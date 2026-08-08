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
    A[🎙️ User Audio Input] -->|LiveKit WebRTC| B[Deepgram STT (Nova-3)]
    B -->|Transcribed Text| C[Google Gemini LLM]
    C -->|Response Stream| D[Murf Falcon TTS]
    D -->|Streaming Audio| E[LiveKit Transport]
    E -->|Audio Output| F[🔊 User Hears Agent]

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

---

## 🎨 Day 3 — Personalized Voice Agent Frontend

The frontend is fully personalized for **Anisha — Murf AI Voice Support Assistant**, providing a state-of-the-art voice agent user experience:

- **Agent Identity**: **Anisha**, AI Customer Support Representative for Murf AI voice services (powered by Murf Falcon TTS voice `Anisha`).
- **5 Required Agent States**:
  1. **READY**: Landing view featuring Anisha's avatar badge, language support tag (**English • Hindi • Hinglish**), clear service description, and a prominent **Start Conversation** primary button.
  2. **CONNECTING**: Animated loading spinner with text *"Connecting to Anisha..."* and disabled action state to prevent duplicate connections.
  3. **LISTENING**: Explicit top status badge displaying *"Listening to you"* with a pulsing emerald microphone indicator.
  4. **SPEAKING**: Explicit top status badge displaying *"Anisha is speaking"* with an active indigo sound wave indicator.
  5. **CALL ENDED**: Clean post-call screen showing *"Conversation ended"* and a **Start Again** action button that enables instant re-connection without reloading the page.
- **Microphone Permission Handling**: Gracefully intercepts browser microphone permission blocks or missing devices to display clear, friendly recovery instructions (*"Microphone access is blocked. Please allow microphone access in your browser settings and try again."*) with a **Try Again** button.
- **Live Transcript & Controls**: Includes real-time chat transcript toggle, audio wave visualizers, microphone toggle, and end call button.
- **Responsive Layout**: Designed for seamless usage across Mobile (390px), Tablet (768px), Laptop (1280px), and Desktop (1440px) without horizontal scrolling or text overflow.

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
