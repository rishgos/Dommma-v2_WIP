"""
Compatibility Router - AI-powered roommate matching
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from db import db
from services.compatibility import RoommateCompatibilityService

router = APIRouter(prefix="/compatibility", tags=["compatibility"])
compatibility_service = RoommateCompatibilityService(db)


@router.post("/calculate/{profile_id}")
async def calculate_compatibility(
    profile_id: str,
    target_ids: Optional[List[str]] = None,
    use_ai: bool = True
):
    """Calculate compatibility scores for a profile against others"""
    try:
        results = await compatibility_service.calculate_compatibility(
            profile_id, target_ids, use_ai
        )
        return {
            "profile_id": profile_id,
            "matches": results,
            "total_matches": len(results)
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/matches/{user_id}")
async def get_top_matches(user_id: str, limit: int = 10):
    """Get top roommate matches for a user"""
    # First get the user's profile
    profile = await db.roommate_profiles.find_one({"user_id": user_id}, {"_id": 0})
    if not profile:
        raise HTTPException(status_code=404, detail="Roommate profile not found")
    
    try:
        results = await compatibility_service.calculate_compatibility(
            profile["id"], use_ai=False  # Use basic scoring for speed
        )
        return {
            "user_id": user_id,
            "matches": results[:limit],
            "total_available": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/score/{profile_id}/{target_profile_id}")
async def get_compatibility_score(profile_id: str, target_profile_id: str, use_ai: bool = False):
    """Get compatibility score between two specific profiles"""
    try:
        results = await compatibility_service.calculate_compatibility(
            profile_id, [target_profile_id], use_ai
        )
        if not results:
            raise HTTPException(status_code=404, detail="Target profile not found")
        return results[0]
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
