import asyncio, websockets, json, time, io
import os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
AUDIO_PATH = os.path.join(ROOT, "app", "temp", "audio", "elevenlabs_testing.mp3")
IMAGE_PATH = os.path.join(ROOT, "assets", "acne.jpg")

AUDIO_PATH = r"C:/Users/MUHAMMAD USMAN/Desktop/POCs/ai-doctor/smart-medical-diagnosis/smart-medical-diagnosis/backend/app/temp/audio/elevenlabs_testing.mp3"
IMAGE_PATH = r"C:/Users/MUHAMMAD USMAN/Desktop/POCs/ai-doctor\smart-medical-diagnosis\smart-medical-diagnosis/backend/assets/acne.jpg"               # or "some.jpg"

async def test():
    uri = "ws://localhost:8001/ws/diagnosis"
    async with websockets.connect(uri) as ws:
        # 1. Send audio
        with open(AUDIO_PATH, "rb") as f:
            await ws.send(f.read())
        # 2. Optional image
        if IMAGE_PATH:
            with open(IMAGE_PATH, "rb") as f:
                await ws.send(f.read())
        else:
            await ws.send(b'')   # empty bytes to trigger "no image"
        # 3. Collect all TTS audio chunks
        audio_out = io.BytesIO()
        async for msg in ws:
            if isinstance(msg, bytes):
                audio_out.write(msg)
            else:
                print("Text feedback:", msg)
        print("Received", audio_out.tell(), "bytes of TTS audio")

asyncio.run(test())