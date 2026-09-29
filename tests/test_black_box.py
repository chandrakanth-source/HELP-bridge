"""
Black-Box Testing Suite (BB-EML, BB-REQ, BB-BUF, BB-PAY, BB-ACC)
For HelpBridge - Emergency & Non-Emergency Help Request Platform
"""

import pytest
from tests.conftest import get_buffer_duration_seconds


# ==============================================================================
# SECTION 5: BLACK-BOX TESTING
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. Equivalence Class: Registration Email Format (BB-EML-01, BB-EML-02)
# ------------------------------------------------------------------------------
@pytest.mark.blackbox
def test_bb_eml_01_valid_email_equivalence_class(mock_backend):
    """
    BB-EML-01: Registration Equivalence Class - Valid email format.
    Expected Output: Accepted (201 Created).
    """
    status, body = mock_backend.register_user(
        name="Valid User",
        email="valid.student@university.edu",
        phone="9876543210",
        password="ValidPassword1",
        role="user"
    )
    assert status == 201
    assert "user" in body
    assert body["user"]["email"] == "valid.student@university.edu"


@pytest.mark.blackbox
def test_bb_eml_02_invalid_email_equivalence_class(mock_backend):
    """
    BB-EML-02: Registration Equivalence Class - Invalid email format (no @ or missing domain).
    Expected Output: Validation error (400 Bad Request).
    """
    invalid_emails = [
        "invalidemailformat.com",
        "plainaddress",
        "@missingusername.com",
        "user@.com",
    ]
    for invalid_email in invalid_emails:
        status, body = mock_backend.register_user(
            name="Invalid User",
            email=invalid_email,
            phone="9876543211",
            password="ValidPassword1",
            role="user"
        )
        assert status == 400
        assert "valid email" in body["message"].lower()


# ------------------------------------------------------------------------------
# 2. Equivalence Class: Help Request Buffer Types (BB-REQ-01, BB-REQ-02)
# ------------------------------------------------------------------------------
@pytest.mark.blackbox
def test_bb_req_01_emergency_buffer_duration():
    """
    BB-REQ-01: Help Request Equivalence Class - Type = Emergency.
    Expected Output: 30 s buffer applied.
    """
    buffer_sec = get_buffer_duration_seconds("emergency")
    assert buffer_sec == 30


@pytest.mark.blackbox
def test_bb_req_02_non_emergency_buffer_duration():
    """
    BB-REQ-02: Help Request Equivalence Class - Type = Non-emergency.
    Expected Output: 5 min (300 s) buffer applied.
    """
    buffer_sec = get_buffer_duration_seconds("non_emergency")
    assert buffer_sec == 300


# ------------------------------------------------------------------------------
# 3. Boundary Value: Buffer Timers (BB-BUF-01 to BB-BUF-05)
# ------------------------------------------------------------------------------
@pytest.mark.blackbox
def test_bb_buf_01_emergency_buffer_boundary_29s(mock_backend):
    """
    BB-BUF-01: Emergency Buffer Boundary Value - Interest at 29 s (just before buffer ends).
    Expected Output: Interest counted.
    """
    # Create request
    mock_backend.register_user("Seeker One", "seeker1@test.com", "9111111101", "Password123", role="user")
    seeker_id = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(seeker_id, "emergency", "Flat Tyre", "Need jack", 17.38, 78.48)
    req_id = req_data["request"]["id"]
    mock_backend.help_requests[req_id]["status"] = "approved"

    mock_backend.register_user("Provider 1", "prov1@test.com", "9111111102", "Password123", role="provider")
    prov_id = list(mock_backend.users.keys())[-1]

    # Provider interest at 29s
    status, body = mock_backend.express_interest(prov_id, req_id, elapsed_time_sec=29.0)
    assert status == 202
    assert "recorded" in body["message"].lower()


@pytest.mark.blackbox
def test_bb_buf_02_emergency_buffer_boundary_30s(mock_backend):
    """
    BB-BUF-02: Emergency Buffer Boundary Value - Interest at 30 s.
    Expected Output: Buffer closes; assignment executed.
    """
    # At exact boundary 30s, buffer transitions to finalized assignment
    mock_backend.register_user("Seeker Two", "seeker2@test.com", "9111111103", "Password123", role="user")
    seeker_id = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(seeker_id, "emergency", "Accident Help", "First aid", 17.38, 78.48)
    req_id = req_data["request"]["id"]
    mock_backend.help_requests[req_id]["status"] = "approved"

    mock_backend.register_user("Provider 2", "prov2@test.com", "9111111104", "Password123", role="provider")
    prov_id = list(mock_backend.users.keys())[-1]

    mock_backend.express_interest(prov_id, req_id, elapsed_time_sec=30.0)
    winner = mock_backend.finalize_assignment_knn(req_id)
    assert winner is not None
    assert mock_backend.help_requests[req_id]["status"] == "assigned"


@pytest.mark.blackbox
def test_bb_buf_03_emergency_buffer_boundary_31s(mock_backend):
    """
    BB-BUF-03: Emergency Buffer Boundary Value - Interest at 31 s (after buffer expires).
    Expected Output: Interest rejected / ignored.
    """
    mock_backend.register_user("Seeker Three", "seeker3@test.com", "9111111105", "Password123", role="user")
    seeker_id = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(seeker_id, "emergency", "Water rescue", "Flooded street", 17.38, 78.48)
    req_id = req_data["request"]["id"]
    mock_backend.help_requests[req_id]["status"] = "approved"

    mock_backend.register_user("Provider 3", "prov3@test.com", "9111111106", "Password123", role="provider")
    prov_id = list(mock_backend.users.keys())[-1]

    # Express interest at 31s (expired)
    status, body = mock_backend.express_interest(prov_id, req_id, elapsed_time_sec=31.0)
    assert status == 400
    assert "rejected" in body["message"].lower() or "closed" in body["message"].lower()


@pytest.mark.blackbox
def test_bb_buf_04_non_emergency_buffer_boundary_4m59s(mock_backend):
    """
    BB-BUF-04: Non-emergency Buffer Boundary Value - Interest at 4 min 59 s (299 s).
    Expected Output: Interest counted.
    """
    mock_backend.register_user("Seeker Four", "seeker4@test.com", "9111111107", "Password123", role="user")
    seeker_id = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(seeker_id, "non_emergency", "Plumbing issue", "Pipe leak", 17.38, 78.48)
    req_id = req_data["request"]["id"]
    mock_backend.help_requests[req_id]["status"] = "approved"

    mock_backend.register_user("Provider 4", "prov4@test.com", "9111111108", "Password123", role="provider")
    prov_id = list(mock_backend.users.keys())[-1]

    status, body = mock_backend.express_interest(prov_id, req_id, elapsed_time_sec=299.0)
    assert status == 202


@pytest.mark.blackbox
def test_bb_buf_05_non_emergency_buffer_boundary_5m01s(mock_backend):
    """
    BB-BUF-05: Non-emergency Buffer Boundary Value - Interest at 5 min 01 s (301 s).
    Expected Output: Interest rejected / ignored.
    """
    mock_backend.register_user("Seeker Five", "seeker5@test.com", "9111111109", "Password123", role="user")
    seeker_id = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(seeker_id, "non_emergency", "Electrical work", "Wiring fault", 17.38, 78.48)
    req_id = req_data["request"]["id"]
    mock_backend.help_requests[req_id]["status"] = "approved"

    mock_backend.register_user("Provider 5", "prov5@test.com", "9111111110", "Password123", role="provider")
    prov_id = list(mock_backend.users.keys())[-1]

    status, body = mock_backend.express_interest(prov_id, req_id, elapsed_time_sec=301.0)
    assert status == 400
    assert "rejected" in body["message"].lower() or "closed" in body["message"].lower()


# ------------------------------------------------------------------------------
# 4. Boundary Value & Equivalence Class: Payment (BB-PAY-01 to BB-PAY-03)
# ------------------------------------------------------------------------------
@pytest.mark.blackbox
def test_bb_pay_01_payment_boundary_zero_amount(mock_backend):
    """
    BB-PAY-01: Payment Boundary Value - Amount = 0.
    Expected Output: Validation error.
    """
    mock_backend.register_user("Seeker Pay1", "seeker.pay1@test.com", "9111111121", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    _, req_data = mock_backend.create_help_request(uid, "emergency", "Help Done", "Done", 17.38, 78.48)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "completed"

    status, body = mock_backend.process_payment(uid, rid, amount=0.0)
    assert status == 400


@pytest.mark.blackbox
def test_bb_pay_02_payment_boundary_negative_amount(mock_backend):
    """
    BB-PAY-02: Payment Boundary Value - Amount = negative (-150).
    Expected Output: Validation error.
    """
    mock_backend.register_user("Seeker Pay2", "seeker.pay2@test.com", "9111111122", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    _, req_data = mock_backend.create_help_request(uid, "emergency", "Help Done 2", "Done", 17.38, 78.48)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "completed"

    status, body = mock_backend.process_payment(uid, rid, amount=-150.0)
    assert status == 400


@pytest.mark.blackbox
def test_bb_pay_03_payment_valid_positive_amount(mock_backend):
    """
    BB-PAY-03: Payment Equivalence Class - Amount = valid positive value (e.g. 500.0).
    Expected Output: Payment accepted.
    """
    mock_backend.register_user("Seeker Pay3", "seeker.pay3@test.com", "9111111123", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    _, req_data = mock_backend.create_help_request(uid, "emergency", "Help Done 3", "Done", 17.38, 78.48)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "completed"

    status, body = mock_backend.process_payment(uid, rid, amount=500.0)
    assert status == 200
    assert body["payment"]["payment_status"] == "successful"


# ------------------------------------------------------------------------------
# 5. Decision Table: Login Role & Verification Status Matrix (BB-ACC-01 to BB-ACC-04)
# ------------------------------------------------------------------------------
@pytest.mark.blackbox
def test_bb_acc_01_user_status_pending_login_denied(mock_backend):
    """
    BB-ACC-01: Decision Table - Role=User, status=Pending.
    Expected Output: Login denied (403).
    """
    mock_backend.register_user("Pending User", "dt.user.pending@test.com", "9111111131", "Password123", role="user")
    status, _ = mock_backend.login_user("dt.user.pending@test.com", "Password123")
    assert status == 403


@pytest.mark.blackbox
def test_bb_acc_02_user_status_approved_login_allowed(mock_backend):
    """
    BB-ACC-02: Decision Table - Role=User, status=Approved/Verified.
    Expected Output: Login allowed (200).
    """
    mock_backend.register_user("Approved User", "dt.user.approved@test.com", "9111111132", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    status, body = mock_backend.login_user("dt.user.approved@test.com", "Password123")
    assert status == 200
    assert "token" in body


@pytest.mark.blackbox
def test_bb_acc_03_manager_status_pending_login_denied(mock_backend):
    """
    BB-ACC-03: Decision Table - Role=Manager, status=Pending (awaiting admin).
    Expected Output: Login denied (403).
    """
    mock_backend.register_user("Pending Manager", "dt.mgr.pending@test.com", "9111111133", "Password123", role="manager")
    status, body = mock_backend.login_user("dt.mgr.pending@test.com", "Password123")
    assert status == 403
    assert "awaiting administrator approval" in body["message"].lower()


@pytest.mark.blackbox
def test_bb_acc_04_manager_status_approved_login_allowed(mock_backend):
    """
    BB-ACC-04: Decision Table - Role=Manager, status=Approved.
    Expected Output: Login allowed (200).
    """
    mock_backend.register_user("Approved Manager", "dt.mgr.approved@test.com", "9111111134", "Password123", role="manager")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    status, body = mock_backend.login_user("dt.mgr.approved@test.com", "Password123")
    assert status == 200
    assert "token" in body
    assert body["user"]["role"] == "manager"
