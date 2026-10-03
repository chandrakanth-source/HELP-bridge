"""
Real Backend / REST API Testing Suite for HelpBridge
Interacts with the deployed Render backend (PostgreSQL + Express) using HTTP requests.
"""

import os
import time
import uuid
import pytest
import requests
@pytest.mark.real_api
def test_real_api_01_health_check(real_api_base_url):
    """
    API-01: Health check endpoint verification
    Verifies that the deployed Express backend and PostgreSQL database are online.
    """
    url = f"{real_api_base_url}/health"
    response = requests.get(url, timeout=30)
    assert response.status_code == 200, f"Health check failed: {response.text}"
    data = response.json()
    assert data.get("success") is True, f"Expected success: True, got {data}"
    assert data.get("database") == "PostgreSQL connected", f"Database not connected: {data}"
    assert "HelpBridge API is running" in data.get("message", "")


# ==============================================================================
# SECTION 2: User Registration Flow
# ==============================================================================

@pytest.mark.real_api
def test_real_api_02_register_valid_user(real_api_base_url):
    """
    API-02: Register a valid user account
    Verifies that user data is persisted in PostgreSQL with 'pending' verification status.
    """
    unique_id = uuid.uuid4().hex[:8]
    payload = {
        "name": f"Test Seeker {unique_id}",
        "email": f"seeker_{unique_id}@test.com",
        "phone": f"91{int(time.time()) % 100000000:08d}",
        "password": f"SecurePass{unique_id}1",
        "role": "user",
        "occupation": "Software Engineer",
        "blood_group": "A+",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "address": "Hyderabad, Telangana",
    }
    response = requests.post(f"{real_api_base_url}/auth/register", json=payload, timeout=30)
    if response.status_code == 429:
        pytest.skip("Auth rate limit (HTTP 429) hit on deployed Render backend.")
    assert response.status_code in (201, 409), f"Registration failed: {response.text}"
    if response.status_code == 201:
        data = response.json()
        assert "user" in data, "Response body must contain user object"
        assert data["user"]["email"] == payload["email"].lower()
        assert data["user"]["verification_status"] == "pending"


@pytest.mark.real_api
def test_real_api_03_register_invalid_email(real_api_base_url):
    """
    API-03: Register with an invalid email format
    Verifies validation rejection with HTTP 400.
    """
    payload = {
        "name": "Invalid Email User",
        "email": "not-a-valid-email-address",
        "phone": "9876543210",
        "password": "Password123",
    }
    response = requests.post(f"{real_api_base_url}/auth/register", json=payload, timeout=30)
    if response.status_code == 429:
        pytest.skip("Auth rate limit (HTTP 429) hit on deployed Render backend.")
    assert response.status_code == 400, f"Expected 400 for invalid email, got {response.status_code}"
    data = response.json()
    assert "valid email" in data.get("message", "").lower()


@pytest.mark.real_api
def test_real_api_04_register_missing_required_fields(real_api_base_url):
    """
    API-04: Register with missing mandatory fields (password omitted)
    Verifies validation error response with HTTP 400.
    """
    payload = {
        "name": "Missing Password User",
        "email": f"nopass_{uuid.uuid4().hex[:6]}@test.com",
        "phone": "9876543210",
    }
    response = requests.post(f"{real_api_base_url}/auth/register", json=payload, timeout=30)
    if response.status_code == 429:
        pytest.skip("Auth rate limit (HTTP 429) hit on deployed Render backend.")
    assert response.status_code == 400, f"Expected 400 for missing fields, got {response.status_code}"


@pytest.mark.real_api
def test_real_api_05_register_duplicate_email(real_api_base_url):
    """
    API-05: Attempt duplicate registration with the same email
    Verifies conflict rejection with HTTP 409.
    """
    unique_id = uuid.uuid4().hex[:8]
    email = f"dup_{unique_id}@test.com"
    payload = {
        "name": f"First User {unique_id}",
        "email": email,
        "phone": f"92{int(time.time()) % 100000000:08d}",
        "password": f"Password{unique_id}1",
        "role": "user",
    }
    resp1 = requests.post(f"{real_api_base_url}/auth/register", json=payload, timeout=30)
    if resp1.status_code == 429:
        pytest.skip("Auth rate limit (HTTP 429) hit on deployed Render backend.")
    
    if resp1.status_code == 201:
        payload["phone"] = f"93{int(time.time()) % 100000000:08d}"
        resp2 = requests.post(f"{real_api_base_url}/auth/register", json=payload, timeout=30)
        assert resp2.status_code == 409, f"Expected 409 for duplicate email, got {resp2.status_code}: {resp2.text}"
        assert "already registered" in resp2.json().get("message", "").lower()


@pytest.mark.real_api
def test_real_api_06_register_short_password(real_api_base_url):
    """
    API-06: Register with a password shorter than 8 characters
    Verifies password policy rejection with HTTP 400.
    """
    payload = {
        "name": "Short Password User",
        "email": f"short_{uuid.uuid4().hex[:6]}@test.com",
        "phone": "9876543210",
        "password": "short",
    }
    response = requests.post(f"{real_api_base_url}/auth/register", json=payload, timeout=30)
    if response.status_code == 429:
        pytest.skip("Auth rate limit (HTTP 429) hit on deployed Render backend.")
    assert response.status_code == 400, f"Expected 400 for weak password, got {response.status_code}"


# ==============================================================================
# SECTION 3: User Authentication & Login Flow
# ==============================================================================

@pytest.mark.real_api
def test_real_api_07_login_valid_credentials(real_api_base_url, authenticated_real_user):
    """
    API-07: Log in with valid registered credentials
    Verifies JWT token issuance and user payload.
    """
    login_resp = requests.post(
        f"{real_api_base_url}/auth/login",
        json={"email": authenticated_real_user["email"], "password": authenticated_real_user["password"]},
        timeout=30
    )
    if login_resp.status_code == 429:
        pytest.skip("Auth rate limit (HTTP 429) hit on deployed Render backend.")
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    data = login_resp.json()
    assert "token" in data, "JWT token must be returned upon login"
    assert "user" in data, "User object must be returned upon login"


@pytest.mark.real_api
def test_real_api_08_login_invalid_password(real_api_base_url, authenticated_real_user):
    """
    API-08: Log in with an incorrect password
    Verifies authentication rejection with HTTP 401.
    """
    login_resp = requests.post(
        f"{real_api_base_url}/auth/login",
        json={"email": authenticated_real_user["email"], "password": "DefinitelyWrongPassword123!"},
        timeout=30
    )
    if login_resp.status_code == 429:
        pytest.skip("Auth rate limit (HTTP 429) hit on deployed Render backend.")
    assert login_resp.status_code == 401, f"Expected 401, got {login_resp.status_code}"
    assert "invalid" in login_resp.json().get("message", "").lower()


@pytest.mark.real_api
def test_real_api_09_login_nonexistent_user(real_api_base_url):
    """
    API-09: Log in with a non-existent email
    Verifies authentication rejection with HTTP 401.
    """
    login_resp = requests.post(
        f"{real_api_base_url}/auth/login",
        json={"email": f"nonexistent_{uuid.uuid4().hex[:8]}@test.com", "password": "AnyPassword123"},
        timeout=30
    )
    if login_resp.status_code == 429:
        pytest.skip("Auth rate limit (HTTP 429) hit on deployed Render backend.")
    assert login_resp.status_code == 401, f"Expected 401 for unknown user, got {login_resp.status_code}"


@pytest.mark.real_api
def test_real_api_10_login_missing_fields(real_api_base_url):
    """
    API-10: Log in without password
    Verifies validation rejection with HTTP 400.
    """
    login_resp = requests.post(
        f"{real_api_base_url}/auth/login",
        json={"email": "someuser@test.com"},
        timeout=30
    )
    if login_resp.status_code == 429:
        pytest.skip("Auth rate limit (HTTP 429) hit on deployed Render backend.")
    assert login_resp.status_code == 400


# ==============================================================================
# SECTION 4: Authentication & Authorization Guards
# ==============================================================================

@pytest.mark.real_api
def test_real_api_11_protected_route_missing_token(real_api_base_url):
    """
    API-11: Access protected profile route without Authorization header
    Verifies unauthorized access blocked with HTTP 401.
    """
    response = requests.get(f"{real_api_base_url}/profile", timeout=30)
    assert response.status_code == 401, f"Expected 401 for missing token, got {response.status_code}"
    assert "no token provided" in response.json().get("message", "").lower()


@pytest.mark.real_api
def test_real_api_12_protected_route_invalid_token(real_api_base_url):
    """
    API-12: Access protected profile route with an invalid/malformed JWT
    Verifies unauthorized access blocked with HTTP 401.
    """
    headers = {"Authorization": "Bearer invalid.jwt.token.string"}
    response = requests.get(f"{real_api_base_url}/profile", headers=headers, timeout=30)
    assert response.status_code == 401, f"Expected 401 for invalid token, got {response.status_code}"


@pytest.mark.real_api
def test_real_api_13_manager_route_forbidden_for_standard_user(real_api_base_url, authenticated_real_user):
    """
    API-13: Standard user attempts to access manager-only endpoint
    Verifies role-based access control blocks request with HTTP 403.
    """
    response = requests.get(
        f"{real_api_base_url}/manager/requests/pending",
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 403, f"Expected 403 for standard user on manager route, got {response.status_code}"
    assert "manager access required" in response.json().get("message", "").lower()


@pytest.mark.real_api
def test_real_api_14_admin_route_forbidden_for_standard_user(real_api_base_url, authenticated_real_user):
    """
    API-14: Standard user attempts to access admin-only endpoint
    Verifies role-based access control blocks request with HTTP 403.
    """
    response = requests.get(
        f"{real_api_base_url}/admin/managers",
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 403, f"Expected 403 for standard user on admin route, got {response.status_code}"


# ==============================================================================
# SECTION 5: Profile Management
# ==============================================================================

@pytest.mark.real_api
def test_real_api_15_get_user_profile(real_api_base_url, authenticated_real_user):
    """
    API-15: Retrieve profile of authenticated user
    Verifies returned profile data matches the authenticated account.
    """
    response = requests.get(
        f"{real_api_base_url}/profile",
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 200, f"Get profile failed: {response.text}"
    data = response.json()
    assert "user" in data
    assert data["user"]["email"] == authenticated_real_user["email"].lower()


@pytest.mark.real_api
def test_real_api_16_update_user_profile(real_api_base_url, authenticated_real_user):
    """
    API-16: Update profile details for authenticated user
    Verifies updated name, occupation, and blood group persist correctly.
    """
    update_payload = {
        "name": "Updated Real User Name",
        "phone": authenticated_real_user["phone"],
        "occupation": "Senior Security Engineer",
        "blood_group": "B+",
        "address": "Gachibowli, Hyderabad"
    }
    response = requests.patch(
        f"{real_api_base_url}/profile",
        json=update_payload,
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 200, f"Update profile failed: {response.text}"
    data = response.json()
    assert data["user"]["name"] == "Updated Real User Name"
    assert data["user"]["occupation"] == "Senior Security Engineer"


@pytest.mark.real_api
def test_real_api_17_update_availability_status(real_api_base_url, authenticated_real_user):
    """
    API-17: Toggle provider availability status ('available' / 'busy')
    Verifies availability status update in database.
    """
    response = requests.patch(
        f"{real_api_base_url}/profile/availability",
        json={"status": "busy"},
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 200, f"Update availability failed: {response.text}"
    assert response.json().get("status") == "busy"


@pytest.mark.real_api
def test_real_api_18_update_availability_invalid_status(real_api_base_url, authenticated_real_user):
    """
    API-18: Attempt to set invalid availability status
    Verifies validation rejection with HTTP 400.
    """
    response = requests.patch(
        f"{real_api_base_url}/profile/availability",
        json={"status": "invalid_status_value"},
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 400


# ==============================================================================
# SECTION 6: Help Requests Flow
# ==============================================================================

@pytest.mark.real_api
def test_real_api_19_create_emergency_help_request(real_api_base_url, authenticated_real_user):
    """
    API-19: Create an emergency SOS help request
    Verifies request creation in PostgreSQL with status 'pending_verification'.
    """
    unique_id = uuid.uuid4().hex[:6]
    payload = {
        "request_type": "emergency",
        "emergency_type": "Medical",
        "title": f"Medical Assistance Needed {unique_id}",
        "description": "Urgent first aid required near HITEC City.",
        "latitude": 17.4435,
        "longitude": 78.3772,
        "address": "HITEC City, Hyderabad"
    }
    response = requests.post(
        f"{real_api_base_url}/help-requests",
        json=payload,
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 201, f"Create emergency request failed: {response.text}"
    data = response.json()
    assert "request" in data
    assert data["request"]["request_type"] == "emergency"
    assert data["request"]["status"] == "pending_verification"


@pytest.mark.real_api
def test_real_api_20_create_non_emergency_help_request(real_api_base_url, authenticated_real_user):
    """
    API-20: Create a non-emergency help request
    Verifies request creation and response format.
    """
    unique_id = uuid.uuid4().hex[:6]
    payload = {
        "request_type": "non_emergency",
        "title": f"Tire Replacement Help {unique_id}",
        "description": "Flat tire on main road, need assistance changing spare.",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "address": "Abids, Hyderabad"
    }
    response = requests.post(
        f"{real_api_base_url}/help-requests",
        json=payload,
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 201, f"Create non-emergency request failed: {response.text}"
    data = response.json()
    assert data["request"]["request_type"] == "non_emergency"
    assert data["request"]["status"] == "pending_verification"


@pytest.mark.real_api
def test_real_api_21_create_request_invalid_coordinates(real_api_base_url, authenticated_real_user):
    """
    API-21: Create a help request with out-of-range GPS coordinates (latitude > 90)
    Verifies validation rejection with HTTP 400.
    """
    payload = {
        "request_type": "emergency",
        "title": "Invalid GPS Request",
        "description": "Test invalid latitude",
        "latitude": 999.0,
        "longitude": 78.4867,
    }
    response = requests.post(
        f"{real_api_base_url}/help-requests",
        json=payload,
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 400, f"Expected 400 for out-of-bounds latitude, got {response.status_code}"


@pytest.mark.real_api
def test_real_api_22_create_request_missing_fields(real_api_base_url, authenticated_real_user):
    """
    API-22: Create a help request with missing title and request type
    Verifies validation rejection with HTTP 400.
    """
    payload = {
        "latitude": 17.3850,
        "longitude": 78.4867
    }
    response = requests.post(
        f"{real_api_base_url}/help-requests",
        json=payload,
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 400


@pytest.mark.real_api
def test_real_api_23_get_my_help_requests(real_api_base_url, authenticated_real_user):
    """
    API-23: Retrieve all help requests created by the authenticated seeker
    Verifies array of user requests returned with HTTP 200.
    """
    response = requests.get(
        f"{real_api_base_url}/help-requests/my",
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 200, f"Get my requests failed: {response.text}"
    data = response.json()
    assert "requests" in data
    assert isinstance(data["requests"], list)


@pytest.mark.real_api
def test_real_api_24_get_help_request_by_id(real_api_base_url, authenticated_real_user):
    """
    API-24: Retrieve detailed view of a created help request by ID
    Verifies request details and requester name are populated.
    """
    # 1. Create a request
    payload = {
        "request_type": "emergency",
        "title": f"Fetch Request By ID Test {uuid.uuid4().hex[:6]}",
        "description": "Details test description",
        "latitude": 17.3850,
        "longitude": 78.4867,
    }
    create_resp = requests.post(
        f"{real_api_base_url}/help-requests",
        json=payload,
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert create_resp.status_code == 201
    request_id = create_resp.json()["request"]["id"]

    # 2. Fetch by ID
    get_resp = requests.get(
        f"{real_api_base_url}/help-requests/{request_id}",
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert get_resp.status_code == 200, f"Get request by ID failed: {get_resp.text}"
    data = get_resp.json()
    assert "request" in data
    assert data["request"]["id"] == request_id
    assert data["request"]["title"] == payload["title"]


@pytest.mark.real_api
def test_real_api_25_get_help_request_nonexistent_id(real_api_base_url, authenticated_real_user):
    """
    API-25: Retrieve a non-existent help request ID
    Verifies 404 Not Found response.
    """
    response = requests.get(
        f"{real_api_base_url}/help-requests/99999999",
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 404


# ==============================================================================
# SECTION 7: Location & GPS Tracking Services
# ==============================================================================

@pytest.mark.real_api
def test_real_api_26_update_gps_location(real_api_base_url, authenticated_real_user):
    """
    API-26: Update authenticated user's live GPS coordinates
    Verifies coordinates are saved in database and returned with HTTP 200.
    """
    payload = {
        "latitude": 17.4399,
        "longitude": 78.3845
    }
    response = requests.post(
        f"{real_api_base_url}/location/update",
        json=payload,
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 200, f"Location update failed: {response.text}"
    data = response.json()
    assert data.get("latitude") == 17.4399
    assert data.get("longitude") == 78.3845
    assert "Location updated successfully" in data.get("message", "")


@pytest.mark.real_api
def test_real_api_27_update_gps_location_invalid_coords(real_api_base_url, authenticated_real_user):
    """
    API-27: Update GPS location with invalid/missing latitude
    Verifies validation rejection with HTTP 400.
    """
    response = requests.post(
        f"{real_api_base_url}/location/update",
        json={"latitude": "invalid_lat"},
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 400


@pytest.mark.real_api
def test_real_api_28_get_request_tracking_data(real_api_base_url, authenticated_real_user):
    """
    API-28: Fetch tracking telemetry for an active request
    Verifies request coordinates, seeker info, and distance fields.
    """
    create_resp = requests.post(
        f"{real_api_base_url}/help-requests",
        json={
            "request_type": "emergency",
            "title": f"Tracking Test {uuid.uuid4().hex[:6]}",
            "latitude": 17.3850,
            "longitude": 78.4867
        },
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert create_resp.status_code == 201
    req_id = create_resp.json()["request"]["id"]

    track_resp = requests.get(
        f"{real_api_base_url}/location/track/{req_id}",
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert track_resp.status_code == 200, f"Get tracking failed: {track_resp.text}"
    data = track_resp.json()
    assert "tracking" in data
    assert data["tracking"]["request_id"] == req_id


# ==============================================================================
# SECTION 8: In-App Notifications
# ==============================================================================

@pytest.mark.real_api
def test_real_api_29_get_notifications(real_api_base_url, authenticated_real_user):
    """
    API-29: Retrieve notification feed for authenticated user
    Verifies notifications array is returned with HTTP 200.
    """
    response = requests.get(
        f"{real_api_base_url}/notifications",
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 200, f"Get notifications failed: {response.text}"
    data = response.json()
    assert "notifications" in data
    assert isinstance(data["notifications"], list)


# ==============================================================================
# SECTION 9: AI Chatbot Assistant
# ==============================================================================

@pytest.mark.real_api
def test_real_api_30_chatbot_assistant_query(real_api_base_url):
    """
    API-30: Query the AI Chatbot Assistant endpoint
    Verifies contextual response and timestamp generation.
    """
    payload = {
        "message": "How do I request emergency SOS assistance on HelpBridge?",
        "context": {}
    }
    response = requests.post(f"{real_api_base_url}/chat/assistant", json=payload, timeout=30)
    assert response.status_code == 200, f"Chatbot query failed: {response.text}"
    data = response.json()
    assert "reply" in data, "Chatbot response must contain reply field"
    assert len(data["reply"]) > 0
    assert "timestamp" in data


@pytest.mark.real_api
def test_real_api_31_chatbot_assistant_empty_message(real_api_base_url):
    """
    API-31: Query Chatbot with an empty message body
    Verifies validation rejection with HTTP 400.
    """
    response = requests.post(f"{real_api_base_url}/chat/assistant", json={}, timeout=30)
    assert response.status_code == 400


# ==============================================================================
# SECTION 10: Bargaining Flow Validation
# ==============================================================================

@pytest.mark.real_api
def test_real_api_32_bargain_offer_nonexistent_request(real_api_base_url, authenticated_real_user):
    """
    API-32: Submit bargain offer for non-existent request ID
    Verifies 404 Not Found response.
    """
    payload = {
        "request_id": 99999999,
        "provider_id": authenticated_real_user["user"].get("id", 1),
        "offered_price": 150.0
    }
    response = requests.post(
        f"{real_api_base_url}/bargain/offer",
        json=payload,
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 404, f"Expected 404 for unknown request, got {response.status_code}"


@pytest.mark.real_api
def test_real_api_33_bargain_offer_invalid_price(real_api_base_url, authenticated_real_user):
    """
    API-33: Submit bargain offer with zero or negative price
    Verifies validation rejection with HTTP 400.
    """
    payload = {
        "request_id": 1,
        "provider_id": authenticated_real_user["user"].get("id", 1),
        "offered_price": -50.0
    }
    response = requests.post(
        f"{real_api_base_url}/bargain/offer",
        json=payload,
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 400


# ==============================================================================
# SECTION 11: Payments & Razorpay Integration Safety
# ==============================================================================

@pytest.mark.real_api
def test_real_api_34_get_completed_payments(real_api_base_url, authenticated_real_user):
    """
    API-34: Retrieve completed payments history for authenticated user
    Verifies payment list returned with HTTP 200.
    """
    response = requests.get(
        f"{real_api_base_url}/payments/completed",
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    assert response.status_code == 200, f"Get completed payments failed: {response.text}"
    data = response.json()
    assert "payments" in data
    assert isinstance(data["payments"], list)


@pytest.mark.real_api
def test_real_api_35_create_order_missing_request_id(real_api_base_url, authenticated_real_user):
    """
    API-35: Attempt Razorpay order creation without required requestId
    Verifies rejection with HTTP 400 or 503 (if Razorpay keys unconfigured).
    """
    response = requests.post(
        f"{real_api_base_url}/payments/create-order",
        json={},
        headers=authenticated_real_user["headers"],
        timeout=30
    )
    if response.status_code == 429:
        pytest.skip("Payments rate limit (HTTP 429) hit on deployed Render backend.")
    assert response.status_code in (400, 503), f"Expected 400/503 for invalid order request, got {response.status_code}"


# ==============================================================================
# SECTION 12: Password Reset Endpoints
# ==============================================================================

@pytest.mark.real_api
def test_real_api_36_forgot_password_request(real_api_base_url):
    """
    API-36: Trigger password reset request for registered/unregistered email
    Verifies generic security message returned with HTTP 200.
    """
    response = requests.post(
        f"{real_api_base_url}/auth/forgot-password",
        json={"email": f"test_pwd_{uuid.uuid4().hex[:6]}@test.com"},
        timeout=30
    )
    if response.status_code == 429:
        pytest.skip("Auth rate limit (HTTP 429) hit on deployed Render backend.")
    assert response.status_code == 200, f"Forgot password failed: {response.text}"
    data = response.json()
    assert "password reset link" in data.get("message", "").lower() or "sent" in data.get("message", "").lower()


@pytest.mark.real_api
def test_real_api_37_reset_password_invalid_token(real_api_base_url):
    """
    API-37: Attempt password reset with an invalid or expired JWT token
    Verifies security rejection with HTTP 400.
    """
    payload = {
        "token": "invalid-or-expired-reset-token",
        "password": "NewSecurePassword123!"
    }
    response = requests.post(
        f"{real_api_base_url}/auth/reset-password",
        json=payload,
        timeout=30
    )
    if response.status_code == 429:
        pytest.skip("Auth rate limit (HTTP 429) hit on deployed Render backend.")
    assert response.status_code == 400, f"Expected 400 for invalid reset token, got {response.status_code}"
    assert "invalid or expired" in response.json().get("message", "").lower()
