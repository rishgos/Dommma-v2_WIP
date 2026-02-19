"""
Calendar Service - Handles both in-app and Google Calendar integration
"""
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
import os
import json
import logging

logger = logging.getLogger(__name__)

class CalendarService:
    def __init__(self, db):
        self.db = db
        self.google_client_id = os.environ.get('GOOGLE_CLIENT_ID', '')
        self.google_client_secret = os.environ.get('GOOGLE_CLIENT_SECRET', '')
    
    async def create_event(self, user_id: str, event_data: dict) -> dict:
        """Create a calendar event (in-app)"""
        from models import CalendarEvent
        
        event = CalendarEvent(
            user_id=user_id,
            **event_data
        )
        await self.db.calendar_events.insert_one(event.model_dump())
        return event.model_dump()
    
    async def get_user_events(
        self, 
        user_id: str, 
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        event_type: Optional[str] = None
    ) -> List[dict]:
        """Get events for a user with optional filters"""
        query = {"user_id": user_id, "status": {"$ne": "cancelled"}}
        
        if start_date:
            query["start_time"] = {"$gte": start_date}
        if end_date:
            query.setdefault("start_time", {})["$lte"] = end_date
        if event_type:
            query["event_type"] = event_type
        
        events = await self.db.calendar_events.find(
            query, {"_id": 0}
        ).sort("start_time", 1).to_list(100)
        return events
    
    async def update_event(self, event_id: str, user_id: str, updates: dict) -> bool:
        """Update a calendar event"""
        updates["updated_at"] = datetime.now(timezone.utc).isoformat()
        result = await self.db.calendar_events.update_one(
            {"id": event_id, "user_id": user_id},
            {"$set": updates}
        )
        return result.modified_count > 0
    
    async def cancel_event(self, event_id: str, user_id: str) -> bool:
        """Cancel a calendar event"""
        return await self.update_event(event_id, user_id, {"status": "cancelled"})
    
    async def schedule_property_viewing(
        self,
        user_id: str,
        listing_id: str,
        proposed_time: str,
        landlord_id: Optional[str] = None,
        notes: str = ""
    ) -> dict:
        """Schedule a property viewing"""
        # Get listing details
        listing = await self.db.listings.find_one({"id": listing_id}, {"_id": 0})
        if not listing:
            raise ValueError("Listing not found")
        
        # Parse time and create 1-hour event
        start = datetime.fromisoformat(proposed_time.replace('Z', '+00:00'))
        end = start + timedelta(hours=1)
        
        event_data = {
            "title": f"Property Viewing: {listing.get('title', 'Property')}",
            "description": f"Viewing at {listing.get('address', '')}",
            "event_type": "viewing",
            "listing_id": listing_id,
            "start_time": start.isoformat(),
            "end_time": end.isoformat(),
            "location": f"{listing.get('address', '')}, {listing.get('city', '')}",
            "attendees": [user_id] + ([landlord_id] if landlord_id else []),
            "notes": notes
        }
        
        event = await self.create_event(user_id, event_data)
        
        # Notify landlord if available
        if landlord_id:
            await self.db.notifications.insert_one({
                "id": str(__import__('uuid').uuid4()),
                "user_id": landlord_id,
                "title": "New Viewing Request",
                "body": f"Someone wants to view {listing.get('title', 'your property')} on {start.strftime('%B %d at %I:%M %p')}",
                "type": "viewing",
                "data": {"event_id": event["id"], "listing_id": listing_id},
                "read": False,
                "created_at": datetime.now(timezone.utc).isoformat()
            })
        
        return event
    
    # Google Calendar Integration Methods
    def get_google_auth_url(self, redirect_uri: str, state: str = "") -> str:
        """Generate Google OAuth URL for calendar access"""
        if not self.google_client_id:
            raise ValueError("Google OAuth not configured")
        
        scopes = "https://www.googleapis.com/auth/calendar.events"
        return (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={self.google_client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"scope={scopes}&"
            f"access_type=offline&"
            f"prompt=consent&"
            f"state={state}"
        )
    
    async def store_google_token(self, user_id: str, token_data: dict) -> None:
        """Store Google Calendar OAuth tokens"""
        from models import GoogleCalendarToken
        
        existing = await self.db.google_calendar_tokens.find_one({"user_id": user_id})
        
        token = GoogleCalendarToken(
            user_id=user_id,
            access_token=token_data.get("access_token", ""),
            refresh_token=token_data.get("refresh_token", ""),
            token_expiry=token_data.get("expiry", ""),
            scope=token_data.get("scope", "")
        )
        
        if existing:
            await self.db.google_calendar_tokens.update_one(
                {"user_id": user_id},
                {"$set": {
                    "access_token": token.access_token,
                    "refresh_token": token.refresh_token or existing.get("refresh_token", ""),
                    "token_expiry": token.token_expiry,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            await self.db.google_calendar_tokens.insert_one(token.model_dump())
    
    async def sync_event_to_google(self, user_id: str, event_id: str) -> Optional[str]:
        """Sync an in-app event to Google Calendar"""
        # Get user's Google token
        token = await self.db.google_calendar_tokens.find_one({"user_id": user_id}, {"_id": 0})
        if not token:
            return None
        
        # Get the event
        event = await self.db.calendar_events.find_one({"id": event_id, "user_id": user_id}, {"_id": 0})
        if not event:
            return None
        
        # In production, this would use Google Calendar API
        # For now, we'll simulate the sync
        google_event_id = f"google_{event_id[:8]}"
        
        await self.db.calendar_events.update_one(
            {"id": event_id},
            {"$set": {"google_event_id": google_event_id}}
        )
        
        return google_event_id
    
    async def check_google_connected(self, user_id: str) -> bool:
        """Check if user has connected Google Calendar"""
        token = await self.db.google_calendar_tokens.find_one({"user_id": user_id})
        return token is not None
