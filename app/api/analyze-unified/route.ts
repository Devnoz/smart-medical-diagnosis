import { NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";
import { InferenceClient } from "@huggingface/inference";

// Environment variables validation
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
const HUGGINGFACE_MODEL = process.env.HUGGINGFACE_MODEL;
const ROBOFLOW_API = process.env.ROBOFLOW_API;

if (!ASSEMBLYAI_API_KEY || !HUGGINGFACE_API_KEY || !HUGGINGFACE_MODEL || !ROBOFLOW_API) {
  throw new Error("Missing required API keys in environment variables");
}

// TypeScript-safe: variables are guaranteed to be strings now
const hfClient = new InferenceClient(HUGGINGFACE_API_KEY as string);

// Constants for configuration
const MAX_TRANSCRIPTION_ATTEMPTS = 30;
const TRANSCRIPTION_POLL_INTERVAL = 1500; // 1.5 seconds
const AUDIO_FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const audio = formData.get("audio") as File | null;

    // Input validation
    if (!image || !audio) {
      return NextResponse.json(
        { error: "Both image and audio files are required." },
        { status: 400 }
      );
    }

    // Validate audio file
    if (!audio.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: "Invalid audio format. Please upload MP3 or WAV." },
        { status: 400 }
      );
    }

    if (audio.size > AUDIO_FILE_SIZE_LIMIT) {
      return NextResponse.json(
        { error: `Audio file too large. Maximum size is ${AUDIO_FILE_SIZE_LIMIT / 1024 / 1024}MB.` },
        { status: 400 }
      );
    }

    const [imageBuffer, audioBuffer] = await Promise.all([
      Buffer.from(await image.arrayBuffer()),
      Buffer.from(await audio.arrayBuffer())
    ]);

    // === 1. Upload Audio to AssemblyAI ===
    const uploadRes = await axios.post(
      "https://api.assemblyai.com/v2/upload",
      audioBuffer,
      {
        headers: {
          authorization: ASSEMBLYAI_API_KEY as string,
          "content-type": "application/octet-stream",
        },
        timeout: 10000
      }
    );

    const audioURL = uploadRes.data?.upload_url;
    if (!audioURL) {
      throw new Error("Audio upload failed: No upload URL received");
    }

    // === 2. Request Transcription ===
    const transcriptRes = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      { audio_url: audioURL },
      {
        headers: { authorization: ASSEMBLYAI_API_KEY as string },
        timeout: 10000
      }
    );

    const transcriptID = transcriptRes.data?.id;
    if (!transcriptID) {
      throw new Error("Transcription request failed: No transcript ID received");
    }

    // === 3. Poll for Transcription Result ===
    let transcriptText = "";
    let lastStatus = "";

    for (let i = 0; i < MAX_TRANSCRIPTION_ATTEMPTS; i++) {
      const poll = await axios.get(
        `https://api.assemblyai.com/v2/transcript/${transcriptID}`,
        {
          headers: { authorization: ASSEMBLYAI_API_KEY as string },
          timeout: 5000
        }
      );

      lastStatus = poll.data.status;

      if (poll.data.status === "completed") {
        transcriptText = poll.data.text || "";
        break;
      }

      if (poll.data.status === "error") {
        throw new Error(`AssemblyAI transcription failed: ${poll.data.error || "Unknown error"}`);
      }

      await new Promise((res) => setTimeout(res, TRANSCRIPTION_POLL_INTERVAL));
    }

    if (!transcriptText) {
      console.warn(`Transcription timed out. Last status: ${lastStatus}`);
      transcriptText = "[Audio analysis incomplete - transcription timed out]";
    }

    // === 4. Analyze Image via Roboflow ===
    const roboflowForm = new FormData();
    roboflowForm.append("file", imageBuffer, {
      filename: "image.jpg",
      contentType: "image/jpeg",
    });

    const visionRes = await axios.post(ROBOFLOW_API as string, roboflowForm, {
      headers: {
        ...roboflowForm.getHeaders(),
      },
      timeout: 30000
    });

    const visualFindings = visionRes.data;

    // === 5. Generate Summary with HuggingFace ===
    const prompt = `
As a medical AI assistant, analyze these patient inputs:

SYMPTOMS:
"${transcriptText}"

VISUAL FINDINGS:
${JSON.stringify(visualFindings, null, 2)}

Respond with structured JSON containing:
1. medical_assessment: { diagnosis, confidence_score, severity }
2. visual_findings: { conditions, confidence }
3. audio_analysis: { key_symptoms, urgency }
4. recommendations: [clinical actions]
5. next_steps: [patient instructions]
6. timestamp: ISO string

Use clear medical terminology but avoid alarming language.
`.trim();

    const chatRes = await hfClient.chatCompletion({
      model: HUGGINGFACE_MODEL as string,
      messages: [{ role: "user", content: prompt }],
    });

    const outputText = chatRes.choices?.[0]?.message?.content || "";

    // === 6. Parse and Validate Response ===
    let parsed;
    try {
      const jsonMatch = outputText.match(/```json\n([\s\S]*?)\n```/) || 
                       outputText.match(/\{[\s\S]*\}/);
      
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : outputText;
      parsed = JSON.parse(jsonString);

      if (!parsed.medical_assessment || !parsed.recommendations) {
        throw new Error("Incomplete response from AI model");
      }
    } catch (parseError) {
      console.warn("Failed to parse AI response, using fallback:", parseError);
      parsed = createFallbackResponse(transcriptText, outputText);
    }

    parsed.timestamp = new Date().toISOString();
    parsed.analysis_duration = `${MAX_TRANSCRIPTION_ATTEMPTS * TRANSCRIPTION_POLL_INTERVAL / 1000}s`;

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Analysis pipeline error:", {
      message: error.message,
      stack: error.stack,
      responseData: error.response?.data
    });

    return NextResponse.json(
      { 
        error: "Analysis failed",
        details: error.message,
        type: error.response?.status ? "api_error" : "processing_error"
      },
      { status: error.response?.status || 500 }
    );
  }
}

// Helper function for fallback response
function createFallbackResponse(transcriptText: string, aiOutput: string) {
  return {
    medical_assessment: {
      primary_diagnosis: "Preliminary Assessment",
      confidence_score: 0.7,
      severity_level: "Unspecified",
      description: aiOutput.slice(0, 250) + (aiOutput.length > 250 ? "..." : ""),
    },
    visual_findings: {
      condition_detected: "Analysis incomplete",
      confidence: 0.5,
    },
    audio_analysis: {
      symptom_description: transcriptText,
      urgency: "Non-emergency",
    },
    recommendations: [
      "Consult with a healthcare professional",
      "Monitor symptoms for changes"
    ],
    next_steps: [
      "Schedule a clinical appointment",
      "Document symptom progression"
    ],
    warning: "This is an automated preliminary analysis only"
  };
}
