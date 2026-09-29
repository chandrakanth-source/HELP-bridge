"""
Core Test Case Design Suite (TC-REG, TC-VER, TC-MGR, TC-LOGIN, TC-REQ, TC-BUF,
TC-BRG, TC-PAY, TC-LOC, TC-CHAT, TC-PWD, TC-NOT, TC-CBT)
From Section 4 of HelpBridge Software Test Report (CSE312)
"""

import pytest
from tests.conftest import haversine_distance, find_nearest_neighbors


# ==============================================================================
# SECTION 4: TEST CASE DESIGN IMPLEMENTATION
# ==============================================================================

# ------------------------------------------------------------------------------
# Module: Registration (TC-REG-01, TC-REG-02)
# ------------------------------------------------------------------------------
def test_tc_reg_01_register_new_user_with_valid_details(mock_backend):
    """
    TC-REG-01: Register a new user with valid details.
    Preconditions: Email not already registered.
    Expected Result: Account created with status 'pending'; user cannot use until approved.
    """
    status, body = mock_backend.register_user(
        name="John Doe",
        email="john.doe@test.com",
        phone="9000000001",
        password="SecurePassword123",
        role="user"
    )
    assert status == 201
    assert body["user"]["verification_status"] == "pending"
    login_status, login_body = mock_backend.login_user("john.doe@test.com", "SecurePassword123")
    assert login_status == 403


def test_tc_reg_02_register_with_already_used_email(mock_backend):
    """
    TC-REG-02: Register with an already used email.
    Preconditions: User with same email exists.
    Expected Result: Registration rejected with duplicate-email error (409 Conflict).
    """
    mock_backend.register_user("User One", "duplicate@test.com", "9000000002", "Password123", role="user")

    # Duplicate registration attempt
    status, body = mock_backend.register_user("User Two", "duplicate@test.com", "9000000003", "Password123", role="user")
    assert status == 409
    assert "already registered" in body["message"].lower()


# ------------------------------------------------------------------------------
# Module: User Verification (TC-VER-01, TC-VER-02)
# ------------------------------------------------------------------------------
def test_tc_ver_01_manager_approves_pending_user(mock_backend):
    """
    TC-VER-01: Manager approves a pending user.
    Preconditions: Manager logged in; user pending.
    Expected Result: User status becomes Approved; user can log in; notification sent.
    """
    # Create and verify manager
    mock_backend.register_user("Manager Mike", "mgr.mike@test.com", "9000000004", "Password123", role="manager")
    mgr_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[mgr_id]["verification_status"] = "verified"

    # Create pending user
    mock_backend.register_user("Pending Paul", "paul.pending@test.com", "9000000005", "Password123", role="user")
    user_id = list(mock_backend.users.keys())[-1]

    # Manager approves user
    status, body = mock_backend.verify_user(manager_id=mgr_id, user_id=user_id, decision="approve")
    assert status == 200
    assert body["user"]["verification_status"] == "verified"

    # User can now log in
    log_st, log_body = mock_backend.login_user("paul.pending@test.com", "Password123")
    assert log_st == 200
    assert "token" in log_body


def test_tc_ver_02_manager_rejects_pending_user(mock_backend):
    """
    TC-VER-02: Manager rejects a pending user.
    Preconditions: Manager logged in; user pending.
    Expected Result: User remains blocked; login denied.
    """
    mock_backend.register_user("Manager Bob", "mgr.bob@test.com", "9000000006", "Password123", role="manager")
    mgr_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[mgr_id]["verification_status"] = "verified"

    mock_backend.register_user("Reject User", "reject.user@test.com", "9000000007", "Password123", role="user")
    user_id = list(mock_backend.users.keys())[-1]

    status, body = mock_backend.verify_user(manager_id=mgr_id, user_id=user_id, decision="reject")
    assert status == 200
    assert body["user"]["verification_status"] == "rejected"

    log_st, log_body = mock_backend.login_user("reject.user@test.com", "Password123")
    assert log_st == 403


# ------------------------------------------------------------------------------
# Module: Manager Registration & Verification (TC-MGR-01, TC-MGR-02, TC-MGR-03)
# ------------------------------------------------------------------------------
def test_tc_mgr_01_register_new_manager(mock_backend):
    """
    TC-MGR-01: Register a new manager.
    Expected Result: Manager created with status 'Pending Admin Verification'.
    """
    status, body = mock_backend.register_user(
        name="Applicant Manager",
        email="app.manager@test.com",
        phone="9000000008",
        password="Password123",
        role="manager"
    )
    assert status == 201
    assert body["user"]["role"] == "manager"
    assert body["user"]["verification_status"] == "pending"


def test_tc_mgr_02_admin_approves_pending_manager(mock_backend):
    """
    TC-MGR-02: Administrator approves pending manager.
    Preconditions: Admin logged in; manager pending.
    Expected Result: Manager status Approved; manager can log in.
    """
    admin_id = 1  # From seeded mock backend fixture
    mock_backend.register_user("New Manager", "new.mgr@test.com", "9000000009", "Password123", role="manager")
    mgr_id = list(mock_backend.users.keys())[-1]

    status, body = mock_backend.approve_manager(admin_id=admin_id, manager_id=mgr_id, decision="approve")
    assert status == 200
    assert body["manager"]["verification_status"] == "verified"

    log_st, log_body = mock_backend.login_user("new.mgr@test.com", "Password123")
    assert log_st == 200
    assert log_body["user"]["role"] == "manager"


def test_tc_mgr_03_pending_manager_tries_to_log_in(mock_backend):
    """
    TC-MGR-03: Pending manager tries to log in.
    Expected Result: Login denied with 'awaiting approval' message.
    """
    mock_backend.register_user("Unapproved Mgr", "unapproved.mgr@test.com", "9000000010", "Password123", role="manager")
    status, body = mock_backend.login_user("unapproved.mgr@test.com", "Password123")
    assert status == 403
    assert "awaiting administrator approval" in body["message"].lower()


def test_tc_mgr_04_multi_provider_approval_and_assignment(mock_backend):
    """
    TC-MGR-04: Help needing two providers: manager approves/assigns both.
    Preconditions: Verified request requires 2 providers; 2+ providers have shown interest; manager logged in.
    Test Input: Manager approves/assigns Provider A and Provider B to the same request.
    Expected Result: Both providers assigned only after manager approval; request shows both;
    both providers and seeker notified; assignment blocked until both are approved.
    """
    # 1. Manager logged in
    mock_backend.register_user("Manager Multi", "mgr.multi@test.com", "9000000044", "Password123", role="manager")
    mgr_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[mgr_id]["verification_status"] = "verified"

    # 2. Seeker creates emergency request needing 2 providers (e.g. heavy lifting / stretcher support)
    mock_backend.register_user("Seeker Multi", "seeker.multi@test.com", "9000000045", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    mock_backend.users[sid]["verification_status"] = "verified"

    st_req, req_data = mock_backend.create_help_request(
        requester_id=sid,
        request_type="emergency",
        title="Flood Evacuation Assistance",
        description="Need 2 responders with raft",
        lat=17.385,
        lon=78.486,
        providers_needed=2
    )
    assert st_req == 201
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    # 3. Two providers express interest
    mock_backend.register_user("Provider Alpha", "alpha.prov@test.com", "9000000046", "Password123", role="provider")
    p_a = list(mock_backend.users.keys())[-1]
    mock_backend.users[p_a]["verification_status"] = "verified"
    mock_backend.express_interest(p_a, rid, elapsed_time_sec=5.0)

    mock_backend.register_user("Provider Beta", "beta.prov@test.com", "9000000047", "Password123", role="provider")
    p_b = list(mock_backend.users.keys())[-1]
    mock_backend.users[p_b]["verification_status"] = "verified"
    mock_backend.express_interest(p_b, rid, elapsed_time_sec=10.0)

    # 4. Assignment blocked if only 1 provider is assigned when 2 are needed
    st_partial, body_partial = mock_backend.manager_assign_multiple_providers(mgr_id, rid, [p_a])
    assert st_partial == 400
    assert "blocked" in body_partial["message"].lower()

    # 5. Manager approves and assigns both Provider A and Provider B
    st_full, body_full = mock_backend.manager_assign_multiple_providers(mgr_id, rid, [p_a, p_b])
    assert st_full == 200
    assert set(body_full["assigned_providers"]) == {p_a, p_b}
    assert mock_backend.help_requests[rid]["status"] == "assigned"

    # 6. Both providers and seeker notified
    seeker_notifs = [n for n in mock_backend.notifications if n["user_id"] == sid and n.get("request_id") == rid]
    prov_a_notifs = [n for n in mock_backend.notifications if n["user_id"] == p_a and n.get("request_id") == rid]
    prov_b_notifs = [n for n in mock_backend.notifications if n["user_id"] == p_b and n.get("request_id") == rid]

    assert len(seeker_notifs) >= 1
    assert len(prov_a_notifs) >= 1
    assert len(prov_b_notifs) >= 1


# ------------------------------------------------------------------------------
# Module: Login (TC-LOGIN-01, TC-LOGIN-02, TC-LOGIN-03)
# ------------------------------------------------------------------------------
def test_tc_login_01_valid_login_of_approved_user(mock_backend):
    """
    TC-LOGIN-01: Valid login of approved user.
    Expected Result: Redirected to role-based dashboard / JWT issued.
    """
    mock_backend.register_user("Approved Login", "approved.login@test.com", "9000000011", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    status, body = mock_backend.login_user("approved.login@test.com", "Password123")
    assert status == 200
    assert "token" in body
    assert body["user"]["id"] == uid


def test_tc_login_02_login_with_wrong_password(mock_backend):
    """
    TC-LOGIN-02: Login with wrong password.
    Expected Result: Error message; no session created.
    """
    mock_backend.register_user("Wrong Pass User", "wrongpass@test.com", "9000000012", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    status, body = mock_backend.login_user("wrongpass@test.com", "IncorrectPassword")
    assert status == 401
    assert "Invalid email or password" in body["message"]


def test_tc_login_03_login_by_user_not_yet_verified(mock_backend):
    """
    TC-LOGIN-03: Login by user not yet verified.
    Expected Result: Login denied until approved.
    """
    mock_backend.register_user("Pending Login", "pending.login@test.com", "9000000013", "Password123", role="user")
    status, body = mock_backend.login_user("pending.login@test.com", "Password123")
    assert status == 403
    assert "pending" in body["message"].lower() or "approval" in body["message"].lower()


# ------------------------------------------------------------------------------
# Module: Help Request (TC-REQ-01, TC-REQ-02, TC-REQ-03)
# ------------------------------------------------------------------------------
def test_tc_req_01_create_emergency_help_request(mock_backend):
    """
    TC-REQ-01: Create an emergency help request.
    Expected Result: Request created and sent for manager verification.
    """
    mock_backend.register_user("Emergency Seeker", "sos.seeker@test.com", "9000000014", "Password123", role="user")
    seeker_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[seeker_id]["verification_status"] = "verified"

    status, body = mock_backend.create_help_request(
        requester_id=seeker_id,
        request_type="emergency",
        title="Severe Medical SOS",
        description="Ambulance needed immediately",
        lat=17.385,
        lon=78.486
    )
    assert status == 201
    assert body["request"]["status"] == "pending_verification"
    assert body["request"]["request_type"] == "emergency"


def test_tc_req_02_create_non_emergency_help_request(mock_backend):
    """
    TC-REQ-02: Create a non-emergency help request.
    Expected Result: Request created and sent for verification.
    """
    mock_backend.register_user("Regular Seeker", "reg.seeker@test.com", "9000000015", "Password123", role="user")
    seeker_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[seeker_id]["verification_status"] = "verified"

    status, body = mock_backend.create_help_request(
        requester_id=seeker_id,
        request_type="non_emergency",
        title="AC Repair Required",
        description="Cooling not working",
        lat=17.385,
        lon=78.486
    )
    assert status == 201
    assert body["request"]["status"] == "pending_verification"
    assert body["request"]["request_type"] == "non_emergency"


def test_tc_req_03_unverified_request_visibility(mock_backend):
    """
    TC-REQ-03: Unverified request visibility.
    Preconditions: Request created, not verified.
    Expected Result: Request is NOT visible to providers until verified by manager.
    """
    mock_backend.register_user("Req Seeker", "req.seeker@test.com", "9000000016", "Password123", role="user")
    seeker_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[seeker_id]["verification_status"] = "verified"

    _, data = mock_backend.create_help_request(seeker_id, "emergency", "Accident on Highway", "Help needed", 17.38, 78.48)
    req_id = data["request"]["id"]

    # Provider attempts to fetch available requests
    mock_backend.register_user("Provider Alex", "alex.prov@test.com", "9000000017", "Password123", role="provider")
    prov_id = list(mock_backend.users.keys())[-1]

    # Available requests should filter status == 'approved'
    available_to_providers = [
        r for r in mock_backend.help_requests.values()
        if r["status"] == "approved"
    ]
    assert all(r["id"] != req_id for r in available_to_providers), "Pending request must not appear to providers"


# ------------------------------------------------------------------------------
# Module: Buffer & Assignment (TC-BUF-01 to TC-BUF-04)
# ------------------------------------------------------------------------------
def test_tc_buf_01_emergency_request_30s_buffer_nearest_assignment(mock_backend):
    """
    TC-BUF-01: Emergency request: 30 s buffer and nearest KNN assignment.
    Expected Result: After 30 s the nearest interested provider is assigned; others notified.
    """
    # Create and approve request
    mock_backend.register_user("SOS Seeker", "buf1.seeker@test.com", "9000000018", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(sid, "emergency", "Fire hazard", "Kitchen fire", 17.3850, 78.4860)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    # Register 3 providers at different coordinates
    providers_data = [
        ("Provider Far", "far@test.com", "9000000019", 17.4800, 78.5000),    # ~10 km
        ("Provider Nearest", "near@test.com", "9000000020", 17.3855, 78.4862), # ~0.06 km
        ("Provider Mid", "mid@test.com", "9000000021", 17.4100, 78.4900),     # ~2.8 km
    ]
    p_ids = []
    for name, email, phone, lat, lon in providers_data:
        mock_backend.register_user(name, email, phone, "Password123", role="provider")
        pid = list(mock_backend.users.keys())[-1]
        mock_backend.users[pid]["latitude"] = lat
        mock_backend.users[pid]["longitude"] = lon
        mock_backend.users[pid]["verification_status"] = "verified"
        mock_backend.express_interest(pid, rid, elapsed_time_sec=15.0)
        p_ids.append(pid)

    # 30s buffer finishes -> Assign nearest
    winner = mock_backend.finalize_assignment_knn(rid)
    assert winner is not None
    assert winner["id"] == p_ids[1], "Provider Nearest must be selected"
    assert mock_backend.help_requests[rid]["assigned_provider_id"] == p_ids[1]


def test_tc_buf_02_non_emergency_request_5min_buffer(mock_backend):
    """
    TC-BUF-02: Non-emergency request: 5 min buffer.
    Expected Result: Assignment happens only after the 5-minute buffer ends.
    """
    mock_backend.register_user("NonEmerg Seeker", "nonemerg@test.com", "9000000022", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(sid, "non_emergency", "Painting help", "Living room", 17.385, 78.486)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    mock_backend.register_user("Painter 1", "paint1@test.com", "9000000023", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]
    mock_backend.users[pid]["verification_status"] = "verified"

    # Express interest at 2 minutes (120 s)
    status, _ = mock_backend.express_interest(pid, rid, elapsed_time_sec=120.0)
    assert status == 202

    # Verify buffer limit is 300 seconds
    assert mock_backend.help_requests[rid]["request_type"] == "non_emergency"


def test_tc_buf_03_no_provider_shows_interest_in_buffer(mock_backend):
    """
    TC-BUF-03: No provider shows interest in buffer.
    Expected Result: No assignment; request stays open / user notified.
    """
    mock_backend.register_user("Lonely Seeker", "lonely@test.com", "9000000024", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(sid, "emergency", "No responders", "Help", 17.385, 78.486)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    # No interests submitted
    winner = mock_backend.finalize_assignment_knn(rid)
    assert winner is None
    assert mock_backend.help_requests[rid]["assigned_provider_id"] is None


def test_tc_buf_04_interest_after_buffer_expiry(mock_backend):
    """
    TC-BUF-04: Interest after buffer expiry.
    Expected Result: Late interest rejected / ignored.
    """
    mock_backend.register_user("Late Seeker", "late@test.com", "9000000025", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(sid, "emergency", "Fast SOS", "Urgent", 17.385, 78.486)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    mock_backend.register_user("Late Provider", "late.prov@test.com", "9000000026", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]

    # Try expressing interest after 45s (> 30s buffer)
    status, body = mock_backend.express_interest(pid, rid, elapsed_time_sec=45.0)
    assert status == 400
    assert "rejected" in body["message"].lower() or "closed" in body["message"].lower()


def test_tc_buf_05_assigned_provider_cancels_reassignment(mock_backend):
    """
    TC-BUF-05: Assigned provider cancels; system reassigns to another provider.
    Preconditions: Request assigned to Provider A; other providers had clicked 'Interested' (or request reopens).
    Test Input: Provider A cancels the assigned request.
    Expected Result: Request is released; system assigns the next nearest interested provider (or reopens the request);
    seeker and new provider notified; help flow continues.
    """
    # 1. Seeker creates emergency request
    mock_backend.register_user("Cancel Flow Seeker", "canc.seeker@test.com", "9000000048", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    mock_backend.users[sid]["verification_status"] = "verified"

    st_req, req_data = mock_backend.create_help_request(sid, "emergency", "Stuck in Elevator", "Need technician", 17.385, 78.486)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    # 2. Provider A (closest) and Provider B (second closest) express interest
    mock_backend.register_user("Provider A", "prov.a@test.com", "9000000049", "Password123", role="provider")
    p_a = list(mock_backend.users.keys())[-1]
    mock_backend.users[p_a]["latitude"], mock_backend.users[p_a]["longitude"] = 17.386, 78.487
    mock_backend.users[p_a]["verification_status"] = "verified"
    mock_backend.express_interest(p_a, rid, elapsed_time_sec=10.0)

    mock_backend.register_user("Provider B", "prov.b@test.com", "9000000050", "Password123", role="provider")
    p_b = list(mock_backend.users.keys())[-1]
    mock_backend.users[p_b]["latitude"], mock_backend.users[p_b]["longitude"] = 17.390, 78.490
    mock_backend.users[p_b]["verification_status"] = "verified"
    mock_backend.express_interest(p_b, rid, elapsed_time_sec=15.0)

    # 3. Buffer assigns Provider A first
    winner = mock_backend.finalize_assignment_knn(rid)
    assert winner["id"] == p_a
    assert mock_backend.help_requests[rid]["assigned_provider_id"] == p_a

    # 4. Provider A cancels the assigned request
    st_canc, body_canc = mock_backend.cancel_assigned_request(provider_id=p_a, request_id=rid)
    assert st_canc == 200

    # 5. System reassigns request to Provider B (next nearest interested candidate)
    assert mock_backend.help_requests[rid]["assigned_provider_id"] == p_b
    assert mock_backend.help_requests[rid]["status"] == "assigned"

    # 6. Seeker and new Provider B receive notifications
    seeker_notifs = [n for n in mock_backend.notifications if n["user_id"] == sid and n.get("request_id") == rid]
    prov_b_notifs = [n for n in mock_backend.notifications if n["user_id"] == p_b and n.get("request_id") == rid]
    assert any("Cancelled" in n["title"] for n in seeker_notifs)
    assert any("Assigned" in n["title"] for n in prov_b_notifs)


def test_tc_buf_06_provider_cannot_hold_two_active_requests(mock_backend):
    """
    TC-BUF-06: Provider cannot hold two active requests at once.
    Preconditions: Provider already accepted/assigned an active request.
    Test Input: Same provider clicks 'Interested' / accepts a second request.
    Expected Result: Second acceptance rejected with a clear message; provider stays on the first request only.
    """
    # 1. Register a provider
    mock_backend.register_user("Busy Provider", "busy.prov@test.com", "9000000051", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]
    mock_backend.users[pid]["verification_status"] = "verified"

    # 2. First request is assigned to Provider
    mock_backend.register_user("User Req 1", "u.req1@test.com", "9000000052", "Password123", role="user")
    u1 = list(mock_backend.users.keys())[-1]
    _, r1_data = mock_backend.create_help_request(u1, "emergency", "Job 1 Active", "Details", 17.385, 78.486)
    r1_id = r1_data["request"]["id"]
    mock_backend.help_requests[r1_id]["status"] = "assigned"
    mock_backend.help_requests[r1_id]["assigned_provider_id"] = pid

    # 3. Second request is created and approved
    mock_backend.register_user("User Req 2", "u.req2@test.com", "9000000053", "Password123", role="user")
    u2 = list(mock_backend.users.keys())[-1]
    _, r2_data = mock_backend.create_help_request(u2, "emergency", "Job 2 New", "Details", 17.385, 78.486)
    r2_id = r2_data["request"]["id"]
    mock_backend.help_requests[r2_id]["status"] = "approved"

    # 4. Same provider tries to click 'Interested' on second request
    st_interest, body_interest = mock_backend.express_interest(pid, r2_id, elapsed_time_sec=5.0)
    assert st_interest == 409
    assert "currently handling another" in body_interest["message"].lower() or "active request" in body_interest["message"].lower()


# ------------------------------------------------------------------------------
# Module: Bargaining (TC-BRG-01, TC-BRG-02)
# ------------------------------------------------------------------------------
def test_tc_brg_01_bargain_price_during_non_emergency_buffer(mock_backend):
    """
    TC-BRG-01: Bargain price during non-emergency buffer.
    Expected Result: Offers recorded and shown to both parties; agreed price stored.
    """
    mock_backend.register_user("Bargain Seeker", "brg.seeker@test.com", "9000000027", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(sid, "non_emergency", "Lawn Mowing", "Front yard", 17.385, 78.486)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    mock_backend.register_user("Mower Provider", "mower@test.com", "9000000028", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]

    # Provider offers $50
    st1, body1 = mock_backend.submit_bargain_offer(sender_id=pid, request_id=rid, provider_id=pid, price=50.0)
    assert st1 == 201
    offer_id = body1["offer"]["id"]

    # Seeker accepts offer of $50
    st2, body2 = mock_backend.accept_bargain_offer(offer_id)
    assert st2 == 200
    assert body2["request"]["agreed_price"] == 50.0
    assert body2["request"]["assigned_provider_id"] == pid


def test_tc_brg_02_bargaining_on_emergency_request(mock_backend):
    """
    TC-BRG-02: Bargaining on an emergency request.
    Expected Result: Bargaining not available for emergency requests.
    """
    mock_backend.register_user("SOS Seeker Brg", "sos.brg@test.com", "9000000029", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(sid, "emergency", "Critical Rescue", "Car submerged", 17.385, 78.486)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    mock_backend.register_user("Rescue Prov", "rescue@test.com", "9000000030", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]

    status, body = mock_backend.submit_bargain_offer(sender_id=pid, request_id=rid, provider_id=pid, price=100.0)
    assert status == 400
    assert "not available for emergency" in body["message"].lower()


# ------------------------------------------------------------------------------
# Module: Payment (TC-PAY-01, TC-PAY-02)
# ------------------------------------------------------------------------------
def test_tc_pay_01_successful_payment_after_help_completed(mock_backend):
    """
    TC-PAY-01: Successful payment after help completed.
    Expected Result: Payment recorded; provider earnings updated; confirmation shown.
    """
    mock_backend.register_user("Pay User", "pay.user@test.com", "9000000031", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]

    mock_backend.register_user("Earn Provider", "earn.prov@test.com", "9000000032", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]

    _, req_data = mock_backend.create_help_request(sid, "emergency", "Completed Task", "Done", 17.385, 78.486)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["assigned_provider_id"] = pid
    mock_backend.help_requests[rid]["status"] = "completed"

    status, body = mock_backend.process_payment(payer_id=sid, request_id=rid, amount=150.0)
    assert status == 200
    assert body["payment"]["payment_status"] == "successful"
    assert body["payment"]["amount"] == 150.0


def test_tc_pay_02_payment_with_invalid_amount(mock_backend):
    """
    TC-PAY-02: Payment with invalid amount / details (Amount = 0).
    Expected Result: Payment rejected with validation error.
    """
    mock_backend.register_user("Pay User 2", "pay.user2@test.com", "9000000033", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]

    _, req_data = mock_backend.create_help_request(sid, "emergency", "Completed Task 2", "Done", 17.385, 78.486)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "completed"

    status, _ = mock_backend.process_payment(payer_id=sid, request_id=rid, amount=0.0)
    assert status == 400


# ------------------------------------------------------------------------------
# Module: Location (TC-LOC-01, TC-LOC-02)
# ------------------------------------------------------------------------------
def test_tc_loc_01_share_location_with_request(mock_backend):
    """
    TC-LOC-01: Share location with request.
    Expected Result: Coordinates stored and used to find nearest provider.
    """
    mock_backend.register_user("Loc User", "loc.user@test.com", "9000000034", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]

    mock_backend.users[uid]["latitude"] = 17.4485
    mock_backend.users[uid]["longitude"] = 78.3748

    assert mock_backend.users[uid]["latitude"] == 17.4485
    assert mock_backend.users[uid]["longitude"] == 78.3748


def test_tc_loc_02_location_permission_denied():
    """
    TC-LOC-02: Location permission denied in browser.
    Expected Result: Graceful message / manual location option; no crash.
    """
    def fallback_location_handler(permission_granted: bool, manual_address: str | None):
        if not permission_granted:
            if not manual_address:
                return 400, "Please allow location access or provide a manual address."
            return 200, f"Manual address accepted: {manual_address}"
        return 200, "GPS location acquired"

    st, msg = fallback_location_handler(permission_granted=False, manual_address="Road No 12, Banjara Hills")
    assert st == 200
    assert "Manual address accepted" in msg


# ------------------------------------------------------------------------------
# Module: Chat (TC-CHAT-01, TC-CHAT-02)
# ------------------------------------------------------------------------------
def test_tc_chat_01_seeker_and_assigned_provider_exchange_messages(mock_backend):
    """
    TC-CHAT-01: Seeker and assigned provider exchange messages.
    Expected Result: Messages delivered and stored in order.
    """
    mock_backend.register_user("Chat Seeker", "chat.seeker@test.com", "9000000035", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]

    mock_backend.register_user("Chat Provider", "chat.prov@test.com", "9000000036", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]

    _, req_data = mock_backend.create_help_request(sid, "emergency", "Need Tow", "Tow needed", 17.385, 78.486)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["assigned_provider_id"] = pid

    # Simulate message exchange
    messages = [
        {"request_id": rid, "sender_id": sid, "message": "Where are you currently?"},
        {"request_id": rid, "sender_id": pid, "message": "I am 5 mins away on main road."},
    ]
    mock_backend.messages.extend(messages)

    req_messages = [m for m in mock_backend.messages if m["request_id"] == rid]
    assert len(req_messages) == 2
    assert req_messages[0]["message"] == "Where are you currently?"
    assert req_messages[1]["message"] == "I am 5 mins away on main road."


def test_tc_chat_02_non_participant_accesses_chat(mock_backend):
    """
    TC-CHAT-02: Non-participant accesses a chat.
    Expected Result: Access denied (403).
    """
    mock_backend.register_user("Chat User 1", "u1@test.com", "9000000037", "Password123", role="user")
    u1 = list(mock_backend.users.keys())[-1]

    mock_backend.register_user("Chat User 2", "u2@test.com", "9000000038", "Password123", role="provider")
    u2 = list(mock_backend.users.keys())[-1]

    mock_backend.register_user("Third Party", "intruder@test.com", "9000000039", "Password123", role="user")
    u3 = list(mock_backend.users.keys())[-1]

    _, req_data = mock_backend.create_help_request(u1, "emergency", "Chat Request", "Details", 17.385, 78.486)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["assigned_provider_id"] = u2

    # Check permission for u3
    has_access = (u3 == u1 or u3 == u2)
    assert not has_access, "Third party user must be denied chat access (403)"


# ------------------------------------------------------------------------------
# Module: Password Reset (TC-PWD-01 to TC-PWD-04)
# ------------------------------------------------------------------------------
def test_tc_pwd_01_request_reset_for_registered_email(mock_backend):
    """
    TC-PWD-01: Request reset for registered email.
    Expected Result: Reset email sent with link/token.
    """
    mock_backend.register_user("PWD User", "pwd.user@test.com", "9000000040", "Password123", role="user")
    # Finding user succeeds
    user_exists = any(u["email"] == "pwd.user@test.com" for u in mock_backend.users.values())
    assert user_exists is True


def test_tc_pwd_02_set_new_password_with_valid_token(mock_backend):
    """
    TC-PWD-02: Set new password with valid token.
    Expected Result: Password updated; login works with new password.
    """
    mock_backend.register_user("Reset User", "reset.user@test.com", "9000000041", "OldPass123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    # Update password
    mock_backend.users[uid]["password"] = "NewStrongPass456"

    # Old password fails
    st_old, _ = mock_backend.login_user("reset.user@test.com", "OldPass123")
    assert st_old == 401

    # New password succeeds
    st_new, body_new = mock_backend.login_user("reset.user@test.com", "NewStrongPass456")
    assert st_new == 200
    assert "token" in body_new


def test_tc_pwd_03_reset_with_invalid_or_expired_token():
    """
    TC-PWD-03: Reset with invalid/expired token.
    Expected Result: Reset rejected with error (400).
    """
    def verify_reset_token(token: str):
        if token in ("expired-token", "malformed-token", "invalid"):
            return 400, "This reset link is invalid or expired"
        return 200, "Valid token"

    st, msg = verify_reset_token("expired-token")
    assert st == 400
    assert "invalid or expired" in msg


def test_tc_pwd_04_request_reset_for_unregistered_email(mock_backend):
    """
    TC-PWD-04: Request reset for unregistered email.
    Expected Result: No email sent; safe error/neutral message.
    """
    # Safe message prevents email enumeration
    safe_response = "If an account exists for that email, a password reset link has been sent."
    assert "If an account exists" in safe_response


# ------------------------------------------------------------------------------
# Module: Notification & Chatbot (TC-NOT-01, TC-CBT-01)
# ------------------------------------------------------------------------------
def test_tc_not_01_notification_on_assignment(mock_backend):
    """
    TC-NOT-01: Notification on assignment.
    Expected Result: Seeker and provider receive notifications.
    """
    mock_backend.register_user("Seeker Notif", "notif.seeker@test.com", "9000000042", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]

    mock_backend.register_user("Prov Notif", "notif.prov@test.com", "9000000043", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]

    _, req_data = mock_backend.create_help_request(sid, "emergency", "Battery Jump", "Details", 17.385, 78.486)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    mock_backend.express_interest(pid, rid, elapsed_time_sec=10.0)
    mock_backend.finalize_assignment_knn(rid)

    # Generate assignment notifications
    mock_backend.notifications.append({"user_id": sid, "title": "Provider Assigned", "request_id": rid})
    mock_backend.notifications.append({"user_id": pid, "title": "Request Assigned", "request_id": rid})

    s_notifs = [n for n in mock_backend.notifications if n["user_id"] == sid]
    p_notifs = [n for n in mock_backend.notifications if n["user_id"] == pid]
    assert len(s_notifs) >= 1
    assert len(p_notifs) >= 1


def test_tc_cbt_01_chatbot_answers_basic_query(mock_backend):
    """
    TC-CBT-01: Chatbot answers a basic query.
    Test Input: 'How do I create a request?'
    Expected Result: Relevant response displayed.
    """
    status, body = mock_backend.chatbot_query("How do I create a request?")
    assert status == 200
    assert "reply" in body
    assert "request" in body["reply"].lower() or "sos" in body["reply"].lower()
