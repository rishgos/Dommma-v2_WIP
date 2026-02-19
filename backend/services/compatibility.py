"""
AI Compatibility Service - Roommate matching using AI
"""
from typing import List, Dict, Any, Optional
import os
import json
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class RoommateCompatibilityService:
    def __init__(self, db):
        self.db = db
        self.api_key = os.environ.get('EMERGENT_LLM_KEY', '')
    
    def _calculate_basic_score(self, profile1: dict, profile2: dict) -> dict:
        """Calculate basic compatibility without AI"""
        scores = {}
        reasons = []
        
        # Budget compatibility (0-25 points)
        budget_overlap = min(profile1.get("budget_max", 0), profile2.get("budget_max", 0)) - \
                        max(profile1.get("budget_min", 0), profile2.get("budget_min", 0))
        if budget_overlap > 0:
            budget_score = min(25, budget_overlap / 20)  # Max 25 points
            scores["budget"] = budget_score
            reasons.append(f"Budget ranges overlap (${max(profile1.get('budget_min', 0), profile2.get('budget_min', 0))}-${min(profile1.get('budget_max', 0), profile2.get('budget_max', 0))})")
        else:
            scores["budget"] = 0
            reasons.append("Budget ranges don't overlap")
        
        # Location compatibility (0-25 points)
        areas1 = set(profile1.get("preferred_areas", []))
        areas2 = set(profile2.get("preferred_areas", []))
        if areas1 and areas2:
            common_areas = areas1.intersection(areas2)
            location_score = (len(common_areas) / max(len(areas1), len(areas2))) * 25
            scores["location"] = location_score
            if common_areas:
                reasons.append(f"Shared preferred areas: {', '.join(list(common_areas)[:3])}")
            else:
                reasons.append("No common preferred areas")
        else:
            scores["location"] = 12.5  # Neutral if not specified
        
        # Lifestyle compatibility (0-30 points)
        lifestyle1 = set(profile1.get("lifestyle", []))
        lifestyle2 = set(profile2.get("lifestyle", []))
        
        # Check for conflicting lifestyles
        conflicts = [
            ("early_bird", "night_owl"),
            ("quiet", "social"),
        ]
        
        has_conflict = False
        for a, b in conflicts:
            if (a in lifestyle1 and b in lifestyle2) or (b in lifestyle1 and a in lifestyle2):
                has_conflict = True
                reasons.append(f"Lifestyle difference: {a} vs {b}")
        
        if has_conflict:
            scores["lifestyle"] = 10
        else:
            common_lifestyle = lifestyle1.intersection(lifestyle2)
            lifestyle_score = 15 + (len(common_lifestyle) * 5)  # Base 15 + bonus for matches
            scores["lifestyle"] = min(30, lifestyle_score)
            if common_lifestyle:
                reasons.append(f"Shared lifestyle: {', '.join(list(common_lifestyle)[:3])}")
        
        # Pets/Smoking compatibility (0-20 points)
        pets1 = profile1.get("pets", False)
        pets2 = profile2.get("pets", False)
        smoking1 = profile1.get("smoking", False)
        smoking2 = profile2.get("smoking", False)
        
        habit_score = 20
        if pets1 != pets2:
            habit_score -= 5
            reasons.append("Different pet preferences")
        else:
            reasons.append("Pet preferences align")
            
        if smoking1 != smoking2:
            habit_score -= 10
            reasons.append("Different smoking preferences")
        else:
            reasons.append("Smoking preferences align")
        
        scores["habits"] = max(0, habit_score)
        
        # Calculate total
        total = sum(scores.values())
        
        return {
            "total_score": round(total, 1),
            "max_score": 100,
            "percentage": round(total, 0),
            "breakdown": scores,
            "reasons": reasons,
            "compatibility_level": self._get_level(total)
        }
    
    def _get_level(self, score: float) -> str:
        """Get compatibility level from score"""
        if score >= 80:
            return "excellent"
        elif score >= 65:
            return "good"
        elif score >= 50:
            return "moderate"
        elif score >= 35:
            return "fair"
        else:
            return "low"
    
    async def calculate_compatibility(
        self,
        profile_id: str,
        target_profile_ids: List[str] = None,
        use_ai: bool = True
    ) -> List[dict]:
        """Calculate compatibility scores between profiles"""
        # Get the main profile
        main_profile = await self.db.roommate_profiles.find_one(
            {"id": profile_id}, {"_id": 0}
        )
        if not main_profile:
            raise ValueError("Profile not found")
        
        # Get target profiles
        if target_profile_ids:
            query = {"id": {"$in": target_profile_ids}, "status": "active"}
        else:
            # Get all active profiles except the main one
            query = {"user_id": {"$ne": main_profile["user_id"]}, "status": "active"}
        
        target_profiles = await self.db.roommate_profiles.find(
            query, {"_id": 0}
        ).to_list(50)
        
        results = []
        for target in target_profiles:
            # Calculate basic compatibility
            basic_score = self._calculate_basic_score(main_profile, target)
            
            # Try AI-enhanced analysis if enabled and API key available
            ai_insights = None
            if use_ai and self.api_key:
                try:
                    ai_insights = await self._get_ai_insights(main_profile, target, basic_score)
                except Exception as e:
                    logger.error(f"AI analysis failed: {e}")
            
            result = {
                "profile_id": target["id"],
                "user_id": target["user_id"],
                "name": target.get("name", ""),
                "age": target.get("age"),
                "occupation": target.get("occupation"),
                "budget_range": f"${target.get('budget_min', 0)}-${target.get('budget_max', 0)}",
                "compatibility": basic_score,
                "ai_insights": ai_insights
            }
            results.append(result)
        
        # Sort by score
        results.sort(key=lambda x: x["compatibility"]["total_score"], reverse=True)
        
        return results
    
    async def _get_ai_insights(
        self,
        profile1: dict,
        profile2: dict,
        basic_score: dict
    ) -> Optional[dict]:
        """Get AI-powered compatibility insights"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            system_prompt = """You are a roommate compatibility expert. Analyze two potential roommate profiles and provide brief, helpful insights.
            
Respond in JSON format:
{
    "summary": "One sentence summary of compatibility",
    "strengths": ["strength1", "strength2"],
    "potential_challenges": ["challenge1"],
    "tips": ["tip for living together"],
    "conversation_starters": ["suggested topic to discuss"]
}"""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"compat-{profile1['id'][:8]}-{profile2['id'][:8]}",
                system_message=system_prompt
            ).with_model("anthropic", "claude-sonnet-4-5-20250929")
            
            profile_info = f"""
Profile 1: {profile1.get('name', 'User 1')}
- Age: {profile1.get('age', 'Not specified')}
- Occupation: {profile1.get('occupation', 'Not specified')}
- Budget: ${profile1.get('budget_min', 0)}-${profile1.get('budget_max', 0)}
- Lifestyle: {', '.join(profile1.get('lifestyle', []))}
- Pets: {'Yes' if profile1.get('pets') else 'No'}
- Smoking: {'Yes' if profile1.get('smoking') else 'No'}
- Bio: {profile1.get('bio', '')[:200]}

Profile 2: {profile2.get('name', 'User 2')}
- Age: {profile2.get('age', 'Not specified')}
- Occupation: {profile2.get('occupation', 'Not specified')}
- Budget: ${profile2.get('budget_min', 0)}-${profile2.get('budget_max', 0)}
- Lifestyle: {', '.join(profile2.get('lifestyle', []))}
- Pets: {'Yes' if profile2.get('pets') else 'No'}
- Smoking: {'Yes' if profile2.get('smoking') else 'No'}
- Bio: {profile2.get('bio', '')[:200]}

Basic compatibility score: {basic_score['percentage']}%
"""
            
            response = await chat.send_message(UserMessage(text=profile_info))
            
            # Parse JSON response
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            
            return {"summary": response[:200]}
            
        except Exception as e:
            logger.error(f"AI insights error: {e}")
            return None
    
    async def save_compatibility_result(
        self,
        requester_id: str,
        target_id: str,
        score: dict
    ) -> None:
        """Save compatibility result for future reference"""
        await self.db.compatibility_results.update_one(
            {"requester_id": requester_id, "target_id": target_id},
            {"$set": {
                "score": score,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }},
            upsert=True
        )
