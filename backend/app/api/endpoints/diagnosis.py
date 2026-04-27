from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from gtts import gTTS
from io import BytesIO
from groq import Groq
from dotenv import load_dotenv
load_dotenv()

import os
import asyncio
import logging
import base64
from typing import Optional
import json


router = APIRouter()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# System prompt for medical diagnosis (Dermatology focused)
SYSTEM_PROMPT = """You are a highly skilled professional dermatologist. 
Your tone is soft-spoken, empathetic, and extremely professional. 
Analyze the provided skin images and symptoms to provide a detailed dermatological assessment. 
Break down your response into clear sections: 
1. Assessment (What you see)
2. Potential Condition (Differential diagnosis)
3. Recommended Actions (Next steps, treatments, or specialists to see)
Be thorough yet clear."""


# Initialize clients
# ElevenLabs removed in favor of gTTS

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def encode_image(image_data: bytes) -> str:
    """Encode image to base64"""
    return base64.b64encode(image_data).decode('utf-8')

def transcribe_with_groq(audio_data: bytes, stt_model: str = "whisper-large-v3") -> str:
    """Transcribe audio using Groq"""
    try:
        # Create a temporary file-like object for the audio data
        audio_file = BytesIO(audio_data)
        audio_file.name = "audio.wav"
        
        transcription = groq_client.audio.transcriptions.create(
            file=audio_file,
            model=stt_model,
            response_format="text",
        )
        return transcription
    except Exception as e:
        logger.error(f"Transcription failed: {str(e)}")
        return f"[Transcription failed: {str(e)}]"


def analyze_image_with_query(
    query: str, 
    encoded_image: Optional[str] = None, 
    model: str = "meta-llama/llama-4-scout-17b-16e-instruct"
) -> str:
    """Analyze image and text query using Groq"""
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    
    if encoded_image:
     messages.append({
    "role": "user",
    "content": [
        {"type": "text", "text": query},
        {
            "type": "image_url",
            "image_url": {
                "url": f"data:image/jpeg;base64,{encoded_image}"
            }
        }
    ]
})
    else:
        messages.append({"role": "user", "content": query})
    
    response = groq_client.chat.completions.create(
        model=model,
        messages=messages,
        temperature=0.7,
        max_tokens=1024
    )
    return response.choices[0].message.content

@router.websocket("/ws/diagnosis")
async def websocket_diagnosis(websocket: WebSocket):
    """WebSocket endpoint for real-time medical diagnosis"""
    
    # CORS validation
    origin = websocket.headers.get("origin", "")
    allowed_origins = [
        "http://localhost",
        "http://127.0.0.1",
        "http://0.0.0.0",
        "https://your-production-domain.com"  # Add production domain when ready
    ]
    
    if origin and not any(origin.startswith(o) for o in allowed_origins):
        logger.warning(f"Rejected connection from unauthorized origin: {origin}")
        await websocket.close(code=1008, reason="Origin not allowed")
        return
    
    try:
        await websocket.accept()
        logger.info(f"New WebSocket connection from {websocket.client}")
        
        # 1. Receive audio data with timeout
        try:
            audio_data = await asyncio.wait_for(
                websocket.receive_bytes(),
                timeout=10.0  # 10 second timeout for audio
            )
            logger.info(f"Received {len(audio_data)} bytes of audio")
        except asyncio.TimeoutError:
            logger.warning("Timeout waiting for audio data")
            await websocket.close(code=1008, reason="Audio timeout")
            return

        # 2. Optional image data with shorter timeout
        image_data: Optional[bytes] = None
        try:
            image_data = await asyncio.wait_for(
                websocket.receive_bytes(),
                timeout=2.0  # 2 second timeout for image
            )
            logger.info(f"Received {len(image_data)} bytes of image")
        except asyncio.TimeoutError:
            logger.info("No image data received")
            pass

        # 3. Consume the third message (text/dummy) from frontend to clear buffer
        try:
            await asyncio.wait_for(websocket.receive(), timeout=0.5)
            logger.info("Consumed third message")
        except:
            pass

        # 4. Process audio transcription
        try:
            transcription = await run_in_threadpool(
                transcribe_with_groq,
                audio_data=audio_data,
                stt_model="whisper-large-v3"
            )
            logger.info(f"Transcription completed ({len(transcription)} chars)")
        except Exception as e:
            logger.error(f"Transcription failed: {str(e)}")
            await websocket.send_text("Error: Transcription service unavailable")
            await websocket.close(code=1011)
            return

        # 4. Generate diagnosis
        try:
            if image_data:
                encoded_image = await run_in_threadpool(encode_image, image_data)
                diagnosis = await run_in_threadpool(
                    analyze_image_with_query,
                    query=transcription,
                    encoded_image=encoded_image,
                    model="meta-llama/llama-4-scout-17b-16e-instruct"
                )
            else:
                diagnosis = await run_in_threadpool(
                    analyze_image_with_query,
                    query=transcription,
                    model="meta-llama/llama-4-scout-17b-16e-instruct"
                )
            logger.info(f"Diagnosis generated ({len(diagnosis)} chars)")
        except Exception as e:
            logger.error(f"Diagnosis failed: {str(e)}")
            await websocket.send_text("Error: Diagnosis service unavailable")
            await websocket.close(code=1011)
            return

        # 5. Send text diagnosis to frontend
        try:
            await websocket.send_text(json.dumps({
                "type": "diagnosis",
                "text": diagnosis
            }))
            logger.info("Sent text diagnosis")
        except Exception as e:
            logger.error(f"Failed to send text diagnosis: {str(e)}")

        # 6. Generate TTS response with gTTS
        try:
            def _generate_gtts():
                # Using co.uk for a British accent which often sounds more professional/soft-spoken
                tts = gTTS(text=diagnosis, lang='en', tld='co.uk')
                audio_fp = BytesIO()
                tts.write_to_fp(audio_fp)
                return audio_fp.getvalue()

            # Run blocking gTTS in threadpool
            audio_bytes = await run_in_threadpool(_generate_gtts)
            
            if audio_bytes:
                await websocket.send_bytes(audio_bytes)
                logger.info(f"Sent gTTS audio ({len(audio_bytes)} bytes)")

        except Exception as e:
            logger.error(f"gTTS failed: {str(e)}")
            await websocket.send_text(json.dumps({"type": "error", "msg": "Voice synthesis failed"}))
            return
            
        # 7. Explicitly close connection
        await websocket.close(code=1000)
        logger.info("WebSocket explicitly closed")

    except WebSocketDisconnect as e:
        logger.info(f"Client disconnected: code={e.code}, reason={e.reason}")
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        try:
            await websocket.close(code=1011)
        except:
            pass  # Connection already closed
    finally:
        logger.info("Connection closed")