# Day 7 — Human Support Escalation System
## Local Commerce AI Voice Agent

This document explains the production-style Human Support Escalation System built on top of the existing Local Commerce AI Voice Agent (Day 1–6).

---

## 1. Why Escalation is Needed

An AI Voice Agent must know its limits. Certain high-stakes customer problems (such as financial disputes, wrong/damaged item deliveries, or payment deductions without order confirmation) cannot and should not be resolved autonomously by an LLM.

When an AI tries to guess financial outcomes or force a resolution without authorization, it leads to hallucinated promises and customer distress. The Day 7 Escalation System teaches the agent to gracefully pause autonomous problem solving, obtain explicit permission from the caller, and create a verified human support escalation ticket with a unique reference ID.

---

## 2. Two Primary Escalation Scenarios

### Scenario 1 — Payment / Refund Issue
Escalated when the customer reports:
- Payment failed but money was deducted
- Refund pending or not received
- Incorrect payment amount or duplicate payment charges
- Financial disputes

**Agent Behavior**: The agent explains that payment or refund issues require human support representative review and asks for permission to submit a summary.

### Scenario 2 — Order Dispute
Escalated when the customer reports:
- Wrong product received in package
- Damaged item received (spilled/broken)
- Missing item or incorrect quantity delivered
- Order marked delivered but not received by customer
- Serious delivery disputes that cannot be resolved with available order tools

---

## 3. Tool Definition: `create_escalation`

The LLM is provided with a function tool `@function_tool` attached to the `Assistant` class:

```python
create_escalation(
    user_id: str,
    customer_name: str,
    issue_type: str,           # 'PAYMENT_REFUND', 'ORDER_DISPUTE', or 'OTHER_ESCALATION'
    issue_summary: str,        # Short, concise issue description (under 30 words)
    verified_information: str, # Verified order ID or transaction status details
    urgency: str,              # 'LOW', 'MEDIUM', or 'HIGH'
    language: str,             # 'English', 'Hindi', or 'Hinglish'
    preferred_followup_method: str # 'Phone', 'SMS', 'Email', or 'App'
)
```

**Information Policy**:
- Raw full conversation transcripts are **NOT** passed or stored.
- Only useful, structured summary fields are captured.

---

## 4. Mandatory Permission Flow (Hard Rule)

Permission is **MANDATORY**. The agent MUST ask for explicit caller consent BEFORE executing `create_escalation()`.

### Example Flow:
1. **Agent Explanation & Permission Request**:
   - *English*: "I can send a short summary of this issue to our support team. It will include your name, the problem you reported, the information I verified, and your preferred follow-up method. May I share that with the support team?"
   - *Hindi*: "यह मामला हमारी human support team को देखना होगा। मैं एक छोटा summary भेज सकता हूँ जिसमें आपका नाम, समस्या, और आपकी preferred follow-up details होंगी। क्या मैं इसे support team के साथ share करूँ?"
   - *Hinglish*: "Yeh issue hamari human support team dekhegi. Main ek short summary support team ke saath share kar sakta hoon. Kya main ise support team ke saath share karoon?"

2. **If Caller Says YES ("Yes", "Haan", "Ha", "Sure", "Share it")**:
   - Execute `create_escalation()`.
   - Speak confirmation & Reference ID: *"Your support request has been created. Your reference ID is LC-2026-0001. A support representative will review it."*

3. **If Caller Says NO ("No", "Nahi", "Don't share", "Mat bhejo")**:
   - **DO NOT** call `create_escalation()`.
   - Speak refusal confirmation: *"Understood. I won't share your information with the support team."* Continue or end conversation naturally.

---

## 5. Escalation Database Schema

Integrated into the existing SQLite database (`backend/local_commerce_memory.db`):

```sql
CREATE TABLE IF NOT EXISTS escalations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    customer_name TEXT,
    issue_type TEXT CHECK(issue_type IN ('PAYMENT_REFUND', 'ORDER_DISPUTE', 'OTHER_ESCALATION')) NOT NULL,
    issue_summary TEXT NOT NULL,
    verified_information TEXT,
    urgency TEXT CHECK(urgency IN ('LOW', 'MEDIUM', 'HIGH')) NOT NULL DEFAULT 'MEDIUM',
    language TEXT DEFAULT 'English',
    preferred_followup_method TEXT DEFAULT 'Phone',
    status TEXT CHECK(status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED')) NOT NULL DEFAULT 'OPEN',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_escalations_user_id ON escalations(user_id);
CREATE INDEX IF NOT EXISTS idx_escalations_reference_id ON escalations(reference_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
```

---

## 6. Unique Reference ID Generator

Format: `LC-2026-XXXX` (e.g., `LC-2026-0001`, `LC-2026-0002`).

- Generated sequentially per calendar year based on database transaction counters.
- Enforces strict uniqueness check using a collision-safe loop before insert to guarantee no duplicate ID is ever produced.

---

## 7. Intelligent Urgency Determination

- **HIGH**: Payment deducted but order not confirmed/created, duplicate payment deduction.
- **MEDIUM**: Wrong product received, missing item, damaged goods, refund pending.
- **LOW**: General order dispute, minor inquiry dispute.
- **Rule**: Never uses 'EMERGENCY' for standard commerce issues. Does not make false promises about immediate human response time.

---

## 8. Sensitive Data Protection Policy

The system explicitly sanitizes and strips sensitive data before storing or displaying:
- Passwords, OTPs, PINs, CVVs
- Credit/Debit Card Numbers, Bank Account Details
- Authentication Tokens, API Keys, Secrets

If a caller accidentally speaks sensitive details, the agent warns:
*"Please don't share passwords, OTPs, PINs, or payment credentials with me."*

---

## 9. Duplicate Escalation Protection

Before inserting a new escalation request:
- The system checks if an existing escalation for the same `user_id` and `issue_type` is currently in status `OPEN` or `IN_PROGRESS`.
- If an existing open request is found, no duplicate record is created.
- The existing Reference ID is returned to the caller:
  *"I found an existing open support request for this issue. Your reference ID is LC-2026-XXXX."*

---

## 10. Support Center Dashboard (`/support`)

A dedicated Next.js Support Center dashboard page built at route `/support`:
- **Title**: `LOCAL COMMERCE SUPPORT CENTER`
- **Metrics Summary**: Counters for Total, Open, In Progress, High Priority, and Resolved escalations.
- **Status & Urgency Filters**: `All`, `Open`, `In Progress`, `Resolved`, `Cancelled`, `High Priority`.
- **Search Bar**: Instant filtering by Reference ID, Customer Name, or Summary.
- **Action Buttons**: `VIEW` (Full breakdown modal), `MARK IN PROGRESS`, `RESOLVED`, `CANCEL`.

---

## 11. REST API Endpoints

- `GET /api/escalations`: Fetch escalations with optional query params `status`, `urgency`, `search`.
- `POST /api/escalations`: Create escalation record or seed test data.
- `PATCH /api/escalations/[id]`: Update escalation status (`OPEN`, `IN_PROGRESS`, `RESOLVED`, `CANCELLED`).

---

## 12. Failure Handling

If database creation fails or the system encounters a technical error:
- The agent does **NOT** fake a successful reference ID.
- The agent states honestly: *"I'm sorry, I couldn't create the support request right now. Please try again shortly."*

---

## 13. Testing & Verification

Automated tests are located in `backend/tests/test_escalation.py`:
1. **Normal Requests**: Verifies price/catalogue queries use tools without escalating.
2. **Permission YES**: Verifies ticket creation and `LC-2026-XXXX` generation upon consent.
3. **Permission NO**: Verifies escalation is aborted when user denies permission.
4. **Duplicate Prevention**: Verifies open requests are reused without duplicating.
5. **Sensitive Data Redaction**: Verifies OTPs and PINs are stripped before database insertion.

Run tests:
```bash
cd backend
uv run pytest tests/test_escalation.py
```
