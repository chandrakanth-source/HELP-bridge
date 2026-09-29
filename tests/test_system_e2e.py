"""
System & End-to-End Testing Suite (SYS-01 to SYS-07)
From Section 9 of HelpBridge Software Test Report (CSE312)
"""

import os
import uuid
import pytest
import requests


# -----------------------------------------------------------------------------
# Configuration
# -----------------------------------------------------------------------------
TIMEOUT = 30


def _url(base_url: str, env_name: str, **kwargs) -> str:
    """Build a real API URL from an environment-configured endpoint."""
    path = os.getenv(env_name)
    if not path:
        pytest.skip(
            f"Real endpoint not configured: {env_name}. "
            "Set it in .env to the route used by your HelpBridge backend."
        )
    return f"{base_url.rstrip('/')}/{path.lstrip('/')}".format(**kwargs)


def _json(response: requests.Response):
    """Return JSON and give a useful error when the backend returns non-JSON."""
    try:
        return response.json()
    except ValueError:
        pytest.fail(
            f"Expected JSON from real backend, got HTTP {response.status_code}: "
            f"{response.text[:500]}"
        )


def _assert_success(response: requests.Response, *expected_codes: int):
    """Assert a real HTTP status and return its JSON body."""
    assert response.status_code in expected_codes, (
        f"Unexpected HTTP {response.status_code}; expected {expected_codes}. "
        f"Response: {response.text[:1000]}"
    )
    return _json(response)


def _register(base_url, name, role, phone):
    """Register a fresh real user through the deployed API."""
    uid = uuid.uuid4().hex[:10]
    email = f"pytest_sys_{uid}@test.com"
    password = f"SysPass{uid}123!"

    response = requests.post(
        f"{base_url}/auth/register",
        json={
            "name": name,
            "email": email,
            "phone": phone,
            "password": password,
            "role": role,
            "occupation": "Automated Tester",
            "blood_group": "O+",
            "latitude": 17.3850,
            "longitude": 78.4860,
            "address": "Hyderabad, TS",
        },
        timeout=TIMEOUT,
    )

    if response.status_code == 429:
        pytest.skip("Live Render rate limit reached (HTTP 429).")

    body = _assert_success(response, 201)
    user = body.get("user", {})
    user_id = user.get("id")
    assert user_id is not None, f"Registration response has no user id: {body}"

    return {
        "id": user_id,
        "name": name,
        "email": email,
        "password": password,
        "phone": phone,
        "role": role,
    }


def _login(base_url, user):
    """Login against the real deployed API and return token + response body."""
    response = requests.post(
        f"{base_url}/auth/login",
        json={"email": user["email"], "password": user["password"]},
        timeout=TIMEOUT,
    )
    return response


def _auth_headers(token):
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }


def _token_from_login(base_url, user):
    response = _login(base_url, user)
    body = _assert_success(response, 200)
    token = body.get("token")
    assert token, f"Real login response did not contain token: {body}"
    return token, body


# -----------------------------------------------------------------------------
# SYS-01
# -----------------------------------------------------------------------------
@pytest.mark.system
@pytest.mark.real_api
def test_sys_01_user_lifecycle_registration_to_dashboard(real_api_base_url):
    """
    SYS-01: Real registration -> real manager verification -> real login.
    """
    user = _register(real_api_base_url, "Sam Seeker SYS", "user", "9777777001")

    # Pending user must not be able to log in before verification.
    pre_login = _login(real_api_base_url, user)
    assert pre_login.status_code == 403, (
        f"Expected pending user login to be blocked, got {pre_login.status_code}: "
        f"{pre_login.text[:500]}"
    )

    # A verified manager performs the real verification operation.
    manager = _register(real_api_base_url, "Manager Mary SYS", "manager", "9777777002")
    manager_token, _ = _token_from_login(real_api_base_url, manager)

    verify_url = _url(
        real_api_base_url,
        "HB_SYS_VERIFY_USER_URL",
        user_id=user["id"],
    )
    verify_response = requests.post(
        verify_url,
        json={"decision": "approve"},
        headers=_auth_headers(manager_token),
        timeout=TIMEOUT,
    )
    _assert_success(verify_response, 200)

    # The same user now logs in through the real API.
    final_login = _login(real_api_base_url, user)
    final_body = _assert_success(final_login, 200)
    assert final_body.get("user", {}).get("id") == user["id"]
    assert final_body.get("token")


# -----------------------------------------------------------------------------
# SYS-02
# -----------------------------------------------------------------------------
@pytest.mark.system
@pytest.mark.real_api
def test_sys_02_manager_approval_and_verification_powers(real_api_base_url):
    """
    SYS-02: Real manager registration -> real admin approval -> manager login
    -> real user verification.
    """
    manager = _register(real_api_base_url, "Manager Candidate SYS", "manager", "9777777003")

    admin_token = os.getenv("HELPBRIDGE_ADMIN_TOKEN")
    if not admin_token:
        pytest.skip("Set HELPBRIDGE_ADMIN_TOKEN to an authenticated real admin JWT for SYS-02.")

    approve_url = _url(
        real_api_base_url,
        "HB_SYS_APPROVE_MANAGER_URL",
        manager_id=manager["id"],
    )
    approve_response = requests.post(
        approve_url,
        json={"decision": "approve"},
        headers=_auth_headers(admin_token),
        timeout=TIMEOUT,
    )
    _assert_success(approve_response, 200)

    manager_token, manager_login = _token_from_login(real_api_base_url, manager)
    assert manager_login.get("user", {}).get("role") == "manager"

    target = _register(real_api_base_url, "Target Seeker SYS", "user", "9777777004")
    verify_url = _url(real_api_base_url, "HB_SYS_VERIFY_USER_URL", user_id=target["id"])
    verify_response = requests.post(
        verify_url,
        json={"decision": "approve"},
        headers=_auth_headers(manager_token),
        timeout=TIMEOUT,
    )
    _assert_success(verify_response, 200)

    target_login = _login(real_api_base_url, target)
    target_body = _assert_success(target_login, 200)
    assert target_body.get("user", {}).get("id") == target["id"]


# -----------------------------------------------------------------------------
# SYS-03
# -----------------------------------------------------------------------------
@pytest.mark.system
@pytest.mark.real_api
def test_sys_03_emergency_complete_e2e_flow(real_api_base_url):
    """
    SYS-03: Real emergency workflow through HTTP APIs.

    The test does not modify a fake database. Every state transition is sent
    to the deployed backend and verified from its HTTP response.
    """
    seeker = _register(real_api_base_url, "SOS Seeker SYS", "user", "9777777005")
    manager = _register(real_api_base_url, "Manager SOS SYS", "manager", "9777777006")
    far_provider = _register(real_api_base_url, "Medic Far SYS", "provider", "9777777007")
    near_provider = _register(real_api_base_url, "Medic Nearest SYS", "provider", "9777777008")

    # These roles normally require approval in HelpBridge. Use real admin token
    # only when the deployed application requires it.
    admin_token = os.getenv("HELPBRIDGE_ADMIN_TOKEN")
    if admin_token:
        for account in (manager, far_provider, near_provider, seeker):
            verify_url = _url(real_api_base_url, "HB_SYS_VERIFY_USER_URL", user_id=account["id"])
            requests.post(
                verify_url,
                json={"decision": "approve"},
                headers=_auth_headers(admin_token),
                timeout=TIMEOUT,
            )

    seeker_token, _ = _token_from_login(real_api_base_url, seeker)
    manager_token, _ = _token_from_login(real_api_base_url, manager)
    far_token, _ = _token_from_login(real_api_base_url, far_provider)
    near_token, _ = _token_from_login(real_api_base_url, near_provider)

    create_url = _url(real_api_base_url, "HB_SYS_CREATE_REQUEST_URL")
    create_response = requests.post(
        create_url,
        json={
            "request_type": "emergency",
            "title": "Cardiac Emergency",
            "description": "Patient collapsed, CPR in progress",
            "latitude": 17.3850,
            "longitude": 78.4860,
            "providers_needed": 1,
        },
        headers=_auth_headers(seeker_token),
        timeout=TIMEOUT,
    )
    create_body = _assert_success(create_response, 201)
    request = create_body.get("request", {})
    request_id = request.get("id")
    assert request_id is not None, f"No request id returned: {create_body}"

    approve_request_url = _url(
        real_api_base_url,
        "HB_SYS_APPROVE_REQUEST_URL",
        request_id=request_id,
    )
    approve_request_response = requests.post(
        approve_request_url,
        headers=_auth_headers(manager_token),
        timeout=TIMEOUT,
    )
    _assert_success(approve_request_response, 200)

    # Provider locations are supplied to the real backend as part of the
    # interest requests if your deployed route accepts them.
    interest_url = _url(real_api_base_url, "HB_SYS_INTEREST_URL", request_id=request_id)
    far_response = requests.post(
        interest_url,
        json={"latitude": 17.4800, "longitude": 78.5000},
        headers=_auth_headers(far_token),
        timeout=TIMEOUT,
    )
    _assert_success(far_response, 202, 200)

    near_response = requests.post(
        interest_url,
        json={"latitude": 17.3860, "longitude": 78.4870},
        headers=_auth_headers(near_token),
        timeout=TIMEOUT,
    )
    _assert_success(near_response, 202, 200)

    # Assignment must be obtained from the REAL backend, not calculated locally.
    assignment_url = _url(real_api_base_url, "HB_SYS_ASSIGNMENT_URL", request_id=request_id)
    assignment_response = requests.post(
        assignment_url,
        headers={**_auth_headers(manager_token), "Accept": "application/json"},
        timeout=TIMEOUT,
    )
    assignment_body = _assert_success(assignment_response, 200)
    assigned = assignment_body.get("request", assignment_body).get("assigned_provider_id")
    assert str(assigned) == str(near_provider["id"]), (
        f"Real backend did not assign nearest provider. Expected {near_provider['id']}, got {assigned}."
    )

    # Complete the real request.
    complete_url = _url(real_api_base_url, "HB_SYS_COMPLETE_REQUEST_URL", request_id=request_id)
    complete_response = requests.post(
        complete_url,
        headers=_auth_headers(near_token),
        timeout=TIMEOUT,
    )
    _assert_success(complete_response, 200)

    payment_url = _url(real_api_base_url, "HB_SYS_PAYMENT_URL")
    payment_response = requests.post(
        payment_url,
        json={"request_id": request_id, "amount": 300.0},
        headers=_auth_headers(seeker_token),
        timeout=TIMEOUT,
    )
    payment_body = _assert_success(payment_response, 200, 201)
    payment = payment_body.get("payment", payment_body)
    assert payment.get("payment_status") in ("successful", "success", "paid")


# -----------------------------------------------------------------------------
# SYS-04
# -----------------------------------------------------------------------------
@pytest.mark.system
@pytest.mark.real_api
def test_sys_04_non_emergency_bargaining_and_assignment_flow(real_api_base_url):
    """SYS-04: Real non-emergency request -> interest -> bargain -> accept -> payment."""
    seeker = _register(real_api_base_url, "NE Seeker SYS", "user", "9777777009")
    provider = _register(real_api_base_url, "Electrician SYS", "provider", "9777777010")

    seeker_token, _ = _token_from_login(real_api_base_url, seeker)
    provider_token, _ = _token_from_login(real_api_base_url, provider)

    create_url = _url(real_api_base_url, "HB_SYS_CREATE_REQUEST_URL")
    request_response = requests.post(
        create_url,
        json={
            "request_type": "non_emergency",
            "title": "Home Electrical Fault",
            "description": "Main breaker tripping",
            "latitude": 17.385,
            "longitude": 78.486,
            "providers_needed": 1,
        },
        headers=_auth_headers(seeker_token),
        timeout=TIMEOUT,
    )
    request_body = _assert_success(request_response, 201)
    request_id = request_body["request"]["id"]

    # If manager approval is required by the real application, configure a
    # manager token and endpoint exactly as used by the deployed backend.
    manager_token = os.getenv("HELPBRIDGE_MANAGER_TOKEN")
    if manager_token:
        approve_url = _url(real_api_base_url, "HB_SYS_APPROVE_REQUEST_URL", request_id=request_id)
        _assert_success(
            requests.post(
                approve_url,
                headers=_auth_headers(manager_token),
                timeout=TIMEOUT,
            ),
            200,
        )

    interest_url = _url(real_api_base_url, "HB_SYS_INTEREST_URL", request_id=request_id)
    _assert_success(
        requests.post(
            interest_url,
            json={"latitude": 17.385, "longitude": 78.486},
            headers=_auth_headers(provider_token),
            timeout=TIMEOUT,
        ),
        202,
        200,
    )

    bargain_url = _url(real_api_base_url, "HB_SYS_BARGAIN_URL", request_id=request_id)
    offer_response = requests.post(
        bargain_url,
        json={"provider_id": provider["id"], "price": 75.0},
        headers=_auth_headers(provider_token),
        timeout=TIMEOUT,
    )
    offer_body = _assert_success(offer_response, 201)
    offer_id = offer_body.get("offer", {}).get("id")
    assert offer_id is not None

    accept_url = _url(real_api_base_url, "HB_SYS_ACCEPT_BARGAIN_URL", offer_id=offer_id)
    accept_response = requests.post(
        accept_url,
        headers=_auth_headers(seeker_token),
        timeout=TIMEOUT,
    )
    accept_body = _assert_success(accept_response, 200)
    assert accept_body.get("request", {}).get("agreed_price") == 75.0

    complete_url = _url(real_api_base_url, "HB_SYS_COMPLETE_REQUEST_URL", request_id=request_id)
    _assert_success(
        requests.post(
            complete_url,
            headers=_auth_headers(provider_token),
            timeout=TIMEOUT,
        ),
        200,
    )

    payment_url = _url(real_api_base_url, "HB_SYS_PAYMENT_URL")
    payment_response = requests.post(
        payment_url,
        json={"request_id": request_id, "amount": 75.0},
        headers=_auth_headers(seeker_token),
        timeout=TIMEOUT,
    )
    payment_body = _assert_success(payment_response, 200, 201)
    assert payment_body.get("payment", payment_body).get("amount") == 75.0


# -----------------------------------------------------------------------------
# SYS-05
# -----------------------------------------------------------------------------
@pytest.mark.system
@pytest.mark.real_api
def test_sys_05_forgot_password_reset_and_login_flow(real_api_base_url):
    """SYS-05: Real forgot-password -> reset -> login workflow."""
    user = _register(real_api_base_url, "PWD Reset SYS", "user", "9777777011")

    forgot_url = _url(real_api_base_url, "HB_SYS_FORGOT_PASSWORD_URL")
    forgot_response = requests.post(
        forgot_url,
        json={"email": user["email"]},
        timeout=TIMEOUT,
    )
    _assert_success(forgot_response, 200, 202)

    # The reset token must come from the real reset-email/test environment.
    reset_token = os.getenv("HELPBRIDGE_TEST_RESET_TOKEN")
    if not reset_token:
        pytest.skip(
            "Real forgot-password request succeeded, but HELPBRIDGE_TEST_RESET_TOKEN "
            "is not configured. Supply a real reset token from the test email flow."
        )

    new_password = f"NewUpdated{uuid.uuid4().hex[:8]}!123"
    reset_url = _url(real_api_base_url, "HB_SYS_RESET_PASSWORD_URL")
    reset_response = requests.post(
        reset_url,
        json={"token": reset_token, "password": new_password},
        timeout=TIMEOUT,
    )
    _assert_success(reset_response, 200)

    old_login = requests.post(
        f"{real_api_base_url}/auth/login",
        json={"email": user["email"], "password": user["password"]},
        timeout=TIMEOUT,
    )
    assert old_login.status_code == 401

    new_login = requests.post(
        f"{real_api_base_url}/auth/login",
        json={"email": user["email"], "password": new_password},
        timeout=TIMEOUT,
    )
    _assert_success(new_login, 200)


# -----------------------------------------------------------------------------
# SYS-06
# -----------------------------------------------------------------------------
@pytest.mark.system
@pytest.mark.real_api
def test_sys_06_provider_flow_available_requests_to_earnings(real_api_base_url):
    """SYS-06: Real provider -> request -> assignment -> completion -> earnings/payment."""
    provider = _register(real_api_base_url, "Pro Provider SYS", "provider", "9777777012")
    seeker = _register(real_api_base_url, "Seeker Pro SYS", "user", "9777777013")

    provider_token, _ = _token_from_login(real_api_base_url, provider)
    seeker_token, _ = _token_from_login(real_api_base_url, seeker)

    available_url = _url(real_api_base_url, "HB_SYS_PROVIDER_REQUESTS_URL")
    available_response = requests.get(
        available_url,
        headers=_auth_headers(provider_token),
        timeout=TIMEOUT,
    )
    available_body = _assert_success(available_response, 200)
    assert isinstance(available_body, (dict, list))

    create_url = _url(real_api_base_url, "HB_SYS_CREATE_REQUEST_URL")
    create_response = requests.post(
        create_url,
        json={
            "request_type": "emergency",
            "title": "Water Leak",
            "description": "Floor 2",
            "latitude": 17.385,
            "longitude": 78.486,
            "providers_needed": 1,
        },
        headers=_auth_headers(seeker_token),
        timeout=TIMEOUT,
    )
    create_body = _assert_success(create_response, 201)
    request_id = create_body["request"]["id"]

    manager_token = os.getenv("HELPBRIDGE_MANAGER_TOKEN")
    if manager_token:
        approve_url = _url(real_api_base_url, "HB_SYS_APPROVE_REQUEST_URL", request_id=request_id)
        _assert_success(
            requests.post(approve_url, headers=_auth_headers(manager_token), timeout=TIMEOUT),
            200,
        )

    interest_url = _url(real_api_base_url, "HB_SYS_INTEREST_URL", request_id=request_id)
    _assert_success(
        requests.post(
            interest_url,
            json={"latitude": 17.385, "longitude": 78.486},
            headers=_auth_headers(provider_token),
            timeout=TIMEOUT,
        ),
        202,
        200,
    )

    manager_token = manager_token or os.getenv("HELPBRIDGE_ADMIN_TOKEN")
    if not manager_token:
        pytest.skip("Set HELPBRIDGE_MANAGER_TOKEN (or admin token) for real assignment in SYS-06.")

    assignment_url = _url(real_api_base_url, "HB_SYS_ASSIGNMENT_URL", request_id=request_id)
    assignment_body = _assert_success(
        requests.post(
            assignment_url,
            headers=_auth_headers(manager_token),
            timeout=TIMEOUT,
        ),
        200,
    )
    assert str(assignment_body.get("request", assignment_body).get("assigned_provider_id")) == str(provider["id"])

    complete_url = _url(real_api_base_url, "HB_SYS_COMPLETE_REQUEST_URL", request_id=request_id)
    _assert_success(
        requests.post(complete_url, headers=_auth_headers(provider_token), timeout=TIMEOUT),
        200,
    )

    payment_url = _url(real_api_base_url, "HB_SYS_PAYMENT_URL")
    payment_body = _assert_success(
        requests.post(
            payment_url,
            json={"request_id": request_id, "amount": 120.0},
            headers=_auth_headers(seeker_token),
            timeout=TIMEOUT,
        ),
        200,
        201,
    )
    assert payment_body.get("payment", payment_body).get("amount") == 120.0


# -----------------------------------------------------------------------------
# SYS-07
# -----------------------------------------------------------------------------
@pytest.mark.system
@pytest.mark.real_api
def test_sys_07_manager_dashboard_statistics(real_api_base_url):
    """SYS-07: Read manager statistics from the real deployed backend."""
    manager_token = os.getenv("HELPBRIDGE_MANAGER_TOKEN")
    if not manager_token:
        pytest.skip("Set HELPBRIDGE_MANAGER_TOKEN to an authenticated real manager JWT for SYS-07.")

    stats_url = _url(real_api_base_url, "HB_SYS_DASHBOARD_STATS_URL")
    response = requests.get(
        stats_url,
        headers=_auth_headers(manager_token),
        timeout=TIMEOUT,
    )
    body = _assert_success(response, 200)

    # Do not calculate statistics from a fake local dictionary. Verify that
    # the real dashboard endpoint returns structured statistics.
    assert isinstance(body, dict)
    assert body, "Real manager dashboard returned an empty response."
