# DAY 8 — ADVANCED VOICE ANALYTICS & PERFORMANCE DASHBOARD

## Local Commerce Voice Intelligence

This document details the production call analytics architecture, database schema, call lifecycle management, APIs, privacy protections, and testing procedures for the **Local Commerce Voice Agent**.

---

## 1. Success Definition

For the Local Commerce Voice Agent, a call is **SUCCESSFUL** (`outcome = 'SUCCESS'`) when the customer's primary objective is completed without critical failures.

### Examples of Successful Calls:
- **Product Enquiry**: Product availability, prices, or stock information was retrieved from the catalogue tool and spoken to the caller.
- **Catalogue Lookup**: Estimated order totals for specific items/quantities were calculated and presented.
- **Order Status Verification**: Existing order status (`PENDING`, `CONFIRMED`, `CANCELLED`) was retrieved and communicated.
- **Human Support Escalation**: Customer requested escalation for a payment/refund issue or order dispute, permission was explicitly granted, and a unique reference ID (e.g. `LC-2026-0001`) was assigned.

---

## 2. Failure Definition

A call is marked **FAILED** (`outcome = 'FAILED'`) when the objective is unachieved or an error occurs during the session. The exact failure reason is recorded separately:

| Failure Reason (`failure_reason`) | Description |
|---|---|
| `USER_HANGUP` | Customer disconnected before asking a question or before completing the primary objective. |
| `INCOMPLETE_TASK` | Customer asked a question or requested an action, but the call ended before resolution was provided. |
| `TOOL_FAILURE` | Catalogue or order lookup tool failed or returned an error response. |
| `API_FAILURE` | Speech recognition (STT), synthesis (TTS), or LLM connection failed. |
| `NO_RESPONSE` | Customer joined the call but gave no spoken input or disconnected immediately. |
| `UNKNOWN` | Uncategorized failure condition. |

---

## 3. Database Schema

All call metrics are stored in the SQLite database (`backend/local_commerce_memory.db`) in the `calls` table:

```sql
CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    call_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    channel TEXT CHECK(channel IN ('BROWSER', 'SIP')) NOT NULL DEFAULT 'BROWSER',
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER DEFAULT 0,
    language TEXT DEFAULT 'English',
    intent TEXT DEFAULT 'OTHER',
    success_condition TEXT,
    outcome TEXT CHECK(outcome IN ('SUCCESS', 'FAILED', 'IN_PROGRESS')) DEFAULT 'IN_PROGRESS',
    failure_reason TEXT CHECK(failure_reason IN ('USER_HANGUP', 'INCOMPLETE_TASK', 'TOOL_FAILURE', 'API_FAILURE', 'NO_RESPONSE', 'UNKNOWN', 'NONE')) DEFAULT 'NONE',
    escalated INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_calls_call_id ON calls(call_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON calls(outcome);
CREATE INDEX IF NOT EXISTS idx_calls_channel ON calls(channel);
CREATE INDEX IF NOT EXISTS idx_calls_language ON calls(language);
CREATE INDEX IF NOT EXISTS idx_calls_intent ON calls(intent);
```

---

## 4. Call Lifecycle

Every voice call follows a tracked 5-stage lifecycle:

```
[1. CALL_STARTED] ──> [2. CALL_CONNECTED] ──> [3. CALL_ACTIVE] ──> [4. CALL_ENDED] ──> [5. CALL_ANALYZED]
```

1. **CALL_STARTED**: When a browser token is generated or SIP call initiated, a row with `outcome = 'IN_PROGRESS'` is registered.
2. **CALL_CONNECTED**: Agent joins LiveKit room and speech pipeline initializes.
3. **CALL_ACTIVE**: Tools execute, intents (`PRODUCT_ENQUIRY`, `ORDER_STATUS`, `CATALOGUE_LOOKUP`, etc.) and language (`English`, `Hindi`, `Hinglish`) are tracked.
4. **CALL_ENDED**: Participant disconnects or session closes.
5. **CALL_ANALYZED**: `finalize_call_analytics()` computes `duration_seconds`, determines `outcome` ('SUCCESS' vs 'FAILED'), stores `failure_reason`, and updates the database.

---

## 5. Outcome Detection Logic

Analytics finalization is handled by a single backend service function `finalize_call_analytics()` in `backend/src/database/memory.py`:

- If a tool fails (`tool_failed = True`), `failure_reason` becomes `TOOL_FAILURE` and `outcome = 'FAILED'`.
- If duration is < 4 seconds and intent remains default (`OTHER`), `failure_reason` becomes `USER_HANGUP` and `outcome = 'FAILED'`.
- If an objective condition is met or escalation completes, `outcome = 'SUCCESS'` and `failure_reason = 'NONE'`.

---

## 6. Browser Call Integration

When a user starts a browser voice call:
1. `POST /api/token` issues a LiveKit token and calls `runPythonDbApi(['start_call', ...])` to pre-register the call (`channel = 'BROWSER'`).
2. When the python agent connects, `my_agent()` links `call_id = room.name`.
3. Upon disconnect, `ctx.add_shutdown_callback` triggers `finalize_call_analytics()`.

---

## 7. SIP Telephony Integration

When an outbound SIP call is placed via Linphone or LiveKit Telephony:
1. `backend/src/telephony/outbound/agent.py` calls `create_call_record(call_id=room_name, channel='SIP')`.
2. When the caller hangs up or opt-out is recorded, `finalize_call_analytics()` finalizes the call metrics.

---

## 8. Analytics APIs

| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/api/analytics/summary` | None | Returns `{ total_calls, successful_calls, failed_calls, success_rate }` |
| `GET` | `/api/analytics/calls` | `limit`, `offset`, `channel`, `language`, `intent`, `outcome`, `search` | Returns recent call records (privacy safe) |
| `GET` | `/api/analytics/trends` | `timeframe` (`today`, `7d`, `30d`) | Time-series data for call volume charts |
| `GET` | `/api/analytics/failures` | None | Failure root cause breakdown & insight sentence |
| `GET` | `/api/analytics/breakdowns` | None | Channels, Languages, Intents, and Day 7 escalation stats |
| `POST` | `/api/analytics/seed` | None | Development helper to seed test calls |

---

## 9. Dashboard Architecture (`/analytics`)

The dashboard UI at `/analytics` is structured into 9 sections:
1. **Header & Live Indicator**: Auto-polling every 8 seconds, timestamp indicator, and navigation bar.
2. **Top 4 KPI Cards**: Total Calls, Successful Calls, Failed Calls, Success Rate.
3. **Call Performance Donut/Bar**: Success vs Failure ratio.
4. **Call Volume Trend Chart**: Interactive time-series visualizer with Today / 7 Days / 30 Days toggles.
5. **Call Channel Analytics**: Browser vs SIP percentage breakdown.
6. **Language Analytics**: Hindi, English, Hinglish distribution.
7. **Local Commerce Intents**: Intent category counts (`PRODUCT_ENQUIRY`, `ORDER_STATUS`, etc.).
8. **Failure Insights**: "Why calls fail" breakdown + data-driven insight banner.
9. **Human Escalation Insights**: Day 7 escalation metrics (Open, In Progress, Resolved).
10. **Recent Calls Table**: Multi-criteria filters, call ID search, badges, skeleton loaders, and empty states.

---

## 10. Privacy Protections

- **Zero Credentials Exposure**: Passwords, OTPs, PINs, CVVs, card numbers, bank details, API keys, and tokens are **NEVER** stored or returned by APIs.
- **No Full Transcripts**: Call records expose only metadata (duration, outcome, language, intent, channel).
- **Public Safety**: Search parameter strictly matches safe fields (`call_id`, `user_id`).

---

## 11. Security

- All database queries use parameterized SQL (`SELECT COUNT(*) FROM calls WHERE outcome = ?`) to prevent SQL injection.
- Database credentials and secrets are kept strictly in `.env.local`.

---

## 12. Performance & Database Optimization

- Aggregation calculations (`COUNT(*)`, `SUM()`) are executed directly in SQLite rather than transferring raw data to the browser.
- Indexes on `call_id`, `created_at`, `outcome`, `channel`, `language`, and `intent` ensure sub-millisecond query responses.
- Pagination (`LIMIT 20 OFFSET 0`) keeps payload sizes tiny.

---

## 13. Testing Verification

### Automated Code Verification:
```bash
# Backend linting
cd backend
uv run ruff check .
uv run ruff format .

# Frontend build & lint
cd frontend
pnpm lint
pnpm build
```

---

## 14. How to Run

### Option A: Using PowerShell (Windows)
```powershell
.\start_app.ps1
```

### Option B: Running Services Separately
```bash
# Terminal 1 — Backend Agent
cd backend
uv run python src/agent.py dev

# Terminal 2 — Next.js Frontend
cd frontend
pnpm dev
```

---

## 15. How to Verify Real Data

1. Open `http://localhost:3000` in your browser.
2. Click **Start Voice Assistant** and perform a product enquiry (e.g. "Do you have Basmati Rice?").
3. End the call.
4. Navigate to `http://localhost:3000/analytics`.
5. Observe **Total Calls +1**, **Successful Calls +1**, and the new call row in the **Recent Calls** table matching your exact duration and language.
