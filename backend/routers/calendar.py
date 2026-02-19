"""
Calendar Router - Property viewings and event scheduling
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from db import db
from models import CalendarEvent, CalendarEventCreate
from services.calendar import CalendarService

router = APIRouter(prefix="/calendar", tags=["calendar"])
calendar_service = CalendarService(db)


@router.get("/events/{user_id}")
async def get_user_events(
    user_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    event_type: Optional[str] = None
):
    """Get calendar events for a user"""
    events = await calendar_service.get_user_events(
        user_id, start_date, end_date, event_type
    )
    return events


@router.post("/events")
async def create_event(user_id: str, event: CalendarEventCreate):
    """Create a new calendar event"""
    event_data = event.model_dump()
    result = await calendar_service.create_event(user_id, event_data)
    return result


@router.put("/events/{event_id}")
async def update_event(event_id: str, user_id: str, updates: dict):
    """Update a calendar event"""
    success = await calendar_service.update_event(event_id, user_id, updates)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "updated"}


@router.delete("/events/{event_id}")
async def cancel_event(event_id: str, user_id: str):
    """Cancel a calendar event"""
    success = await calendar_service.cancel_event(event_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Event not found")
    return {"status": "cancelled"}


@router.post("/viewing")
async def schedule_viewing(
    user_id: str,
    listing_id: str,
    proposed_time: str,
    landlord_id: Optional[str] = None,
    notes: str = ""
):
    """Schedule a property viewing"""
    try:
        event = await calendar_service.schedule_property_viewing(
            user_id, listing_id, proposed_time, landlord_id, notes
        )
        return event
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Google Calendar Integration
@router.get("/google/auth-url")
async def get_google_auth_url(redirect_uri: str, state: str = ""):
    """Get Google OAuth URL for calendar access"""
    try:
        url = calendar_service.get_google_auth_url(redirect_uri, state)
        return {"auth_url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/google/callback")
async def google_callback(user_id: str, code: str, redirect_uri: str):
    """Handle Google OAuth callback"""
    # In production, exchange code for tokens using Google OAuth
    # For now, simulate the token storage
    token_data = {
        "access_token": f"mock_access_{code[:8]}",
        "refresh_token": f"mock_refresh_{code[:8]}",
        "expiry": "2025-12-31T23:59:59Z",
        "scope": "https://www.googleapis.com/auth/calendar.events"
    }
    
    await calendar_service.store_google_token(user_id, token_data)
    return {"status": "connected", "message": "Google Calendar connected successfully"}


@router.get("/google/status/{user_id}")
async def check_google_status(user_id: str):
    """Check if Google Calendar is connected"""
    connected = await calendar_service.check_google_connected(user_id)
    return {"connected": connected}


@router.post("/google/sync/{event_id}")
async def sync_to_google(event_id: str, user_id: str):
    """Sync an event to Google Calendar"""
    google_id = await calendar_service.sync_event_to_google(user_id, event_id)
    if not google_id:
        raise HTTPException(status_code=400, detail="Could not sync event")
    return {"status": "synced", "google_event_id": google_id}
