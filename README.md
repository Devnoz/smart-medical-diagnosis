# AI Doctor: Smart Medical Diagnosis

A modern web application that uses AI to analyze patient-uploaded skin images and recorded symptoms, providing instant medical insights and solutions. Built with a Next.js frontend and a FastAPI backend for powerful, end-to-end AI diagnostics. :contentReference[oaicite:1]{index=1}

---

## 🚀 Features

- **🩺 Image Diagnosis**: Upload a skin image; get instant AI-powered analysis using YOLOv8.
- **🎙 Voice Symptoms**: Record your symptoms and receive automatic transcription.
- **🤖 AI Summaries**: Combined audio and image data are summarized into actionable medical insights (via LLM).
- **🔁 Audio Playback**: Listen to both the original voice and the AI-generated response.
- **🖥 Responsive UI**: Clean, medical-themed interface with drag-and-drop upload and instant feedback.

---

## 🛠 Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | Next.js, React, Tailwind CSS       |
| Backend    | FastAPI (Python)                   |
| Audio      | AssemblyAI for transcription       |
| Vision     | Roboflow hosted YOLOv8 model       |
| Reasoning  | HuggingFace LLM (Mistral-7B)       |
| DevOps     | Docker, CI/CD pipeline support     |

---

## 🧩 Getting Started

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
Frontend Setup
bash
Copy
Edit
cd frontend
pnpm install
pnpm dev
Visit http://localhost:3000 to interact with the app.

🎯 Usage
Click “Start Diagnosis”.

Upload a clear image of the skin issue.

(Optional) Record symptoms via your microphone.

Click “Get Diagnosis”.

View AI-generated medical summary and listen to audio playback.
⚠️ Disclaimer
This application is for informational purposes only and is not a substitute for professional medical advice. Always seek the guidance of a qualified health provider.

📝 License
MIT License

© 2025 AI Doctor. All rights reserved.
