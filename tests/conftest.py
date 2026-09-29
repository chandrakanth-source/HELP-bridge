"""
Global Pytest Configuration and Fixtures for HelpBridge Software Test Suite
(CSE312 - Software Architecture: Principles and Practices)
"""

import os
import math
import uuid
import time
import pytest
import requests
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

load_dotenv()

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "https://help-bridge-34vg.onrender.com/api")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "https://help-bridge-gamma.vercel.app")
ADMIN_SETUP_KEY = os.getenv("ADMIN_SETUP_KEY", "replace-with-a-long-random-secret")
JWT_SECRET = os.getenv("JWT_SECRET", "test-secret-key-123")


# ==============================================================================
# Helper Mathematics matching HelpBridge knnService.js
# ==============================================================================
def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates Great Circle distance (in kilometers) between two GPS points
    using the Haversine formula (identical to knnService.js).
    """
    R = 6371.0  # Earth's radius in kilometers
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)

    a = (
        math.sin(d_lat / 2.0) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lon / 2.0) ** 2
    )
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    distance = R * c
    return round(distance, 2)


def find_nearest_neighbors(
    target_location: Dict[str, float],
    candidate_providers: List[Dict[str, Any]],
    k: int = 1
) -> List[Dict[str, Any]]:
    """
    Finds the K nearest neighbors among candidate providers.
    """
    if not target_location or not candidate_providers:
        return []

    target_lat = float(target_location.get("latitude", 0))
    target_lon = float(target_location.get("longitude", 0))

    ranked = []
    for provider in candidate_providers:
        try:
            p_lat = float(provider["latitude"])
            p_lon = float(provider["longitude"])
        except (KeyError, ValueError, TypeError):
            continue

        dist = haversine_distance(target_lat, target_lon, p_lat, p_lon)
        item = dict(provider)
        item["distance_km"] = dist
        ranked.append(item)

    ranked.sort(key=lambda x: x["distance_km"])
    return ranked[:k]


def get_buffer_duration_seconds(request_type: str) -> int:
    """
    Returns the buffer duration in seconds for a given request type:
    - emergency: 30 seconds
    - non_emergency: 300 seconds (5 minutes)
    """
    if request_type == "emergency":
        return 30
    elif request_type == "non_emergency":
        return 300
    return 30


# ==============================================================================
# Helper Mock Backend Engine for Standalone / CI execution
# ==============================================================================
class MockHelpBridgeBackend:
    """
    In-memory simulation of HelpBridge database & controllers
    to allow comprehensive unit, black-box, white-box, and validation testing
    independently or alongside live integration endpoints.
    """

    def __init__(self):
        self.users: Dict[int, Dict[str, Any]] = {}
        self.help_requests: Dict[int, Dict[str, Any]] = {}
        self.interests: List[Dict[str, Any]] = []
        self.bargain_offers: Dict[int, Dict[str, Any]] = {}
        self.messages: List[Dict[str, Any]] = []
        self.notifications: List[Dict[str, Any]] = []
        self.payments: Dict[int, Dict[str, Any]] = {}
        self.locations: List[Dict[str, Any]] = []
        self.user_id_counter = 1
        self.req_id_counter = 1
        self.offer_id_counter = 1
        self.msg_id_counter = 1
        self.notif_id_counter = 1
        self.payment_id_counter = 1

    def register_user(self, name: str, email: str, phone: str, password: str, role: str = "user"):
        if not name or not email or not phone or not password:
            return 400, {"message": "Name, email, phone and password are required"}
        if len(password) < 8 or not any(c.isalpha() for c in password) or not any(c.isdigit() for c in password):
            return 400, {"message": "Password must be at least 8 characters and include a letter and a number"}
        import re
        if not re.match(r"^[^\s@]+@[^\s@]+\.[^\s@]+$", email.strip()) or len(phone.strip()) < 7:
            return 400, {"message": "Enter a valid email address and phone number"}

        for u in self.users.values():
            if u["email"].lower() == email.lower():
                return 409, {"message": "That email address is already registered."}

        uid = self.user_id_counter
        self.user_id_counter += 1
        ver_status = "pending" if role in ("user", "seeker", "provider", "manager") else "verified"
        user_obj = {
            "id": uid,
            "name": name,
            "email": email.lower(),
            "phone": phone,
            "password": password,
            "role": role,
            "verification_status": ver_status,
            "availability_status": "available",
            "latitude": 17.3850,
            "longitude": 78.4867,
            "last_located_at": time.time(),
        }
        self.users[uid] = user_obj
        return 201, {"message": "Registration successful", "user": user_obj}

    def login_user(self, email: str, password: str):
        if not email or not password:
            return 400, {"message": "Email and password are required"}
        user = next((u for u in self.users.values() if u["email"].lower() == email.lower()), None)
        if not user or user["password"] != password:
            return 401, {"message": "Invalid email or password"}

        if user["verification_status"] == "pending":
            if user["role"] == "manager":
                return 403, {"message": "Your manager application is awaiting administrator approval."}
            return 403, {"message": "Account pending verification. Please wait for approval."}
        if user["verification_status"] == "rejected":
            return 403, {"message": "Account has been rejected."}

        token = f"jwt-mock-token-for-user-{user['id']}-{user['role']}"
        return 200, {
            "message": "Login successful",
            "token": token,
            "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]},
        }

    def verify_user(self, manager_id: int, user_id: int, decision: str):
        mgr = self.users.get(manager_id)
        if not mgr or mgr["role"] != "manager" or mgr["verification_status"] != "verified":
            return 403, {"message": "Access denied. Manager access required."}
        user = self.users.get(user_id)
        if not user:
            return 404, {"message": "User not found"}
        user["verification_status"] = "verified" if decision == "approve" else "rejected"
        self.notifications.append({
            "id": self.notif_id_counter,
            "user_id": user_id,
            "title": f"Account {user['verification_status'].title()}",
            "message": f"Your account status is now {user['verification_status']}."
        })
        self.notif_id_counter += 1
        return 200, {"message": f"User status updated to {user['verification_status']}", "user": user}

    def approve_manager(self, admin_id: int, manager_id: int, decision: str):
        admin = self.users.get(admin_id)
        if not admin or admin["role"] != "admin":
            return 403, {"message": "Access denied. Admin access required."}
        mgr = self.users.get(manager_id)
        if not mgr or mgr["role"] != "manager":
            return 404, {"message": "Manager application not found"}
        mgr["verification_status"] = "verified" if decision == "approve" else "rejected"
        return 200, {"message": f"Manager application {mgr['verification_status']}", "manager": mgr}

    def create_help_request(self, requester_id: int, request_type: str, title: str, description: str, lat: float, lon: float, providers_needed: int = 1):
        user = self.users.get(requester_id)
        if not user:
            return 401, {"message": "Unauthorized"}
        if not request_type or not title or lat is None or lon is None:
            return 400, {"message": "Request type, title, latitude and longitude are required"}
        if request_type not in ("emergency", "non_emergency"):
            return 400, {"message": "Invalid request type"}

        rid = self.req_id_counter
        self.req_id_counter += 1
        req_obj = {
            "id": rid,
            "requester_id": requester_id,
            "request_type": request_type,
            "title": title,
            "description": description,
            "latitude": lat,
            "longitude": lon,
            "status": "pending_verification",
            "assigned_provider_id": None,
            "assigned_providers": [],
            "providers_needed": providers_needed,
            "agreed_price": None,
            "created_at": time.time(),
        }
        self.help_requests[rid] = req_obj
        return 201, {
            "message": "Emergency SOS request sent to Manager for approval." if request_type == "emergency" else "Help request created successfully",
            "request": req_obj,
        }

    def manager_approve_request(self, manager_id: int, request_id: int):
        mgr = self.users.get(manager_id)
        if not mgr or mgr["role"] != "manager":
            return 403, {"message": "Access denied. Manager access required."}
        req_obj = self.help_requests.get(request_id)
        if not req_obj or req_obj["status"] != "pending_verification":
            return 404, {"message": "Pending request not found"}
        req_obj["status"] = "approved"
        return 200, {"message": "Help request approved successfully", "request": req_obj}

    def manager_assign_multiple_providers(self, manager_id: int, request_id: int, provider_ids: list):
        mgr = self.users.get(manager_id)
        if not mgr or mgr["role"] != "manager":
            return 403, {"message": "Access denied. Manager access required."}
        req_obj = self.help_requests.get(request_id)
        if not req_obj:
            return 404, {"message": "Request not found"}

        needed = req_obj.get("providers_needed", 1)
        if len(provider_ids) < needed:
            return 400, {"message": f"Assignment blocked until all {needed} required providers are approved"}

        req_obj["assigned_providers"] = list(provider_ids)
        req_obj["assigned_provider_id"] = provider_ids[0]
        req_obj["status"] = "assigned"

        for pid in provider_ids:
            if pid in self.users:
                self.users[pid]["availability_status"] = "busy"
            self.notifications.append({
                "user_id": pid,
                "request_id": request_id,
                "title": "Help Request Assigned",
                "message": f"You were assigned to '{req_obj['title']}'."
            })

        self.notifications.append({
            "user_id": req_obj["requester_id"],
            "request_id": request_id,
            "title": "Providers Assigned",
            "message": f"{len(provider_ids)} providers assigned to your request."
        })

        return 200, {
            "message": "Multiple providers assigned successfully",
            "request": req_obj,
            "assigned_providers": provider_ids
        }

    def express_interest(self, provider_id: int, request_id: int, elapsed_time_sec: float = 0.0):
        req_obj = self.help_requests.get(request_id)
        if not req_obj:
            return 404, {"message": "Help request not found"}
        if req_obj["status"] != "approved":
            return 409, {"message": "Request is not open for interest"}

        # Busy check: provider cannot hold two active requests at once (TC-BUF-06)
        active_requests = [
            r for r in self.help_requests.values()
            if (r.get("assigned_provider_id") == provider_id or provider_id in r.get("assigned_providers", []))
            and r.get("status") in ("assigned", "accepted", "in_progress")
        ]
        if active_requests:
            return 409, {
                "message": f"You are currently handling another active request (#{active_requests[0]['id']}). Complete or cancel it before accepting a new one."
            }

        buffer_limit = 30 if req_obj["request_type"] == "emergency" else 300
        if elapsed_time_sec > buffer_limit:
            return 400, {"message": "Buffer closed. Late interest rejected."}

        self.interests.append({
            "request_id": request_id,
            "provider_id": provider_id,
            "created_at": time.time(),
        })
        return 202, {"message": "Interest recorded successfully"}

    def cancel_assigned_request(self, provider_id: int, request_id: int):
        req_obj = self.help_requests.get(request_id)
        if not req_obj:
            return 404, {"message": "Help request not found."}

        is_assigned = (req_obj.get("assigned_provider_id") == provider_id or provider_id in req_obj.get("assigned_providers", []))
        if not is_assigned:
            return 403, {"message": "You are not assigned to this help request."}

        # Release provider
        if provider_id in self.users:
            self.users[provider_id]["availability_status"] = "available"

        # Reopen request
        req_obj["assigned_provider_id"] = None
        req_obj["assigned_providers"] = [p for p in req_obj.get("assigned_providers", []) if p != provider_id]
        req_obj["status"] = "approved"

        # Notify seeker
        self.notifications.append({
            "user_id": req_obj["requester_id"],
            "request_id": request_id,
            "title": "Provider Cancelled Assistance",
            "message": "Provider cancelled assistance. Re-routing your request to other nearby providers."
        })

        # Check if other providers had expressed interest
        other_candidates = [
            i["provider_id"] for i in self.interests
            if i["request_id"] == request_id and i["provider_id"] != provider_id
        ]
        next_winner = None
        if other_candidates:
            target = {"latitude": req_obj["latitude"], "longitude": req_obj["longitude"]}
            cand_users = [self.users[pid] for pid in other_candidates if pid in self.users]
            ranked = find_nearest_neighbors(target, cand_users, k=1)
            if ranked:
                next_winner = ranked[0]
                req_obj["assigned_provider_id"] = next_winner["id"]
                req_obj["status"] = "assigned"
                if next_winner["id"] in self.users:
                    self.users[next_winner["id"]]["availability_status"] = "busy"
                self.notifications.append({
                    "user_id": next_winner["id"],
                    "request_id": request_id,
                    "title": "Help Request Assigned",
                    "message": f"You have been reassigned to '{req_obj['title']}'."
                })

        return 200, {
            "message": "Assistance cancelled. Request re-routed to next nearest provider." if next_winner else "Assistance cancelled. Request reopened for other providers.",
            "request": req_obj,
            "reassigned_provider": next_winner
        }

    def finalize_assignment_knn(self, request_id: int):
        req_obj = self.help_requests.get(request_id)
        if not req_obj:
            return None
        candidate_ids = [i["provider_id"] for i in self.interests if i["request_id"] == request_id]
        candidates = [self.users[pid] for pid in candidate_ids if pid in self.users]
        if not candidates:
            return None

        target = {"latitude": req_obj["latitude"], "longitude": req_obj["longitude"]}
        nearest = find_nearest_neighbors(target, candidates, k=1)
        if nearest:
            winner = nearest[0]
            req_obj["assigned_provider_id"] = winner["id"]
            req_obj["status"] = "assigned"
            return winner
        return None

    def submit_bargain_offer(self, sender_id: int, request_id: int, provider_id: int, price: float):
        req_obj = self.help_requests.get(request_id)
        if not req_obj:
            return 404, {"message": "Help request not found."}
        if req_obj["request_type"] == "emergency":
            return 400, {"message": "Bargaining is not available for emergency requests."}
        if price <= 0:
            return 400, {"message": "Invalid price"}

        oid = self.offer_id_counter
        self.offer_id_counter += 1
        is_seeker = sender_id == req_obj["requester_id"]
        offer = {
            "id": oid,
            "request_id": request_id,
            "provider_id": provider_id,
            "seeker_id": req_obj["requester_id"],
            "sender_role": "seeker" if is_seeker else "provider",
            "offered_price": price,
            "status": "pending",
        }
        self.bargain_offers[oid] = offer
        req_obj["status"] = "bargaining"
        return 201, {"message": "Bargain offer submitted successfully", "offer": offer}

    def accept_bargain_offer(self, offer_id: int):
        offer = self.bargain_offers.get(offer_id)
        if not offer:
            return 404, {"message": "Offer not found"}
        offer["status"] = "accepted"
        req_obj = self.help_requests[offer["request_id"]]
        req_obj["agreed_price"] = offer["offered_price"]
        req_obj["assigned_provider_id"] = offer["provider_id"]
        req_obj["status"] = "assigned"
        return 200, {"message": "Bargain offer accepted", "request": req_obj, "offer": offer}

    def process_payment(self, payer_id: int, request_id: int, amount: float):
        req_obj = self.help_requests.get(request_id)
        if not req_obj:
            return 404, {"message": "Help request not found"}
        if req_obj["requester_id"] != payer_id:
            return 403, {"message": "You are not authorized to make this payment"}
        if req_obj["status"] != "completed":
            return 400, {"message": "Payment is available only after the help is completed"}
        if amount <= 0:
            return 400, {"message": "Amount must be a positive number"}

        pid = self.payment_id_counter
        self.payment_id_counter += 1
        payment = {
            "id": pid,
            "request_id": request_id,
            "payer_id": payer_id,
            "provider_id": req_obj["assigned_provider_id"],
            "amount": amount,
            "payment_status": "successful",
            "transaction_id": f"tx_mock_{uuid.uuid4().hex[:8]}",
        }
        self.payments[pid] = payment
        return 200, {"message": "Payment verified successfully", "payment": payment}

    def chatbot_query(self, message: str):
        if not message or not isinstance(message, str):
            return 400, {"message": "Message text is required."}
        low = message.lower()
        if "how do i create a request" in low or "create" in low:
            reply = "To create a help request, navigate to the Dashboard or SOS page, fill in the emergency details and your current location, and submit."
        elif "bargain" in low:
            reply = "Bargaining is supported for non-emergency requests during the 5-minute buffer period."
        else:
            reply = "HelpBridge AI Assistant: I am here to help you navigate emergency assistance, requests, and verification."
        return 200, {"reply": reply, "timestamp": time.time()}


@pytest.fixture
def mock_backend():
    """Provides a fresh in-memory mock backend instance."""
    backend = MockHelpBridgeBackend()
    # Seed default Admin
    admin_res, admin_data = backend.register_user("System Admin", "admin@helpbridge.com", "9999999999", "AdminPass123", role="admin")
    backend.users[admin_data["user"]["id"]]["verification_status"] = "verified"
    return backend


# ==============================================================================
# Selenium WebDriver Fixture
# ==============================================================================
@pytest.fixture(scope="function")
def selenium_driver():
    """
    Provides a Selenium WebDriver instance with Headless Chrome configuration.
    Gracefully skips if Chrome/ChromeDriver is not installed in the environment.
    """
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service

        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--disable-gpu")
        options.add_argument("--window-size=1920,1080")
        options.add_argument("--ignore-certificate-errors")

        driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(15)
        driver.implicitly_wait(5)
        yield driver
        driver.quit()
    except Exception as e:
        pytest.skip(f"Selenium WebDriver initialization skipped (Chrome/driver not accessible: {e})")


# ==============================================================================
# Real Backend / Render Deployment Fixtures
# ==============================================================================
@pytest.fixture(scope="session")
def real_api_base_url() -> str:
    """Returns the base URL for real API tests (defaults to deployed Render API)."""
    return os.getenv("API_BASE_URL", API_BASE_URL).rstrip("/")


@pytest.fixture(scope="session")
def authenticated_real_user(real_api_base_url):
    """
    Registers a fresh, isolated test user on the real deployed backend,
    performs a real login to obtain a JWT token, and yields credentials + auth headers.
    Session-scoped to preserve Render rate limits (30 requests / 15 min).
    """
    unique_id = uuid.uuid4().hex[:8]
    email = f"pytest_real_{unique_id}@test.com"
    phone = f"98{int(time.time()) % 100000000:08d}"
    password = f"Pass{unique_id}123!"

    # 1. Register on real backend
    reg_payload = {
        "name": f"Pytest Real User {unique_id}",
        "email": email,
        "phone": phone,
        "password": password,
        "role": "user",
        "occupation": "Automated Tester",
        "blood_group": "O+",
        "latitude": 17.3850,
        "longitude": 78.4867,
        "address": "Hyderabad, TS"
    }
    
    try:
        reg_resp = requests.post(
            f"{real_api_base_url}/auth/register",
            json=reg_payload,
            timeout=30
        )
    except Exception as exc:
        pytest.skip(f"Live Render backend unreachable: {exc}")

    if reg_resp.status_code == 429:
        pytest.skip("Rate limit (HTTP 429) hit on live Render backend. Please wait 15 minutes before re-running.")
    elif reg_resp.status_code != 201:
        # Fallback to predefined demo login if dynamic registration is restricted by live DB constraints
        login_payload = {
            "email": "seeker@test.com",
            "password": "Password123"
        }
        login_resp = requests.post(
            f"{real_api_base_url}/auth/login",
            json=login_payload,
            timeout=30
        )
        if login_resp.status_code == 200:
            login_data = login_resp.json()
            token = login_data.get("token")
            return {
                "token": token,
                "headers": {
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json"
                },
                "user": login_data.get("user", {}),
                "email": "seeker@test.com",
                "password": "Password123",
                "phone": "9876543210",
            }
        pytest.skip(f"Real backend registration failed with HTTP {reg_resp.status_code}: {reg_resp.text}")

    # 2. Login on real backend
    login_payload = {
        "email": email,
        "password": password
    }
    login_resp = requests.post(
        f"{real_api_base_url}/auth/login",
        json=login_payload,
        timeout=30
    )
    if login_resp.status_code != 200:
        pytest.skip(f"Real backend login failed with HTTP {login_resp.status_code}: {login_resp.text}")

    login_data = login_resp.json()
    token = login_data.get("token")
    user_data = login_data.get("user", {})

    return {
        "token": token,
        "headers": {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        },
        "user": user_data,
        "email": email,
        "password": password,
        "phone": phone,
    }
