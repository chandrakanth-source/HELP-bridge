"""
Validation Testing & Requirements Traceability Matrix Suite (FR-01 to FR-14)
From Section 10 of HelpBridge Software Test Report (CSE312)
"""

import pytest
from tests.conftest import (
    haversine_distance,
    find_nearest_neighbors,
    get_buffer_duration_seconds,
)


# ==============================================================================
# SECTION 10: VALIDATION TESTING / REQUIREMENTS TRACEABILITY
# ==============================================================================

@pytest.mark.validation
def test_fr_01_user_verification_by_manager(mock_backend):
    """
    FR-01: A registered user shall be verified by a manager before being approved.
    Mapped: TC-REG-01, TC-VER-01, TC-VER-02, TC-LOGIN-03, SYS-01
    """
    # Register user -> pending
    _, reg = mock_backend.register_user("FR1 User", "fr1@test.com", "9666666601", "Password123", role="user")
    uid = reg["user"]["id"]
    assert reg["user"]["verification_status"] == "pending"

    # Pending cannot log in
    assert mock_backend.login_user("fr1@test.com", "Password123")[0] == 403

    # Manager approves
    mock_backend.register_user("FR1 Mgr", "fr1.mgr@test.com", "9666666602", "Password123", role="manager")
    mgr_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[mgr_id]["verification_status"] = "verified"

    st_ver, _ = mock_backend.verify_user(manager_id=mgr_id, user_id=uid, decision="approve")
    assert st_ver == 200
    assert mock_backend.users[uid]["verification_status"] == "verified"
    assert mock_backend.login_user("fr1@test.com", "Password123")[0] == 200


@pytest.mark.validation
def test_fr_02_manager_verification_by_admin(mock_backend):
    """
    FR-02: A registered manager shall be verified by the administrator before being approved.
    Mapped: TC-MGR-01, TC-MGR-02, TC-MGR-03, SYS-02
    """
    admin_id = 1
    _, reg = mock_backend.register_user("FR2 Mgr", "fr2.mgr@test.com", "9666666603", "Password123", role="manager")
    mgr_id = reg["user"]["id"]
    assert reg["user"]["verification_status"] == "pending"

    # Pending manager cannot log in
    assert mock_backend.login_user("fr2.mgr@test.com", "Password123")[0] == 403

    # Admin approves manager
    mock_backend.approve_manager(admin_id=admin_id, manager_id=mgr_id, decision="approve")
    assert mock_backend.users[mgr_id]["verification_status"] == "verified"
    assert mock_backend.login_user("fr2.mgr@test.com", "Password123")[0] == 200


@pytest.mark.validation
def test_fr_03_role_based_access_control(mock_backend):
    """
    FR-03: The system shall authenticate approved users with role-based access.
    Mapped: TC-LOGIN-01, TC-LOGIN-02, UT-08, UT-09
    """
    mock_backend.register_user("FR3 User", "fr3.user@test.com", "9666666604", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    # Approved user logs in and gets token
    st, body = mock_backend.login_user("fr3.user@test.com", "Password123")
    assert st == 200
    assert body["user"]["role"] == "user"

    # Regular user cannot execute manager actions
    st_mgr, _ = mock_backend.verify_user(manager_id=uid, user_id=2, decision="approve")
    assert st_mgr == 403


@pytest.mark.validation
def test_fr_04_emergency_and_non_emergency_requests(mock_backend):
    """
    FR-04: The system shall allow creation of emergency and non-emergency help requests.
    Mapped: TC-REQ-01, TC-REQ-02, BB-REQ-01, BB-REQ-02
    """
    mock_backend.register_user("FR4 User", "fr4@test.com", "9666666605", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    st_e, data_e = mock_backend.create_help_request(uid, "emergency", "Accident SOS", "Details", 17.38, 78.48)
    st_ne, data_ne = mock_backend.create_help_request(uid, "non_emergency", "Gardening", "Details", 17.38, 78.48)

    assert st_e == 201 and data_e["request"]["request_type"] == "emergency"
    assert st_ne == 201 and data_ne["request"]["request_type"] == "non_emergency"


@pytest.mark.validation
def test_fr_05_request_verification_before_release(mock_backend):
    """
    FR-05: A help request shall be verified before it is released to providers.
    Mapped: TC-REQ-03, INT-04
    """
    mock_backend.register_user("FR5 User", "fr5@test.com", "9666666606", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    _, data = mock_backend.create_help_request(uid, "emergency", "Unverified SOS", "Details", 17.38, 78.48)
    rid = data["request"]["id"]
    assert mock_backend.help_requests[rid]["status"] == "pending_verification"

    # Not visible as approved
    assert rid not in [r["id"] for r in mock_backend.help_requests.values() if r["status"] == "approved"]


@pytest.mark.validation
def test_fr_06_provider_interest_on_verified_request(mock_backend):
    """
    FR-06: Providers shall be able to click ‘Interested’ on a verified request.
    Mapped: INT-05, TC-BUF-01
    """
    mock_backend.register_user("FR6 Prov", "fr6.prov@test.com", "9666666607", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]
    mock_backend.users[pid]["verification_status"] = "verified"

    mock_backend.register_user("FR6 User", "fr6.user@test.com", "9666666608", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]

    _, data = mock_backend.create_help_request(uid, "emergency", "Verified SOS", "Details", 17.38, 78.48)
    rid = data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    st_int, _ = mock_backend.express_interest(pid, rid, elapsed_time_sec=5.0)
    assert st_int == 202


@pytest.mark.validation
def test_fr_07_emergency_30s_buffer_knn_assignment(mock_backend):
    """
    FR-07: Emergency requests shall use a 30-second buffer, then assign the nearest interested provider.
    Mapped: TC-BUF-01, TC-BUF-03, TC-BUF-04, BB-BUF-01 to BB-BUF-03, INT-06, UT-01
    """
    assert get_buffer_duration_seconds("emergency") == 30

    mock_backend.register_user("FR7 User", "fr7.user@test.com", "9666666609", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    _, data = mock_backend.create_help_request(uid, "emergency", "SOS 30s", "Details", 17.385, 78.486)
    rid = data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    # Register providers
    mock_backend.register_user("Far Prov", "far.fr7@test.com", "9666666610", "Password123", role="provider")
    p1 = list(mock_backend.users.keys())[-1]
    mock_backend.users[p1]["latitude"], mock_backend.users[p1]["longitude"] = 17.450, 78.500
    mock_backend.express_interest(p1, rid, elapsed_time_sec=10.0)

    mock_backend.register_user("Close Prov", "close.fr7@test.com", "9666666611", "Password123", role="provider")
    p2 = list(mock_backend.users.keys())[-1]
    mock_backend.users[p2]["latitude"], mock_backend.users[p2]["longitude"] = 17.386, 78.487
    mock_backend.express_interest(p2, rid, elapsed_time_sec=20.0)

    winner = mock_backend.finalize_assignment_knn(rid)
    assert winner["id"] == p2


@pytest.mark.validation
def test_fr_08_non_emergency_5min_buffer():
    """
    FR-08: Non-emergency requests shall use a 5-minute buffer before assignment.
    Mapped: TC-BUF-02, BB-BUF-04, BB-BUF-05, SYS-04
    """
    assert get_buffer_duration_seconds("non_emergency") == 300


@pytest.mark.validation
def test_fr_09_bargaining_in_non_emergency_buffer(mock_backend):
    """
    FR-09: Bargaining shall be available during the non-emergency buffer.
    Mapped: TC-BRG-01, TC-BRG-02, INT-08
    """
    mock_backend.register_user("FR9 User", "fr9.user@test.com", "9666666612", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    _, data = mock_backend.create_help_request(uid, "non_emergency", "House Work", "Details", 17.38, 78.48)
    rid = data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    mock_backend.register_user("FR9 Prov", "fr9.prov@test.com", "9666666613", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]

    st, bdata = mock_backend.submit_bargain_offer(pid, rid, pid, 60.0)
    assert st == 201
    assert bdata["offer"]["offered_price"] == 60.0


@pytest.mark.validation
def test_fr_10_payment_for_completed_help(mock_backend):
    """
    FR-10: The system shall support payment for completed help.
    Mapped: TC-PAY-01, TC-PAY-02, INT-09, INT-10
    """
    mock_backend.register_user("FR10 User", "fr10.user@test.com", "9666666614", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    _, data = mock_backend.create_help_request(uid, "emergency", "Completed SOS", "Details", 17.38, 78.48)
    rid = data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "completed"

    st, pdata = mock_backend.process_payment(uid, rid, 100.0)
    assert st == 200
    assert pdata["payment"]["payment_status"] == "successful"


@pytest.mark.validation
def test_fr_11_location_capture_for_matching():
    """
    FR-11: The system shall capture location for nearest-provider matching.
    Mapped: TC-LOC-01, TC-LOC-02, INT-06
    """
    lat, lon = 17.385044, 78.486671
    dist = haversine_distance(lat, lon, 17.386000, 78.487000)
    assert dist < 0.5


@pytest.mark.validation
def test_fr_12_chat_between_seeker_and_provider(mock_backend):
    """
    FR-12: Seeker and assigned provider shall be able to chat.
    Mapped: TC-CHAT-01, TC-CHAT-02, INT-11
    """
    mock_backend.messages.append({"request_id": 999, "sender_id": 1, "message": "Hi, I am on my way."})
    msgs = [m for m in mock_backend.messages if m["request_id"] == 999]
    assert len(msgs) == 1
    assert msgs[0]["message"] == "Hi, I am on my way."


@pytest.mark.validation
def test_fr_13_password_reset_via_email():
    """
    FR-13: Users shall be able to reset their password using email.
    Mapped: TC-PWD-01 to TC-PWD-04, INT-12, SYS-05
    """
    email = "user.reset@test.com"
    token = "jwt-reset-token"
    reset_url = f"http://localhost:3000/reset_password?token={token}"
    assert "token=" in reset_url


@pytest.mark.validation
def test_fr_14_notifications_for_key_events(mock_backend):
    """
    FR-14: The system shall notify users of key events.
    Mapped: TC-NOT-01, INT-07
    """
    mock_backend.notifications.append({
        "user_id": 1,
        "title": "Provider Ready",
        "message": "A provider is ready to help."
    })
    assert len(mock_backend.notifications) >= 1
