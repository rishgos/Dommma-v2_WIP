"""
Nova AI Router - Enhanced AI capabilities for the chatbot
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Response
from typing import Optional, List
from pydantic import BaseModel
from db import db
from services.voice import VoiceService
from services.nova_memory import NovaMemoryService, SavedSearchService
from services.image_analysis import ImageAnalysisService
from services.tts import TextToSpeechService
from services.nova_insights import NovaInsightsService

router = APIRouter(prefix="/nova", tags=["nova-ai"])

voice_service = VoiceService(db)
memory_service = NovaMemoryService(db)
search_service = SavedSearchService(db)
image_service = ImageAnalysisService(db)
tts_service = TextToSpeechService(db)
insights_service = NovaInsightsService(db)


# Request/Response Models
class TranscriptionRequest(BaseModel):
    audio_data: str  # base64 encoded
    language: str = "en"


class TTSRequest(BaseModel):
    text: str
    voice: str = "nova"
    speed: float = 1.0


class VoicePreferenceRequest(BaseModel):
    voice: Optional[str] = None
    speed: Optional[float] = None
    enabled: Optional[bool] = None


class SaveSearchRequest(BaseModel):
    user_id: str
    criteria: dict
    name: str = ""


class ImageAnalysisRequest(BaseModel):
    image_data: str  # base64 or data URL
    analysis_type: str = "general"  # general, condition, layout, comparison


class ImageComparisonRequest(BaseModel):
    images: List[str]  # list of base64 images
    criteria: List[str] = None


# Voice Endpoints
@router.post("/transcribe")
async def transcribe_audio(request: TranscriptionRequest):
    """Transcribe audio to text using Whisper"""
    try:
        result = await voice_service.transcribe_base64(
            request.audio_data,
            request.language
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/transcribe-file")
async def transcribe_audio_file(
    file: UploadFile = File(...),
    language: str = Form("en")
):
    """Transcribe uploaded audio file"""
    if file.size > 25 * 1024 * 1024:  # 25MB limit
        raise HTTPException(status_code=400, detail="File too large. Max 25MB")
    
    allowed_types = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/mp4']
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported audio format: {file.content_type}")
    
    try:
        audio_data = await file.read()
        result = await voice_service.transcribe_audio(audio_data, language)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Memory & Suggestions Endpoints
@router.get("/memory/{user_id}")
async def get_user_memory(user_id: str):
    """Get Nova's memory of user preferences and interactions"""
    memory = await memory_service.get_user_memory(user_id)
    return memory


@router.get("/suggestions/{user_id}")
async def get_proactive_suggestions(user_id: str):
    """Get proactive suggestions for the user"""
    suggestions = await memory_service.generate_proactive_suggestions(user_id)
    return {"suggestions": suggestions}


@router.get("/context/{user_id}")
async def get_context_summary(user_id: str):
    """Get context summary for Nova to use in responses"""
    summary = await memory_service.get_context_summary(user_id)
    return {"context": summary}


@router.post("/preferences/{user_id}")
async def update_preferences(user_id: str, preferences: dict):
    """Update user preferences"""
    await memory_service.update_preferences(user_id, preferences)
    return {"status": "updated"}


# Saved Searches Endpoints
@router.post("/saved-search")
async def save_search(request: SaveSearchRequest):
    """Save a search for notifications"""
    search_id = await search_service.save_search(
        request.user_id,
        request.criteria,
        request.name
    )
    return {"search_id": search_id, "status": "saved"}


@router.get("/saved-searches/{user_id}")
async def get_saved_searches(user_id: str):
    """Get user's saved searches"""
    searches = await search_service.get_user_searches(user_id)
    return {"searches": searches}


@router.get("/saved-search-matches/{user_id}")
async def check_saved_search_matches(user_id: str):
    """Check saved searches for new matches"""
    matches = await search_service.check_for_matches(user_id)
    return {"matches": matches}


@router.delete("/saved-search/{search_id}")
async def delete_saved_search(search_id: str, user_id: str):
    """Delete a saved search"""
    result = await db.saved_searches.delete_one(
        {"id": search_id, "user_id": user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Search not found")
    return {"status": "deleted"}


# Image Analysis Endpoints
@router.post("/analyze-image")
async def analyze_property_image(request: ImageAnalysisRequest):
    """Analyze a property image using AI vision"""
    result = await image_service.analyze_property_image(
        request.image_data,
        request.analysis_type
    )
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Analysis failed"))
    return result


@router.post("/compare-images")
async def compare_property_images(request: ImageComparisonRequest):
    """Compare multiple property images"""
    if len(request.images) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 images to compare")
    if len(request.images) > 4:
        raise HTTPException(status_code=400, detail="Maximum 4 images for comparison")
    
    result = await image_service.compare_property_images(
        request.images,
        request.criteria
    )
    return result


@router.post("/analyze-room")
async def analyze_room_details(image_data: str):
    """Extract detailed room information from image"""
    result = await image_service.extract_room_details(image_data)
    return result


@router.post("/assess-condition")
async def assess_property_condition(image_data: str):
    """Assess property condition from image"""
    result = await image_service.assess_condition(image_data)
    return result



# Text-to-Speech Endpoints
@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    """Convert text to speech audio"""
    try:
        audio_base64 = await tts_service.generate_speech_base64(
            text=request.text,
            voice=request.voice,
            speed=request.speed
        )
        return {
            "audio": audio_base64,
            "format": "mp3",
            "voice": request.voice
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/tts/voices")
async def get_available_voices():
    """Get list of available TTS voices"""
    voices = tts_service.get_available_voices()
    return {"voices": voices}


@router.get("/tts/preferences/{user_id}")
async def get_voice_preferences(user_id: str):
    """Get user's voice preferences"""
    prefs = await tts_service.get_user_voice_preference(user_id)
    return prefs


@router.post("/tts/preferences/{user_id}")
async def set_voice_preferences(user_id: str, request: VoicePreferenceRequest):
    """Set user's voice preferences"""
    try:
        prefs = await tts_service.set_user_voice_preference(
            user_id,
            voice=request.voice,
            speed=request.speed,
            enabled=request.enabled
        )
        return prefs
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Insights Endpoints
@router.get("/insights/{user_id}")
async def get_user_insights(user_id: str):
    """Get comprehensive AI-generated insights for user"""
    insights = await insights_service.get_user_insights(user_id)
    return insights


@router.get("/insights/{user_id}/timeline")
async def get_moving_timeline(user_id: str):
    """Get AI-generated moving timeline"""
    insights = await insights_service.get_user_insights(user_id)
    return {"timeline": insights.get("moving_timeline", {})}


@router.get("/insights/{user_id}/matches")
async def get_property_matches(user_id: str):
    """Get property match scores"""
    insights = await insights_service.get_user_insights(user_id)
    return {"matches": insights.get("property_match_scores", {})}


@router.get("/insights/{user_id}/trends")
async def get_market_trends(user_id: str):
    """Get personalized market trends"""
    insights = await insights_service.get_user_insights(user_id)
    return {"trends": insights.get("market_trends", {})}
