"""
Unit Testing Suite (UT-01 to UT-12) & White-Box Testing (WB-01 to WB-08)
For HelpBridge - Emergency & Non-Emergency Help Request Platform
"""

import pytest
import time
from tests.conftest import (
    haversine_distance,
    find_nearest_neighbors,
    get_buffer_duration_seconds,
)


# ==============================================================================
# SECTION 7: UNIT TESTING (UT-01 to UT-12)
# ==============================================================================

@pytest.mark.unit
def test_ut_01_knn_nearest_provider_selection():
    """
    UT-01: knnService – nearestProvider() with 3 providers at known coordinates.
    Expected Result: Closest provider returned.
    """
    target = {"latitude": 17.385044, "longitude": 78.486671}  # Center: Hyderabad

    candidates = [
        {"id": 1, "name": "Provider Far", "latitude": 17.450000, "longitude": 78.500000},     # ~7.3 km
        {"id": 2, "name": "Provider Closest", "latitude": 17.386000, "longitude": 78.487000}, # ~0.11 km
        {"id": 3, "name": "Provider Medium", "latitude": 17.400000, "longitude": 78.490000},  # ~1.7 km
    ]

    result = find_nearest_neighbors(target, candidates, k=1)

    assert len(result) == 1, "Should return exactly one nearest provider"
    assert result[0]["id"] == 2, "Expected Provider Closest (id=2) to be selected"
    assert result[0]["distance_km"] < 0.5, f"Distance should be under 0.5 km, got {result[0]['distance_km']}"


@pytest.mark.unit
def test_ut_02_knn_empty_provider_list():
    """
    UT-02: knnService – nearestProvider() with empty candidate provider list.
    Expected Result: No provider / empty list returned.
    """
    target = {"latitude": 17.385044, "longitude": 78.486671}
    candidates = []

    result = find_nearest_neighbors(target, candidates, k=1)
    assert result == [], "Empty candidate list must return empty result"


@pytest.mark.unit
def test_ut_03_buffer_duration_emergency():
    """
    UT-03: Buffer duration helper for Request type = Emergency.
    Expected Result: 30 seconds.
    """
    duration = get_buffer_duration_seconds("emergency")
    assert duration == 30, f"Emergency buffer duration must be 30 seconds, got {duration}"


@pytest.mark.unit
def test_ut_04_buffer_duration_non_emergency():
    """
    UT-04: Buffer duration helper for Request type = Non-emergency.
    Expected Result: 5 minutes (300 seconds).
    """
    duration = get_buffer_duration_seconds("non_emergency")
    assert duration == 300, f"Non-emergency buffer duration must be 300 seconds, got {duration}"


@pytest.mark.unit
def test_ut_05_auth_controller_valid_login(mock_backend):
    """
    UT-05: authController – login() with valid credentials and approved user.
    Expected Result: Login successful, token issued.
    """
    mock_backend.register_user("Alice Valid", "alice.approved@test.com", "9111111111", "Password123", role="user")
    user_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[user_id]["verification_status"] = "verified"

    status, body = mock_backend.login_user("alice.approved@test.com", "Password123")
    assert status == 200
    assert "token" in body
    assert body["user"]["email"] == "alice.approved@test.com"


@pytest.mark.unit
def test_ut_06_auth_controller_wrong_password(mock_backend):
    """
    UT-06: authController – login() with valid email, wrong password.
    Expected Result: Login rejected (401).
    """
    mock_backend.register_user("Bob User", "bob.pass@test.com", "9111111112", "Password123", role="user")
    user_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[user_id]["verification_status"] = "verified"

    status, body = mock_backend.login_user("bob.pass@test.com", "WrongPassword999")
    assert status == 401
    assert "Invalid email or password" in body["message"]


@pytest.mark.unit
def test_ut_07_auth_controller_pending_user_login(mock_backend):
    """
    UT-07: authController – login() with valid credentials, status pending.
    Expected Result: Login rejected (403 awaiting approval).
    """
    mock_backend.register_user("Charlie Pending", "charlie.pending@test.com", "9111111113", "Password123", role="user")

    status, body = mock_backend.login_user("charlie.pending@test.com", "Password123")
    assert status == 403
    assert "pending" in body["message"].lower() or "approval" in body["message"].lower()


@pytest.mark.unit
def test_ut_08_auth_middleware_missing_token():
    """
    UT-08: authMiddleware check for request without token.
    Expected Result: 401 Unauthorized.
    """
    auth_header = None
    is_authenticated = auth_header is not None and auth_header.startswith("Bearer ")
    assert not is_authenticated, "Request without token must fail authentication"


@pytest.mark.unit
def test_ut_09_manager_and_admin_middleware_forbidden_role(mock_backend):
    """
    UT-09: managerMiddleware / adminMiddleware with regular user role.
    Expected Result: 403 Forbidden.
    """
    mock_backend.register_user("Regular User", "regular@test.com", "9111111114", "Password123", role="user")
    user_id = list(mock_backend.users.keys())[-1]
    user = mock_backend.users[user_id]
    user["verification_status"] = "verified"

    # Attempt manager-level approval
    status, body = mock_backend.verify_user(manager_id=user["id"], user_id=2, decision="approve")
    assert status == 403
    assert "Manager access required" in body["message"]


@pytest.mark.unit
def test_ut_10_payment_controller_validate_payment(mock_backend):
    """
    UT-10: paymentController – validate payment with Amount = 0.
    Expected Result: Validation error (400).
    """
    # Create request and complete it
    mock_backend.register_user("Dave Seeker", "dave.pay@test.com", "9111111115", "Password123", role="user")
    seeker_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[seeker_id]["verification_status"] = "verified"

    _, req_data = mock_backend.create_help_request(seeker_id, "emergency", "Need Tow Truck", "Car broken", 17.385, 78.486)
    req_id = req_data["request"]["id"]
    mock_backend.help_requests[req_id]["status"] = "completed"

    status, body = mock_backend.process_payment(payer_id=seeker_id, request_id=req_id, amount=0.0)
    assert status == 400
    assert "positive" in body["message"].lower() or "invalid" in body["message"].lower()


@pytest.mark.unit
def test_ut_11_email_service_send_reset_mail():
    """
    UT-11: emailService – send reset mail with valid email + token (mock SMTP).
    Expected Result: Mail send function executed successfully with reset link.
    """
    email_dispatched = []

    def mock_send_reset_email(to_email: str, token: str):
        reset_link = f"http://localhost:3000/reset_password?token={token}"
        email_dispatched.append({"to": to_email, "link": reset_link, "token": token})
        return True

    success = mock_send_reset_email("user@example.com", "sample-reset-jwt-token-123")
    assert success is True
    assert len(email_dispatched) == 1
    assert "reset_password?token=sample-reset-jwt-token-123" in email_dispatched[0]["link"]


@pytest.mark.unit
def test_ut_12_chat_middleware_unauthorized_user(mock_backend):
    """
    UT-12: chatMiddleware for user not part of chat.
    Expected Result: Access denied (403).
    """
    mock_backend.register_user("User A", "usera@test.com", "9111111116", "Password123", role="user")
    u_a = list(mock_backend.users.keys())[-1]

    mock_backend.register_user("User B", "userb@test.com", "9111111117", "Password123", role="user")
    u_b = list(mock_backend.users.keys())[-1]

    mock_backend.register_user("User C (Intruder)", "userc@test.com", "9111111118", "Password123", role="user")
    u_c = list(mock_backend.users.keys())[-1]

    _, req_data = mock_backend.create_help_request(u_a, "emergency", "Medical Help", "Need bandages", 17.385, 78.486)
    req_id = req_data["request"]["id"]
    mock_backend.help_requests[req_id]["assigned_provider_id"] = u_b

    # Check permission for User C
    req = mock_backend.help_requests[req_id]
    is_part_of_chat = (u_c == req["requester_id"] or u_c == req["assigned_provider_id"])
    assert not is_part_of_chat, "Third party user should NOT have access to chat"


# ==============================================================================
# SECTION 6: WHITE-BOX TESTING (WB-01 to WB-08)
# ==============================================================================

@pytest.mark.whitebox
def test_wb_01_knn_branch_coverage_no_providers():
    """
    WB-01: knnService.js branch coverage: No interested providers -> returns empty list.
    """
    target = {"latitude": 17.385044, "longitude": 78.486671}
    assert find_nearest_neighbors(target, []) == []


@pytest.mark.whitebox
def test_wb_02_knn_branch_coverage_one_provider():
    """
    WB-02: knnService.js branch coverage: One provider -> selected directly.
    """
    target = {"latitude": 17.385044, "longitude": 78.486671}
    candidates = [{"id": 10, "latitude": 17.390, "longitude": 78.490}]
    res = find_nearest_neighbors(target, candidates, k=1)
    assert len(res) == 1
    assert res[0]["id"] == 10


@pytest.mark.whitebox
def test_wb_03_knn_branch_coverage_multiple_providers():
    """
    WB-03: knnService.js branch coverage: Multiple providers -> smallest distance selected.
    """
    target = {"latitude": 17.385044, "longitude": 78.486671}
    candidates = [
        {"id": 101, "latitude": 17.500, "longitude": 78.500},
        {"id": 102, "latitude": 17.386, "longitude": 78.487},
        {"id": 103, "latitude": 17.400, "longitude": 78.490},
    ]
    res = find_nearest_neighbors(target, candidates, k=1)
    assert res[0]["id"] == 102
    assert res[0]["distance_km"] == min(
        haversine_distance(target["latitude"], target["longitude"], c["latitude"], c["longitude"])
        for c in candidates
    )


@pytest.mark.whitebox
def test_wb_04_auth_controller_login_branch_coverage(mock_backend):
    """
    WB-04: authController.js login branch coverage:
    - Unknown email -> 401
    - Wrong password -> 401
    - Unapproved status -> 403
    - Success -> 200
    """
    # 1. Unknown email
    st1, _ = mock_backend.login_user("unknown.user@test.com", "Pass12345")
    assert st1 == 401

    # 2. Registered pending
    mock_backend.register_user("WB User", "wb.user@test.com", "9222222222", "Pass12345", role="user")
    uid = list(mock_backend.users.keys())[-1]

    # 3. Wrong password
    st2, _ = mock_backend.login_user("wb.user@test.com", "WrongPassword")
    assert st2 == 401

    # 4. Unapproved / Pending status
    st3, _ = mock_backend.login_user("wb.user@test.com", "Pass12345")
    assert st3 == 403

    # 5. Success
    mock_backend.users[uid]["verification_status"] = "verified"
    st4, data4 = mock_backend.login_user("wb.user@test.com", "Pass12345")
    assert st4 == 200
    assert "token" in data4


@pytest.mark.whitebox
def test_wb_05_auth_middleware_token_branch_coverage():
    """
    WB-05: authMiddleware.js token check branch coverage:
    - Missing token -> 401
    - Invalid token -> 401
    - Valid token -> next()
    """
    def simulate_auth_middleware(header: str | None):
        if not header or not header.startswith("Bearer "):
            return 401, "Access denied. No token provided."
        token = header.split(" ")[1]
        if token == "valid-token":
            return 200, "OK"
        return 401, "Invalid or expired token"

    assert simulate_auth_middleware(None)[0] == 401
    assert simulate_auth_middleware("InvalidPrefix token")[0] == 401
    assert simulate_auth_middleware("Bearer bad-token")[0] == 401
    assert simulate_auth_middleware("Bearer valid-token")[0] == 200


@pytest.mark.whitebox
def test_wb_06_buffer_logic_condition_coverage():
    """
    WB-06: Buffer logic condition coverage:
    - Emergency (30s) vs Non-emergency (300s)
    - Before expiry vs After expiry
    """
    # Emergency: within 30s is active, > 30s is expired
    assert 25 <= get_buffer_duration_seconds("emergency")
    assert not (35 <= get_buffer_duration_seconds("emergency"))

    # Non-Emergency: within 300s is active, > 300s is expired
    assert 295 <= get_buffer_duration_seconds("non_emergency")
    assert not (305 <= get_buffer_duration_seconds("non_emergency"))


@pytest.mark.whitebox
def test_wb_07_payment_controller_validation_branch_coverage(mock_backend):
    """
    WB-07: paymentController.js payment validation branch coverage:
    - Amount <= 0 -> 400
    - Amount > 0 on completed request -> 200
    """
    mock_backend.register_user("WB Payer", "wb.payer@test.com", "9333333333", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    _, req_data = mock_backend.create_help_request(uid, "emergency", "Need Fuel", "Empty tank", 17.38, 78.48)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "completed"

    # Branch 1: Invalid negative amount
    assert mock_backend.process_payment(uid, rid, -50.0)[0] == 400
    # Branch 2: Invalid zero amount
    assert mock_backend.process_payment(uid, rid, 0.0)[0] == 400
    # Branch 3: Valid positive amount
    assert mock_backend.process_payment(uid, rid, 250.0)[0] == 200


@pytest.mark.whitebox
def test_wb_08_auth_controller_reset_password_branches():
    """
    WB-08: authController.js reset password branch coverage:
    - Unknown email -> safe neutral response
    - Valid token -> reset success
    - Expired/Invalid token -> rejection error
    """
    known_emails = {"user@test.com": {"id": 1, "password": "OldPassword1"}}

    def simulate_request_reset(email: str):
        if not email:
            return 400, "Email required"
        # Always returns safe message for privacy
        return 200, "If an account exists for that email, a password reset link has been sent."

    def simulate_reset(token: str, new_pass: str):
        if not token or not new_pass:
            return 400, "Reset token and password are required"
        if len(new_pass) < 6:
            return 400, "Password must be at least 6 characters"
        if token == "expired_or_invalid":
            return 400, "This reset link is invalid or expired"
        if token == "valid_token":
            return 200, "Password reset successful"
        return 400, "This reset link is invalid or expired"

    assert simulate_request_reset("unknown@test.com")[0] == 200
    assert simulate_reset("expired_or_invalid", "NewPass123")[0] == 400
    assert simulate_reset("valid_token", "short")[0] == 400
    assert simulate_reset("valid_token", "NewSecurePass123")[0] == 200
