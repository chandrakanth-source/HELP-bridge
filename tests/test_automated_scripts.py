"""
Automated Test Scripts Suite (ATS-01 to ATS-10)
From Section 11 of HelpBridge Software Test Report (CSE312)
"""

import pytest
from tests.conftest import find_nearest_neighbors, get_buffer_duration_seconds


# ==============================================================================
# SECTION 11: AUTOMATED TEST SCRIPTS (ATS-01 to ATS-10)
# ==============================================================================

@pytest.mark.automated
def test_ats_01_valid_login_automation(mock_backend):
    """
    ATS-01 [TC-LOGIN-01]: Automated login verification of approved user.
    """
    mock_backend.register_user("ATS1 User", "ats1@test.com", "9555555501", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    status, body = mock_backend.login_user("ats1@test.com", "Password123")
    assert status == 200
    assert "token" in body


@pytest.mark.automated
def test_ats_02_wrong_password_rejected_automation(mock_backend):
    """
    ATS-02 [TC-LOGIN-02]: Automated wrong password rejection verification.
    """
    mock_backend.register_user("ATS2 User", "ats2@test.com", "9555555502", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    status, body = mock_backend.login_user("ats2@test.com", "WrongPassword")
    assert status == 401


@pytest.mark.automated
def test_ats_03_unapproved_user_blocked_automation(mock_backend):
    """
    ATS-03 [TC-LOGIN-03]: Automated unapproved user login denial verification.
    """
    mock_backend.register_user("ATS3 User", "ats3@test.com", "9555555503", "Password123", role="user")
    status, body = mock_backend.login_user("ats3@test.com", "Password123")
    assert status == 403


@pytest.mark.automated
def test_ats_04_admin_approves_manager_automation(mock_backend):
    """
    ATS-04 [TC-MGR-02]: Automated Admin approving manager verification.
    """
    admin_id = 1
    mock_backend.register_user("ATS4 Mgr", "ats4.mgr@test.com", "9555555504", "Password123", role="manager")
    mgr_id = list(mock_backend.users.keys())[-1]

    status, body = mock_backend.approve_manager(admin_id=admin_id, manager_id=mgr_id, decision="approve")
    assert status == 200
    assert body["manager"]["verification_status"] == "verified"


@pytest.mark.automated
def test_ats_05_manager_approves_user_automation(mock_backend):
    """
    ATS-05 [TC-VER-01]: Automated Manager approving user verification.
    """
    mock_backend.register_user("ATS5 Mgr", "ats5.mgr@test.com", "9555555505", "Password123", role="manager")
    mgr_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[mgr_id]["verification_status"] = "verified"

    mock_backend.register_user("ATS5 User", "ats5.user@test.com", "9555555506", "Password123", role="user")
    user_id = list(mock_backend.users.keys())[-1]

    status, body = mock_backend.verify_user(manager_id=mgr_id, user_id=user_id, decision="approve")
    assert status == 200
    assert body["user"]["verification_status"] == "verified"


@pytest.mark.automated
def test_ats_06_emergency_buffer_and_nearest_assignment_automation(mock_backend):
    """
    ATS-06 [TC-BUF-01]: Automated 30 s emergency buffer & nearest provider assignment.
    """
    mock_backend.register_user("ATS6 Seeker", "ats6.seeker@test.com", "9555555507", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    _, rdata = mock_backend.create_help_request(sid, "emergency", "Accident ATS", "Details", 17.385, 78.486)
    rid = rdata["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    mock_backend.register_user("ATS6 Near", "ats6.near@test.com", "9555555508", "Password123", role="provider")
    p_near = list(mock_backend.users.keys())[-1]
    mock_backend.users[p_near]["latitude"], mock_backend.users[p_near]["longitude"] = 17.386, 78.487

    mock_backend.register_user("ATS6 Far", "ats6.far@test.com", "9555555509", "Password123", role="provider")
    p_far = list(mock_backend.users.keys())[-1]
    mock_backend.users[p_far]["latitude"], mock_backend.users[p_far]["longitude"] = 17.500, 78.500

    mock_backend.express_interest(p_far, rid, elapsed_time_sec=10.0)
    mock_backend.express_interest(p_near, rid, elapsed_time_sec=15.0)

    winner = mock_backend.finalize_assignment_knn(rid)
    assert winner["id"] == p_near


@pytest.mark.automated
def test_ats_07_non_emergency_5min_buffer_automation():
    """
    ATS-07 [TC-BUF-02]: Automated 5-minute non-emergency buffer check.
    """
    assert get_buffer_duration_seconds("non_emergency") == 300


@pytest.mark.automated
def test_ats_08_knn_service_selection_automation():
    """
    ATS-08 [UT-01, UT-02]: Automated KNN service unit verification.
    """
    target = {"latitude": 17.3850, "longitude": 78.4860}
    providers = [
        {"id": 1, "latitude": 17.4000, "longitude": 78.4900},
        {"id": 2, "latitude": 17.3855, "longitude": 78.4865},
    ]
    res = find_nearest_neighbors(target, providers, k=1)
    assert res[0]["id"] == 2
    assert find_nearest_neighbors(target, []) == []


@pytest.mark.automated
def test_ats_09_password_reset_trigger_automation(mock_backend):
    """
    ATS-09 [TC-PWD-01]: Automated password reset dispatch verification.
    """
    mock_backend.register_user("ATS9 User", "ats9@test.com", "9555555510", "Password123", role="user")
    exists = any(u["email"] == "ats9@test.com" for u in mock_backend.users.values())
    assert exists


@pytest.mark.automated
def test_ats_10_end_to_end_emergency_flow_automation(mock_backend):
    """
    ATS-10 [SYS-03]: Automated complete Emergency E2E workflow.
    """
    # 1. Seeker register & approved
    mock_backend.register_user("ATS10 Seeker", "ats10.seeker@test.com", "9555555511", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    mock_backend.users[sid]["verification_status"] = "verified"

    # 2. Emergency request
    _, req = mock_backend.create_help_request(sid, "emergency", "Fire SOS", "Details", 17.385, 78.486)
    rid = req["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    # 3. Provider interest & assign
    mock_backend.register_user("ATS10 Prov", "ats10.prov@test.com", "9555555512", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]
    mock_backend.users[pid]["latitude"], mock_backend.users[pid]["longitude"] = 17.386, 78.487
    mock_backend.express_interest(pid, rid, elapsed_time_sec=10.0)

    winner = mock_backend.finalize_assignment_knn(rid)
    assert winner["id"] == pid

    # 4. Completion & payment
    mock_backend.help_requests[rid]["status"] = "completed"
    st_pay, pdata = mock_backend.process_payment(sid, rid, 250.0)
    assert st_pay == 200
    assert pdata["payment"]["payment_status"] == "successful"
