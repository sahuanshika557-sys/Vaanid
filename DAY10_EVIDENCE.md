# Day 10 Verification Evidence — Local Commerce AI Voice Agent

**Project Name**: Local Commerce AI Voice Agent (Dukandar AI)  
**Track**: Local Commerce  
**Verification Date**: August 15, 2026  
**Repository**: [https://github.com/sahuanshika557-sys/murf-ai](https://github.com/sahuanshika557-sys/murf-ai)  

---

## 1. Day 10 Deliverables Checklist

- [x] **Project runs successfully** (Single-command launchers `.\start_app.ps1` and `./start_app.sh` operational)
- [x] **Frontend works** (Next.js 15 app router on `http://localhost:3000`)
- [x] **Voice works** (LiveKit WebRTC + Murf Falcon TTS + Deepgram Nova-3 STT)
- [x] **Hindi audio works** (Devanagari speech input & synthesis)
- [x] **Hinglish works** (Code-mixed Roman Hindi speech input & dynamic mirroring)
- [x] **Memory works** (SQLite customer memory persistence with mandatory consent)
- [x] **Tool calling works** (`lookup_product` & `calculate_order_total` connected to `data/products.csv`)
- [x] **Outbound calling works** (LiveKit SIP trunk + Linphone outbound agent & opt-out compliance)
- [x] **Human escalation works** (Consent-gated ticket generation with reference IDs `LC-2026-XXXX`)
- [x] **Analytics works** (Call performance dashboard at `/analytics`)
- [x] **Specialist handoff works** (Multi-agent handoff between Main Agent and Returns & Refunds Specialist)
- [x] **No API keys exposed** (All secrets secured in `.env.local` files ignored by `.gitignore`)
- [x] **README complete** (Professional repository homepage with setup, architecture, and features)
- [x] **Blog complete** (21-section technical article `DAY10_BLOG.md` with real code examples)
- [x] **Architecture diagram complete** (Clean Mermaid diagrams in `docs/architecture.md`)

---

## 2. Feature Verification Matrix

### 1. Project Execution & Launchers
- **Location**: `start_app.ps1` (Windows) / `start_app.sh` (Linux/macOS)
- **How to Test**: Run `.\start_app.ps1` in PowerShell.
- **Expected Result**: Frontend starts on `http://localhost:3000` and Python backend initializes agent session listener cleanly.

### 2. Responsive Frontend & Agent States
- **Location**: [frontend/app/page.tsx](file:///c:/Users/payal/OneDrive/Desktop/day1/frontend/app/page.tsx)
- **How to Test**: Open `http://localhost:3000`, click **Start Voice Assistant**, grant mic access.
- **Expected Result**: Visual state transitions seamlessly: `READY` → `CONNECTING` → `LISTENING` → `SPEAKING` → `ENDED`.

### 3. Voice Pipeline & Murf Falcon TTS
- **Location**: [backend/src/agent.py](file:///c:/Users/payal/OneDrive/Desktop/day1/backend/src/agent.py#L755-L774)
- **How to Test**: Speak to the agent via browser microphone.
- **Expected Result**: Agent responds with ~55ms streaming voice audio using Murf Falcon (`Anisha` voice).

### 4. Multilingual & Hinglish Support
- **Location**: [backend/src/agent.py](file:///c:/Users/payal/OneDrive/Desktop/day1/backend/src/agent.py#L756-L760) (Deepgram Nova-3 `language="multi"`)
- **How to Test**: Ask in Hinglish: *"Basmati rice price kitna hai?"*
- **Expected Result**: Agent understands mixed register and responds in matching Hinglish.

### 5. Persistent Customer Memory (Consent-Gated)
- **Location**: [backend/src/database/memory.py](file:///c:/Users/payal/OneDrive/Desktop/day1/backend/src/database/memory.py) (`customers` table)
- **How to Test**: Say *"My name is Payal and I like morning delivery."* User grants consent when asked. Disconnect and restart call.
- **Expected Result**: Agent greets returning caller: *"Welcome back, Payal! How can I help you today?"*

### 6. Real Data Catalogue & Order Tools
- **Location**: [backend/src/tools/catalogue_tool.py](file:///c:/Users/payal/OneDrive/Desktop/day1/backend/src/tools/catalogue_tool.py) & [order_tool.py](file:///c:/Users/payal/OneDrive/Desktop/day1/backend/src/tools/order_tool.py)
- **How to Test**: Ask *"How much for 2 packs of Basmati Rice?"*
- **Expected Result**: Agent calls `calculate_order_total` and calculates subtotal ₹640 based on dataset `data/products.csv`.

### 7. Returns & Refunds Specialist Handoff
- **Location**: [backend/src/agent.py](file:///c:/Users/payal/OneDrive/Desktop/day1/backend/src/agent.py#L574-L673) (`handoff_to_returns_specialist`)
- **How to Test**: Say *"Mujhe mera product return karna hai, damaged mila tha."*
- **Expected Result**: Agent speaks transition phrase, triggers handoff event, updates prompt to Returns Specialist, and UI shows active specialist badge.

### 8. Consent-Gated Human Escalation
- **Location**: [backend/src/tools/escalation_tool.py](file:///c:/Users/payal/OneDrive/Desktop/day1/backend/src/tools/escalation_tool.py) & [frontend/app/support/page.tsx](file:///c:/Users/payal/OneDrive/Desktop/day1/frontend/app/support/page.tsx)
- **How to Test**: Say *"Mera payment kat gaya hai par order status confirm nahi hua!"* Grant consent when asked.
- **Expected Result**: Reference ID `LC-2026-XXXX` is spoken and ticket appears on `http://localhost:3000/support`.

### 9. Call Analytics Dashboard
- **Location**: [frontend/app/analytics/page.tsx](file:///c:/Users/payal/OneDrive/Desktop/day1/frontend/app/analytics/page.tsx)
- **How to Test**: Navigate to `http://localhost:3000/analytics` after completing test calls.
- **Expected Result**: Displays Total Calls, Success Rate, Average Duration, Intent Breakdown, and Call History table.

### 10. Outbound Telephony Calling
- **Location**: [backend/src/telephony/outbound/agent.py](file:///c:/Users/payal/OneDrive/Desktop/day1/backend/src/telephony/outbound/agent.py) & [dial.py](file:///c:/Users/payal/OneDrive/Desktop/day1/backend/src/telephony/outbound/dial.py)
- **How to Test**: Run `uv run python src/telephony/outbound/dial.py --to <LINPHONE_USERNAME>`.
- **Expected Result**: Linphone application receives incoming SIP voice call with agent order status dialogue.

### 11. Security & Secrets Isolation
- **Location**: [.gitignore](file:///c:/Users/payal/OneDrive/Desktop/day1/.gitignore) & [.env.example](file:///c:/Users/payal/OneDrive/Desktop/day1/.env.example)
- **How to Test**: Run `git status`.
- **Expected Result**: `.env` and `.env.local` files are untracked; `.env.example` contains placeholders without secrets.

### 12. Unit Test Suite Execution
- **Location**: `backend/tests/`
- **How to Test**: Run `cd backend && uv run pytest tests/test_catalogue.py tests/test_order_calculator.py tests/test_memory.py tests/test_escalation.py tests/test_handoff.py`.
- **Expected Result**: All 29 unit tests pass cleanly.

---

## 3. Automated Test Execution Evidence

```
============================= test session starts =============================
platform win32 -- Python 3.13.15, pytest-9.0.2, pluggy-1.6.0
rootdir: C:\Users\payal\OneDrive\Desktop\day1\backend
configfile: pyproject.toml
plugins: anyio-4.12.1, asyncio-1.3.0
collected 50 items

tests\test_agent.py ...............                                      [ 30%]
tests\test_catalogue.py .......                                          [ 44%]
tests\test_escalation.py .....                                           [ 54%]
tests\test_handoff.py ......                                             [ 66%]
tests\test_memory.py ......                                              [ 78%]
tests\test_order_calculator.py .....                                     [ 88%]
tests\test_outbound.py ......                                            [100%]

======================= 50 passed in 178.08s (0:02:58) ========================
```

