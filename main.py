from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
import uvicorn
import os
from brain_of_the_doctor import encode_image, analyze_image_with_query
from voice_of_the_doctor import text_to_speech_with_gtts

app = FastAPI()

# Allow CORS for local development (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "AI Doctor FastAPI backend is running."}

@app.post("/predict/")
async def predict(file: UploadFile = File(...)):
    # Save uploaded file to disk
    file_location = f"temp_{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())
    # Run AI analysis
    try:
        encoded = encode_image(file_location)
        # Use the same prompt and model as in gradio_app.py
        system_prompt = ("You have to act as a professional doctor, I know you are not but this is for learning purpose. "
            "What's in this image? Do you find anything wrong with it medically? "
            "If you make a differential, suggest some remedies for them. Do not add any numbers or special characters in "
            "your response. Your response should be in one long paragraph. Also always answer as if you are answering to a real person. "
            "Do not say 'In the image I see' but say 'With what I see, I think you have ....' "
            "Don't respond as an AI model in markdown, your answer should mimic that of an actual doctor not an AI bot. "
            "Keep your answer concise (max 2 sentences). No preamble, start your answer right away please.")
        result = analyze_image_with_query(
            query=system_prompt,
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            encoded_image=encoded
        )
        # Generate audio response
        audio_path = f"doctor_response_{file.filename}.mp3"
        text_to_speech_with_gtts(result, audio_path)
        with open(audio_path, "rb") as audio_file:
            audio_bytes = audio_file.read()
        os.remove(audio_path)
    except Exception as e:
        os.remove(file_location)
        return {"error": str(e)}
    os.remove(file_location)
    return {
        "filename": file.filename,
        "result": result,
        "solution": result,  # Use the same result as solution for now
        "confidence": 95,    # Placeholder confidence
        "audio": audio_bytes.hex()  # send as hex string for frontend to reconstruct
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
