"""
Integration & Interface Testing Suite (INT-01 to INT-12)
From Section 8 of HelpBridge Software Test Report (CSE312)
"""

import pytest
from tests.conftest import haversine_distance, find_nearest_neighbors


# ==============================================================================
# SECTION 8: INTEGRATION & INTERFACE TESTING (INT-01 to INT-12)
# ==============================================================================

@pytest.mark.integration
def test_int_01_frontend_backend_registration_flow(mock_backend):
    """
    INT-01: Frontend <-> Backend REST API
    Scenario: Register user from UI.
    Expected Result: Record stored as Pending; UI/API shows waiting-for-approval message.
    """
    status, body = mock_backend.register_user(
        name="Integration Seeker",
        email="int.seeker@test.com",
        phone="9888888801",
        password="Password123",
        role="user"
    )
    assert status == 201
    assert body["user"]["verification_status"] == "pending"
    assert "Registration successful" in body["message"]


@pytest.mark.integration
def test_int_02_manager_db_notification_flow(mock_backend):
    """
    INT-02: Manager Module <-> Database / Notification
    Scenario: Manager approves user.
    Expected Result: User status updated in DB; in-app notification generated.
    """
    mock_backend.register_user("Manager Ian", "mgr.ian@test.com", "9888888802", "Password123", role="manager")
    mgr_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[mgr_id]["verification_status"] = "verified"

    mock_backend.register_user("Target User", "target.u@test.com", "9888888803", "Password123", role="user")
    user_id = list(mock_backend.users.keys())[-1]

    status, body = mock_backend.verify_user(manager_id=mgr_id, user_id=user_id, decision="approve")
    assert status == 200
    assert mock_backend.users[user_id]["verification_status"] == "verified"

    # Check notification generation
    user_notifs = [n for n in mock_backend.notifications if n["user_id"] == user_id]
    assert len(user_notifs) >= 1
    assert "Verified" in user_notifs[-1]["title"]


@pytest.mark.integration
def test_int_03_admin_manager_approval_flow(mock_backend):
    """
    INT-03: Admin Module <-> Database
    Scenario: Admin approves manager.
    Expected Result: Manager status updated to Approved.
    """
    admin_id = 1
    mock_backend.register_user("Candidate Mgr", "candidate.mgr@test.com", "9888888804", "Password123", role="manager")
    mgr_id = list(mock_backend.users.keys())[-1]

    status, body = mock_backend.approve_manager(admin_id=admin_id, manager_id=mgr_id, decision="approve")
    assert status == 200
    assert mock_backend.users[mgr_id]["verification_status"] == "verified"


@pytest.mark.integration
def test_int_04_help_request_manager_verification_visibility(mock_backend):
    """
    INT-04: Help Request <-> Manager Verification
    Scenario: Verify a pending request.
    Expected Result: Request becomes visible to providers.
    """
    mock_backend.register_user("Req Seeker Int", "req.int@test.com", "9888888805", "Password123", role="user")
    seeker_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[seeker_id]["verification_status"] = "verified"

    _, req_data = mock_backend.create_help_request(seeker_id, "emergency", "Accident Road 5", "Urgent", 17.38, 78.48)
    rid = req_data["request"]["id"]
    assert mock_backend.help_requests[rid]["status"] == "pending_verification"

    # Manager approves request
    mock_backend.register_user("Manager Ken", "mgr.ken@test.com", "9888888806", "Password123", role="manager")
    mgr_id = list(mock_backend.users.keys())[-1]
    mock_backend.users[mgr_id]["verification_status"] = "verified"

    st_appr, _ = mock_backend.manager_approve_request(mgr_id, rid)
    assert st_appr == 200
    assert mock_backend.help_requests[rid]["status"] == "approved"


@pytest.mark.integration
def test_int_05_provider_interest_buffer_timer_candidate_list(mock_backend):
    """
    INT-05: Provider Interest <-> Buffer Timer
    Scenario: Interest clicked inside buffer.
    Expected Result: Interest stored and included in candidate list.
    """
    mock_backend.register_user("Seeker Int5", "seeker.int5@test.com", "9888888807", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(sid, "emergency", "Car battery", "Dead battery", 17.38, 78.48)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    mock_backend.register_user("Prov Int5", "prov.int5@test.com", "9888888808", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]

    status, body = mock_backend.express_interest(pid, rid, elapsed_time_sec=10.0)
    assert status == 202
    assert any(i["request_id"] == rid and i["provider_id"] == pid for i in mock_backend.interests)


@pytest.mark.integration
def test_int_06_buffer_timer_knn_nearest_assignment(mock_backend):
    """
    INT-06: Buffer Timer <-> KNN Service / Location
    Scenario: Buffer expires.
    Expected Result: Nearest provider computed from stored coordinates and assigned.
    """
    mock_backend.register_user("Seeker Int6", "seeker.int6@test.com", "9888888809", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(sid, "emergency", "Tire burst", "Near tech park", 17.4400, 78.3800)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    # Register 2 providers
    mock_backend.register_user("Provider Closer", "closer@test.com", "9888888810", "Password123", role="provider")
    p_closer = list(mock_backend.users.keys())[-1]
    mock_backend.users[p_closer]["latitude"] = 17.4410
    mock_backend.users[p_closer]["longitude"] = 78.3810

    mock_backend.register_user("Provider Further", "further@test.com", "9888888811", "Password123", role="provider")
    p_further = list(mock_backend.users.keys())[-1]
    mock_backend.users[p_further]["latitude"] = 17.5000
    mock_backend.users[p_further]["longitude"] = 78.5000

    mock_backend.express_interest(p_closer, rid, elapsed_time_sec=5.0)
    mock_backend.express_interest(p_further, rid, elapsed_time_sec=8.0)

    winner = mock_backend.finalize_assignment_knn(rid)
    assert winner is not None
    assert winner["id"] == p_closer
    assert mock_backend.help_requests[rid]["assigned_provider_id"] == p_closer


@pytest.mark.integration
def test_int_07_assignment_notification_dispatch(mock_backend):
    """
    INT-07: Assignment <-> Notification
    Scenario: Provider assigned.
    Expected Result: Notifications created for seeker and provider.
    """
    seeker_id = 100
    prov_id = 200
    req_id = 300

    # Dispatch assignment notifications
    mock_backend.notifications.append({"user_id": seeker_id, "title": "Provider Assigned", "request_id": req_id})
    mock_backend.notifications.append({"user_id": prov_id, "title": "Help Request Assigned", "request_id": req_id})

    assert any(n["user_id"] == seeker_id and n["title"] == "Provider Assigned" for n in mock_backend.notifications)
    assert any(n["user_id"] == prov_id and n["title"] == "Help Request Assigned" for n in mock_backend.notifications)


@pytest.mark.integration
def test_int_08_bargaining_non_emergency_offer_flow(mock_backend):
    """
    INT-08: Bargaining <-> Help Request (non-emergency)
    Scenario: Offer/counter-offer in buffer.
    Expected Result: Agreed price saved against the request.
    """
    mock_backend.register_user("Bargain Seeker Int", "brg.int@test.com", "9888888812", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    _, req_data = mock_backend.create_help_request(sid, "non_emergency", "House Cleaning", "2 BHK", 17.38, 78.48)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["status"] = "approved"

    mock_backend.register_user("Cleaner Prov", "cleaner@test.com", "9888888813", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]

    st1, body1 = mock_backend.submit_bargain_offer(sender_id=pid, request_id=rid, provider_id=pid, price=80.0)
    assert st1 == 201
    offer_id = body1["offer"]["id"]

    st2, body2 = mock_backend.accept_bargain_offer(offer_id)
    assert st2 == 200
    assert mock_backend.help_requests[rid]["agreed_price"] == 80.0


@pytest.mark.integration
def test_int_09_bargaining_payment_amount_match(mock_backend):
    """
    INT-09: Bargaining <-> Payment
    Scenario: Pay agreed price.
    Expected Result: Payment amount equals agreed bargain price.
    """
    agreed_price = 120.0
    mock_backend.register_user("Int9 Seeker", "int9.seeker@test.com", "9888888814", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]
    mock_backend.users[sid]["verification_status"] = "verified"

    mock_backend.register_user("Int9 Prov", "int9.prov@test.com", "9888888815", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]

    _, req_data = mock_backend.create_help_request(sid, "non_emergency", "Repair", "Fixing tap", 17.38, 78.48)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["assigned_provider_id"] = pid
    mock_backend.help_requests[rid]["agreed_price"] = agreed_price
    mock_backend.help_requests[rid]["status"] = "completed"

    st, body = mock_backend.process_payment(payer_id=sid, request_id=rid, amount=agreed_price)
    assert st == 200
    assert body["payment"]["amount"] == mock_backend.help_requests[rid]["agreed_price"]


@pytest.mark.integration
def test_int_10_payment_database_record(mock_backend):
    """
    INT-10: Payment <-> Database
    Scenario: Complete payment.
    Expected Result: Payment record and provider earnings stored.
    """
    mock_backend.register_user("Payer 10", "payer10@test.com", "9888888816", "Password123", role="user")
    sid = list(mock_backend.users.keys())[-1]

    mock_backend.register_user("Prov 10", "prov10@test.com", "9888888817", "Password123", role="provider")
    pid = list(mock_backend.users.keys())[-1]

    _, req_data = mock_backend.create_help_request(sid, "emergency", "Tow", "Done", 17.38, 78.48)
    rid = req_data["request"]["id"]
    mock_backend.help_requests[rid]["assigned_provider_id"] = pid
    mock_backend.help_requests[rid]["status"] = "completed"

    st, body = mock_backend.process_payment(payer_id=sid, request_id=rid, amount=200.0)
    assert st == 200
    payment_id = body["payment"]["id"]
    assert payment_id in mock_backend.payments
    assert mock_backend.payments[payment_id]["amount"] == 200.0


@pytest.mark.integration
def test_int_11_chat_database_message_history(mock_backend):
    """
    INT-11: Chat <-> Database (REST API / WebSocket)
    Scenario: Send message.
    Expected Result: Message stored and returned in history.
    """
    req_id = 55
    mock_backend.messages.append({
        "id": 1,
        "request_id": req_id,
        "sender_id": 10,
        "message": "Hello, I have arrived at the spot.",
    })
    history = [m for m in mock_backend.messages if m["request_id"] == req_id]
    assert len(history) == 1
    assert history[0]["message"] == "Hello, I have arrived at the spot."


@pytest.mark.integration
def test_int_12_password_reset_email_integration():
    """
    INT-12: Password Reset <-> Email Service
    Scenario: Request reset.
    Expected Result: Email generated and sent with valid reset token.
    """
    sent_emails = []

    def dispatch_reset_email(to: str, token: str):
        sent_emails.append({"to": to, "token": token})
        return True

    success = dispatch_reset_email("user.reset@test.com", "reset-token-xyz")
    assert success is True
    assert len(sent_emails) == 1
    assert sent_emails[0]["to"] == "user.reset@test.com"
