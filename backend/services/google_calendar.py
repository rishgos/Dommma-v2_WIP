"""
Google Calendar Service - Real OAuth integration
"""
import os
import json
import logging
import httpx
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict, Any
from urllib.parse import urlencode

logger = logging.getLogger(__name__)

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3"
SCOPES = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly"


class GoogleCalendarService:
    def __init__(self, db):
        self.db = db
        self.client_id = os.environ.get('GOOGLE_CLIENT_ID', '')
        self.client_secret = os.environ.get('GOOGLE_CLIENT_SECRET', '')
    
    def get_auth_url(self, redirect_uri: str, state: str = "") -> str:
        """Generate Google OAuth URL"""
        if not self.client_id:
            raise ValueError("Google OAuth not configured")
        
        params = {
            "client_id": self.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": SCOPES,
            "access_type": "offline",
            "prompt": "consent",
            "state": state
        }
        
        return f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    
    async def exchange_code(self, code: str, redirect_uri: str) -> dict:
        """Exchange authorization code for tokens"""
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(GOOGLE_TOKEN_URL, data=data)
            
            if response.status_code != 200:
                logger.error(f"Token exchange failed: {response.text}")
                raise ValueError("Failed to exchange authorization code")
            
            return response.json()
    
    async def refresh_token(self, refresh_token: str) -> dict:
        """Refresh access token"""
        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(GOOGLE_TOKEN_URL, data=data)
            
            if response.status_code != 200:
                logger.error(f"Token refresh failed: {response.text}")
                raise ValueError("Failed to refresh token")
            
            return response.json()
    
    async def store_tokens(self, user_id: str, tokens: dict) -> None:
        """Store Google tokens for user"""
        from datetime import datetime, timezone
        
        # Calculate expiry time
        expires_in = tokens.get("expires_in", 3600)
        expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        
        token_data = {
            "user_id": user_id,
            "access_token": tokens.get("access_token"),
            "refresh_token": tokens.get("refresh_token"),
            "token_expiry": expiry.isoformat(),
            "scope": tokens.get("scope", SCOPES),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        existing = await self.db.google_calendar_tokens.find_one({"user_id": user_id})
        
        if existing:
            # Keep existing refresh token if not provided (happens on refresh)
            if not token_data.get("refresh_token"):
                token_data["refresh_token"] = existing.get("refresh_token")
            
            await self.db.google_calendar_tokens.update_one(
                {"user_id": user_id},
                {"$set": token_data}
            )
        else:
            token_data["created_at"] = datetime.now(timezone.utc).isoformat()
            await self.db.google_calendar_tokens.insert_one(token_data)
    
    async def get_valid_token(self, user_id: str) -> Optional[str]:
        """Get valid access token, refreshing if needed"""
        token_doc = await self.db.google_calendar_tokens.find_one(
            {"user_id": user_id}, {"_id": 0}
        )
        
        if not token_doc:
            return None
        
        # Check if token is expired
        expiry = datetime.fromisoformat(token_doc["token_expiry"].replace('Z', '+00:00'))
        if expiry < datetime.now(timezone.utc):
            # Token expired, refresh it
            try:
                new_tokens = await self.refresh_token(token_doc["refresh_token"])
                await self.store_tokens(user_id, new_tokens)
                return new_tokens["access_token"]
            except Exception as e:
                logger.error(f"Token refresh failed: {e}")
                return None
        
        return token_doc["access_token"]
    
    async def is_connected(self, user_id: str) -> bool:
        """Check if user has connected Google Calendar"""
        token = await self.get_valid_token(user_id)
        return token is not None
    
    async def disconnect(self, user_id: str) -> bool:
        """Disconnect Google Calendar"""
        result = await self.db.google_calendar_tokens.delete_one({"user_id": user_id})
        return result.deleted_count > 0
    
    # Calendar API Methods
    async def list_calendars(self, user_id: str) -> List[dict]:
        """List user's calendars"""
        token = await self.get_valid_token(user_id)
        if not token:
            raise ValueError("Google Calendar not connected")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GOOGLE_CALENDAR_API}/users/me/calendarList",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            if response.status_code != 200:
                raise ValueError("Failed to fetch calendars")
            
            data = response.json()
            return data.get("items", [])
    
    async def create_event(
        self,
        user_id: str,
        event: dict,
        calendar_id: str = "primary"
    ) -> dict:
        """Create a calendar event"""
        token = await self.get_valid_token(user_id)
        if not token:
            raise ValueError("Google Calendar not connected")
        
        # Format event for Google Calendar API
        google_event = {
            "summary": event.get("title", "DOMMMA Event"),
            "description": event.get("description", ""),
            "location": event.get("location", ""),
            "start": {
                "dateTime": event.get("start_time"),
                "timeZone": "America/Vancouver"
            },
            "end": {
                "dateTime": event.get("end_time"),
                "timeZone": "America/Vancouver"
            },
            "reminders": {
                "useDefault": False,
                "overrides": [
                    {"method": "popup", "minutes": event.get("reminder_minutes", 30)}
                ]
            }
        }
        
        if event.get("attendees"):
            google_event["attendees"] = [
                {"email": email} for email in event["attendees"] if "@" in email
            ]
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GOOGLE_CALENDAR_API}/calendars/{calendar_id}/events",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                json=google_event
            )
            
            if response.status_code not in [200, 201]:
                logger.error(f"Failed to create event: {response.text}")
                raise ValueError("Failed to create calendar event")
            
            return response.json()
    
    async def list_events(
        self,
        user_id: str,
        time_min: str = None,
        time_max: str = None,
        max_results: int = 50,
        calendar_id: str = "primary"
    ) -> List[dict]:
        """List calendar events"""
        token = await self.get_valid_token(user_id)
        if not token:
            raise ValueError("Google Calendar not connected")
        
        params = {
            "maxResults": max_results,
            "singleEvents": "true",
            "orderBy": "startTime"
        }
        
        if time_min:
            params["timeMin"] = time_min
        else:
            params["timeMin"] = datetime.now(timezone.utc).isoformat()
        
        if time_max:
            params["timeMax"] = time_max
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{GOOGLE_CALENDAR_API}/calendars/{calendar_id}/events",
                headers={"Authorization": f"Bearer {token}"},
                params=params
            )
            
            if response.status_code != 200:
                raise ValueError("Failed to fetch events")
            
            data = response.json()
            return data.get("items", [])
    
    async def delete_event(
        self,
        user_id: str,
        event_id: str,
        calendar_id: str = "primary"
    ) -> bool:
        """Delete a calendar event"""
        token = await self.get_valid_token(user_id)
        if not token:
            raise ValueError("Google Calendar not connected")
        
        async with httpx.AsyncClient() as client:
            response = await client.delete(
                f"{GOOGLE_CALENDAR_API}/calendars/{calendar_id}/events/{event_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
            
            return response.status_code == 204
    
    async def sync_local_event(
        self,
        user_id: str,
        local_event_id: str
    ) -> Optional[str]:
        """Sync a local calendar event to Google Calendar"""
        # Get local event
        local_event = await self.db.calendar_events.find_one(
            {"id": local_event_id, "user_id": user_id}, {"_id": 0}
        )
        
        if not local_event:
            raise ValueError("Local event not found")
        
        # Create on Google Calendar
        google_event = await self.create_event(user_id, local_event)
        
        # Update local event with Google event ID
        await self.db.calendar_events.update_one(
            {"id": local_event_id},
            {"$set": {"google_event_id": google_event["id"]}}
        )
        
        return google_event["id"]
