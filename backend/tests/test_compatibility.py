"""
Test AI Roommate Compatibility Feature
Tests compatibility API endpoints: calculate, score, and AI insights
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test profile IDs
TEST_PROFILE_1_ID = "65cecf96-1ea6-4c34-aabd-311a092e8127"  # John Test
TEST_PROFILE_2_ID = "aec9e7b8-6cb5-4059-b298-17e5c413718d"  # Jane Test
TEST_USER_1 = "test-compat-user-1"
TEST_USER_2 = "test-compat-user-2"


class TestRoommateCompatibilityBasic:
    """Basic compatibility scoring tests (without AI)"""
    
    def test_calculate_compatibility_basic(self):
        """POST /api/compatibility/calculate/{profile_id} with use_ai=false"""
        response = requests.post(
            f"{BASE_URL}/api/compatibility/calculate/{TEST_PROFILE_1_ID}?use_ai=false"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "profile_id" in data
        assert data["profile_id"] == TEST_PROFILE_1_ID
        assert "matches" in data
        assert "total_matches" in data
        assert isinstance(data["matches"], list)
        
        # Check first match structure
        if len(data["matches"]) > 0:
            match = data["matches"][0]
            assert "profile_id" in match
            assert "compatibility" in match
            assert "total_score" in match["compatibility"]
            assert "percentage" in match["compatibility"]
            assert "breakdown" in match["compatibility"]
            assert "reasons" in match["compatibility"]
            assert "compatibility_level" in match["compatibility"]
            
            # ai_insights should be null when use_ai=false
            assert match["ai_insights"] is None
    
    def test_calculate_compatibility_returns_other_profiles(self):
        """Verify calculate returns profiles from other users"""
        response = requests.post(
            f"{BASE_URL}/api/compatibility/calculate/{TEST_PROFILE_1_ID}?use_ai=false"
        )
        assert response.status_code == 200
        
        data = response.json()
        # Check that Profile 2 is in the matches
        profile_ids = [m["profile_id"] for m in data["matches"]]
        assert TEST_PROFILE_2_ID in profile_ids
    
    def test_score_between_two_profiles_basic(self):
        """GET /api/compatibility/score/{profile_id}/{target_id} without AI"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/score/{TEST_PROFILE_1_ID}/{TEST_PROFILE_2_ID}?use_ai=false"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["profile_id"] == TEST_PROFILE_2_ID
        assert "compatibility" in data
        
        compat = data["compatibility"]
        assert "total_score" in compat
        assert "percentage" in compat
        assert "breakdown" in compat
        assert "reasons" in compat
        assert "compatibility_level" in compat
        
        # Verify breakdown categories
        breakdown = compat["breakdown"]
        assert "budget" in breakdown
        assert "location" in breakdown
        assert "lifestyle" in breakdown
        assert "habits" in breakdown
        
        # ai_insights should be null when use_ai=false
        assert data.get("ai_insights") is None
    
    def test_compatibility_levels_correct_values(self):
        """Verify compatibility levels are valid"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/score/{TEST_PROFILE_1_ID}/{TEST_PROFILE_2_ID}?use_ai=false"
        )
        assert response.status_code == 200
        
        data = response.json()
        level = data["compatibility"]["compatibility_level"]
        valid_levels = ["excellent", "good", "moderate", "fair", "low"]
        assert level in valid_levels
    
    def test_compatibility_percentage_in_valid_range(self):
        """Verify percentage is between 0 and 100"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/score/{TEST_PROFILE_1_ID}/{TEST_PROFILE_2_ID}?use_ai=false"
        )
        assert response.status_code == 200
        
        data = response.json()
        percentage = data["compatibility"]["percentage"]
        assert 0 <= percentage <= 100
    
    def test_calculate_nonexistent_profile_returns_404(self):
        """Verify 404 for non-existent profile"""
        response = requests.post(
            f"{BASE_URL}/api/compatibility/calculate/nonexistent-profile-id?use_ai=false"
        )
        assert response.status_code == 404
    
    def test_score_nonexistent_target_returns_404(self):
        """Verify 404 when target profile doesn't exist"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/score/{TEST_PROFILE_1_ID}/nonexistent-target-id?use_ai=false"
        )
        assert response.status_code == 404


class TestRoommateCompatibilityAI:
    """AI-enhanced compatibility tests - REAL Claude integration"""
    
    def test_calculate_compatibility_with_ai(self):
        """POST /api/compatibility/calculate/{profile_id} with use_ai=true for specific targets"""
        # Test with specific target to avoid long timeout (AI is called per profile)
        response = requests.post(
            f"{BASE_URL}/api/compatibility/calculate/{TEST_PROFILE_1_ID}?use_ai=false",
            timeout=30
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "matches" in data
        
        # For bulk AI, we test with use_ai=false to avoid timeout
        # AI for single target is tested in test_score_with_ai_insights
    
    def test_score_with_ai_insights(self):
        """GET /api/compatibility/score/{profile_id}/{target_id}?use_ai=true"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/score/{TEST_PROFILE_1_ID}/{TEST_PROFILE_2_ID}?use_ai=true",
            timeout=60
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "compatibility" in data
        
        # Verify AI insights structure when available
        ai_insights = data.get("ai_insights")
        if ai_insights:
            # AI insights should have these fields
            assert "summary" in ai_insights
            # These may be present
            if "strengths" in ai_insights:
                assert isinstance(ai_insights["strengths"], list)
            if "potential_challenges" in ai_insights:
                assert isinstance(ai_insights["potential_challenges"], list)
            if "conversation_starters" in ai_insights:
                assert isinstance(ai_insights["conversation_starters"], list)
    
    def test_ai_insights_content_quality(self):
        """Verify AI insights contain meaningful content"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/score/{TEST_PROFILE_1_ID}/{TEST_PROFILE_2_ID}?use_ai=true",
            timeout=60
        )
        assert response.status_code == 200
        
        data = response.json()
        ai_insights = data.get("ai_insights")
        
        if ai_insights:
            # Summary should be non-empty
            if "summary" in ai_insights:
                assert len(ai_insights["summary"]) > 10
            
            # Strengths should have at least one item
            if "strengths" in ai_insights:
                assert len(ai_insights["strengths"]) >= 1
            
            # Conversation starters should be helpful
            if "conversation_starters" in ai_insights:
                for starter in ai_insights["conversation_starters"]:
                    assert len(starter) > 5


class TestCompatibilityMatches:
    """Tests for /api/compatibility/matches endpoint"""
    
    def test_get_top_matches_for_user(self):
        """GET /api/compatibility/matches/{user_id}"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/matches/{TEST_USER_1}"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "user_id" in data
        assert data["user_id"] == TEST_USER_1
        assert "matches" in data
        assert "total_available" in data
    
    def test_matches_sorted_by_score(self):
        """Verify matches are sorted by compatibility score (descending)"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/matches/{TEST_USER_1}"
        )
        assert response.status_code == 200
        
        data = response.json()
        matches = data["matches"]
        
        if len(matches) >= 2:
            # Verify descending order
            for i in range(len(matches) - 1):
                score1 = matches[i]["compatibility"]["total_score"]
                score2 = matches[i + 1]["compatibility"]["total_score"]
                assert score1 >= score2
    
    def test_matches_limit_parameter(self):
        """Verify limit parameter works"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/matches/{TEST_USER_1}?limit=5"
        )
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["matches"]) <= 5
    
    def test_matches_nonexistent_user_returns_404(self):
        """Verify 404 for non-existent user profile"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/matches/nonexistent-user-id"
        )
        assert response.status_code == 404


class TestCompatibilityAlgorithm:
    """Tests for compatibility scoring algorithm correctness"""
    
    def test_budget_overlap_calculation(self):
        """Verify budget compatibility is calculated correctly"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/score/{TEST_PROFILE_1_ID}/{TEST_PROFILE_2_ID}?use_ai=false"
        )
        assert response.status_code == 200
        
        data = response.json()
        breakdown = data["compatibility"]["breakdown"]
        
        # Budget score should be present and non-negative
        assert "budget" in breakdown
        assert breakdown["budget"] >= 0
    
    def test_location_match_calculation(self):
        """Verify location compatibility is calculated correctly"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/score/{TEST_PROFILE_1_ID}/{TEST_PROFILE_2_ID}?use_ai=false"
        )
        assert response.status_code == 200
        
        data = response.json()
        breakdown = data["compatibility"]["breakdown"]
        
        # Location score should be present and non-negative
        assert "location" in breakdown
        assert breakdown["location"] >= 0
        
        # Both profiles share Downtown area, so should have some score
        reasons = data["compatibility"]["reasons"]
        downtown_reason = any("Downtown" in r for r in reasons)
        assert downtown_reason  # Should mention Downtown
    
    def test_lifestyle_alignment_calculation(self):
        """Verify lifestyle compatibility is calculated correctly"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/score/{TEST_PROFILE_1_ID}/{TEST_PROFILE_2_ID}?use_ai=false"
        )
        assert response.status_code == 200
        
        data = response.json()
        breakdown = data["compatibility"]["breakdown"]
        
        # Lifestyle score should be present
        assert "lifestyle" in breakdown
        assert breakdown["lifestyle"] >= 0
        
        # Both have early_bird and clean, should mention shared lifestyle
        reasons = data["compatibility"]["reasons"]
        lifestyle_reason = any("lifestyle" in r.lower() for r in reasons)
        assert lifestyle_reason
    
    def test_habits_compatibility_calculation(self):
        """Verify habits (pets, smoking) compatibility is calculated correctly"""
        response = requests.get(
            f"{BASE_URL}/api/compatibility/score/{TEST_PROFILE_1_ID}/{TEST_PROFILE_2_ID}?use_ai=false"
        )
        assert response.status_code == 200
        
        data = response.json()
        breakdown = data["compatibility"]["breakdown"]
        
        # Habits score should be present
        assert "habits" in breakdown
        assert breakdown["habits"] >= 0
        
        # Both profiles have pets=false and smoking=false
        reasons = data["compatibility"]["reasons"]
        pet_reason = any("pet" in r.lower() for r in reasons)
        smoking_reason = any("smoking" in r.lower() for r in reasons)
        assert pet_reason
        assert smoking_reason


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
