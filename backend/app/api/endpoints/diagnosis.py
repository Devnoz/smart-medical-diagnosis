from fastapi import APIRouter, UploadFile, File, HTTPException
from tempfile import NamedTemporaryFile
import os
from app.core.brain_of_the_doctor import encode_image, analyze_image_with_query
from app.core.voice_of_the_patient import transcribe_with_groq
from app.core.voice_of_the_doctor import text_to_speech_with_elevenlabs

router = APIRouter()

SYSTEM_PROMPT = """You have to act as a professional doctor..."""  # Your existing prompt

@router.post("/diagnosis")
async def analyze_medical_case(
    audio: UploadFile = File(...),
    image: UploadFile = File(None),
):
    try:
        # Process audio
        with NamedTemporaryFile(suffix=".wav", delete=False) as audio_temp:
            audio_temp.write(await audio.read())
            audio_path = audio_temp.name

        # Process image if exists
        image_path = None
        if image:
            with NamedTemporaryFile(suffix=".jpg", delete=False) as image_temp:
                image_temp.write(await image.read())
                image_path = image_temp.name

        # Transcription
        transcription = transcribe_with_groq(
            GROQ_API_KEY=os.getenv("GROQ_API_KEY"),
            audio_filepath=audio_path,
            stt_model="whisper-large-v3"
        )

        # Diagnosis
        if image_path:
            encoded_image = encode_image(image_path)
            diagnosis = analyze_image_with_query(
                query=SYSTEM_PROMPT + transcription,
                encoded_image=encoded_image,
                model="meta-llama/llama-4-scout-17b-16e-instruct"
            )
        else:
            diagnosis = "No image provided for analysis"

        # Voice response
        voice_path = text_to_speech_with_elevenlabs(diagnosis)

        # Cleanup
        os.unlink(audio_path)
        if image_path:
            os.unlink(image_path)

        return {
            "transcription": transcription,
            "diagnosis": diagnosis,
            "audio_url": f"/audio/{os.path.basename(voice_path)}"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))