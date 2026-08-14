# Day 9 — Multi-Agent Specialist Handoff Documentation

This document describes the multi-agent voice architecture for the **Local Commerce Voice Assistant**, introducing the **Returns & Refunds Specialist Agent** alongside the **Main Commerce Agent** with seamless context-preserving handoff, visual UI feedback, Day 7 human escalation integration, and Day 8 analytics tracking.

---

## 1. Main Agent Responsibility

The **Main Commerce Agent** (Anisha) serves as the primary point of contact for customer calls.

**Responsibilities**:
- Product catalogue discovery ("Do you have Basmati Rice?", "What snacks do you sell?")
- Price checks & product availability ("How much is 5kg rice?", "Is mustard oil in stock?")
- Order total calculations ("Calculate total for 2 packs of rice")
- General store information & store hours ("When does the store open?")
- Basic order status inquiries ("What is my order status?")

---

## 2. Specialist Responsibility

The **Returns & Refunds Specialist Agent** handles post-purchase issues requiring domain-specific workflow.

**Responsibilities**:
- Return requests & return eligibility checks (`check_return_eligibility`)
- Refund status inquiries & refund processing timeline (`check_refund_status`)
- Damaged product complaints & wrong product received reports
- Missing product complaints
- Return process explanation and guidance
- Basic order dispute clarification

---

## 3. Handoff Conditions

The Main Agent **MUST** hand off when the user's primary request concerns:
1. `RETURN` ("Mujhe product return karna hai", "I want to return this item")
2. `REFUND` ("Mera refund kab milega?", "I need a refund for my order")
3. `DAMAGED_PRODUCT` ("Product damaged condition mein mila hai")
4. `WRONG_PRODUCT` ("Mujhe wrong item receive hua hai")
5. `MISSING_PRODUCT` ("Product box mein missing tha")
6. `REFUND_STATUS` ("Mere order ka refund status kya hai?")
7. `RETURN_ELIGIBILITY` ("Can I return this item after 5 days?")
8. `ORDER_DISPUTE` ("Order marked delivered but I didn't receive it")

**DO NOT Hand Off**:
- Catalogue inquiries ("Do you have Basmati rice?")
- Price enquiries ("Rice price kya hai?")
- Available items list ("Show available products")
- General delivery timeline ("Mera order kab deliver hoga?")

---

## 4. Handoff Architecture

```
                       ┌─────────────────────────┐
                       │   CUSTOMER CALL VOICE   │
                       └────────────┬────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │   MAIN COMMERCE AGENT   │
                       └────────────┬────────────┘
                                    │
              Trigger: Return / Refund / Damaged Intent
              Tool: handoff_to_returns_specialist
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          │                                                   │
          ▼                                                   ▼
┌──────────────────┐                               ┌──────────────────┐
│ HANDOFF CONTEXT  │                               │ LIVEKIT DATA CH. │
│ user_id, order_id│                               │  agent_handoff   │
│ intent, request  │                               │  "transferring"  │
└─────────┬────────┘                               └─────────┬────────┘
          │                                                   │
          └─────────────────────────┬─────────────────────────┘
                                    │
                       ┌────────────▼────────────┐
                       │    RETURNS & REFUNDS    │
                       │    SPECIALIST AGENT     │
                       └────────────┬────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           │                                                 │
  Unrelated Query                                 Payment / Financial Dispute
handoff_to_main_agent                            create_escalation (Permission)
           │                                                 │
           ▼                                                 ▼
┌─────────────────────┐                           ┌─────────────────────┐
│ MAIN COMMERCE AGENT │                           │   DAY 7 HUMAN ESC.  │
│   (Handback Flow)   │                           │ Ref: LC-2026-XXXX   │
└─────────────────────┘                           └─────────────────────┘
```

---

## 5. Context Passing

Before handoff, minimum required context is captured in a structured `HandoffContext` object and passed to the Specialist:

```json
{
  "user_id": "cust_default",
  "name": "Payal",
  "language": "Hinglish",
  "intent": "WRONG_PRODUCT",
  "user_request": "Mera order #12345 mein wrong product aa gaya hai aur mujhe refund chahiye.",
  "order_id": "12345",
  "relevant_product_info": "Basmati Rice (5kg)",
  "previous_tool_results": "lookup_product: found=True",
  "relevant_memory": "language_preference=Hinglish",
  "handoff_reason": "User requested WRONG_PRODUCT refund",
  "handoff_count": 1
}
```

The Specialist receives this context and starts immediately:
> *"नमस्ते Payal! मुझे आपकी refund request का context मिल गया है। मैं ऑर्डर #12345 का refund status check करके आपकी मदद करता हूँ।"*

The user is **NEVER** asked to repeat their problem.

---

## 6. Language Handling

The Specialist automatically mirrors the active conversation register across all turns:

- **English**: *"I'll help you check your refund status for order #12345."*
- **Devanagari Hindi**: *"नमस्ते! मैं आपका रिफंड स्टेटस चेक करने में मदद करता हूँ।"*
- **Hinglish (Roman Hindi)**: *"Sure, main aapka refund status check karta hoon."*

---

## 7. Specialist Guardrails

The Specialist enforces strict safety and truthfulness rules:
- **No Hallucinations**: Never invent refund approval, status, or refund amounts without verified database results.
- **No Credential Requests**: Never ask for passwords, OTPs, PINs, CVVs, or payment card details.
- **Graceful Unverified Fallback**: If data is unverified, state: *"मैं इस जानकारी को अभी verify नहीं कर पा रहा हूँ, इसलिए मैं अनुमान नहीं लगाऊँगा।"* and offer next steps.

---

## 8. Tool Usage

### Specialist Tools:
1. `check_return_eligibility`: Checks return policy window and item status from SQLite `orders` table.
2. `check_refund_status`: Queries verified refund transaction status.
3. `get_order_details`: Retrieves order details for verification.
4. `handoff_to_main_agent`: Hands back to Main Agent if user asks an unrelated product availability question.

---

## 9. Day 7 Escalation Integration

If the Specialist encounters a payment dispute, financial deduction issue, or unverified refund problem, it triggers Day 7 human escalation:
1. Spoken Permission Request: *"I can send a short summary of this issue to our support team. May I share that with them?"*
2. Call `create_escalation` ONLY after explicit YES.
3. Spoken Reference ID: *"Your support request has been created. Reference ID is LC-2026-XXXX."*

---

## 10. Day 8 Analytics Integration

All calls record multi-agent handoff metrics in SQLite `calls` table:
- `agent_type`: `'MAIN'` or `'SPECIALIST'`
- `handoff`: `1` (if handoff occurred) or `0`
- `handoff_target`: `'returns_refunds_specialist'` or `'main_agent'`

The analytics breakdowns API includes specialist handoff counts under the `specialist` key.

---

## 11. Test Cases & Verification Results

All 29 backend test cases pass cleanly:
- `test_handoff_context_defaults`: PASS
- `test_handoff_context_anti_loop_limit`: PASS
- `test_check_return_eligibility_existing_order`: PASS
- `test_check_return_eligibility_nonexistent_order`: PASS
- `test_check_refund_status_existing_order`: PASS
- `test_get_order_details`: PASS

---

## 12. Known Limitations

- Real banking gateways require live webhooks for final bank-settled refunds. Local development mode uses verified SQLite order records.
- Handoff depth limit is capped at 2 to avoid infinite loops.

---

## 13. Run Instructions

### Start Backend:
```bash
cd backend
uv run python src/agent.py dev
```

### Start Frontend:
```bash
cd frontend
pnpm dev
```
