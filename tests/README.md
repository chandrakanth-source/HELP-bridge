# HelpBridge Software Test Suite (Python, Pytest & Selenium)

This test suite implements all the test cases defined in the **Software Test Report** for **HelpBridge – Emergency & Non-Emergency Help Request Platform** (Course: CSE312 Software Architecture: Principles and Practices).

---

## 📁 Directory Structure

```
tests/
├── conftest.py                     # Global Pytest fixtures, KNN / Haversine algorithms, Selenium driver, Mock engine
├── pytest.ini                      # Pytest runner configuration & custom markers
├── requirements.txt                # Python testing dependencies (pytest, selenium, requests, python-dotenv)
├── test_unit.py                    # Section 6 (WB-01 to WB-08) & Section 7 (UT-01 to UT-12)
├── test_black_box.py               # Section 5: Equivalence Classes, Boundary Values & Decision Tables
├── test_test_cases.py              # Section 4: All 33 Core Test Cases (TC-REG, TC-VER, TC-MGR, TC-LOGIN, TC-REQ, TC-BUF, etc.)
├── test_integration.py             # Section 8: Integration & Interface Testing (INT-01 to INT-12)
├── test_system_e2e.py              # Section 9: System & E2E Workflows (SYS-01 to SYS-07)
├── test_requirements_validation.py # Section 10: Validation & Requirements Traceability (FR-01 to FR-14)
├── test_automated_scripts.py       # Section 11: Automated Test Scripts (ATS-01 to ATS-10)
├── test_non_functional.py          # Section 12: Non-Functional Testing (NFR-01 to NFR-06)
├── test_selenium_ui.py             # UI Automation using Selenium WebDriver & Chrome
└── README.md                       # Comprehensive guide & test report mapping
```

---

## 🚀 Installation & Setup

1. **Install Python requirements:**
   ```bash
   pip install -r tests/requirements.txt
   ```

2. **Configure Environment Variables (Optional):**
   You can customize base URLs in your `.env` or system environment:
   ```env
   API_BASE_URL=http://localhost:5000/api
   FRONTEND_BASE_URL=http://localhost:3000
   ```

---

## 🧪 Running the Tests

### 1. Run the Entire Test Suite
```bash
pytest
```

### 2. Run Specific Test Suites by Marker
- **Unit & White-Box Tests:**
  ```bash
  pytest -m "unit or whitebox"
  ```
- **Black-Box Tests (Equivalence Class, Boundary Value, Decision Table):**
  ```bash
  pytest -m blackbox
  ```
- **Core Test Cases:**
  ```bash
  pytest tests/test_test_cases.py
  ```
- **Integration & Interface Tests:**
  ```bash
  pytest -m integration
  ```
- **End-to-End System Tests:**
  ```bash
  pytest -m system
  ```
- **Validation & Traceability Matrix (FR-01 to FR-14):**
  ```bash
  pytest -m validation
  ```
- **Automated Script Suite (ATS-01 to ATS-10):**
  ```bash
  pytest -m automated
  ```
- **Non-Functional Testing (NFR-01 to NFR-06):**
  ```bash
  pytest -m nfr
  ```
- **Selenium Web UI Tests:**
  ```bash
  pytest -m selenium
  ```

---

## 📊 Summary of Test Coverage

| Section | Test Identifier Prefix | Description | Test Count |
|---|---|---|---|
| **Section 4** | `TC-REG`, `TC-VER`, `TC-MGR`, `TC-LOGIN`, `TC-REQ`, `TC-BUF`, `TC-BRG`, `TC-PAY`, `TC-LOC`, `TC-CHAT`, `TC-PWD`, `TC-NOT`, `TC-CBT` | Core Test Case Design (including TC-MGR-04, TC-BUF-05, TC-BUF-06) | 36 |
| **Section 5** | `BB-EML`, `BB-REQ`, `BB-BUF`, `BB-PAY`, `BB-ACC` | Black-Box Testing (Boundary Value, Equivalence Class, Decision Table) | 16 |
| **Section 6 & 7** | `WB-01` to `WB-08`, `UT-01` to `UT-12` | White-Box & Unit Testing (KNN, Buffer, Auth, Payments, Middleware) | 20 |
| **Section 8** | `INT-01` to `INT-12` | Integration & Subsystem Interface Testing | 12 |
| **Section 9** | `SYS-01` to `SYS-07` | Full System & E2E Workflows | 7 |
| **Section 10** | `FR-01` to `FR-14` | Requirements Traceability Matrix | 14 |
| **Section 11** | `ATS-01` to `ATS-10` | Automated Execution Scripts | 10 |
| **Section 12** | `NFR-01` to `NFR-06` | Non-Functional Testing (Performance, Security, Usability, Accuracy) | 6 |
| **UI Automation** | `UI-01` to `UI-07` | Selenium WebDriver UI Automation | 7 |
