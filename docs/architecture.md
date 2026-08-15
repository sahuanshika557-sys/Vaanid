# System Architecture — Local Commerce AI Voice Agent

This document provides a detailed breakdown of the system architecture, voice streaming pipeline, multi-agent context handoff, persistent memory, real-time tools, human support escalation, and call analytics engine powering the **Local Commerce AI Voice Agent** (Dukandar AI).

---

## 1. High-Level System Architecture

```mermaid
flowchart TD
    subgraph Client_Layer ["1. Client & Interface Layer"]
        WEB["🌐 Next.js Web UI\n(http://localhost:3000)"]
        SIP_CLIENT["📱 Linphone / Mobile Phone\n(Outbound Telephony)"]
        ADMIN["📊 Analytics & Support Portal\n(/analytics & /support)"]
    end

    subgraph Transport_Layer ["2. Real-Time Transport Layer"]
        LK["⚡ LiveKit WebRTC Server & SIP Gateway\n(Full-Duplex Audio & Room Data Channel)"]
    end

    subgraph Pipeline_Layer ["3. Voice AI Pipeline"]
        STT["🎤 Deepgram STT (Nova-3 Multilingual)\n- English, Hindi, Hinglish"]
        LLM["🧠 Google Gemini LLM (3.5 Flash Lite)\n- Instruction Following & Tool Calling"]
        TTS["🔊 Murf Falcon TTS (Anisha Voice)\n- ~55ms Latency Audio Streaming"]
        VAD["🎛️ Silero VAD & Multilingual Turn Detector"]
    end

    subgraph Multi_Agent_Core ["4. Multi-Agent Core (backend/src/agent.py)"]
        MAIN["🤖 Main Commerce Agent (Anisha)\n- Product Catalogue & Order Subtotals"]
        SPEC["🤖 Returns & Refunds Specialist\n- Returns, Refunds & Eligibility"]
    end

    subgraph Logic_Persistence ["5. Tools & Persistence Engine"]
        MEM["🧠 Persistent Memory Engine\n(customers table - Consent Gated)"]
        CAT["🛒 Catalogue Search Tool\n(lookup_product -> products.csv)"]
        CALC["🧮 Order Calculator Tool\n(calculate_order_total -> Subtotal)"]
        RET["📦 Specialist Tools\n(check_refund_status & eligibility)"]
        ESC["👨💼 Escalation Tool\n(create_escalation -> LC-2026-XXXX)"]
        DB[("💾 SQLite Database\nbackend/local_commerce_memory.db")]
    end

    WEB <-->|"WebRTC Audio & Data Events"| LK
    SIP_CLIENT <-->|"SIP / TLS RTP Streams"| LK
    LK <--> STT
    LK <--> TTS
    STT --> MAIN
    STT --> SPEC
    MAIN --> LLM
    SPEC --> LLM
    LLM --> TTS
    TTS --> LK

    MAIN <-->|"Context-Preserving Handoff"| SPEC
    MAIN <--> MEM
    MAIN <--> CAT
    MAIN <--> CALC
    MAIN <--> ESC
    SPEC <--> RET
    SPEC <--> ESC

    MEM <--> DB
    CAT <--> DB
    CALC <--> DB
    RET <--> DB
    ESC <--> DB
    ADMIN <-->|"Next.js API Routes & db_api.py"| DB
```

---

## 2. Voice Pipeline Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer (Browser / Phone)
    participant UI as Next.js Web UI / LiveKit
    participant STT as Deepgram Nova-3 STT
    participant Agent as Python Agent (agent.py)
    participant Tools as Function Tools / DB
    participant LLM as Google Gemini LLM
    participant TTS as Murf Falcon TTS

    User->>UI: Speaks audio utterance ("Basmati rice price kitna hai?")
    UI->>STT: WebRTC streaming audio chunks
    STT-->>Agent: Transcribed text ("Basmati rice price kitna hai?")
    Agent->>LLM: Pass text + system prompt + tool schemas
    LLM-->>Agent: Request tool call `lookup_product(product_query="Basmati rice")`
    Agent->>Tools: Execute `lookup_product_data("Basmati rice")`
    Tools-->>Agent: Return product details (Price: ₹320, Stock: 25, Unit: 5kg)
    Agent->>LLM: Supply tool output result
    LLM-->>Agent: Generated response text ("Basmati Rice 5 kg pack is ₹320 with 25 units available.")
    Agent->>TTS: Stream response text to Murf Falcon
    TTS-->>UI: Stream audio bytes (~55ms latency)
    UI-->>User: Plays spoken audio response to customer
```

---

## 3. Multi-Agent Handoff Architecture (Day 9)

```mermaid
flowchart TD
    START["🎙️ Call Initiated"] --> MAIN["🤖 Main Commerce Agent (Anisha)"]
    
    MAIN --> INTENT{"Detect User Intent"}
    
    INTENT -- "Catalogue / Price Query" --> CAT_TOOL["🛒 lookup_product / calculate_order_total"]
    INTENT -- "General Store Question" --> STORE_INFO["ℹ️ Provide Store Hours / Info"]
    
    INTENT -- "Return / Refund / Damaged / Missing Item" --> HANDOFF_SPEC["🔄 Tool: handoff_to_returns_specialist"]
    
    HANDOFF_SPEC --> SPEC["🤖 Returns & Refunds Specialist Agent"]
    
    SPEC --> SPEC_INTENT{"Specialist Query Type"}
    
    SPEC_INTENT -- "Return Eligibility Check" --> ELIG_TOOL["📦 check_return_eligibility"]
    SPEC_INTENT -- "Refund Status Inquiry" --> REF_TOOL["💳 check_refund_status"]
    SPEC_INTENT -- "Unrelated Catalogue Question" --> HANDBACK_MAIN["🔄 Tool: handoff_to_main_agent"]
    SPEC_INTENT -- "Financial / Payment Dispute" --> ESC_FLOW["👨💼 Tool: create_escalation"]
    
    HANDBACK_MAIN --> MAIN
    ESC_FLOW --> TICKET["📋 Support Ticket Created (LC-2026-XXXX)"]
```

---

## 4. Consent-Based Escalation Architecture (Day 7)

```mermaid
sequenceDiagram
    autonumber
    actor User as Customer
    participant Agent as Voice Agent (Main / Specialist)
    participant DB as SQLite (escalations table)
    participant Portal as Support Portal (/support)

    User->>Agent: Reports payment failed / refund issue ("Money deducted but no order confirm")
    Agent->>User: Asks permission ("May I share a summary of this issue with our support team?")
    
    alt Customer Denies Consent ("No" / "Nahi")
        User->>Agent: "No, don't share"
        Agent->>User: "Understood. I won't share your information."
    else Customer Grants Consent ("Yes" / "Haan, bhej do")
        User->>Agent: "Yes, share it with support"
        Agent->>DB: Execute `create_escalation()` -> Generates Ref ID `LC-2026-0001`
        DB-->>Agent: Ticket created successfully
        Agent->>User: Speaks Ref ID ("Support ticket created with reference ID LC-2026-0001.")
        DB-->>Portal: Real-time ticket visible in `/support` dashboard
    end
```

---

## 5. Outbound Telephony Architecture (Day 6)

```mermaid
flowchart LR
    DISPATCHER["🐍 Outbound Dispatcher\n(dial.py)"] --> DB_CHECK{"Check Opt-Out Table\n(opt_outs)"}
    
    DB_CHECK -- "User Opted Out" --> BLOCKED["🚫 Dialing Blocked"]
    DB_CHECK -- "Not Opted Out" --> LK_SIP["⚡ LiveKit Telephony Gateway"]
    
    LK_SIP --> SIP_TRUNK["🔌 SIP Trunk (linphone-trunk)"]
    SIP_TRUNK --> LINPHONE["📱 Linphone App / Phone"]
    
    LINPHONE <-->|"Full-Duplex Audio (TTS + STT)"| AGENT["🤖 Outbound Voice Worker\n(telephony/outbound/agent.py)"]
```

---

## 6. Database Entity-Relationship Diagram

```mermaid
erDiagram
    customers {
        text user_id PK
        text name
        text language_preference
        text preferred_delivery_slot
        text usual_quantity
        text past_orders
        text last_interaction
        text created_at
        text updated_at
    }

    orders {
        text order_id PK
        text user_id FK
        text customer_name
        text phone_or_sip
        text product_name
        real quantity
        real estimated_total
        text status
        text created_at
        text updated_at
    }

    calls {
        integer id PK
        text call_id UK
        text user_id FK
        text channel
        text started_at
        text ended_at
        integer duration_seconds
        text language
        text intent
        text agent_type
        integer handoff
        text handoff_target
        text success_condition
        text outcome
        text failure_reason
        integer escalated
        text created_at
        text updated_at
    }

    escalations {
        integer id PK
        text reference_id UK
        text user_id FK
        text customer_name
        text issue_type
        text issue_summary
        text verified_information
        text urgency
        text language
        text preferred_followup_method
        text status
        text created_at
        text updated_at
    }

    call_logs {
        text call_id PK
        text order_id FK
        text user_id FK
        text destination
        text outcome
        text timestamp
        integer retry_count
    }

    opt_outs {
        text destination PK
        text user_id FK
        text opted_out_at
    }

    customers ||--o{ orders : "places"
    customers ||--o{ calls : "makes"
    customers ||--o{ escalations : "creates"
    orders ||--o{ call_logs : "triggers"
```

---

## 7. Component Summary Matrix

| Component | Technology | Primary File Location | Responsibilities |
|---|---|---|---|
| **Voice Agent Pipeline** | LiveKit SDK + Python | `backend/src/agent.py` | Orchestrates STT, LLM, TTS, VAD, and room connections |
| **Main Assistant** | System Prompt + Gemini | `backend/src/agent.py` | Product search, store info, subtotal calculation |
| **Returns Specialist** | System Prompt + Gemini | `backend/src/agent.py` | Return eligibility, refund status, damaged items |
| **Catalogue Tool** | Python CSV Reader | `backend/src/tools/catalogue_tool.py` | Queries `data/products.csv` for prices and stock |
| **Order Calculator Tool** | Python Math Engine | `backend/src/tools/order_tool.py` | Computes subtotals and checks stock sufficiency |
| **Memory Engine** | SQLite Database | `backend/src/database/memory.py` | Manages customer memory, consent, calls & escalations |
| **SQLite CLI Bridge** | Python Subprocess Bridge | `backend/src/database/db_api.py` | Bridges Next.js API routes with SQLite without native C++ addons |
| **Frontend Web App** | Next.js 15 + React 19 | `frontend/app/page.tsx` | Interactive voice UI with visual agent states |
| **Analytics Dashboard** | Next.js + Recharts/Lucide | `frontend/app/analytics/page.tsx` | Visualizes call volume, success rates & failure metrics |
| **Support Ticket Portal** | Next.js App Router | `frontend/app/support/page.tsx` | Displays human escalation tickets with status filters |
