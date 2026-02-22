"""
Nova Memory Service - Long-term user memory and proactive suggestions
"""
import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta

logger = logging.getLogger(__name__)


class NovaMemoryService:
    def __init__(self, db):
        self.db = db
    
    async def store_interaction(
        self,
        user_id: str,
        message: str,
        response: str,
        context: Dict[str, Any] = None
    ) -> None:
        """Store a user interaction for long-term memory"""
        interaction = {
            "user_id": user_id,
            "message": message,
            "response": response[:500],  # Truncate long responses
            "context": context or {},
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
        await self.db.nova_interactions.insert_one(interaction)
        
        # Extract and update user preferences
        await self._extract_preferences(user_id, message, context)
    
    async def _extract_preferences(
        self,
        user_id: str,
        message: str,
        context: Dict[str, Any] = None
    ) -> None:
        """Extract preferences from user messages"""
        message_lower = message.lower()
        preferences_update = {}
        
        # Budget extraction
        import re
        budget_match = re.search(r'\$?\s*(\d{1,2}[,.]?\d{3})\s*(?:/mo|per month|monthly)?', message)
        if budget_match:
            budget = int(budget_match.group(1).replace(',', '').replace('.', ''))
            if budget < 10000:  # Likely monthly rent
                preferences_update["max_budget"] = budget
        
        # Bedroom extraction
        bed_match = re.search(r'(\d+)\s*(?:bed|bedroom|br)', message_lower)
        if bed_match:
            preferences_update["bedrooms"] = int(bed_match.group(1))
        
        # Pet preferences
        if any(word in message_lower for word in ['dog', 'cat', 'pet']):
            preferences_update["pet_friendly"] = True
        
        # Location preferences
        vancouver_areas = ['downtown', 'kitsilano', 'mount pleasant', 'yaletown', 
                         'gastown', 'east van', 'west end', 'burnaby', 'richmond']
        for area in vancouver_areas:
            if area in message_lower:
                if "preferred_areas" not in preferences_update:
                    preferences_update["preferred_areas"] = []
                preferences_update["preferred_areas"].append(area.title())
        
        # Property type preferences
        property_types = {'apartment': 'Apartment', 'condo': 'Condo', 'house': 'House', 
                         'townhouse': 'Townhouse', 'studio': 'Studio'}
        for key, value in property_types.items():
            if key in message_lower:
                preferences_update["preferred_property_type"] = value
        
        # Commute preferences
        commute_match = re.search(r'commute to\s+(.+?)(?:\.|,|$)', message_lower)
        if commute_match:
            preferences_update["commute_to"] = commute_match.group(1).strip().title()
        
        # Save preferences if any found
        if preferences_update:
            await self.update_preferences(user_id, preferences_update)
    
    async def get_user_memory(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive user memory for Nova"""
        # Get stored preferences
        user_prefs = await self.db.nova_user_profiles.find_one(
            {"user_id": user_id}, {"_id": 0}
        ) or {}
        
        # Get recent interactions
        recent = await self.db.nova_interactions.find(
            {"user_id": user_id}
        ).sort("timestamp", -1).limit(10).to_list(10)
        
        # Get saved searches
        saved_searches = await self.db.saved_searches.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(5).to_list(5)
        
        # Get favorited listings
        favorites = await self.db.favorites.find(
            {"user_id": user_id}
        ).sort("created_at", -1).limit(10).to_list(10)
        
        return {
            "preferences": user_prefs.get("preferences", {}),
            "recent_interactions": [
                {"message": r["message"], "timestamp": r["timestamp"]}
                for r in recent
            ],
            "saved_searches": saved_searches,
            "favorite_count": len(favorites),
            "last_active": recent[0]["timestamp"] if recent else None
        }
    
    async def update_preferences(
        self,
        user_id: str,
        preferences: Dict[str, Any]
    ) -> None:
        """Update user preferences"""
        await self.db.nova_user_profiles.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    f"preferences.{k}": v for k, v in preferences.items()
                },
                "$setOnInsert": {
                    "user_id": user_id,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
    
    async def generate_proactive_suggestions(
        self,
        user_id: str
    ) -> List[Dict[str, Any]]:
        """Generate proactive suggestions based on user behavior"""
        suggestions = []
        memory = await self.get_user_memory(user_id)
        prefs = memory.get("preferences", {})
        
        # Check for new listings matching preferences
        if prefs.get("max_budget") or prefs.get("bedrooms"):
            query = {"status": "active"}
            if prefs.get("max_budget"):
                query["price"] = {"$lte": prefs["max_budget"]}
            if prefs.get("bedrooms"):
                query["bedrooms"] = prefs["bedrooms"]
            if prefs.get("pet_friendly"):
                query["pet_friendly"] = True
            
            # Get listings from last 3 days
            three_days_ago = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
            query["created_at"] = {"$gte": three_days_ago}
            
            new_listings = await self.db.listings.count_documents(query)
            if new_listings > 0:
                suggestions.append({
                    "type": "new_listings",
                    "message": f"🏠 {new_listings} new listing(s) match your preferences!",
                    "action": "View new listings",
                    "priority": "high"
                })
        
        # Price drop alerts (simulated for demo)
        if memory.get("favorite_count", 0) > 0:
            suggestions.append({
                "type": "price_drop",
                "message": "💰 1 of your saved properties just dropped in price!",
                "action": "View favorites",
                "priority": "high"
            })
        
        # Market insights
        suggestions.append({
            "type": "market_insight",
            "message": "📊 Vancouver rental market is 5% more competitive this month",
            "action": "Learn more",
            "priority": "low"
        })
        
        # Incomplete profile nudge
        if not prefs.get("commute_to"):
            suggestions.append({
                "type": "profile_incomplete",
                "message": "📍 Tell me your commute location for better recommendations",
                "action": "Set commute",
                "priority": "medium"
            })
        
        return suggestions
    
    async def get_context_summary(self, user_id: str) -> str:
        """Generate a context summary for Nova to use in responses"""
        memory = await self.get_user_memory(user_id)
        prefs = memory.get("preferences", {})
        
        summary_parts = []
        
        if prefs.get("max_budget"):
            summary_parts.append(f"budget up to ${prefs['max_budget']}/month")
        if prefs.get("bedrooms"):
            summary_parts.append(f"looking for {prefs['bedrooms']} bedroom(s)")
        if prefs.get("preferred_areas"):
            summary_parts.append(f"interested in {', '.join(prefs['preferred_areas'][:3])}")
        if prefs.get("pet_friendly"):
            summary_parts.append("needs pet-friendly")
        if prefs.get("commute_to"):
            summary_parts.append(f"commutes to {prefs['commute_to']}")
        if prefs.get("preferred_property_type"):
            summary_parts.append(f"prefers {prefs['preferred_property_type']}")
        
        if summary_parts:
            return "User context: " + "; ".join(summary_parts)
        return ""


class SavedSearchService:
    def __init__(self, db):
        self.db = db
    
    async def save_search(
        self,
        user_id: str,
        search_criteria: Dict[str, Any],
        name: str = ""
    ) -> str:
        """Save a search for notifications"""
        import uuid
        search_id = str(uuid.uuid4())
        
        search = {
            "id": search_id,
            "user_id": user_id,
            "name": name or f"Search {datetime.now(timezone.utc).strftime('%b %d')}",
            "criteria": search_criteria,
            "notify": True,
            "last_checked": datetime.now(timezone.utc).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.saved_searches.insert_one(search)
        return search_id
    
    async def get_user_searches(self, user_id: str) -> List[Dict[str, Any]]:
        """Get all saved searches for a user"""
        searches = await self.db.saved_searches.find(
            {"user_id": user_id}, {"_id": 0}
        ).sort("created_at", -1).to_list(20)
        return searches
    
    async def check_for_matches(self, user_id: str) -> List[Dict[str, Any]]:
        """Check saved searches for new matches"""
        matches = []
        searches = await self.get_user_searches(user_id)
        
        for search in searches:
            criteria = search.get("criteria", {})
            query = {"status": "active"}
            
            if criteria.get("max_price"):
                query["price"] = {"$lte": criteria["max_price"]}
            if criteria.get("bedrooms"):
                query["bedrooms"] = criteria["bedrooms"]
            if criteria.get("city"):
                query["city"] = {"$regex": criteria["city"], "$options": "i"}
            
            # Check for listings since last check
            query["created_at"] = {"$gt": search.get("last_checked", "")}
            
            new_count = await self.db.listings.count_documents(query)
            if new_count > 0:
                matches.append({
                    "search_id": search["id"],
                    "search_name": search["name"],
                    "new_listings": new_count
                })
                
                # Update last checked
                await self.db.saved_searches.update_one(
                    {"id": search["id"]},
                    {"$set": {"last_checked": datetime.now(timezone.utc).isoformat()}}
                )
        
        return matches
