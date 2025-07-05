from dotenv import load_dotenv
import os
import gradio as gr

from brain_of_the_doctor import encode_image, analyze_image_with_query
from voice_of_the_patient import transcribe_with_groq
from voice_of_the_doctor import text_to_speech_with_gtts

load_dotenv()

system_prompt = """You have to act as a professional doctor, I know you are not but this is for learning purpose. 
What's in this image? Do you find anything wrong with it medically? 
If you make a differential, suggest some remedies for them. Do not add any numbers or special characters in 
your response. Your response should be in one long paragraph. Also always answer as if you are answering to a real person.
Do not say 'In the image I see' but say 'With what I see, I think you have ....'
Don't respond as an AI model in markdown, your answer should mimic that of an actual doctor not an AI bot. 
Keep your answer concise (max 2 sentences). No preamble, start your answer right away please."""

def process_inputs(audio_filepath, image_filepath):
    if not audio_filepath:
        return "No audio file provided.", "No doctor response generated.", None

    speech_to_text_output = transcribe_with_groq(
        GROQ_API_KEY=os.environ.get("GROQ_API_KEY"),
        audio_filepath=audio_filepath,
        stt_model="whisper-large-v3"
    )

    if image_filepath:
        doctor_response = analyze_image_with_query(
            query=system_prompt + speech_to_text_output,
            encoded_image=encode_image(image_filepath),
            model="meta-llama/llama-4-scout-17b-16e-instruct"
        )
    else:
        doctor_response = "No image provided for me to analyze"

    text_to_speech_with_gtts(input_text=doctor_response, output_filepath="final.mp3")
    return speech_to_text_output, doctor_response, "final.mp3"

# Optional logo path
logo_path = "logo.png"  # Use a valid image file from your project directory

with gr.Blocks(title="AI Doctor: Voice & Vision") as iface:
    gr.HTML("""
    <style>
        body {
            background: linear-gradient(to right, #f8fafc, #e0f2fe);
            font-family: 'Segoe UI', sans-serif;
        }
        .gradio-container {
            max-width: 960px;
            margin: auto;
            padding: 30px;
        }
        .gr-block {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            box-shadow: 0 8px 16px rgba(0,0,0,0.06);
            padding: 20px;
        }
        .gr-button-primary {
            background: linear-gradient(to right, #06b6d4, #3b82f6);
            color: white !important;
            border-radius: 8px;
            font-weight: bold;
        }
        h2 {
            text-align: center;
            color: #0f172a;
            margin-bottom: 20px;
        }
        .footer {
            text-align: center;
            font-size: 13px;
            color: #64748b;
        }
        /* Logo styling */
        .logo-center {
            display: flex;
            justify-content: center;
            align-items: center;
            margin-bottom: 18px;
        }
        .logo-img {
            border-radius: 16px;
            box-shadow: 0 4px 16px rgba(59,130,246,0.15);
            border: 2px solid #3b82f6;
            width: 90px !important;
            height: 90px !important;
            object-fit: cover;
            background: #fff;
        }
    </style>
    """)

    with gr.Row():
        gr.HTML("<div class='logo-center'><img src='logo.png' class='logo-img' alt='Logo'></div>")

    gr.Markdown("##  AI Doctor: Voice & Vision")
    gr.Markdown("🎙️ **Speak your symptoms** and 📷 **upload a skin image** to get real-time medical-like feedback.")

    with gr.Row():
        with gr.Column():
            audio_input = gr.Audio(
                sources=["microphone"],
                type="filepath",
                label="🎤 Speak symptoms"
            )
            image_input = gr.Image(
                type="filepath",
                label="🖼️ Upload skin image"
            )
            submit_btn = gr.Button("🚀 Analyze", variant="primary")

        with gr.Column():
            stt_output = gr.Textbox(label="📝 Transcribed Symptoms", interactive=False)
            doctor_response = gr.Textbox(label="💬 AI Doctor's Response", lines=4, max_lines=6, interactive=False)
            audio_output = gr.Audio(label="🔊 Doctor Voice")

    gr.Markdown("---")
    gr.Markdown("⚠️ **Disclaimer**: This is an AI-powered tool for learning purposes only — not real medical advice.")
    gr.HTML("<div class='footer'>Built with ❤️ by the AI Doctor Team</div>")

    submit_btn.click(
        fn=process_inputs,
        inputs=[audio_input, image_input],
        outputs=[stt_output, doctor_response, audio_output]
    )

iface.launch(debug=True)
