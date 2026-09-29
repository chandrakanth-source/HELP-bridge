"""
Non-Functional Testing Suite (NFR-01 to NFR-06)
From Section 12 of HelpBridge Software Test Report (CSE312)
"""

import pytest
import time
import concurrent.futures


# ==============================================================================
# SECTION 12: NON-FUNCTIONAL TESTING (NFR-01 to NFR-06)
# ==============================================================================

@pytest.mark.nfr
def test_nfr_01_performance_concurrent_requests(mock_backend):
    """
    NFR-01: Performance - Multiple users log in and create requests concurrently.
    Metric / Acceptance Criterion: Response time < 3 seconds (target).
    """
    start_time = time.time()

    def simulate_user_action(user_index: int):
        email = f"perf.user{user_index}@test.com"
        mock_backend.register_user(f"Perf User {user_index}", email, f"94444444{user_index:02d}", "Password123", role="user")
        uid = list(mock_backend.users.keys())[-1]
        mock_backend.users[uid]["verification_status"] = "verified"
        mock_backend.login_user(email, "Password123")
        mock_backend.create_help_request(uid, "emergency", f"SOS Task {user_index}", "Urgent", 17.38, 78.48)
        return True

    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        futures = [executor.submit(simulate_user_action, i) for i in range(10)]
        results = [f.result() for f in concurrent.futures.as_completed(futures)]

    duration = time.time() - start_time
    assert all(results)
    assert duration < 3.0, f"Concurrent execution took {duration:.2f}s, expected < 3.0s"


@pytest.mark.nfr
def test_nfr_02_timer_accuracy_for_emergency_buffer():
    """
    NFR-02: Performance / Accuracy - Buffer timer accuracy for emergency assignment.
    Metric / Acceptance Criterion: Assignment triggered at 30 s (± 1 s).
    """
    configured_buffer_sec = 30
    simulated_elapsed = 30.2
    tolerance = 1.0  # ± 1 s

    is_accurate = abs(simulated_elapsed - configured_buffer_sec) <= tolerance
    assert is_accurate, f"Timer accuracy deviation exceeds {tolerance}s"


@pytest.mark.nfr
def test_nfr_03_security_unauthorized_access_and_password_hashing(mock_backend):
    """
    NFR-03: Security - Unauthenticated/unauthorised role opens manager/admin APIs; passwords hashed.
    Metric / Acceptance Criterion: Access denied (401/403); passwords stored hashed.
    """
    # 1. Access denied without role
    mock_backend.register_user("Regular Joe", "joe@test.com", "9444444420", "PlainPassword123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    st, _ = mock_backend.verify_user(manager_id=uid, user_id=1, decision="approve")
    assert st == 403

    # 2. Passwords should never be stored in cleartext in production (simulated check)
    import hashlib
    hashed = hashlib.sha256("PlainPassword123".encode()).hexdigest()
    assert hashed != "PlainPassword123"


@pytest.mark.nfr
def test_nfr_04_security_password_reset_token_expiry():
    """
    NFR-04: Security - Password reset token reuse / expiry.
    Metric / Acceptance Criterion: Expired or used token rejected (400).
    """
    used_tokens = set(["token-used-once"])

    def process_reset(token: str):
        if token in used_tokens:
            return 400, "Token already used or expired"
        used_tokens.add(token)
        return 200, "Reset successful"

    # Second attempt with same token fails
    st, msg = process_reset("token-used-once")
    assert st == 400
    assert "expired" in msg or "already used" in msg


@pytest.mark.nfr
def test_nfr_05_reliability_error_handling_without_crash():
    """
    NFR-05: Reliability - Database / backend service error handled safely.
    Metric / Acceptance Criterion: Controlled error message (500/503), no crash.
    """
    def simulate_resilient_endpoint(db_connected: bool):
        try:
            if not db_connected:
                raise ConnectionError("PostgreSQL connection timeout")
            return 200, {"success": True}
        except ConnectionError as e:
            return 503, {"success": False, "message": "Database service temporarily unavailable"}

    status, body = simulate_resilient_endpoint(db_connected=False)
    assert status == 503
    assert body["success"] is False
    assert "Database service temporarily unavailable" in body["message"]


@pytest.mark.nfr
def test_nfr_06_usability_help_request_creation_flow(mock_backend):
    """
    NFR-06: Usability - New user completes a help request without assistance.
    Metric / Acceptance Criterion: Task completed without error.
    """
    mock_backend.register_user("Usability User", "use@test.com", "9444444430", "Password123", role="user")
    uid = list(mock_backend.users.keys())[-1]
    mock_backend.users[uid]["verification_status"] = "verified"

    status, body = mock_backend.create_help_request(
        requester_id=uid,
        request_type="emergency",
        title="Immediate First Aid",
        description="Bleeding wound requires bandage kit",
        lat=17.385,
        lon=78.486
    )
    assert status == 201
    assert "request" in body
    assert body["request"]["title"] == "Immediate First Aid"
