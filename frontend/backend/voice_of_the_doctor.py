# if you dont use pipenv uncomment the following:
# from dotenv import load_dotenv
# load_dotenv()

#Step1a: Setup Text to Speech–TTS–model with gTTS
import os
from gtts import gTTS

def text_to_speech_with_gtts(input_text, output_filepath):
    language="en"
    audioobj = gTTS(
        text=input_text,
        lang=language,
        slow=False
    )
    audioobj.save(output_filepath)

# Example usage (can be removed if not needed)
input_text = "Hi this is Ai with Hassan!"
text_to_speech_with_gtts(input_text=input_text, output_filepath="gtts_testing.mp3")