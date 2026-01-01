"""
SoundDrops API Backend Tests
Tests for: API health, samples listing, admin endpoints, creator endpoints
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://audiodrop-2.preview.emergentagent.com')

class TestHealthAndPublicEndpoints:
    """Test public API endpoints that don't require authentication"""
    
    def test_api_health_check(self):
        """Test GET /api/ - API health check"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "SoundDrops API v1.0"
        print(f"✅ API health check passed: {data}")
    
    def test_list_samples_empty(self):
        """Test GET /api/samples - Should return empty array without errors"""
        response = requests.get(f"{BASE_URL}/api/samples")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✅ Samples list returned: {len(data)} samples")
    
    def test_list_samples_with_filters(self):
        """Test GET /api/samples with various filters"""
        # Test category filter
        response = requests.get(f"{BASE_URL}/api/samples", params={"category": "Drums"})
        assert response.status_code == 200
        
        # Test free_only filter
        response = requests.get(f"{BASE_URL}/api/samples", params={"free_only": True})
        assert response.status_code == 200
        
        # Test featured_only filter
        response = requests.get(f"{BASE_URL}/api/samples", params={"featured_only": True})
        assert response.status_code == 200
        
        # Test sync_ready_only filter
        response = requests.get(f"{BASE_URL}/api/samples", params={"sync_ready_only": True})
        assert response.status_code == 200
        
        # Test search filter
        response = requests.get(f"{BASE_URL}/api/samples", params={"search": "test"})
        assert response.status_code == 200
        
        print("✅ All sample filters work correctly")
    
    def test_get_nonexistent_sample(self):
        """Test GET /api/samples/{pack_id} - Should return 404 for non-existent pack"""
        response = requests.get(f"{BASE_URL}/api/samples/nonexistent_pack_id")
        assert response.status_code == 404
        print("✅ Non-existent sample returns 404 as expected")


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_auth_me_without_token(self):
        """Test GET /api/auth/me without authentication - Should return 401"""
        response = requests.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 401
        print("✅ Auth endpoint correctly requires authentication")
    
    def test_auth_logout_without_token(self):
        """Test POST /api/auth/logout without authentication"""
        response = requests.post(f"{BASE_URL}/api/auth/logout")
        # Should succeed even without token (just clears cookie)
        assert response.status_code == 200
        print("✅ Logout endpoint works without token")


class TestProtectedEndpoints:
    """Test protected endpoints that require authentication"""
    
    def test_favorites_without_auth(self):
        """Test GET /api/favorites without authentication - Should return 401"""
        response = requests.get(f"{BASE_URL}/api/favorites")
        assert response.status_code == 401
        print("✅ Favorites endpoint correctly requires authentication")
    
    def test_collections_without_auth(self):
        """Test GET /api/collections without authentication - Should return 401"""
        response = requests.get(f"{BASE_URL}/api/collections")
        assert response.status_code == 401
        print("✅ Collections endpoint correctly requires authentication")
    
    def test_creator_packs_without_auth(self):
        """Test GET /api/creator/packs without authentication - Should return 401"""
        response = requests.get(f"{BASE_URL}/api/creator/packs")
        assert response.status_code == 401
        print("✅ Creator packs endpoint correctly requires authentication")
    
    def test_admin_stats_without_auth(self):
        """Test GET /api/admin/stats without authentication - Should return 401"""
        response = requests.get(f"{BASE_URL}/api/admin/stats")
        assert response.status_code == 401
        print("✅ Admin stats endpoint correctly requires authentication")
    
    def test_admin_users_without_auth(self):
        """Test GET /api/admin/users without authentication - Should return 401"""
        response = requests.get(f"{BASE_URL}/api/admin/users")
        assert response.status_code == 401
        print("✅ Admin users endpoint correctly requires authentication")
    
    def test_admin_packs_without_auth(self):
        """Test GET /api/admin/packs without authentication - Should return 401"""
        response = requests.get(f"{BASE_URL}/api/admin/packs")
        assert response.status_code == 401
        print("✅ Admin packs endpoint correctly requires authentication")


class TestSubscriptionEndpoints:
    """Test subscription-related endpoints"""
    
    def test_subscription_status_without_auth(self):
        """Test GET /api/subscribe/status without authentication - Should return 401"""
        response = requests.get(f"{BASE_URL}/api/subscribe/status")
        assert response.status_code == 401
        print("✅ Subscription status endpoint correctly requires authentication")


class TestObjectIdSerialization:
    """Test that ObjectId serialization is working correctly (no MongoDB _id errors)"""
    
    def test_samples_no_objectid_error(self):
        """Verify samples endpoint doesn't return ObjectId serialization errors"""
        response = requests.get(f"{BASE_URL}/api/samples")
        assert response.status_code == 200
        # If there was an ObjectId serialization error, we'd get a 500
        data = response.json()
        # Verify no _id field in response
        for sample in data:
            assert "_id" not in sample, "ObjectId _id should not be in response"
        print("✅ No ObjectId serialization errors in samples endpoint")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
