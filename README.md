# Murf AI & LiveKit Voice Agent Starter

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Murf Falcon](https://img.shields.io/badge/TTS-Murf%20Falcon-6366F1)](https://murf.ai/api/docs/text-to-speech/streaming)
[![LiveKit](https://img.shields.io/badge/Transport-LiveKit-002cf2)](https://docs.livekit.io)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![CI](https://github.com/murf-ai/murf-livekit-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/murf-ai/murf-livekit-starter/actions)

A production-ready voice AI agent starter powered by **Murf Falcon TTS** (ultra-fast text-to-speech) and **LiveKit Agents** framework.

This project includes a Python backend voice pipeline (STT → LLM → TTS) and a modern, fully responsive Next.js frontend web UI with real-time audio visualization, theme toggling, and transcript display.

---

## 🌟 Key Features

- **Ultra-Low Latency Voice AI**: ~55ms TTS streaming latency powered by Murf Falcon.
- **Full Responsiveness**: Mobile, tablet, and desktop layout with fluid typography and dark/light mode support.
- **Production Ready**: Zero broken imports, full linting compliance, automated CI workflows, and single-command local setup.
- **Modular Backend**: Extensible assistant class with support for `@function_tool` decorators (weather, database, API calls).
- **Accessibility & Performance**: Built with semantic HTML, focus indicators, WCAG AA contrast, and optimized assets.

---

## 🏗️ Architecture

```mermaid
flowchart LR
    A["🎙️ User Audio Input"] -->|"LiveKit Transport"| B["Deepgram STT (Nova-3)"]
    B -->|"Transcribed Text"| C["Google Gemini LLM"]
    C -->|"Response Stream"| D["Murf Falcon TTS"]
    D -->|"Streaming Audio"| E["LiveKit Transport"]
    E -->|"Audio Output"| F["🔊 User Hears Agent"]

    style A fill:#1e293b,stroke:#64748b,color:#fff
    style B fill:#0284c7,stroke:#38bdf8,color:#fff
    style C fill:#6366f1,stroke:#818cf8,color:#fff
    style D fill:#059669,stroke:#34d399,color:#fff
    style E fill:#ea580c,stroke:#fb923c,color:#fff
    style F fill:#1e293b,stroke:#64748b,color:#fff
```

---

## 🚀 Quickstart & One-Command Run

### Prerequisites

- **Python**: 3.10 to 3.14
- **[uv](https://docs.astral.sh/uv/)**: High-performance Python package installer
- **Node.js**: 18+
- **pnpm**: Fast, disk space efficient package manager (`npm install -g pnpm`)

### 1. Clone & Set Up Environment

```bash
git clone https://github.com/murf-ai/murf-livekit-starter.git
cd murf-livekit-starter
```

Copy the example environment files for backend and frontend:

```bash
# Backend environment setup
cp backend/.env.example backend/.env.local

# Frontend environment setup
cp frontend/.env.example frontend/.env.local
```

Fill in your API keys in `backend/.env.local`:

| Environment Variable | Description | Source |
| -------------------- | ----------- | ------ |
| `LIVEKIT_URL` | LiveKit Cloud / Local Server URL | [LiveKit Cloud](https://cloud.livekit.io) |
| `LIVEKIT_API_KEY` | LiveKit API Key | [LiveKit Cloud](https://cloud.livekit.io) |
| `LIVEKIT_API_SECRET` | LiveKit API Secret | [LiveKit Cloud](https://cloud.livekit.io) |
| `MURF_API_KEY` | Murf API Key | [Murf AI Dashboard](https://murf.ai/api/dashboard) |
| `DEEPGRAM_API_KEY` | Deepgram STT API Key | [Deepgram Console](https://console.deepgram.com) |
| `GOOGLE_API_KEY` | Google Gemini LLM Key | [Google AI Studio](https://aistudio.google.com) |

Fill in your LiveKit connection details in `frontend/.env.local`:

```env
LIVEKIT_URL=wss://your-livekit-project.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
```

### 2. Run with a Single Command

#### Windows (PowerShell):
```powershell
.\start_app.ps1
```

#### macOS / Linux (Bash):
```bash
chmod +x start_app.sh
./start_app.sh
```

#### Using root `package.json`:
```bash
pnpm setup  # Install backend & frontend dependencies
pnpm dev    # Run services
```

The app will start:
- Frontend UI: `http://localhost:3000`
- Backend Agent: Listening for LiveKit WebRTC connections

---

## 🧪 Testing & Code Quality

Run tests and linter checks directly from the root workspace:

```bash
# Run backend pytest suite
pnpm test

# Run code linter checks
pnpm lint

# Format codebase
pnpm format

# Build production frontend bundle
pnpm build
```

## 🧠 Day 4 — Persistent Customer Memory

The voice agent is powered by **REAL Persistent Customer Memory** using SQLite (`local_commerce_memory.db`), enabling memory to survive call terminations, agent restarts, backend restarts, and browser reloads:

- **SQLite Database Layer**: `customers` table storing `user_id` (PRIMARY KEY), `name`, `language_preference`, `preferred_delivery_slot`, `usual_quantity`, `past_orders`, `last_interaction`, `created_at`, and `updated_at`. Uses parameterized SQL queries exclusively.
- **Stable Customer Identity**: Frontend generates and persists a stable client-side customer ID (`local_commerce_customer_id`) in browser `localStorage`. Passed as `participantIdentity` to LiveKit so the same caller is recognized across all calls.
- **3 Agent Tools (`@function_tool`)**:
  1. `lookup_caller`: Retrieves saved customer memory (`name`, `language_preference`, `preferred_delivery_slot`, `usual_quantity`, `past_orders`, `last_interaction`).
  2. `save_caller_memory`: Saves caller memory AFTER explicit user consent (`"Would you like me to remember that...?"` → `"Yes"`).
  3. `forget_caller`: Deletes caller memory when requested (`"Forget everything about me"`).
- **Mandatory Consent Workflow**: The agent ALWAYS asks for permission before saving any personal fact or preference. Supports English (*"Yes, remember it"*), Hindi (*"हाँ, याद रखना"*), and Hinglish (*"Haan, yaad rakhna"*).
- **Personalized Returning Customer Experience**:
  - **New Customer**: *"Hi! I'm Anisha, your local shopping assistant. How can I help you today?"*
  - **Returning Customer**: *"नमस्ते Ramesh जी! वापस स्वागत है। आज मैं आपकी कैसे मदद कर सकती हूँ?"*
- **Privacy & Safety**: Never stores passwords, OTPs, credit cards, or payment credentials. Memory never overrides Day 2 guardrails (never falsely confirms orders or refunds).
- **Automated Tests**: Unit tests in `backend/tests/test_memory.py` covering table creation, customer CRUD, timestamp updates, consent scenarios, and persistence across connections (`uv run pytest tests/test_memory.py`).

---

## 🌐 Multilingual Voice Support (Hindi + Hinglish + English)

The agent detects and responds according to the user's current language/register and can switch languages during the same call without restarting or manual toggles.

### Key Capabilities
- **Supported Languages & Registers**:
  - **English**: *"How much is basmati rice?"* → *"Basmati Rice 5 kg pack is listed at ₹320 with 25 units available."*
  - **Hinglish / Roman Hindi**: *"Basmati rice kitne ka hai?"* → *"Basmati rice ka listed price ₹320 hai."*
  - **Hindi (Devanagari)**: *"बासमती चावल कितने के हैं?"* → *"बासमती चावल की सूचीबद्ध कीमत ₹320 है।"*
  - **Mixed Code-Switching**: *"Can you check kar sakte ho basmati rice price?"* → Mirrors mixed register naturally.
- **Speech Recognition (STT)**: Configured with **Deepgram Nova-3** (`language="multi"`, `detect_language=True`) for multi-language speech recognition.
- **Text-to-Speech (TTS)**: Powered by **Murf Falcon** (`Anisha`, `en-IN` / `hi-IN` capabilities) for natural voice synthesis across English, Hindi, and Hinglish.
- **Language Mirroring**: Automatically matches the user's latest utterance language, script, and formality. Current utterance always overrides stored customer memory language preferences.
- **Tool & Guardrail Integration**: Function tools (`lookup_product`, `calculate_order_total`) and refusal guardrails operate language-independently across English, Hindi, and Hinglish.
- **Unclear Speech Fallback**: Gracefully asks for clarification in the user's active language (*"Sorry, mujhe clear nahi suna. Ek baar phir bata sakte ho?"*).

---

## 🛍️ Day 3 — Personalized Local Commerce AI Voice Agent Frontend

The frontend has been completely upgraded and personalized for the **LOCAL COMMERCE** track (**Dukandar AI — Local Commerce Voice Assistant**), providing a voice-first local shopping assistant experience:

- **Product Concept**: A smart AI voice assistant helping local customers interact with local shops and businesses (product questions, shop details, hours, local services, and support).
- **Five Agent States**:
  1. **READY**: Prominent hero section, interactive central AI assistant card with breathing avatar pulse, language badge (`English • Hindi • Hinglish`), capability cards, and a primary **Start Voice Assistant** button.
  2. **CONNECTING**: Rotating loading indicator with status *"Connecting..."* and disabled action button to prevent duplicate connections.
  3. **LISTENING**: Top status badge displaying `🎤 Listening to you` with dynamic microphone pulse and organic voice visualizer bars.
  4. **SPEAKING**: Top status badge displaying `🔊 Your assistant is speaking` with dynamic animated waveform.
  5. **CALL ENDED**: Clean post-call screen displaying *"Conversation ended"* and a **Start Again** action button that resets session state without a browser refresh.
- **Microphone Error Handling**: Friendly error card for `NotAllowedError` / `NotFoundError` displaying step-by-step browser permission instructions (*"Please allow microphone access in your browser settings and try again."*) with a **Try Again** button.
- **Local Commerce Visual Sections**:
  - 🛍️ **Product Questions**: Ask about local shop products, services, and availability.
  - 🏪 **Shop Information**: Inquire about business address, operating hours, and contact info.
  - 📦 **Order Assistance**: Guidance on orders when store data is available.
  - 💬 **Customer Support**: Seamless escalation to human support when needed.
- **Trust & Guardrails**: Highlights Day 2 guardrails (verifiable store data, zero false order/refund confirmations, transparent escalation).
- **Multi-lingual Voice**: Seamless English, Hindi, and Hinglish support matching Day 2 capabilities.
- **Responsive & Accessible**: Fully responsive layout across Desktop (1440px), Laptop (1280px), Tablet (768px), and Mobile (390px) with semantic HTML, focus states, and `prefers-reduced-motion` support.

---

## 🛒 Day 5 — Real-Time Tools for Local Commerce Voice Agent

Day 5 connects the Local Commerce Voice Assistant (**Dukandar AI**) to **REAL DOMAIN DATA** through real-time function tools (`lookup_product` and `calculate_order_total`).

### 1. Data Source Disclosure
> [!IMPORTANT]
> **DATA SOURCE**: Product catalogue data is **local/static test data** stored in `data/products.csv` and `backend/data/products.csv`. The assistant clearly communicates this local data context and never claims to fetch live unverified market data.

### 2. Dataset Schema (`data/products.csv`)
The catalogue contains 20 realistic items across 8 categories (Groceries, Fruits, Vegetables, Household, Personal Care, Snacks, Beverages, Bakery) with prices in Indian Rupees (INR), stock levels, seller names, locations (Kanpur), and freshness timestamps:
```csv
product_id,product_name,category,description,price,currency,stock_quantity,unit,seller_name,location,last_updated
P001,Basmati Rice,Groceries,Premium long-grain basmati rice,320,INR,25,5 kg,Local Fresh Mart,Kanpur,2026-08-10T10:00:00+05:30
P004,Aashirvaad Whole Wheat Atta,Groceries,100% pure MP chakki atta,240,INR,3,5 kg,Local Fresh Mart,Kanpur,2026-08-10T10:00:00+05:30
P005,Toor Dal,Groceries,Unpolished premium toor dal,140,INR,0,1 kg,Local Fresh Mart,Kanpur,2026-08-10T10:00:00+05:30
```

### 3. Built Agent Tools

#### Tool 1: `lookup_product`
- **Purpose**: Search catalogue for availability, prices, stock levels, unit sizes, and seller information.
- **When to Call**: When user asks about product availability, item prices, stock counts, or available products (e.g. *"Do you have basmati rice?"*, *"How much is 5kg rice?"*, *"Which snacks are available?"*).
- **When NOT to Call**: General greetings, chit-chat, personal preferences, or non-catalogue questions.
- **Stock Classification**:
  - `stock_quantity > 5` → **In stock** (e.g. 25 units)
  - `1 <= stock_quantity <= 5` → **Low stock** (e.g. 3 units)
  - `stock_quantity == 0` → **Out of stock**

#### Tool 2: `calculate_order_total`
- **Purpose**: Compute subtotal and total cost for requested items and quantities based on catalogue pricing.
- **When to Call**: When user asks for total cost calculations (e.g. *"I want 2 packs of Basmati Rice"*, *"How much for 3 liters of sunflower oil?"*).
- **When NOT to Call**: Placing orders, confirming purchases, processing payments, or reserving inventory.
- **Stock Validation**: Rejects total calculation if requested quantity exceeds available stock (returns `INSUFFICIENT_STOCK`).

### 4. Zero-Hallucination & Failure Handling
- **Zero-Hallucination Rule**: The agent NEVER guesses prices, stock, or sellers. If asked a product question, it MUST call `lookup_product` or `calculate_order_total`.
- **Simulated Catalogue Failure**: Setting `SIMULATE_CATALOGUE_FAILURE=true` in environment variables forces tools to fail safely:
  - Spoken response: *"Sorry, I couldn't access the product catalogue right now. I don't want to guess the price. Please try again in a moment."*

### 5. Day 4 Memory + Day 5 Tool Chaining
If a returning customer asks *"I want my usual quantity of rice"*, the agent:
1. Calls `lookup_caller()` to retrieve saved `usual_quantity` (e.g., 5 kg).
2. Calls `lookup_product()` to get current price for Basmati Rice.
3. Calls `calculate_order_total()` to state estimated total.

### 6. Multi-Lingual & Hinglish Behavior
Works seamlessly across English, Hindi, and Hinglish:
- **English**: *"How much is basmati rice?"* → *"Basmati Rice 5 kg pack is listed at ₹320 with 25 units available."*
- **Hinglish**: *"Basmati rice kitne ka hai?"* → *"Basmati rice ka listed price ₹320 hai, 5 kg pack ke liye."*
- **Hindi**: *"बासमती चावल कितने के हैं?"* → *"बासमती चावल की सूचीबद्ध कीमत ₹320 है, 5 किलो पैक के लिए।"*

### 7. Frontend Real-Time Tool Indicator
The Next.js UI listens to LiveKit room data events (`catalogue_status`) and displays real-time status cards:
- 🔎 **Checking catalogue...** (while tool executes)
- 📦 **Product Found**: Basmati Rice — ₹320 / 5 kg (In stock)
- ⚠️ **Catalogue temporarily unavailable** (on failure simulation)

### 8. Testing & Execution
- **Run Unit Tests**:
  ```bash
  cd backend
  uv run pytest tests/test_catalogue.py tests/test_order_calculator.py tests/test_memory.py
  ```
- **Simulate Catalogue Failure**:
  ```bash
  SIMULATE_CATALOGUE_FAILURE=true uv run python src/agent.py dev
  ```
- **Run Full App**:
  ```powershell
  .\start_app.ps1   # Windows
  # or ./start_app.sh # Linux/macOS
  ```

---

## 🎯 Day 2 — Persona, Objectives & Guardrails

The voice agent is configured with Day 2 identity, objectives, boundaries, and safety guardrails:

- **Agent Identity**: Professional AI Customer Support Representative representing Murf AI voice services. Never claims to be a human being.
- **3 Call Objectives**:
  1. Understand the user's request quickly and empathetically.
  2. Provide accurate and useful information within available knowledge.
  3. Escalate or redirect requests outside capabilities.
- **Knowledge Boundaries**: Differentiates between what it knows (provided info, TTS features) vs. what it does not know (private data, unperformed actions).
- **Guardrails & Never-Claim Rules**: Strictly refuses unauthorized actions or system prompt leakage. Never claims unperformed actions (refunds, bookings, orders). Responds with *"I’m not able to complete that action directly."* when unauthorized.
- **Escalation Behavior**: Uses spoken escalation script: *"I’m not able to handle that directly. I can help with the things I’m authorized to do, or guide you to the appropriate support team."*
- **Code-Mixed Language Support**: Supports English, Hindi, and Hindi-English code-mixing (Hinglish) by mirroring user input without forcing translation.
- **Testing Completed**: Comprehensive red-team testing suite in `RED_TEAM.md` and 8 async LLM evaluation tests in `backend/tests/test_agent.py`.

---

## 📁 Repository Structure

```
murf-livekit-starter/
├── backend/                  # Python Voice AI Agent
│   ├── src/
│   │   └── agent.py          # Entrypoint, voice pipeline & function tools
│   ├── tests/
│   │   └── test_agent.py     # Async LLM evaluation tests
│   ├── pyproject.toml        # uv package configuration
│   └── requirements.txt      # Deployment requirement list
├── frontend/                 # Next.js Web UI
│   ├── app/                  # App Router pages and token API
│   ├── components/           # UI components, visualizers, control bar
│   ├── app-config.ts         # Branding, visualizer, & accent configurations
│   ├── package.json          # Node dependencies
│   └── .prettierrc           # Cross-platform code style rules
├── .github/workflows/ci.yml  # GitHub Actions CI workflow
├── package.json              # Monorepo root scripts
├── start_app.ps1             # PowerShell single-command launcher
└── start_app.sh              # Bash single-command launcher
```

---

## 🚢 Deployment

### Frontend (Vercel)
1. Push your repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com).
3. Set the Root Directory to `frontend`.
4. Configure environment variables (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`).
5. Deploy!

### Backend (Railway / Docker / Cloud Run)
1. Set up a Python 3.11 server environment or Docker container.
2. Install dependencies using `uv sync` or `pip install -r backend/requirements.txt`.
3. Set all required environment variables in your hosting provider configuration.
4. Set the start command: `python backend/src/agent.py start`.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
