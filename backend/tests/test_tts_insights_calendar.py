"""
Test TTS, Nova Insights, and Google Calendar endpoints
Iteration 12 - Testing new features added by main agent
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTTSEndpoints:
    """Text-to-Speech endpoint tests"""
    
    def test_tts_voices_endpoint(self):
        """GET /api/nova/tts/voices - returns available voices"""
        response = requests.get(f"{BASE_URL}/api/nova/tts/voices")
        assert response.status_code == 200
        data = response.json()
        assert "voices" in data
        assert len(data["voices"]) > 0
        # Check voice structure
        voice = data["voices"][0]
        assert "id" in voice
        assert "name" in voice
        assert "description" in voice
        print(f"TTS Voices endpoint: PASSED - Found {len(data['voices'])} voices")
    
    def test_tts_generate_speech(self):
        """POST /api/nova/tts - generates speech audio from text"""
        response = requests.post(f"{BASE_URL}/api/nova/tts", json={
            "text": "Hello, I am Nova, your AI real estate assistant.",
            "voice": "nova",
            "speed": 1.0
        })
        assert response.status_code == 200
        data = response.json()
        assert "audio" in data
        assert "format" in data
        assert data["format"] == "mp3"
        assert len(data["audio"]) > 100  # Should have base64 audio data
        print(f"TTS Generate Speech: PASSED - Audio length: {len(data['audio'])} chars")
    
    def test_tts_generate_speech_different_voice(self):
        """POST /api/nova/tts - test with different voice"""
        response = requests.post(f"{BASE_URL}/api/nova/tts", json={
            "text": "Testing different voice",
            "voice": "alloy",
            "speed": 1.2
        })
        assert response.status_code == 200
        data = response.json()
        assert "audio" in data
        assert data["voice"] == "alloy"
        print("TTS Different Voice: PASSED")
    
    def test_tts_empty_text_error(self):
        """POST /api/nova/tts - empty text should fail"""
        response = requests.post(f"{BASE_URL}/api/nova/tts", json={
            "text": "",
            "voice": "nova"
        })
        assert response.status_code == 400
        print("TTS Empty Text Validation: PASSED")
    
    def test_tts_preferences_get(self):
        """GET /api/nova/tts/preferences/{user_id} - get user voice prefs"""
        user_id = "test_user_tts_iter12"
        response = requests.get(f"{BASE_URL}/api/nova/tts/preferences/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "voice" in data
        assert "speed" in data
        assert "enabled" in data
        print(f"TTS Get Preferences: PASSED - Voice: {data['voice']}, Enabled: {data['enabled']}")
    
    def test_tts_preferences_set(self):
        """POST /api/nova/tts/preferences/{user_id} - set user voice prefs"""
        user_id = "test_user_tts_iter12"
        response = requests.post(f"{BASE_URL}/api/nova/tts/preferences/{user_id}", json={
            "voice": "coral",
            "speed": 1.5,
            "enabled": True
        })
        assert response.status_code == 200
        data = response.json()
        assert data["voice"] == "coral"
        assert data["speed"] == 1.5
        assert data["enabled"] == True
        print("TTS Set Preferences: PASSED")
    
    def test_tts_preferences_verify_persistence(self):
        """Verify TTS preferences were persisted"""
        user_id = "test_user_tts_iter12"
        response = requests.get(f"{BASE_URL}/api/nova/tts/preferences/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["voice"] == "coral"
        assert data["enabled"] == True
        print("TTS Preferences Persistence: PASSED")
    
    def test_tts_invalid_voice_fallback(self):
        """POST /api/nova/tts - invalid voice should fallback to default"""
        response = requests.post(f"{BASE_URL}/api/nova/tts", json={
            "text": "Testing invalid voice fallback",
            "voice": "invalid_voice_name",
            "speed": 1.0
        })
        # Should still succeed with default voice
        assert response.status_code == 200
        print("TTS Invalid Voice Fallback: PASSED")


class TestNovaInsightsEndpoints:
    """Nova Insights endpoint tests"""
    
    def test_insights_main_endpoint(self):
        """GET /api/nova/insights/{user_id} - get comprehensive insights"""
        user_id = "test_user_insights_iter12"
        response = requests.get(f"{BASE_URL}/api/nova/insights/{user_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Check all expected keys
        assert "search_history" in data
        assert "preference_evolution" in data
        assert "market_trends" in data
        assert "moving_timeline" in data
        assert "property_match_scores" in data
        assert "activity_summary" in data
        assert "recommendations" in data
        print("Insights Main Endpoint: PASSED - All sections present")
    
    def test_insights_timeline_endpoint(self):
        """GET /api/nova/insights/{user_id}/timeline - get moving timeline"""
        user_id = "test_user_insights_iter12"
        response = requests.get(f"{BASE_URL}/api/nova/insights/{user_id}/timeline")
        assert response.status_code == 200
        data = response.json()
        assert "timeline" in data
        timeline = data["timeline"]
        assert "current_phase" in timeline
        assert "phases" in timeline
        assert "activity_level" in timeline
        print(f"Insights Timeline: PASSED - Current phase: {timeline['current_phase']}")
    
    def test_insights_matches_endpoint(self):
        """GET /api/nova/insights/{user_id}/matches - get property matches"""
        user_id = "test_user_insights_iter12"
        response = requests.get(f"{BASE_URL}/api/nova/insights/{user_id}/matches")
        assert response.status_code == 200
        data = response.json()
        assert "matches" in data
        matches = data["matches"]
        assert "average_score" in matches
        print(f"Insights Matches: PASSED - Average score: {matches['average_score']}")
    
    def test_insights_trends_endpoint(self):
        """GET /api/nova/insights/{user_id}/trends - get market trends"""
        user_id = "test_user_insights_iter12"
        response = requests.get(f"{BASE_URL}/api/nova/insights/{user_id}/trends")
        assert response.status_code == 200
        data = response.json()
        assert "trends" in data
        trends = data["trends"]
        assert "average_price" in trends
        assert "availability" in trends
        print(f"Insights Trends: PASSED - Availability: {trends['availability']}")
    
    def test_insights_activity_summary(self):
        """Verify activity summary structure in insights"""
        user_id = "test_user_insights_iter12"
        response = requests.get(f"{BASE_URL}/api/nova/insights/{user_id}")
        assert response.status_code == 200
        data = response.json()
        activity = data["activity_summary"]
        assert "total_interactions" in activity
        assert "this_week" in activity
        assert "favorites_saved" in activity
        assert "viewings_scheduled" in activity
        assert "engagement_level" in activity
        print(f"Insights Activity Summary: PASSED - Engagement: {activity['engagement_level']}")
    
    def test_insights_recommendations(self):
        """Verify recommendations structure in insights"""
        user_id = "test_user_insights_iter12"
        response = requests.get(f"{BASE_URL}/api/nova/insights/{user_id}")
        assert response.status_code == 200
        data = response.json()
        recommendations = data["recommendations"]
        assert isinstance(recommendations, list)
        # For new users, should have profile completion recommendation
        if len(recommendations) > 0:
            rec = recommendations[0]
            assert "type" in rec
            assert "priority" in rec
            assert "title" in rec
            assert "description" in rec
        print(f"Insights Recommendations: PASSED - {len(recommendations)} recommendations")


class TestGoogleCalendarEndpoints:
    """Google Calendar OAuth endpoint tests"""
    
    def test_google_auth_url(self):
        """GET /api/calendar/google/auth-url - generates OAuth URL"""
        redirect_uri = f"{BASE_URL}/calendar/callback"
        response = requests.get(
            f"{BASE_URL}/api/calendar/google/auth-url",
            params={"redirect_uri": redirect_uri, "state": "test_state"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "auth_url" in data
        auth_url = data["auth_url"]
        # Verify URL structure
        assert "accounts.google.com" in auth_url
        assert "client_id=" in auth_url
        assert "redirect_uri=" in auth_url
        assert "scope=" in auth_url
        print(f"Google Auth URL: PASSED - URL generated")
    
    def test_google_status_not_connected(self):
        """GET /api/calendar/google/status/{user_id} - check status"""
        user_id = "test_user_google_iter12"
        response = requests.get(f"{BASE_URL}/api/calendar/google/status/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "connected" in data
        assert isinstance(data["connected"], bool)
        print(f"Google Status: PASSED - Connected: {data['connected']}")
    
    def test_google_disconnect_nonexistent(self):
        """DELETE /api/calendar/google/disconnect/{user_id} - disconnect"""
        user_id = "test_user_google_iter12"
        response = requests.delete(f"{BASE_URL}/api/calendar/google/disconnect/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert "disconnected" in data
        print(f"Google Disconnect: PASSED - Disconnected: {data['disconnected']}")
    
    def test_local_calendar_events(self):
        """GET /api/calendar/events/{user_id} - local calendar still works"""
        user_id = "test_user_google_iter12"
        response = requests.get(f"{BASE_URL}/api/calendar/events/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Local Calendar Events: PASSED - {len(data)} events")


class TestExistingEndpointsStillWork:
    """Verify existing endpoints are not broken"""
    
    def test_chat_endpoint(self):
        """POST /api/chat - main chat still working"""
        response = requests.post(f"{BASE_URL}/api/chat", json={
            "message": "Hello Nova",
            "session_id": None
        })
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "session_id" in data
        print("Chat Endpoint: PASSED")
    
    def test_listings_endpoint(self):
        """GET /api/listings - listings still working"""
        response = requests.get(f"{BASE_URL}/api/listings")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Listings Endpoint: PASSED - {len(data)} listings")
    
    def test_nova_memory_endpoint(self):
        """GET /api/nova/memory/{user_id} - memory still working"""
        response = requests.get(f"{BASE_URL}/api/nova/memory/test_user_iter12")
        assert response.status_code == 200
        print("Nova Memory: PASSED")
    
    def test_nova_suggestions_endpoint(self):
        """GET /api/nova/suggestions/{user_id} - suggestions still working"""
        response = requests.get(f"{BASE_URL}/api/nova/suggestions/test_user_iter12")
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        print("Nova Suggestions: PASSED")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
