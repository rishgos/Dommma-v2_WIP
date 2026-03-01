"""
AI Tools Service for Nova Concierge
Implements Claude tool-calling for structured actions
"""
import uuid
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)

# Tool Definitions for Claude
NOVA_TOOLS = [
    {
        "name": "create_listing",
        "description": "Create a new property listing for rent or sale. Use this when a landlord wants to list their property. Collect as much information as possible from the conversation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "title": {
                    "type": "string",
                    "description": "Property title (e.g., 'Modern 2BR Downtown Condo')"
                },
                "address": {
                    "type": "string",
                    "description": "Street address of the property"
                },
                "city": {
                    "type": "string",
                    "description": "City name (default: Vancouver)"
                },
                "province": {
                    "type": "string",
                    "description": "Province (default: BC)"
                },
                "postal_code": {
                    "type": "string",
                    "description": "Postal code if known"
                },
                "price": {
                    "type": "number",
                    "description": "Monthly rent or sale price"
                },
                "listing_type": {
                    "type": "string",
                    "enum": ["rent", "sale"],
                    "description": "Whether the property is for rent or sale"
                },
                "property_type": {
                    "type": "string",
                    "enum": ["apartment", "house", "condo", "studio", "townhouse", "duplex", "loft", "basement"],
                    "description": "Type of property"
                },
                "bedrooms": {
                    "type": "integer",
                    "description": "Number of bedrooms (0 for studio)"
                },
                "bathrooms": {
                    "type": "number",
                    "description": "Number of bathrooms"
                },
                "sqft": {
                    "type": "integer",
                    "description": "Square footage if known"
                },
                "description": {
                    "type": "string",
                    "description": "Property description"
                },
                "amenities": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "List of amenities (e.g., parking, laundry, gym)"
                },
                "pet_friendly": {
                    "type": "boolean",
                    "description": "Whether pets are allowed"
                },
                "lease_duration_months": {
                    "type": "integer",
                    "description": "Minimum lease duration in months"
                },
                "special_offers": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Special offers (e.g., '1 month free rent', 'Free parking')"
                },
                "available_date": {
                    "type": "string",
                    "description": "When the property is available (ISO date or 'immediately')"
                }
            },
            "required": ["address", "price", "bedrooms", "bathrooms"]
        }
    },
    {
        "name": "search_listings",
        "description": "Search for property listings based on criteria. Use this when users are looking for properties to rent or buy.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {
                    "type": "string",
                    "description": "City to search in"
                },
                "listing_type": {
                    "type": "string",
                    "enum": ["rent", "sale"],
                    "description": "Looking to rent or buy"
                },
                "min_price": {
                    "type": "number",
                    "description": "Minimum price"
                },
                "max_price": {
                    "type": "number",
                    "description": "Maximum price"
                },
                "bedrooms": {
                    "type": "integer",
                    "description": "Minimum number of bedrooms"
                },
                "pet_friendly": {
                    "type": "boolean",
                    "description": "Must allow pets"
                },
                "amenities": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Required amenities"
                },
                "has_offers": {
                    "type": "boolean",
                    "description": "Only show listings with special offers/deals"
                }
            }
        }
    },
    {
        "name": "find_contractors",
        "description": "Search for contractors/service providers. Use this when users need plumbers, electricians, cleaners, painters, or other home service professionals.",
        "input_schema": {
            "type": "object",
            "properties": {
                "specialty": {
                    "type": "string",
                    "description": "Type of service needed (e.g., plumbing, electrical, cleaning, painting, renovation)"
                },
                "city": {
                    "type": "string",
                    "description": "City/area for service"
                },
                "min_rating": {
                    "type": "number",
                    "description": "Minimum rating (1-5)"
                },
                "max_hourly_rate": {
                    "type": "number",
                    "description": "Maximum hourly rate budget"
                },
                "verified_only": {
                    "type": "boolean",
                    "description": "Only show verified contractors"
                }
            },
            "required": ["specialty"]
        }
    },
    {
        "name": "triage_maintenance",
        "description": "Analyze and triage a maintenance request. Use this when tenants report issues with their rental property.",
        "input_schema": {
            "type": "object",
            "properties": {
                "issue_description": {
                    "type": "string",
                    "description": "Description of the maintenance issue"
                },
                "category": {
                    "type": "string",
                    "enum": ["plumbing", "electrical", "hvac", "appliance", "structural", "pest", "other"],
                    "description": "Category of the issue"
                },
                "urgency": {
                    "type": "string",
                    "enum": ["low", "medium", "high", "emergency"],
                    "description": "Urgency level based on description"
                },
                "property_id": {
                    "type": "string",
                    "description": "ID of the property if known"
                },
                "tenant_id": {
                    "type": "string",
                    "description": "ID of the tenant reporting"
                }
            },
            "required": ["issue_description", "category", "urgency"]
        }
    },
    {
        "name": "calculate_budget",
        "description": "Calculate affordable rent based on income. Use the 30% rule: max rent should be 30% of gross monthly income.",
        "input_schema": {
            "type": "object",
            "properties": {
                "annual_income": {
                    "type": "number",
                    "description": "Annual gross income"
                },
                "monthly_income": {
                    "type": "number",
                    "description": "Monthly gross income (alternative to annual)"
                },
                "include_utilities": {
                    "type": "boolean",
                    "description": "Whether to factor in estimated utilities"
                }
            }
        }
    },
    {
        "name": "schedule_viewing",
        "description": "Schedule a property viewing appointment.",
        "input_schema": {
            "type": "object",
            "properties": {
                "listing_id": {
                    "type": "string",
                    "description": "ID of the listing to view"
                },
                "preferred_date": {
                    "type": "string",
                    "description": "Preferred date for viewing (ISO format)"
                },
                "preferred_time": {
                    "type": "string",
                    "description": "Preferred time slot"
                },
                "viewer_name": {
                    "type": "string",
                    "description": "Name of the person viewing"
                },
                "viewer_email": {
                    "type": "string",
                    "description": "Email for confirmation"
                },
                "viewer_phone": {
                    "type": "string",
                    "description": "Phone number"
                },
                "notes": {
                    "type": "string",
                    "description": "Additional notes or questions"
                }
            },
            "required": ["listing_id", "preferred_date"]
        }
    }
]


class AIToolsService:
    """Service to execute AI tool calls"""
    
    def __init__(self, db):
        self.db = db
    
    async def execute_tool(self, tool_name: str, tool_input: Dict[str, Any], user_id: Optional[str] = None) -> Dict[str, Any]:
        """Execute a tool and return the result"""
        logger.info(f"Executing tool: {tool_name} with input: {tool_input}")
        
        try:
            if tool_name == "create_listing":
                return await self._create_listing(tool_input, user_id)
            elif tool_name == "search_listings":
                return await self._search_listings(tool_input)
            elif tool_name == "find_contractors":
                return await self._find_contractors(tool_input)
            elif tool_name == "triage_maintenance":
                return await self._triage_maintenance(tool_input, user_id)
            elif tool_name == "calculate_budget":
                return await self._calculate_budget(tool_input)
            elif tool_name == "schedule_viewing":
                return await self._schedule_viewing(tool_input, user_id)
            else:
                return {"error": f"Unknown tool: {tool_name}"}
        except Exception as e:
            logger.error(f"Tool execution error: {e}")
            return {"error": str(e)}
    
    async def _create_listing(self, input: Dict[str, Any], user_id: Optional[str]) -> Dict[str, Any]:
        """Create a new property listing"""
        listing_id = str(uuid.uuid4())
        
        # Default Vancouver coordinates if not provided
        default_lat = 49.2827
        default_lng = -123.1207
        
        # Build listing document
        listing = {
            "id": listing_id,
            "title": input.get("title", f"{input.get('bedrooms', 1)} Bedroom {input.get('property_type', 'Apartment').title()}"),
            "address": input.get("address", ""),
            "city": input.get("city", "Vancouver"),
            "province": input.get("province", "BC"),
            "postal_code": input.get("postal_code", ""),
            "price": input.get("price", 0),
            "listing_type": input.get("listing_type", "rent"),
            "property_type": input.get("property_type", "apartment"),
            "bedrooms": input.get("bedrooms", 1),
            "bathrooms": input.get("bathrooms", 1),
            "sqft": input.get("sqft", 0),
            "description": input.get("description", ""),
            "amenities": input.get("amenities", []),
            "pet_friendly": input.get("pet_friendly", False),
            "lease_duration_months": input.get("lease_duration_months", 12),
            "offers": input.get("special_offers", []),
            "available_date": input.get("available_date", "immediately"),
            "images": [],
            "status": "active",
            "owner_id": user_id,
            "lat": default_lat,
            "lng": default_lng,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Insert into database
        await self.db.listings.insert_one(listing)
        
        # Return success with listing details
        return {
            "success": True,
            "listing_id": listing_id,
            "message": "Listing created successfully",
            "listing": {
                "id": listing_id,
                "title": listing["title"],
                "address": f"{listing['address']}, {listing['city']}, {listing['province']}",
                "price": listing["price"],
                "bedrooms": listing["bedrooms"],
                "bathrooms": listing["bathrooms"],
                "property_type": listing["property_type"],
                "listing_type": listing["listing_type"],
                "special_offers": listing["offers"]
            }
        }
    
    async def _search_listings(self, input: Dict[str, Any]) -> Dict[str, Any]:
        """Search for listings based on criteria"""
        query = {"status": "active"}
        
        if input.get("city"):
            query["city"] = {"$regex": input["city"], "$options": "i"}
        
        if input.get("listing_type"):
            query["listing_type"] = input["listing_type"]
        
        if input.get("min_price") or input.get("max_price"):
            query["price"] = {}
            if input.get("min_price"):
                query["price"]["$gte"] = input["min_price"]
            if input.get("max_price"):
                query["price"]["$lte"] = input["max_price"]
        
        if input.get("bedrooms") is not None:
            query["bedrooms"] = {"$gte": input["bedrooms"]}
        
        if input.get("pet_friendly"):
            query["pet_friendly"] = True
        
        if input.get("has_offers"):
            query["offers"] = {"$exists": True, "$ne": []}
        
        # Execute search
        listings = await self.db.listings.find(query, {"_id": 0}).limit(10).to_list(10)
        
        return {
            "success": True,
            "count": len(listings),
            "listings": [
                {
                    "id": listing["id"],
                    "title": listing.get("title", "Untitled"),
                    "address": f"{listing.get('address', '')}, {listing.get('city', '')}",
                    "price": listing.get("price", 0),
                    "bedrooms": listing.get("bedrooms", 0),
                    "bathrooms": listing.get("bathrooms", 1),
                    "property_type": listing.get("property_type", "apartment"),
                    "pet_friendly": listing.get("pet_friendly", False),
                    "special_offers": listing.get("offers", [])
                }
                for listing in listings
            ]
        }
    
    async def _find_contractors(self, input: Dict[str, Any]) -> Dict[str, Any]:
        """Find contractors based on specialty"""
        query = {"status": "active"}
        
        specialty = input.get("specialty", "").lower()
        if specialty:
            query["specialties"] = {"$regex": specialty, "$options": "i"}
        
        if input.get("city"):
            query["service_area"] = {"$regex": input["city"], "$options": "i"}
        
        if input.get("min_rating"):
            query["rating"] = {"$gte": input["min_rating"]}
        
        if input.get("max_hourly_rate"):
            query["hourly_rate"] = {"$lte": input["max_hourly_rate"]}
        
        if input.get("verified_only"):
            query["verified"] = True
        
        # Execute search
        contractors = await self.db.contractor_profiles.find(query, {"_id": 0}).limit(5).to_list(5)
        
        return {
            "success": True,
            "count": len(contractors),
            "contractors": [
                {
                    "id": c["id"],
                    "business_name": c.get("business_name") or c.get("company_name", "Unknown"),
                    "specialties": c.get("specialties", []),
                    "hourly_rate": c.get("hourly_rate", 0),
                    "rating": c.get("rating", 0),
                    "verified": c.get("verified", False),
                    "description": c.get("description", "")[:100]
                }
                for c in contractors
            ]
        }
    
    async def _triage_maintenance(self, input: Dict[str, Any], user_id: Optional[str]) -> Dict[str, Any]:
        """Triage a maintenance request"""
        request_id = str(uuid.uuid4())
        
        # Determine urgency factors
        urgency = input.get("urgency", "medium")
        category = input.get("category", "other")
        
        # Create maintenance request
        maintenance_request = {
            "id": request_id,
            "description": input.get("issue_description", ""),
            "category": category,
            "urgency": urgency,
            "property_id": input.get("property_id"),
            "tenant_id": user_id,
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.maintenance_requests.insert_one(maintenance_request)
        
        # Find matching contractors
        contractor_query = {"status": "active"}
        if category in ["plumbing", "electrical", "hvac"]:
            contractor_query["specialties"] = {"$regex": category, "$options": "i"}
        
        suggested_contractors = await self.db.contractor_profiles.find(
            contractor_query, {"_id": 0}
        ).sort("rating", -1).limit(3).to_list(3)
        
        return {
            "success": True,
            "request_id": request_id,
            "urgency": urgency,
            "category": category,
            "message": f"Maintenance request created with {urgency} urgency",
            "suggested_contractors": [
                {
                    "id": c["id"],
                    "name": c.get("business_name") or c.get("company_name"),
                    "rating": c.get("rating", 0),
                    "hourly_rate": c.get("hourly_rate", 0)
                }
                for c in suggested_contractors
            ]
        }
    
    async def _calculate_budget(self, input: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate affordable rent based on income"""
        annual = input.get("annual_income", 0)
        monthly = input.get("monthly_income", 0)
        
        if annual:
            monthly = annual / 12
        
        if not monthly:
            return {"error": "Please provide annual or monthly income"}
        
        # 30% rule for rent
        max_rent = monthly * 0.30
        comfortable_rent = monthly * 0.25
        
        # Estimate utilities
        utilities_estimate = 150  # Average in Vancouver
        
        result = {
            "success": True,
            "monthly_income": round(monthly, 2),
            "max_affordable_rent": round(max_rent, 2),
            "comfortable_rent": round(comfortable_rent, 2),
            "recommendation": f"Based on the 30% rule, you can afford up to ${max_rent:,.0f}/month in rent.",
        }
        
        if input.get("include_utilities"):
            result["with_utilities"] = round(max_rent - utilities_estimate, 2)
            result["utilities_estimate"] = utilities_estimate
            result["recommendation"] += f" Factoring in ~${utilities_estimate}/month for utilities, aim for ${max_rent - utilities_estimate:,.0f}/month."
        
        return result
    
    async def _schedule_viewing(self, input: Dict[str, Any], user_id: Optional[str]) -> Dict[str, Any]:
        """Schedule a property viewing"""
        viewing_id = str(uuid.uuid4())
        
        # Get listing details
        listing = await self.db.listings.find_one({"id": input.get("listing_id")}, {"_id": 0})
        if not listing:
            return {"error": "Listing not found"}
        
        # Create viewing record
        viewing = {
            "id": viewing_id,
            "listing_id": input.get("listing_id"),
            "viewer_id": user_id,
            "viewer_name": input.get("viewer_name", ""),
            "viewer_email": input.get("viewer_email", ""),
            "viewer_phone": input.get("viewer_phone", ""),
            "preferred_date": input.get("preferred_date"),
            "preferred_time": input.get("preferred_time", "Flexible"),
            "notes": input.get("notes", ""),
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        await self.db.viewings.insert_one(viewing)
        
        return {
            "success": True,
            "viewing_id": viewing_id,
            "message": "Viewing request submitted",
            "details": {
                "listing_title": listing.get("title"),
                "address": f"{listing.get('address')}, {listing.get('city')}",
                "requested_date": input.get("preferred_date"),
                "requested_time": input.get("preferred_time", "Flexible")
            }
        }
