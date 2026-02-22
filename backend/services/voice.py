"""
Voice Service - Speech-to-text and text-to-speech for Nova AI
Uses OpenAI Whisper for STT
"""
import os
import base64
import logging
from typing import Optional
from datetime import datetime, timezone
from openai import AsyncOpenAI

logger = logging.getLogger(__name__)


class VoiceService:
    def __init__(self, db):
        self.db = db
        self.api_key = os.environ.get('OPENAI_API_KEY', '')
        self.client = AsyncOpenAI(api_key=self.api_key)
    
    async def transcribe_audio(
        self,
        audio_data: bytes,
        language: str = "en",
        prompt: str = ""
    ) -> dict:
        """Transcribe audio to text using Whisper"""
        try:
            import tempfile
            import os as os_module
            
            # Write audio data to temp file
            with tempfile.NamedTemporaryFile(suffix='.webm', delete=False) as tmp:
                tmp.write(audio_data)
                tmp_path = tmp.name
            
            try:
                with open(tmp_path, 'rb') as audio_file:
                    response = await self.client.audio.transcriptions.create(
                        file=audio_file,
                        model="whisper-1",
                        response_format="verbose_json",
                        language=language,
                        prompt=prompt or "Real estate property search, rental apartments, home buying, contractors, Vancouver Canada",
                        temperature=0.0
                    )
                
                result = {
                    "text": response.text,
                    "language": language,
                    "duration": getattr(response, 'duration', None),
                    "segments": []
                }
                
                # Include segments if available
                if hasattr(response, 'segments') and response.segments:
                    result["segments"] = [
                        {
                            "start": seg.start,
                            "end": seg.end,
                            "text": seg.text
                        }
                        for seg in response.segments
                    ]
                
                return result
                
            finally:
                # Clean up temp file
                os_module.unlink(tmp_path)
                
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            raise ValueError(f"Failed to transcribe audio: {str(e)}")
    
    async def transcribe_base64(
        self,
        base64_audio: str,
        language: str = "en",
        prompt: str = ""
    ) -> dict:
        """Transcribe base64-encoded audio"""
        # Remove data URL prefix if present
        if ',' in base64_audio:
            base64_audio = base64_audio.split(',')[1]
        
        audio_data = base64.b64decode(base64_audio)
        return await self.transcribe_audio(audio_data, language, prompt)
