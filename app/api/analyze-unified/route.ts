// File: app/api/analyze-unified/route.ts

import { NextResponse } from "next/server";
import axios from "axios";

// === Environment variables ===
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY!;
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY!;
const ROBOFLOW_API = "https://serverless.roboflow.com/skin-lesion-detection-3iiut/1?api_key=x90BHkiM0wGExjL66flq"; // Replace with your actual model URL
const HUGGINGFACE_API = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File | null;
    const audio = formData.get("audio") as File | null;

    if (!image || !audio) {
      return NextResponse.json({ error: "Both image and audio files are required." }, { status: 400 });
    }

    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const audioBuffer = Buffer.from(await audio.arrayBuffer());

    // === 1. Upload Audio to AssemblyAI ===
    const uploadRes = await axios.post("https://api.assemblyai.com/v2/upload", audioBuffer, {
      headers: {
        authorization: ASSEMBLYAI_API_KEY,
        "content-type": "application/octet-stream",
      },
    });

    const audioURL = uploadRes.data.upload_url;
    if (!audioURL) throw new Error("Audio upload failed.");

    // === 2. Request Transcription ===
    const transcriptRes = await axios.post(
      "https://api.assemblyai.com/v2/transcript",
      { audio_url: audioURL },
      { headers: { authorization: ASSEMBLYAI_API_KEY } }
    );

    const transcriptID = transcriptRes.data.id;

    // === 3. Poll for Transcription Result (Up to 60 sec) ===
    let transcriptText = "";
    for (let i = 0; i < 20; i++) {
      const poll = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptID}`, {
        headers: { authorization: ASSEMBLYAI_API_KEY },
      });

      if (poll.data.status === "completed") {
        transcriptText = poll.data.text;
        break;
      }

      if (poll.data.status === "error") {
        throw new Error(`AssemblyAI transcription failed: ${poll.data.error}`);
      }

      await new Promise((res) => setTimeout(res, 3000));
    }

    if (!transcriptText) throw new Error("Transcription failed or timed out.");

    // === 4. Analyze Image via Roboflow ===
    const visionRes = await axios.post(ROBOFLOW_API, imageBuffer, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    const visualFindings = visionRes.data;

    // === 5. Generate Summary with HuggingFace ===
    const prompt = `
You are a medical AI assistant. Analyze the following:

Symptoms from patient:
"${transcriptText}"

Visual medical image findings:
${JSON.stringify(visualFindings, null, 2)}

Respond in JSON with:
{
  "medical_assessment": { ... },
  "visual_findings": { ... },
  "audio_analysis": { ... },
  "recommendations": [...],
  "next_steps": [...],
  "timestamp": "ISO string"
}
`;

    const aiRes = await axios.post(
      HUGGINGFACE_API,
      { inputs: prompt },
      {
        headers: { Authorization: `Bearer ${HUGGINGFACE_API_KEY}` },
      }
    );

    const outputText = aiRes.data[0]?.generated_text || "";

    let parsed;
    try {
      const match = outputText.match(/```json\n([\s\S]*?)\n```/) || outputText.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(match ? match[1] || match[0] : outputText);
    } catch {
      parsed = {
        medical_assessment: {
          primary_diagnosis: "Fallback Summary",
          confidence_score: 0.75,
          severity_level: "Moderate",
          description: outputText.slice(0, 200) + "...",
        },
        visual_findings: {
          condition_detected: "Detected",
          visual_characteristics: [],
          areas_of_concern: [],
        },
        audio_analysis: {
          symptom_description: transcriptText,
          vocal_indicators: [],
          respiratory_patterns: [],
        },
        recommendations: ["Consult a medical professional"],
        next_steps: ["Schedule a follow-up appointment"],
      };
    }

    parsed.timestamp = new Date().toISOString();
    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("Unified analysis error:", error);
    return NextResponse.json({ error: error.message || "Analysis failed" }, { status: 500 });
  }
}
