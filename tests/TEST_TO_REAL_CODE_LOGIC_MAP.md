# Test Cases to Real Code Logic Mapping

This document maps every **Test Case Identifier** in the test suite directly to the **Real Application Source Code Files, Controllers, Middlewares, and Services** that execute that business logic in production.

---

## 🗺️ Real Backend Architecture Overview

| Layer | Real Source Code Directory | Key Real Files |
|---|---|---|
| **Algorithms & Services** | [`backend/src/services/`](file:///d:/projects/helpbridge/backend/src/services/) | [`knnService.js`](file:///d:/projects/helpbridge/backend/src/services/knnService.js), [`emailService.js`](file:///d:/projects/helpbridge/backend/src/services/emailService.js), [`chatbotService.js`](file:///d:/projects/helpbridge/backend/src/services/chatbotService.js) |
| **Business Logic Controllers** | [`backend/src/controllers/`](file:///d:/projects/helpbridge/backend/src/controllers/) | [`authController.js`](file:///d:/projects/helpbridge/backend/src/controllers/authController.js), [`helpRequestController.js`](file:///d:/projects/helpbridge/backend/src/controllers/helpRequestController.js), [`providerController.js`](file:///d:/projects/helpbridge/backend/src/controllers/providerController.js), [`managerController.js`](file:///d:/projects/helpbridge/backend/src/controllers/managerController.js), [`bargainController.js`](file:///d:/projects/helpbridge/backend/src/controllers/bargainController.js), [`paymentController.js`](file:///d:/projects/helpbridge/backend/src/controllers/paymentController.js), [`locationController.js`](file:///d:/projects/helpbridge/backend/src/controllers/locationController.js), [`messageController.js`](file:///d:/projects/helpbridge/backend/src/controllers/messageController.js), [`notificationController.js`](file:///d:/projects/helpbridge/backend/src/controllers/notificationController.js) |
| **Security & Middlewares** | [`backend/src/middleware/`](file:///d:/projects/helpbridge/backend/src/middleware/) | [`authMiddleware.js`](file:///d:/projects/helpbridge/backend/src/middleware/authMiddleware.js), [`managerMiddleware.js`](file:///d:/projects/helpbridge/backend/src/middleware/managerMiddleware.js), [`adminMiddleware.js`](file:///d:/projects/helpbridge/backend/src/middleware/adminMiddleware.js), [`chatMiddleware.js`](file:///d:/projects/helpbridge/backend/src/middleware/chatMiddleware.js), [`providerMiddleware.js`](file:///d:/projects/helpbridge/backend/src/middleware/providerMiddleware.js) |
| **API Endpoints & Routing** | [`backend/src/routes/`](file:///d:/projects/helpbridge/backend/src/routes/) | [`authRoutes.js`](file:///d:/projects/helpbridge/backend/src/routes/authRoutes.js), [`helpRequestRoutes.js`](file:///d:/projects/helpbridge/backend/src/routes/helpRequestRoutes.js), [`providerRoutes.js`](file:///d:/projects/helpbridge/backend/src/routes/providerRoutes.js), [`managerRoutes.js`](file:///d:/projects/helpbridge/backend/src/routes/managerRoutes.js), [`chatRoutes.js`](file:///d:/projects/helpbridge/backend/src/routes/chatRoutes.js), [`paymentRoutes.js`](file:///d:/projects/helpbridge/backend/src/routes/paymentRoutes.js) |
| **Core Server & Socket.IO** | [`backend/src/`](file:///d:/projects/helpbridge/backend/src/) | [`server.js`](file:///d:/projects/helpbridge/backend/src/server.js) |

---

## 1. Unit & White-Box Tests $\rightarrow$ Real Code Logic

| Test ID | Test Name | Real Code File & Component | Real Function / Logic Executed |
|---|---|---|---|
| **UT-01** | `test_ut_01_knn_nearest_provider_selection` | [`backend/src/services/knnService.js`](file:///d:/projects/helpbridge/backend/src/services/knnService.js) | `findNearestNeighbors()`, `calculateHaversineDistance()` |
| **UT-02** | `test_ut_02_knn_empty_provider_list` | [`backend/src/services/knnService.js`](file:///d:/projects/helpbridge/backend/src/services/knnService.js) | `findNearestNeighbors()` (empty candidates branch) |
| **UT-03** | `test_ut_03_buffer_duration_emergency` | [`backend/src/controllers/helpRequestController.js`](file:///d:/projects/helpbridge/backend/src/controllers/helpRequestController.js) | Buffer timeout calculation (`30s` for emergency) |
| **UT-04** | `test_ut_04_buffer_duration_non_emergency` | [`backend/src/controllers/helpRequestController.js`](file:///d:/projects/helpbridge/backend/src/controllers/helpRequestController.js) | Buffer timeout calculation (`300s` for non-emergency) |
| **UT-05** | `test_ut_05_auth_controller_valid_login` | [`backend/src/controllers/authController.js`](file:///d:/projects/helpbridge/backend/src/controllers/authController.js) | `login()` (JWT token creation on verified account) |
| **UT-06** | `test_ut_06_auth_controller_wrong_password` | [`backend/src/controllers/authController.js`](file:///d:/projects/helpbridge/backend/src/controllers/authController.js) | `login()` (`bcrypt.compare` password mismatch $\rightarrow$ 401) |
| **UT-07** | `test_ut_07_auth_controller_pending_user_login` | [`backend/src/controllers/authController.js`](file:///d:/projects/helpbridge/backend/src/controllers/authController.js) | `login()` (`verification_status !== 'verified'` $\rightarrow$ 403) |
| **UT-08** | `test_ut_08_auth_middleware_missing_token` | [`backend/src/middleware/authMiddleware.js`](file:///d:/projects/helpbridge/backend/src/middleware/authMiddleware.js) | `authMiddleware()` (Missing `Bearer` header check $\rightarrow$ 401) |
| **UT-09** | `test_ut_09_manager_and_admin_middleware_forbidden_role` | [`backend/src/middleware/managerMiddleware.js`](file:///d:/projects/helpbridge/backend/src/middleware/managerMiddleware.js) | `managerMiddleware()` (Enforces role `'manager'` or `'admin'`) |
| **UT-10** | `test_ut_10_payment_controller_validate_payment` | [`backend/src/controllers/paymentController.js`](file:///d:/projects/helpbridge/backend/src/controllers/paymentController.js) | `processPayment()` (`amount <= 0` validation $\rightarrow$ 400) |
| **UT-11** | `test_ut_11_email_service_send_reset_mail` | [`backend/src/services/emailService.js`](file:///d:/projects/helpbridge/backend/src/services/emailService.js) | `sendPasswordResetEmail()` (NodeMailer dispatch) |
| **UT-12** | `test_ut_12_chat_middleware_unauthorized_user` | [`backend/src/middleware/chatMiddleware.js`](file:///d:/projects/helpbridge/backend/src/middleware/chatMiddleware.js) | `chatMiddleware()` (Validates requester or assigned provider ID) |
| **WB-01 to WB-03** | `test_wb_01..03` | [`backend/src/services/knnService.js`](file:///d:/projects/helpbridge/backend/src/services/knnService.js) | Branch condition paths in `findNearestNeighbors()` |
| **WB-04** | `test_wb_04` | [`backend/src/controllers/authController.js`](file:///d:/projects/helpbridge/backend/src/controllers/authController.js) | Complete conditional decision tree in `login()` |
| **WB-05** | `test_wb_05` | [`backend/src/middleware/authMiddleware.js`](file:///d:/projects/helpbridge/backend/src/middleware/authMiddleware.js) | Token format, expiration & signature branching |
| **WB-06** | `test_wb_06` | [`backend/src/controllers/helpRequestController.js`](file:///d:/projects/helpbridge/backend/src/controllers/helpRequestController.js) | Buffer expiration condition boundary evaluation |
| **WB-07** | `test_wb_07` | [`backend/src/controllers/paymentController.js`](file:///d:/projects/helpbridge/backend/src/controllers/paymentController.js) | Positive/negative amount input validation branching |
| **WB-08** | `test_wb_08` | [`backend/src/controllers/authController.js`](file:///d:/projects/helpbridge/backend/src/controllers/authController.js) | `requestPasswordReset()` & `resetPassword()` token branches |

---

## 2. Core Functional Test Cases $\rightarrow$ Real Code Logic

| Test ID | Domain / Feature | Real Code File | Real Controller Method / Endpoint |
|---|---|---|---|
| **TC-REG-01, 02** | User Registration | [`backend/src/controllers/authController.js`](file:///d:/projects/helpbridge/backend/src/controllers/authController.js) | `register()` $\rightarrow$ `POST /api/auth/register` |
| **TC-VER-01, 02** | Manager Approvals | [`backend/src/controllers/managerController.js`](file:///d:/projects/helpbridge/backend/src/controllers/managerController.js) | `verifyUser()` $\rightarrow$ `POST /api/manager/verify-user` |
| **TC-MGR-01..04** | Manager Management | [`backend/src/controllers/managerController.js`](file:///d:/projects/helpbridge/backend/src/controllers/managerController.js) | `getPendingUsers()`, `assignProvider()` |
| **TC-LOGIN-01..03** | User Login & Auth | [`backend/src/controllers/authController.js`](file:///d:/projects/helpbridge/backend/src/controllers/authController.js) | `login()` $\rightarrow$ `POST /api/auth/login` |
| **TC-REQ-01..03** | Help Request Creation | [`backend/src/controllers/helpRequestController.js`](file:///d:/projects/helpbridge/backend/src/controllers/helpRequestController.js) | `createHelpRequest()` $\rightarrow$ `POST /api/requests` |
| **TC-BUF-01..06** | Buffer & Dispatch Logic | [`backend/src/controllers/providerController.js`](file:///d:/projects/helpbridge/backend/src/controllers/providerController.js) & [`knnService.js`](file:///d:/projects/helpbridge/backend/src/services/knnService.js) | `expressInterest()`, `nearestProviderSelection()` |
| **TC-BRG-01, 02** | Price Bargaining | [`backend/src/controllers/bargainController.js`](file:///d:/projects/helpbridge/backend/src/controllers/bargainController.js) | `createOffer()`, `acceptOffer()` $\rightarrow$ `POST /api/bargain` |
| **TC-PAY-01, 02** | Payment Processing | [`backend/src/controllers/paymentController.js`](file:///d:/projects/helpbridge/backend/src/controllers/paymentController.js) | `processPayment()` $\rightarrow$ `POST /api/payment/process` |
| **TC-LOC-01, 02** | GPS Location Sharing | [`backend/src/controllers/locationController.js`](file:///d:/projects/helpbridge/backend/src/controllers/locationController.js) | `updateLocation()`, `getLocationHistory()` |
| **TC-CHAT-01, 02** | In-App Live Messaging | [`backend/src/controllers/messageController.js`](file:///d:/projects/helpbridge/backend/src/controllers/messageController.js) & [`chatMiddleware.js`](file:///d:/projects/helpbridge/backend/src/middleware/chatMiddleware.js) | `sendMessage()`, `getMessages()` |
| **TC-PWD-01..03** | Password Reset Flow | [`backend/src/controllers/authController.js`](file:///d:/projects/helpbridge/backend/src/controllers/authController.js) & [`emailService.js`](file:///d:/projects/helpbridge/backend/src/services/emailService.js) | `forgotPassword()`, `resetPassword()` |
| **TC-NOT-01, 02** | Real-Time Notifications | [`backend/src/controllers/notificationController.js`](file:///d:/projects/helpbridge/backend/src/controllers/notificationController.js) | `getUserNotifications()` |
| **TC-CBT-01, 02** | Emergency AI Chatbot | [`backend/src/services/chatbotService.js`](file:///d:/projects/helpbridge/backend/src/services/chatbotService.js) | `processMessage()`, `detectEmergencyIntent()` |

---

## 3. Black-Box Boundary & Equivalence Tests $\rightarrow$ Real Code Logic

| Test ID | Tested Real Rule | Real Code File |
|---|---|---|
| **BB-EML-01, 02** | Email format regex check `/\S+@\S+\.\S+/` | [`backend/src/controllers/authController.js`](file:///d:/projects/helpbridge/backend/src/controllers/authController.js) |
| **BB-REQ-01, 02** | 30s vs 300s buffer category routing | [`backend/src/controllers/helpRequestController.js`](file:///d:/projects/helpbridge/backend/src/controllers/helpRequestController.js) |
| **BB-BUF-01..05** | Buffer deadline check `created_at + buffer_seconds < now` | [`backend/src/controllers/providerController.js`](file:///d:/projects/helpbridge/backend/src/controllers/providerController.js) |
| **BB-PAY-01..03** | Amount validation check `if (amount <= 0)` | [`backend/src/controllers/paymentController.js`](file:///d:/projects/helpbridge/backend/src/controllers/paymentController.js) |
| **BB-ACC-01..04** | Role authorization verification | [`backend/src/middleware/managerMiddleware.js`](file:///d:/projects/helpbridge/backend/src/middleware/managerMiddleware.js) & [`adminMiddleware.js`](file:///d:/projects/helpbridge/backend/src/middleware/adminMiddleware.js) |

---

## 4. Live Integration & End-to-End Tests $\rightarrow$ Real Code Logic

| Test ID | Real Flow Triggered | Real Backend Modules Invoked |
|---|---|---|
| **INT-01 to INT-12** | Subsystem Interoperability | [`authController.js`](file:///d:/projects/helpbridge/backend/src/controllers/authController.js) $\rightarrow$ [`managerController.js`](file:///d:/projects/helpbridge/backend/src/controllers/managerController.js) $\rightarrow$ [`providerController.js`](file:///d:/projects/helpbridge/backend/src/controllers/providerController.js) $\rightarrow$ [`knnService.js`](file:///d:/projects/helpbridge/backend/src/services/knnService.js) $\rightarrow$ [`paymentController.js`](file:///d:/projects/helpbridge/backend/src/controllers/paymentController.js) |
| **SYS-01 to SYS-07** | Full User Journey Scenarios | Live Express Server [`backend/src/server.js`](file:///d:/projects/helpbridge/backend/src/server.js) + Database Pool |
| **REAL-API-01 to 15** | Live HTTP Endpoint Tests | Direct HTTP calls against all route handlers under [`backend/src/routes/`](file:///d:/projects/helpbridge/backend/src/routes/) |
