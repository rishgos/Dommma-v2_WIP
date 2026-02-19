"""
Text-to-Speech Service - Generate voice audio from text for Nova AI
Uses OpenAI TTS API
"""
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)

# Available voices with descriptions
AVAILABLE_VOICES = {
    "alloy": {"name": "Alloy", "description": "Neutral, balanced", "gender": "neutral"},
    "ash": {"name": "Ash", "description": "Clear, articulate", "gender": "neutral"},
    "coral": {"name": "Coral", "description": "Warm, friendly", "gender": "female"},
    "echo": {"name": "Echo", "description": "Smooth, calm", "gender": "male"},
    "fable": {"name": "Fable", "description": "Expressive, storytelling", "gender": "neutral"},
    "nova": {"name": "Nova", "description": "Energetic, upbeat", "gender": "female"},
    "onyx": {"name": "Onyx", "description": "Deep, authoritative", "gender": "male"},
    "sage": {"name": "Sage", "description": "Wise, measured", "gender": "neutral"},
    "shimmer": {"name": "Shimmer", "description": "Bright, cheerful", "gender": "female"},
}

DEFAULT_VOICE = "nova"  # Matches our Nova AI assistant name!


class TextToSpeechService:
    def __init__(self, db):
        self.db = db
        self.api_key = os.environ.get('EMERGENT_LLM_KEY', '')
        self.max_text_length = 4096
    
    async def generate_speech(
        self,
        text: str,
        voice: str = DEFAULT_VOICE,
        model: str = "tts-1",
        speed: float = 1.0,
        response_format: str = "mp3"
    ) -> bytes:
        """Generate speech audio from text"""
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")
        
        if len(text) > self.max_text_length:
            raise ValueError(f"Text too long. Maximum {self.max_text_length} characters")
        
        if voice not in AVAILABLE_VOICES:
            voice = DEFAULT_VOICE
        
        try:
            from emergentintegrations.llm.openai import OpenAITextToSpeech
            
            tts = OpenAITextToSpeech(api_key=self.api_key)
            
            audio_bytes = await tts.generate_speech(
                text=text,
                model=model,
                voice=voice,
                speed=speed,
                response_format=response_format
            )
            
            return audio_bytes
            
        except Exception as e:
            logger.error(f"TTS generation error: {e}")
            raise ValueError(f"Failed to generate speech: {str(e)}")
    
    async def generate_speech_base64(
        self,
        text: str,
        voice: str = DEFAULT_VOICE,
        model: str = "tts-1",
        speed: float = 1.0
    ) -> str:
        """Generate speech and return as base64 string"""
        try:
            from emergentintegrations.llm.openai import OpenAITextToSpeech
            
            tts = OpenAITextToSpeech(api_key=self.api_key)
            
            audio_base64 = await tts.generate_speech_base64(
                text=text,
                model=model,
                voice=voice,
                speed=speed
            )
            
            return audio_base64
            
        except Exception as e:
            logger.error(f"TTS base64 generation error: {e}")
            raise ValueError(f"Failed to generate speech: {str(e)}")
    
    async def get_user_voice_preference(self, user_id: str) -> dict:
        """Get user's voice preference"""
        prefs = await self.db.nova_user_profiles.find_one(
            {"user_id": user_id}, {"_id": 0}
        )
        
        voice = prefs.get("preferences", {}).get("voice", DEFAULT_VOICE) if prefs else DEFAULT_VOICE
        speed = prefs.get("preferences", {}).get("voice_speed", 1.0) if prefs else 1.0
        enabled = prefs.get("preferences", {}).get("voice_enabled", False) if prefs else False
        
        return {
            "voice": voice,
            "speed": speed,
            "enabled": enabled,
            "voice_info": AVAILABLE_VOICES.get(voice, AVAILABLE_VOICES[DEFAULT_VOICE])
        }
    
    async def set_user_voice_preference(
        self,
        user_id: str,
        voice: str = None,
        speed: float = None,
        enabled: bool = None
    ) -> dict:
        """Set user's voice preference"""
        updates = {}
        
        if voice is not None:
            if voice not in AVAILABLE_VOICES:
                raise ValueError(f"Invalid voice. Choose from: {list(AVAILABLE_VOICES.keys())}")
            updates["preferences.voice"] = voice
        
        if speed is not None:
            if not 0.25 <= speed <= 4.0:
                raise ValueError("Speed must be between 0.25 and 4.0")
            updates["preferences.voice_speed"] = speed
        
        if enabled is not None:
            updates["preferences.voice_enabled"] = enabled
        
        if updates:
            from datetime import datetime, timezone
            updates["updated_at"] = datetime.now(timezone.utc).isoformat()
            
            await self.db.nova_user_profiles.update_one(
                {"user_id": user_id},
                {"$set": updates},
                upsert=True
            )
        
        return await self.get_user_voice_preference(user_id)
    
    def get_available_voices(self) -> list:
        """Get list of available voices"""
        return [
            {"id": k, **v}
            for k, v in AVAILABLE_VOICES.items()
        ]
