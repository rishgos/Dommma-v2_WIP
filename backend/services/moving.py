"""
Moving Quote Service - AI-Enhanced Moving Cost Calculator
Uses real pricing algorithms with AI-powered tips and recommendations
"""
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import math
import logging
import os
import json

logger = logging.getLogger(__name__)

# Base pricing configuration
PRICING_CONFIG = {
    "base_rate_per_hour": 120,  # CAD per hour
    "truck_sizes": {
        "small": {"capacity": "studio-1br", "cost_multiplier": 1.0, "crew": 2},
        "medium": {"capacity": "2br-3br", "cost_multiplier": 1.3, "crew": 3},
        "large": {"capacity": "4br+", "cost_multiplier": 1.6, "crew": 4},
    },
    "home_size_hours": {
        "studio": 2,
        "1br": 3,
        "2br": 4,
        "3br": 6,
        "4br+": 8,
        "house": 10,
    },
    "distance_rate_per_km": 2.5,  # CAD per km
    "floor_surcharge_per_floor": 50,  # No elevator
    "special_items": {
        "piano": 300,
        "pool_table": 250,
        "antiques": 150,
        "hot_tub": 400,
        "safe": 200,
        "artwork": 100,
        "gym_equipment": 150,
    },
    "packing_service_multiplier": 1.4,
    "storage_monthly_base": 150,
    "storage_per_sqft": 3,
}

# Vancouver area coordinates for distance calculation
VANCOUVER_AREAS = {
    "downtown": (49.2827, -123.1207),
    "kitsilano": (49.2684, -123.1647),
    "mount pleasant": (49.2620, -123.1013),
    "east vancouver": (49.2488, -123.0655),
    "west end": (49.2850, -123.1356),
    "yaletown": (49.2750, -123.1220),
    "north vancouver": (49.3165, -123.0688),
    "burnaby": (49.2488, -122.9805),
    "richmond": (49.1666, -123.1336),
    "surrey": (49.1913, -122.8490),
    "coquitlam": (49.2838, -122.7932),
    "new westminster": (49.2057, -122.9110),
}


def calculate_distance(origin: str, destination: str) -> float:
    """Calculate approximate distance between two addresses in km"""
    origin_lower = origin.lower()
    dest_lower = destination.lower()
    
    origin_coords = None
    dest_coords = None
    
    for area, coords in VANCOUVER_AREAS.items():
        if area in origin_lower:
            origin_coords = coords
        if area in dest_lower:
            dest_coords = coords
    
    # Default to downtown if not found
    if not origin_coords:
        origin_coords = VANCOUVER_AREAS["downtown"]
    if not dest_coords:
        dest_coords = VANCOUVER_AREAS["downtown"]
    
    # Haversine formula for distance
    lat1, lon1 = origin_coords
    lat2, lon2 = dest_coords
    
    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    distance = R * c
    
    # Minimum distance of 5km for local moves
    return max(distance, 5.0)


def get_truck_size(home_size: str) -> str:
    """Determine appropriate truck size based on home size"""
    if home_size in ["studio", "1br"]:
        return "small"
    elif home_size in ["2br", "3br"]:
        return "medium"
    else:
        return "large"


class MovingQuoteService:
    def __init__(self, db):
        self.db = db
        self.config = PRICING_CONFIG
    
    async def _get_ai_tips(self, request_data: dict, quote_data: dict) -> Optional[Dict]:
        """Get AI-powered moving tips and recommendations"""
        try:
            from emergentintegrations.llm.chat import chat, UserMessage
            
            api_key = os.environ.get("EMERGENT_LLM_KEY")
            if not api_key:
                return None
            
            prompt = f"""You are a moving consultant helping someone plan their move. Based on their details, provide helpful tips.

MOVE DETAILS:
- From: {request_data.get('origin_address')}
- To: {request_data.get('destination_address')}
- Home Size: {request_data.get('home_size')}
- Move Date: {request_data.get('preferred_date', 'Not specified')}
- Distance: {quote_data.get('distance_km')} km
- Special Items: {', '.join(request_data.get('special_items', [])) or 'None'}
- Packing Service: {'Yes' if request_data.get('packing_service') else 'No'}
- Has Elevator (Origin): {'Yes' if request_data.get('has_elevator_origin') else 'No'}
- Has Elevator (Destination): {'Yes' if request_data.get('has_elevator_destination') else 'No'}
- Estimated Cost: ${quote_data.get('estimated_cost_low')} - ${quote_data.get('estimated_cost_high')}

Provide a JSON response with:
1. "summary": A brief 1-2 sentence summary of their move
2. "money_saving_tips": Array of 3 tips to save money on this move
3. "preparation_checklist": Array of 5 key things to do before moving day
4. "moving_day_tips": Array of 3 tips for the actual moving day
5. "neighborhood_info": Brief info about the destination area (if identifiable)
6. "timing_advice": Advice about the best time/day to move

Respond ONLY with valid JSON, no other text."""

            response = await chat(
                api_key=api_key,
                model="claude-sonnet-4-5-20250514",
                messages=[UserMessage(content=prompt)]
            )
            
            # Parse AI response
            content = response.content
            try:
                # Handle potential markdown code blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0]
                elif "```" in content:
                    content = content.split("```")[1].split("```")[0]
                
                return json.loads(content.strip())
            except json.JSONDecodeError:
                logger.warning("Failed to parse AI tips response")
                return None
                
        except Exception as e:
            logger.error(f"AI tips generation error: {e}")
            return None
    
    async def generate_quote(self, user_id: str, request_data: dict, include_ai_tips: bool = False) -> dict:
        """Generate a moving quote based on the request"""
        from models import MovingQuote, MovingQuoteRequest
        
        request = MovingQuoteRequest(**request_data)
        
        # Calculate distance
        distance = calculate_distance(request.origin_address, request.destination_address)
        
        # Determine truck size and crew
        truck_size = get_truck_size(request.home_size)
        truck_config = self.config["truck_sizes"][truck_size]
        
        # Calculate base hours
        base_hours = self.config["home_size_hours"].get(request.home_size, 5)
        
        # Add time for distance (approximate 30 min per 10km)
        travel_hours = distance / 20
        total_hours = base_hours + travel_hours
        
        # Calculate base cost
        hourly_rate = self.config["base_rate_per_hour"] * truck_config["cost_multiplier"]
        base_cost = hourly_rate * total_hours
        
        # Add distance cost
        distance_cost = distance * self.config["distance_rate_per_km"]
        
        # Floor surcharges (if no elevator)
        floor_surcharge = 0
        if not request.has_elevator_origin and request.floor_origin > 1:
            floor_surcharge += (request.floor_origin - 1) * self.config["floor_surcharge_per_floor"]
        if not request.has_elevator_destination and request.floor_destination > 1:
            floor_surcharge += (request.floor_destination - 1) * self.config["floor_surcharge_per_floor"]
        
        # Special items
        special_items_cost = sum(
            self.config["special_items"].get(item, 0) 
            for item in request.special_items
        )
        
        # Subtotal before services
        subtotal = base_cost + distance_cost + floor_surcharge + special_items_cost
        
        # Packing service
        if request.packing_service:
            subtotal *= self.config["packing_service_multiplier"]
        
        # Calculate range (±15%)
        low_estimate = subtotal * 0.85
        high_estimate = subtotal * 1.15
        
        # Storage calculation
        storage_monthly = None
        if request.storage_needed:
            storage_sqft = {"studio": 50, "1br": 75, "2br": 100, "3br": 150, "4br+": 200, "house": 250}
            sqft = storage_sqft.get(request.home_size, 100)
            storage_monthly = self.config["storage_monthly_base"] + (sqft * self.config["storage_per_sqft"])
        
        # Generate notes
        notes = []
        if distance > 50:
            notes.append("Long-distance move - additional insurance recommended")
        if request.special_items:
            notes.append(f"Special handling for: {', '.join(request.special_items)}")
        if floor_surcharge > 0:
            notes.append("Stair carry charges applied")
        if request.packing_service:
            notes.append("Full packing service included")
        
        # Create quote valid for 7 days
        valid_until = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
        
        quote = MovingQuote(
            user_id=user_id,
            request=request,
            estimated_cost_low=round(low_estimate, 2),
            estimated_cost_high=round(high_estimate, 2),
            estimated_hours=round(total_hours, 1),
            distance_km=round(distance, 1),
            truck_size=truck_size,
            crew_size=truck_config["crew"],
            includes_packing=request.packing_service,
            includes_storage=request.storage_needed,
            storage_monthly_cost=storage_monthly,
            valid_until=valid_until,
            notes=notes
        )
        
        quote_dict = quote.model_dump()
        
        # Get AI tips if requested
        if include_ai_tips:
            ai_tips = await self._get_ai_tips(request_data, quote_dict)
            if ai_tips:
                quote_dict["ai_tips"] = ai_tips
        
        # Save quote to database
        await self.db.moving_quotes.insert_one(quote_dict)
        
        return quote_dict
    
    async def get_ai_tips_for_quote(self, quote_id: str) -> Optional[Dict]:
        """Get AI tips for an existing quote"""
        quote = await self.db.moving_quotes.find_one({"id": quote_id}, {"_id": 0})
        if not quote:
            return None
        
        request_data = quote.get("request", {})
        ai_tips = await self._get_ai_tips(request_data, quote)
        
        if ai_tips:
            # Update quote with AI tips
            await self.db.moving_quotes.update_one(
                {"id": quote_id},
                {"$set": {"ai_tips": ai_tips}}
            )
        
        return ai_tips
    
    async def get_user_quotes(self, user_id: str) -> List[dict]:
        """Get all quotes for a user"""
        quotes = await self.db.moving_quotes.find(
            {"user_id": user_id}, {"_id": 0}
        ).sort("created_at", -1).to_list(50)
        return quotes
    
    async def get_quote(self, quote_id: str) -> dict:
        """Get a specific quote"""
        quote = await self.db.moving_quotes.find_one({"id": quote_id}, {"_id": 0})
        return quote
