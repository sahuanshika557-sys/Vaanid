# DukanVaani AI — Turn Every Voice Into Commerce
> **Target Track:** Track 1 — AI Growth & Agentic Commerce  
> **Tagline:** Dukan Ki Apni Awaaz • Turn Every Voice Into Commerce.  
> **Platform:** Multilingual Voice & Omnichannel Autonomous Commerce Agents for Bharat.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Murf Falcon](https://img.shields.io/badge/TTS-Murf%20Falcon%20(~55ms)-6366F1)](https://murf.ai/api/docs/text-to-speech/streaming)
[![LiveKit](https://img.shields.io/badge/Transport-LiveKit%20WebRTC-002cf2)](https://docs.livekit.io)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![Deepgram](https://img.shields.io/badge/STT-Deepgram%20Nova--3-13EF95)](https://deepgram.com)
[![SQLite](https://img.shields.io/badge/Database-SQLite%20Deterministic-003B57?logo=sqlite&logoColor=white)](https://sqlite.org/)

---

## 1. Executive Summary & Problem in Bharat Commerce

Millions of local merchants (kiranas, neighborhood stores, D2C brands) in India receive hundreds of customer inquiries daily over phone calls and WhatsApp. However:
- **40%+ Inquiries Drop Off**: Customers abandon inquiries because shopkeepers are busy handling physical store traffic or cannot respond immediately.
- **Language & Literacy Barrier**: Standard e-commerce apps force customers to type in formal English or navigate complex multi-level menus.
- **Lost Recovery Opportunities**: Repeat orders and abandoned carts are rarely followed up due to a lack of automated tooling for small merchants.
- **Chatbot Hallucination Risk**: Generic LLMs hallucinate product stock, invent fake prices, and cannot safely create financial payment intents.

### The Solution: DukanVaani AI
**DukanVaani AI** bridges this gap with an **autonomous agentic commerce platform** that turns voice and text conversations directly into verified transactions. Customers speak naturally in **Hindi, English, or Hinglish** to discover products, get intelligent recommendations within their budget, build shopping carts, and generate UPI payment intents — while merchants gain an **AI Merchant Copilot** and an **Automated Revenue Recovery** engine.

---

## 2. Multi-Agent Architecture

```
                                  [ CUSTOMER ]
                         (Voice / WebRTC / Text / SIP)
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   VyapaarVoice AI Hub    │
                        │    (Next.js 15 Frontend)  │
                        └─────────────┬─────────────┘
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
  ┌──────────────────────────┐                  ┌──────────────────────────┐
  │   LiveKit Agents Server  │                  │  Next.js Commerce API    │
  │    (Python 3.10+ & uv)   │                  │   (/api/commerce/*)      │
  └────────────┬─────────────┘                  └────────────┬─────────────┘
               │                                             │
      ┌────────┴────────┐                                    │
      ▼                 ▼                                    │
┌──────────────┐ ┌──────────────┐                            │
│ Deepgram STT │ │ Murf Falcon  │                            │
│  (Nova-3)    │ │ TTS (~55ms)  │                            │
└──────────────┘ └──────────────┘                            │
      ▲                 │                                    │
      └────────┬────────┘                                    │
               ▼                                             │
   ┌───────────────────────┐                                 │
   │  Gemini LLM Router    │                                 │
   └───────────┬───────────┘                                 │
               │                                             │
  ┌────────────┴───────────────────────────┬─────────────────┘
  ▼                                        ▼
┌───────────────────────────────┐        ┌───────────────────────────────┐
│     Agentic Tool Pipeline     │        │     Deterministic Database    │
│  • recommend_products()       │        │  • local_commerce_memory.db   │
│  • manage_cart() (Add/Clear)  │ ◄────► │  • Carts & Cart Items         │
│  • calculate_order_total()    │        │  • Payment Intents (UPI/QR)   │
│  • merchant_copilot_query()   │        │  • Agent Audit Log            │
│  • check_return_eligibility() │        │  • Follow-up Suggestions      │
│  • create_escalation()        │        │  • Verified CSV Catalogue     │
└───────────────────────────────┘        └───────────────────────────────┘
```

---

## 3. Key Agentic Commerce Capabilities (Track 1)

### 🛒 1. Smart Cart & Checkout Engine
- **Deterministic Math**: Cart subtotals, delivery fees (e.g. Free Delivery above ₹500), and totals are strictly calculated in verified database logic, never guessed.
- **Stock-Aware Addition**: Validates current inventory in `products.csv` before adding items. If an item is low in stock or unavailable, the agent suggests real alternatives.
- **Instant Payment Intents**: Generates unique payment references (`TXN_PAY_...`) with instant UPI QR simulation.

### 🎯 2. Budget & Preference Product Recommendations
- **Constraint-Based Filtering**: Customers can say *"Mujhe ₹1000 ke andar monthly grocery bundle suggest karo"*, and the agent shortlists in-stock items with explainable reasons.
- **Explainable Decision Engine**: Every recommendation and cart action produces an audit log with a *"Why this action?"* explanation card.

### 📈 3. Merchant AI Copilot
- **Live Voice & Text Business Intelligence**: Shop owners can ask:
  - *"Kaunsa product low stock mein hai?"*
  - *"Aaj kitna revenue generate hua?"*
  - *"Abandoned carts kitne hain?"*
- **Real-Time SQL Insights**: Directly queries SQLite tables to return actionable store summaries.

### 🔄 4. Consent-Gated Revenue Recovery & Follow-ups
- **Abandoned Cart Recovery**: Automatically flags high-priority abandoned carts and drafts personalized recovery prompts for merchant approval.
- **Predictive Repeat Reordering**: Analyzes customer purchase frequency and suggests timely restock reminders (e.g., 30-day Basmati Rice replenishment).
- **Human-in-the-Loop Approvals**: Merchants can review, approve, or dismiss all AI-drafted messages before sending.

### 🛡️ 5. AI Safety, Guardrails & Human Escalation
- **Zero Financial Hallucinations**: Product prices and payment totals are validated against the database.
- **Consent-Gated Memory**: Customer names and preferences are saved only upon explicit user permission.
- **Escalation Support Tickets**: Unresolved disputes or return issues generate structured tickets (`LC-2026-XXXX`) accessible on `/support`.

---

## 4. Quickstart Guide

### Prerequisites
- Python 3.10+ with `uv`
- Node.js 18+ with `pnpm`
- LiveKit Cloud, Murf AI, Deepgram, and Google Gemini API keys.

### 1. Backend Setup
```bash
cd backend
uv sync
uv run python src/agent.py download-files
uv run pytest tests/test_agentic_commerce.py tests/test_catalogue.py
uv run python src/agent.py dev
```

### 2. Frontend Setup
```bash
cd frontend
pnpm install
pnpm build
pnpm start
```

### 3. One-Command Windows Startup
```powershell
.\start_app.ps1
```

---

## 5. 3-Minute Hackathon Demo Flow

1. **Launch Platform**: Open `http://localhost:3000`.
2. **Start Interactive Tour**: Click the glowing **"Judge Tour (3 Min)"** button in the header for an interactive overview.
3. **Voice/Text Commerce Session**:
   - Speak or type: *"Mujhe ₹1000 ke andar groceries chahiye"*
   - Agent shortlists Basmati Rice and Toor Dal with budget validation.
   - Type or speak: *"Basmati Rice aur Dal add karo, aur checkout karo"*
   - Smart Cart updates in real time and creates a verified payment intent.
4. **Merchant Copilot**:
   - Click **"Merchant Copilot"** in the top navigation.
   - Ask: *"Kaunsa product low stock mein hai?"*
   - Observe live SQL response from inventory tables.
5. **Revenue Recovery**:
   - Scroll to the **AI Revenue Recovery & Approvals** section.
   - Click **[Approve]** on pending reorder and recovery suggestions.
6. **Agent Activity Stream**:
   - Inspect the **Live AI Agent Activity** stream to see the full multi-agent execution timeline and AI decision reasons.

---

## 6. Technology Stack

- **Voice AI Pipeline**: Murf Falcon TTS (`livekit-murf`), LiveKit Agents SDK (`livekit-agents`), Deepgram Nova-3 STT, Google Gemini LLM.
- **Backend**: Python 3.10+, SQLite 3, `uv`, `pytest`.
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion.
- **Telephony**: LiveKit SIP Trunking & Linphone integration.

---

*VyapaarVoice AI — Turn Every Conversation Into Commerce.*
