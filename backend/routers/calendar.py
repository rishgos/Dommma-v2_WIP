"""
Calendar Router - Property viewings and event scheduling with Real Google OAuth
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from db import db
from models import CalendarEvent, CalendarEventCreate
from services.calendar import CalendarService
from services.google_calendar import GoogleCalendarService

router = APIRouter(prefix="/calendar", tags=["calendar"])
calendar_service = CalendarService(db)
google_service = GoogleCalendarService(db)


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


# Google Calendar Integration - Real OAuth
@router.get("/google/auth-url")
async def get_google_auth_url(redirect_uri: str, state: str = ""):
    """Get Google OAuth URL for calendar access"""
    try:
        url = google_service.get_auth_url(redirect_uri, state)
        return {"auth_url": url}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/google/callback")
async def google_callback(user_id: str, code: str, redirect_uri: str):
    """Handle Google OAuth callback - exchange code for tokens"""
    try:
        tokens = await google_service.exchange_code(code, redirect_uri)
        await google_service.store_tokens(user_id, tokens)
        return {"status": "connected", "message": "Google Calendar connected successfully"}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/google/status/{user_id}")
async def check_google_status(user_id: str):
    """Check if Google Calendar is connected"""
    connected = await google_service.is_connected(user_id)
    return {"connected": connected}


@router.delete("/google/disconnect/{user_id}")
async def disconnect_google(user_id: str):
    """Disconnect Google Calendar"""
    success = await google_service.disconnect(user_id)
    return {"disconnected": success}


@router.post("/google/sync/{event_id}")
async def sync_to_google(event_id: str, user_id: str):
    """Sync a local event to Google Calendar"""
    try:
        google_id = await google_service.sync_local_event(user_id, event_id)
        return {"status": "synced", "google_event_id": google_id}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/google/events/{user_id}")
async def get_google_events(
    user_id: str,
    max_results: int = 50
):
    """Get events from Google Calendar"""
    try:
        events = await google_service.list_events(user_id, max_results=max_results)
        return {"events": events}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/google/create")
async def create_google_event(user_id: str, event: CalendarEventCreate):
    """Create event directly on Google Calendar"""
    try:
        google_event = await google_service.create_event(user_id, event.model_dump())
        return google_event
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/google/calendars/{user_id}")
async def list_google_calendars(user_id: str):
    """List user's Google calendars"""
    try:
        calendars = await google_service.list_calendars(user_id)
        return {"calendars": calendars}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
