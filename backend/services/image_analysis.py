"""
Image Analysis Service - Analyze property images using AI
"""
import os
import base64
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger(__name__)


class ImageAnalysisService:
    def __init__(self, db):
        self.db = db
        self.api_key = os.environ.get('EMERGENT_LLM_KEY', '')
    
    def _extract_base64_and_type(self, image_data: str) -> tuple:
        """Extract base64 content and mime type from image data"""
        if image_data.startswith('data:'):
            # Parse data URL: data:image/jpeg;base64,<data>
            parts = image_data.split(',', 1)
            if len(parts) == 2:
                header = parts[0]  # data:image/jpeg;base64
                base64_data = parts[1]
                # Extract mime type
                if ':' in header and ';' in header:
                    mime_type = header.split(':')[1].split(';')[0]
                else:
                    mime_type = 'image/jpeg'
                return base64_data, mime_type
        # If not a data URL, assume it's raw base64 jpeg
        return image_data, 'image/jpeg'
    
    async def analyze_property_image(
        self,
        image_data: str,
        analysis_type: str = "general"
    ) -> Dict[str, Any]:
        """Analyze a property image using AI vision"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage, FileContent
            
            prompts = {
                "general": """Analyze this property image and provide:
1. Room type (bedroom, living room, kitchen, bathroom, etc.)
2. Estimated room size (small/medium/large/spacious)
3. Natural light assessment (poor/adequate/good/excellent)
4. Condition (needs work/fair/good/excellent/move-in ready)
5. Notable features (hardwood floors, modern appliances, etc.)
6. Potential concerns (visible damage, outdated fixtures, etc.)
7. Overall impression (1-10 score)

Respond in JSON format.""",
                
                "condition": """Assess the condition of this property:
1. Overall condition score (1-10)
2. Visible maintenance issues
3. Age estimate of fixtures/finishes
4. Renovation recommendations
5. Estimated repair costs (low/medium/high)

Respond in JSON format.""",
                
                "layout": """Analyze the layout and space of this room:
1. Estimated square footage
2. Layout efficiency (1-10)
3. Furniture placement suggestions
4. Storage assessment
5. Flow and functionality notes

Respond in JSON format.""",
                
                "comparison": """Compare this property image to typical Vancouver rentals:
1. Quality percentile (how it compares to similar listings)
2. Value assessment (underpriced/fair/overpriced based on appearance)
3. Target demographic
4. Standout features vs. common complaints

Respond in JSON format."""
            }
            
            prompt = prompts.get(analysis_type, prompts["general"])
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"img-analysis-{analysis_type}",
                system_message="You are a professional real estate appraiser and interior designer. Analyze property images accurately and provide actionable insights."
            ).with_model("anthropic", "claude-sonnet-4-5-20250929")
            
            # Extract base64 content and mime type
            base64_content, mime_type = self._extract_base64_and_type(image_data)
            
            # Create message with image using file_contents
            file_content = FileContent(content_type=mime_type, file_content_base64=base64_content)
            message = UserMessage(
                text=prompt,
                file_contents=[file_content]
            )
            
            response = await chat.send_message(message)
            
            # Parse JSON response
            import re
            import json
            
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                analysis = json.loads(json_match.group())
            else:
                analysis = {"raw_analysis": response}
            
            return {
                "analysis_type": analysis_type,
                "results": analysis,
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Image analysis error: {e}")
            return {
                "analysis_type": analysis_type,
                "results": {},
                "success": False,
                "error": str(e)
            }
    
    async def compare_property_images(
        self,
        images: List[str],
        criteria: List[str] = None
    ) -> Dict[str, Any]:
        """Compare multiple property images"""
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            
            default_criteria = [
                "natural light",
                "space/size",
                "condition",
                "modern features",
                "storage",
                "overall appeal"
            ]
            criteria = criteria or default_criteria
            
            prompt = f"""Compare these {len(images)} property images across these criteria:
{', '.join(criteria)}

For each image, score it 1-10 on each criterion.
Then provide an overall ranking and recommendation.

Respond in JSON format with structure:
{{
    "scores": [
        {{"image": 1, "criteria_scores": {{}}, "total": 0}},
        ...
    ],
    "ranking": [1, 2, 3...],
    "recommendation": "Which property and why",
    "pros_cons": [
        {{"image": 1, "pros": [], "cons": []}}
    ]
}}"""
            
            chat = LlmChat(
                api_key=self.api_key,
                session_id="img-comparison",
                system_message="You are a real estate expert helping buyers compare properties objectively."
            ).with_model("anthropic", "claude-sonnet-4-5-20250929")
            
            # For now, analyze first image (multi-image requires different approach)
            # In production, you'd send multiple images or analyze sequentially
            if images:
                message = UserMessage(
                    text=prompt,
                    image_url=images[0] if images[0].startswith('data:') else f"data:image/jpeg;base64,{images[0]}"
                )
                
                response = await chat.send_message(message)
                
                import re
                import json
                json_match = re.search(r'\{.*\}', response, re.DOTALL)
                if json_match:
                    return json.loads(json_match.group())
            
            return {"error": "No images provided"}
            
        except Exception as e:
            logger.error(f"Image comparison error: {e}")
            return {"error": str(e)}
    
    async def extract_room_details(self, image_data: str) -> Dict[str, Any]:
        """Extract detailed room information from image"""
        return await self.analyze_property_image(image_data, "layout")
    
    async def assess_condition(self, image_data: str) -> Dict[str, Any]:
        """Assess property condition from image"""
        return await self.analyze_property_image(image_data, "condition")
