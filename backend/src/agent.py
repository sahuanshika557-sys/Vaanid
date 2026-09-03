import asyncio
import json
import logging
import os
import sys
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

# Low-memory constraints for 512MB cloud environments (Render, etc.)
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["MKL_NUM_THREADS"] = "1"
os.environ["OPENBLAS_NUM_THREADS"] = "1"
os.environ["VECLIB_MAXIMUM_THREADS"] = "1"
os.environ["NUMEXPR_NUM_THREADS"] = "1"
os.environ["TOKENIZERS_PARALLELISM"] = "false"

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass
    os.environ["PYTHONIOENCODING"] = "utf-8"

from dotenv import load_dotenv
from livekit import rtc
from livekit.agents import (
    Agent,
    AgentServer,
    AgentSession,
    AutoSubscribe,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    room_io,
    tokenize,
)
from livekit.plugins import deepgram, google, murf, noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from database.memory import (
    create_call_record,
    create_escalation_record,
    delete_customer,
    finalize_call_analytics,
    get_customer,
    init_db,
    update_call_event,
    update_customer,
    update_last_interaction,
)
from services.handoff_service import HandoffContext
from tools.cart_tool import manage_cart_data
from tools.catalogue_tool import lookup_product_data
from tools.merchant_copilot_tools import query_merchant_copilot
from tools.order_tool import calculate_order_data
from tools.recommendation_tool import recommend_products_data
from tools.returns_refunds_tools import (
    check_refund_status_data,
    check_return_eligibility_data,
    get_order_details_data,
)

logger = logging.getLogger("agent")

load_dotenv(".env.local")


async def get_caller_identity(ctx: JobContext) -> str:
    """Safely retrieve connected participant identity without blocking indefinitely."""
    for _ in range(10):
        if ctx.room and ctx.room.remote_participants:
            p = next(iter(ctx.room.remote_participants.values()), None)
            if p and p.identity:
                return p.identity
        await asyncio.sleep(0.2)
    return "cust_default"


MAIN_COMMERCE_SYSTEM_PROMPT = """You are Anisha, the Main Commerce Assistant representing Murf AI and Local Commerce businesses.

IDENTITY:
- Name: Anisha, Main Commerce Assistant.
- Role: Primary AI Assistant for local shops, product catalogue discovery, availability, price estimation, and general store information.
- Nature: You are an AI assistant. Never claim to be a human being.

CALL OBJECTIVES:
1. Help users discover products, check stock levels, calculate order totals, and answer store questions.
2. Maintain natural, multilingual conversation in English, Hindi (Devanagari), or Hinglish (Roman Hindi).
3. MANDATORY SPECIALIST HANDOFF: Detect return, refund, damaged product, wrong product, missing product, refund status, or return eligibility intents for existing orders and hand off to the Returns & Refunds Specialist using handoff_to_returns_specialist.

MURF AI VOICE SERVICE FEATURES KNOWLEDGE:
- Murf AI voice services offer high-fidelity text-to-speech, natural streaming voices (like Murf Falcon), studio-quality voices in multiple languages and Indian regional accents, customizable voice styles, and low-latency voice integration for AI agents.

APP SETUP & RESOURCES GUIDANCE:
- If asked how to set up the app on a phone (e.g. "How can I set up the app on my phone?"), guide the user concisely: "You can download and set up the app from the App Store or Google Play Store, or visit our official website for step-by-step setup guides."

KNOWLEDGE & SCOPE BOUNDARIES:
- If a user requests unauthorized system modifications, server setting changes, or demands to contact executives (e.g., "VP of Engineering"), state clearly: "I'm not able to handle that directly. I can help you with authorized product searches, store info, or guide you to appropriate support options."
- NEVER CLAIM UNPERFORMED ACTIONS: Never claim that a refund has been processed, payment confirmed, or order placed unless verified by tools. If asked hypothetical questions about credit card refund confirmations (e.g., "Can you confirm that you have refunded $50 to my credit card?"), DO NOT call handoff tools. State directly: "I cannot process refunds or manage account transactions directly, but I can help with store topics or connect you with support."

HARD GUARDRAIL — ORDER CONFIRMATION / PLACEMENT REFUSAL:
- YOU CANNOT PLACE OR CONFIRM ORDERS DIRECTLY.
- When a user asks to confirm or place an order directly (e.g. "Just confirm my order", "बस मेरा ऑर्डर कन्फर्म कर दो"): YOU MUST REFUSE directly in their language.
- Explain clearly: "I cannot place or confirm orders directly. I can check product details or calculate estimated totals for you." (In Hindi: "मैं सीधे ऑर्डर प्लेस या कन्फर्म नहीं कर सकती हूँ। मैं प्रोडक्ट्स चेक कर सकती हूँ या अनुमानित टोटल निकाल सकती हूँ।"). NEVER ask for an order ID to confirm an order.

PRIMARY RESPONSIBILITIES (MAIN AGENT HANDLES):
- Product discovery & catalogue lookups ("Do you have Basmati Rice?", "What snacks do you sell?")
- Price checks & availability ("Rice ka price kya hai?", "Is mustard oil available?")
- Order total calculations ("Calculate total for 2 rice packs")
- Store information & general order status ("When will store open?", "Mera order status kya hai?")

HANDOFF CONDITIONS (MUST CALL handoff_to_returns_specialist FOR EXISTING ORDERS):
- User asks to return an item ("I want to return my product", "Mujhe product return karna hai")
- User asks for refund status or money back on an order ("Mera refund kab tak aayega?", "Where is my refund?")
- User reports damaged product ("Product damaged condition mein mila hai")
- User reports wrong product received ("Mujhe wrong product receive hua")
- User reports missing item ("Product missing hai")
- Return eligibility questions ("Can I return this item?", "Kya ye return ho sakta hai?")
- Basic order dispute clarification

DO NOT HAND OFF FOR:
- "Do you have Basmati rice?"
- "Rice ka price kya hai?"
- "Which products are available?"
- "Mera order kab deliver hoga?"
- "Show me available products."
- Hypothetical questions asking if a credit card refund was already processed without an order ID.

MANDATORY HANDOFF TOOL USAGE:
- Speak a warm, natural transition sentence in the user's language before handoff:
  - Hindi: "समझ गया। यह return/refund से related request है। मैं आपको हमारे Returns & Refunds Specialist से connect करता हूँ।"
  - Hinglish: "Samajh gaya. Yeh return/refund request hai. Main aapko Returns & Refunds Specialist se connect karta hoon."
  - English: "Understood. I am connecting you to our Returns & Refunds Specialist."

REAL-TIME PRODUCT & CATALOGUE TOOLS (DAY 5):
- You MUST call lookup_product for product availability/prices.
- You MUST call calculate_order_total for total calculations.
- NEVER invent prices or stock levels. State data freshness clearly.
- TOOL FAILURE GRACEFUL HANDLING: If lookup_product or calculate_order_total returns CATALOGUE_UNAVAILABLE or error, YOU MUST ALWAYS INCLUDE AN EXPLICIT APOLOGY WORD ('Sorry', 'Apologies', 'माफ़ कीजिए'). Example: "Sorry, the product catalogue is currently offline and unreachable. I cannot check the price right now."

CUSTOMER MEMORY & MANDATORY CONSENT (DAY 4):
- Ask explicit consent before saving any personal fact ("Would you like me to remember...?"). Save ONLY if user says YES.

HUMAN SUPPORT ESCALATION (DAY 7):
- Ask explicit permission before calling create_escalation ("May I share that with the support team?").

VOICE-FIRST ULTRA-FAST RESPONSE STYLE:
- Keep every response snappy, direct, and under 12-15 words.
- Answer immediately in the caller's language (Hindi / Hinglish / English).
- No unnecessary pleasantries or fluff. State the product details, prices, or cart actions directly.
- Example: "Basmati rice 5kg ka pack 320 rupaye ka hai. Kya cart me add karein?"
"""


RETURNS_REFUNDS_SPECIALIST_PROMPT = """You are the Returns & Refunds Specialist for the Local Commerce Voice Assistant.

IDENTITY:
- Role: Returns & Refunds Specialist.
- Primary Responsibility: Dedicated specialist handling return requests, refund requests, damaged product complaints, wrong product received, missing product complaints, return eligibility questions, refund status, return process explanation, and basic order-dispute clarification.

SPECIALIST SCOPE (HANDLE ONLY THESE):
- Return requests & return process guidance
- Refund status inquiries & refund eligibility
- Damaged product complaints & wrong/missing product issues
- Verification of order return windows

SPECIALIST GUARDRAILS (HARD RULES):
- NEVER invent refund status, return eligibility, refund amount, delivery dates, or order details.
- NEVER claim a refund has been processed or return approved without verified tool data (check_return_eligibility, check_refund_status, get_order_details).
- NEVER ask for passwords, OTP, PIN, CVV, or card details.
- If information is unavailable or unverified, state clearly: "मैं इस जानकारी को अभी verify नहीं कर पा रहा हूँ, इसलिए मैं अनुमान नहीं लगाऊँगा।" / "I am unable to verify this information right now..." and provide appropriate next steps.

CONTEXT CONTINUITY:
- You will receive captured context from Main Agent (user name, request, order ID, product info, language).
- DO NOT ask the user to repeat their problem. Acknowledge their issue directly using the received context!
- Example: "नमस्ते Payal! मुझे आपकी refund request का context मिल गया है। मैं ऑर्डर #12345 का refund status check करके आपकी मदद करता हूँ।"

SPECIALIST → MAIN AGENT HANDOFF:
- If the user asks an unrelated product availability or catalogue question after resolving their return/refund issue (e.g. "Waise Basmati rice available hai?"):
  Call handoff_to_main_agent and say: "यह product availability से related question है। मैं आपको main commerce assistant से connect करता हूँ।"

HUMAN ESCALATION INTEGRATION (DAY 7):
- If the user reports a financial dispute, payment deduction failure, serious order dispute, or requests human support:
  Explain why human support is required and ask explicit permission before calling create_escalation:
  "I can send a short summary of this issue to our support team. May I share that with them?"

LANGUAGE & REGISTER MIRRORING:
- Mirror the user's active language: Devanagari Hindi for Hindi, Roman Hindi for Hinglish, and English for English.

VOICE-FIRST RESPONSE STYLE:
- Speak naturally in short sentences under 20 words. Never output raw JSON, code, or internal tool names.
"""


class Assistant(Agent):
    def __init__(
        self, user_id: str = "cust_default", ctx: JobContext | None = None
    ) -> None:
        self.user_id = user_id
        self.ctx = ctx
        self.call_id = ctx.room.name if (ctx and ctx.room) else None
        self.agent_type = "MAIN"  # "MAIN" or "SPECIALIST"
        self.handoff_ctx = HandoffContext(user_id=user_id)
        super().__init__(instructions=MAIN_COMMERCE_SYSTEM_PROMPT)

    async def _publish_tool_event(self, tool_name: str, payload: dict) -> None:
        """Send real-time status to frontend connected participants via LiveKit data channel."""
        if self.ctx and self.ctx.room and self.ctx.room.local_participant:
            try:
                event_data = json.dumps(
                    {
                        "type": "catalogue_status",
                        "tool_name": tool_name,
                        "data": payload,
                    }
                ).encode("utf-8")
                await self.ctx.room.local_participant.publish_data(
                    event_data,
                    topic="catalogue_status",
                )
            except Exception as e:
                logger.warning(f"Could not publish tool event to room: {e}")

    async def _publish_handoff_event(self, status: str, agent_name: str) -> None:
        """Publish real-time handoff visual state to frontend via LiveKit data channel."""
        if self.ctx and self.ctx.room and self.ctx.room.local_participant:
            try:
                event_data = json.dumps(
                    {
                        "type": "agent_handoff",
                        "status": status,  # "transferring", "active"
                        "agent": self.agent_type.lower(),
                        "agent_name": agent_name,
                        "handoff_count": self.handoff_ctx.handoff_count,
                    }
                ).encode("utf-8")
                await self.ctx.room.local_participant.publish_data(
                    event_data,
                    topic="agent_handoff",
                )
            except Exception as e:
                logger.warning(f"Could not publish handoff event to room: {e}")

    # =========================================================================
    # TOOL 1: PRODUCT LOOKUP (MAIN AGENT & SPECIALIST)
    # =========================================================================
    @function_tool
    async def lookup_product(self, context: RunContext, product_query: str) -> dict:
        """Find product catalogue information such as availability, price, stock quantity, seller, and unit size.

        Args:
            product_query: The name, category, or search phrase for the product (e.g. 'basmati rice', 'mustard oil').
        """
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_STARTED: lookup_product query='{product_query}'"
        )
        res = lookup_product_data(product_query)
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_COMPLETED: lookup_product found={res.get('found')}"
        )
        await self._publish_tool_event("lookup_product", res)

        if self.call_id:
            update_call_event(
                call_id=self.call_id,
                intent="PRODUCT_ENQUIRY",
                agent_type=self.agent_type,
                tool_failed=not res.get("found", True),
                success_condition=f"Product enquiry answered for '{product_query}'"
                if res.get("found")
                else None,
            )

        return res

    # =========================================================================
    # TOOL 2: ORDER TOTAL CALCULATOR (MAIN AGENT)
    # =========================================================================
    @function_tool
    async def calculate_order_total(
        self,
        context: RunContext,
        product_query: str,
        quantity: float = 1.0,
        additional_items_json: str | None = None,
    ) -> dict:
        """Calculate the estimated total price for specific product quantities from the catalogue.

        Args:
            product_query: Name or search query of the primary product (e.g. 'Basmati Rice').
            quantity: The quantity requested (must be a positive number, e.g. 2).
            additional_items_json: Optional JSON string of extra items.
        """
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_STARTED: calculate_order_total query='{product_query}', qty={quantity}"
        )
        items = [{"product_query": product_query, "quantity": quantity}]
        if additional_items_json:
            try:
                parsed = json.loads(additional_items_json)
                if isinstance(parsed, list):
                    items.extend(parsed)
            except Exception as e:
                logger.warning(f"Could not parse additional_items_json: {e}")

        res = calculate_order_data(items)
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_COMPLETED: calculate_order_total success={res.get('success')}"
        )
        await self._publish_tool_event("calculate_order_total", res)

        if self.call_id:
            update_call_event(
                call_id=self.call_id,
                intent="CATALOGUE_LOOKUP",
                agent_type=self.agent_type,
                tool_failed=not res.get("success", True),
                success_condition=f"Order total calculated for '{product_query}'"
                if res.get("success")
                else None,
            )

        return res

    # =========================================================================
    # TOOL 3: LOOKUP CALLER MEMORY (DAY 4)
    # =========================================================================
    @function_tool
    async def lookup_caller(
        self, context: RunContext, user_id: str | None = None
    ) -> dict:
        """Look up a caller's saved customer memory.

        Args:
            user_id: The unique customer ID of the caller (optional).
        """
        target_id = user_id or self.user_id
        logger.info(f"Looking up customer memory for '{target_id}'")
        cust = get_customer(target_id)
        if cust:
            return {"found": True, **cust}
        return {"found": False, "user_id": target_id}

    # =========================================================================
    # TOOL 4: SAVE CALLER MEMORY (DAY 4 - CONSENT REQUIRED)
    # =========================================================================
    @function_tool
    async def save_caller_memory(
        self,
        context: RunContext,
        user_id: str | None = None,
        name: str | None = None,
        language_preference: str | None = None,
        preferred_delivery_slot: str | None = None,
        usual_quantity: str | None = None,
        past_orders: str | None = None,
    ) -> dict:
        """Save or update customer memory AFTER receiving explicit user consent.

        Args:
            user_id: Customer ID.
            name: Customer's preferred name.
            language_preference: Preferred language (English, Hindi, Hinglish).
            preferred_delivery_slot: Preferred slot (Morning, Evening).
            usual_quantity: Typical quantity ordered.
            past_orders: Summary of past verified orders.
        """
        target_id = user_id or self.user_id
        logger.info(f"Saving customer memory for '{target_id}'")
        try:
            res = update_customer(
                user_id=target_id,
                name=name,
                language_preference=language_preference,
                preferred_delivery_slot=preferred_delivery_slot,
                usual_quantity=usual_quantity,
                past_orders=past_orders,
            )
            if res:
                return {
                    "success": True,
                    "message": "Customer memory updated successfully.",
                }
            return {"success": False, "message": "Unable to save customer memory."}
        except Exception as e:
            logger.error(f"Failed to save customer memory for '{target_id}': {e}")
            return {"success": False, "message": "Error saving customer memory."}

    # =========================================================================
    # TOOL 5: FORGET CALLER (DAY 4)
    # =========================================================================
    @function_tool
    async def forget_caller(
        self, context: RunContext, user_id: str | None = None
    ) -> dict:
        """Delete all saved memory for a customer when requested."""
        target_id = user_id or self.user_id
        logger.info(f"Deleting customer memory for '{target_id}'")
        success = delete_customer(target_id)
        if success:
            return {"success": True, "message": "Customer memory removed."}
        return {"success": False, "message": "Unable to remove customer memory."}

    # =========================================================================
    # TOOL 6: HUMAN ESCALATION (DAY 7 - PERMISSION REQUIRED)
    # =========================================================================
    @function_tool
    async def create_escalation(
        self,
        context: RunContext,
        issue_type: str,
        issue_summary: str,
        customer_name: str | None = None,
        verified_information: str | None = None,
        urgency: str | None = None,
        language: str | None = None,
        preferred_followup_method: str | None = None,
        user_id: str | None = None,
    ) -> dict:
        """Create a real human support escalation request in the system database.

        Args:
            issue_type: 'PAYMENT_REFUND', 'ORDER_DISPUTE', or 'OTHER_ESCALATION'.
            issue_summary: Brief summary of the issue (under 30 words).
            customer_name: Customer's name.
            verified_information: Details verified by agent.
            urgency: 'LOW', 'MEDIUM', or 'HIGH'.
            language: Active conversation language.
            preferred_followup_method: 'Phone', 'Email', 'App', or 'SMS'.
            user_id: Customer ID override.
        """
        target_user = user_id or self.user_id
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_STARTED: create_escalation target='{target_user}', issue_type='{issue_type}'"
        )
        await self._publish_tool_event(
            "create_escalation", {"status": "creating", "issue_type": issue_type}
        )

        res = create_escalation_record(
            user_id=target_user,
            customer_name=customer_name or self.handoff_ctx.name,
            issue_type=issue_type,
            issue_summary=issue_summary,
            verified_information=verified_information,
            urgency=urgency,
            language=language or self.handoff_ctx.language,
            preferred_followup_method=preferred_followup_method,
        )

        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_COMPLETED: create_escalation success={res.get('success')}, ref={res.get('reference_id')}"
        )

        status_event = "created" if res.get("success") else "failed"
        if res.get("is_duplicate"):
            status_event = "duplicate"

        await self._publish_tool_event(
            "create_escalation",
            {
                "status": status_event,
                "reference_id": res.get("reference_id"),
                "is_duplicate": res.get("is_duplicate", False),
                "urgency": res.get("urgency"),
                "message": res.get("message"),
            },
        )

        if self.call_id:
            esc_intent = "HUMAN_ESCALATION"
            if issue_type == "PAYMENT_REFUND":
                esc_intent = "PAYMENT_ISSUE"
            elif issue_type == "ORDER_DISPUTE":
                esc_intent = "ORDER_DISPUTE"

            update_call_event(
                call_id=self.call_id,
                intent=esc_intent,
                agent_type=self.agent_type,
                escalated=True,
                success_condition=f"Escalation request created with ref {res.get('reference_id')}"
                if res.get("success")
                else None,
            )

        return res

    # =========================================================================
    # SPECIALIST TOOL 7: CHECK RETURN ELIGIBILITY (DAY 9)
    # =========================================================================
    @function_tool
    async def check_return_eligibility(
        self,
        context: RunContext,
        order_id: str | None = None,
        user_id: str | None = None,
    ) -> dict:
        """Check if an order item is eligible for return based on purchase date and order status.

        WHEN TO CALL: Call when a user asks if their order item can be returned.
        """
        target_user = user_id or self.user_id
        target_order = order_id or self.handoff_ctx.order_id
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_STARTED: check_return_eligibility order_id='{target_order}'"
        )

        res = check_return_eligibility_data(order_id=target_order, user_id=target_user)
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_COMPLETED: check_return_eligibility verified={res.get('verified')}, eligible={res.get('eligible')}"
        )
        await self._publish_tool_event("check_return_eligibility", res)

        if self.call_id:
            update_call_event(
                call_id=self.call_id,
                intent="RETURN_ELIGIBILITY",
                agent_type=self.agent_type,
                success_condition=f"Return eligibility verified for order {target_order}"
                if res.get("verified")
                else None,
            )

        return res

    # =========================================================================
    # SPECIALIST TOOL 8: CHECK REFUND STATUS (DAY 9)
    # =========================================================================
    @function_tool
    async def check_refund_status(
        self,
        context: RunContext,
        order_id: str | None = None,
        user_id: str | None = None,
    ) -> dict:
        """Check the verified refund status and expected timeline for an order refund request.

        WHEN TO CALL: Call when a user asks about their refund status or when their refund will arrive.
        """
        target_user = user_id or self.user_id
        target_order = order_id or self.handoff_ctx.order_id
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_STARTED: check_refund_status order_id='{target_order}'"
        )

        res = check_refund_status_data(order_id=target_order, user_id=target_user)
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_COMPLETED: check_refund_status verified={res.get('verified')}"
        )
        await self._publish_tool_event("check_refund_status", res)

        if self.call_id:
            update_call_event(
                call_id=self.call_id,
                intent="REFUND_STATUS",
                agent_type=self.agent_type,
                success_condition=f"Refund status checked for order {target_order}"
                if res.get("verified")
                else None,
            )

        return res

    # =========================================================================
    # SPECIALIST TOOL 9: GET ORDER DETAILS (DAY 9)
    # =========================================================================
    @function_tool
    async def get_order_details(
        self,
        context: RunContext,
        order_id: str | None = None,
        user_id: str | None = None,
    ) -> dict:
        """Retrieve full verified details for an order.

        WHEN TO CALL: Call when verifying order contents, items, or status during return/refund requests.
        """
        target_user = user_id or self.user_id
        target_order = order_id or self.handoff_ctx.order_id
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_STARTED: get_order_details order_id='{target_order}'"
        )

        res = get_order_details_data(order_id=target_order, user_id=target_user)
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_COMPLETED: get_order_details found={res.get('found')}"
        )
        await self._publish_tool_event("get_order_details", res)

        return res

    # =========================================================================
    # AGENTIC COMMERCE TOOL 10: AI PRODUCT RECOMMENDATIONS (TRACK 1)
    # =========================================================================
    @function_tool
    async def recommend_products(
        self,
        context: RunContext,
        budget: float | None = None,
        category: str | None = None,
        query: str | None = None,
    ) -> dict:
        """Recommend verified in-stock products based on customer budget, category, or natural request.

        WHEN TO CALL:
        - When a customer asks for recommendations (e.g. 'Suggest groceries under 2000', '₹1000 mein kitchen items batao').
        - When recommending alternative or popular products.
        """
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_STARTED: recommend_products budget={budget}, category='{category}'"
        )
        res = recommend_products_data(
            query=query, budget=budget, category=category, user_id=self.user_id
        )
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_COMPLETED: recommend_products count={res.get('count')}"
        )
        await self._publish_tool_event("recommend_products", res)
        return res

    # =========================================================================
    # AGENTIC COMMERCE TOOL 11: SMART CART & CHECKOUT AGENT (TRACK 1)
    # =========================================================================
    @function_tool
    async def manage_cart(
        self,
        context: RunContext,
        action: str,
        product_name: str | None = None,
        quantity: float = 1.0,
    ) -> dict:
        """Autonomous cart and checkout manager for adding, removing, viewing, or initiating checkout.

        WHEN TO CALL:
        - When customer wants to add an item to cart (e.g. '2 kg rice add kar do').
        - When customer wants to view current cart (e.g. 'Cart mein kya hai?').
        - When customer wants to remove an item or clear cart.
        - When customer initiates checkout or requests a payment link / QR.
        """
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_STARTED: manage_cart action='{action}', product='{product_name}', qty={quantity}"
        )
        res = manage_cart_data(
            action=action,
            product_name=product_name,
            quantity=quantity,
            user_id=self.user_id,
        )
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_COMPLETED: manage_cart success={res.get('success')}"
        )
        await self._publish_tool_event("manage_cart", res)
        return res

    # =========================================================================
    # AGENTIC COMMERCE TOOL 12: MERCHANT COPILOT (TRACK 1)
    # =========================================================================
    @function_tool
    async def merchant_copilot_query(
        self, context: RunContext, query: str
    ) -> dict:
        """Answer merchant business analytics questions (revenue, low stock, abandoned carts, top sellers).

        WHEN TO CALL: When a merchant asks business intelligence questions.
        """
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_STARTED: merchant_copilot_query query='{query}'"
        )
        res = query_merchant_copilot(query)
        logger.info(
            f"[VOICE_PIPELINE] TOOL_CALL_COMPLETED: merchant_copilot_query success={res.get('success')}"
        )
        await self._publish_tool_event("merchant_copilot_query", res)
        return res

    # =========================================================================
    # DAY 9 HANDOFF TOOL: MAIN AGENT -> RETURNS & REFUNDS SPECIALIST
    # =========================================================================
    @function_tool
    async def handoff_to_returns_specialist(
        self,
        context: RunContext,
        intent: str,
        user_request: str,
        order_id: str | None = None,
        product_info: str | None = None,
        language: str | None = None,
        handoff_reason: str | None = None,
    ) -> dict:
        """Hand off conversation from Main Agent to Returns & Refunds Specialist.

        WHEN TO CALL:
        Call this tool when the user's primary request concerns:
        - Return requests (RETURN)
        - Refund requests or refund status (REFUND, REFUND_STATUS)
        - Damaged product complaints (DAMAGED_PRODUCT)
        - Wrong product received (WRONG_PRODUCT)
        - Missing product complaints (MISSING_PRODUCT)
        - Return eligibility questions (RETURN_ELIGIBILITY)
        - Order dispute clarification (ORDER_DISPUTE)

        WHEN NOT TO CALL:
        DO NOT call for normal product discovery, catalogue lookup, product availability, general store info, or hypothetical refund confirmation questions without an order ID.

        Args:
            intent: Detected return/refund intent (e.g., 'REFUND', 'RETURN', 'DAMAGED_PRODUCT', 'WRONG_PRODUCT').
            user_request: Original user request phrase.
            order_id: Order ID if provided by user or context (e.g., '12345').
            product_info: Relevant product details if mentioned.
            language: Active conversation language ('Hindi', 'Hinglish', 'English').
            handoff_reason: Reason for handoff.
        """
        logger.info(
            f"[HANDOFF_SERVICE] HANDOFF_INITIATED: Main -> Specialist (intent='{intent}', order='{order_id}')"
        )

        # Anti-loop protection
        if not self.handoff_ctx.can_handoff():
            logger.warning(
                "[HANDOFF_SERVICE] HANDOFF_BLOCKED: Exceeded max handoff depth (2)."
            )
            return {
                "success": False,
                "handoff_blocked": True,
                "message": "Maximum agent handoff count reached. Continuing with human escalation option.",
            }

        # Update context
        self.handoff_ctx.intent = intent
        self.handoff_ctx.user_request = user_request
        if order_id:
            self.handoff_ctx.order_id = order_id
        else:
            recent_order = get_order_details_data(order_id=None, user_id=self.user_id)
            if recent_order and recent_order.get("found"):
                order_rec = recent_order.get("order")
                if order_rec:
                    self.handoff_ctx.order_id = order_rec.get("order_id")
        if product_info:
            self.handoff_ctx.relevant_product_info = product_info
        if language:
            self.handoff_ctx.language = language
        self.handoff_ctx.handoff_reason = handoff_reason or f"User requested {intent}"
        self.handoff_ctx.handoff_count += 1

        # Publish visual transfer state to frontend UI
        await self._publish_handoff_event(
            "transferring", "Returns & Refunds Specialist"
        )

        # Update active agent instructions to Returns & Refunds Specialist
        self.agent_type = "SPECIALIST"
        await self.update_instructions(RETURNS_REFUNDS_SPECIALIST_PROMPT)

        # Publish active state to frontend UI
        await self._publish_handoff_event("active", "Returns & Refunds Specialist")

        if self.call_id:
            update_call_event(
                call_id=self.call_id,
                intent=intent,
                agent_type="SPECIALIST",
                handoff=True,
                handoff_target="returns_refunds_specialist",
                success_condition=f"Handoff completed to Returns & Refunds Specialist for intent '{intent}'",
            )

        logger.info(
            "[HANDOFF_SERVICE] HANDOFF_SUCCESS: Switched to Returns & Refunds Specialist."
        )

        return {
            "success": True,
            "agent_type": "SPECIALIST",
            "agent_name": "Returns & Refunds Specialist",
            "handoff_context": self.handoff_ctx.to_dict(),
            "instruction": "State to the user warmly that you are the Returns & Refunds Specialist, acknowledge their context (name, request, order ID), and proceed to check their request using specialist tools. DO NOT ask them to repeat their problem.",
        }

    # =========================================================================
    # DAY 9 HANDOFF TOOL: SPECIALIST -> MAIN AGENT
    # =========================================================================
    @function_tool
    async def handoff_to_main_agent(
        self,
        context: RunContext,
        product_query: str | None = None,
        reason: str | None = None,
    ) -> dict:
        """Hand off conversation back from Specialist to Main Commerce Agent for unrelated product/catalogue inquiries.

        Args:
            product_query: Unrelated product inquiry mentioned by user.
            reason: Reason for handback.
        """
        logger.info(
            f"[HANDOFF_SERVICE] HANDBACK_INITIATED: Specialist -> Main Agent (query='{product_query}')"
        )

        if not self.handoff_ctx.can_handoff():
            return {
                "success": False,
                "handoff_blocked": True,
                "message": "Maximum handoff limit reached.",
            }

        self.handoff_ctx.handoff_count += 1
        await self._publish_handoff_event("transferring", "Main Commerce Agent")

        self.agent_type = "MAIN"
        await self.update_instructions(MAIN_COMMERCE_SYSTEM_PROMPT)

        await self._publish_handoff_event("active", "Main Commerce Agent")

        if self.call_id:
            update_call_event(
                call_id=self.call_id,
                intent="CATALOGUE_LOOKUP",
                agent_type="MAIN",
                handoff=True,
                handoff_target="main_agent",
                success_condition="Handoff back to Main Commerce Agent completed",
            )

        return {
            "success": True,
            "agent_type": "MAIN",
            "agent_name": "Main Commerce Agent",
            "instruction": "State warmly that you are back as the Main Commerce Assistant and assist with the product availability or catalogue question.",
        }


def zero_load(*args, **kwargs) -> float:
    return 0.0


num_idle = 0 if (os.getenv("RENDER") or os.getenv("PORT")) else 1
server = AgentServer(port=0, load_threshold=10.0, load_fnc=zero_load, num_idle_processes=num_idle)


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()
    init_db()


server.setup_fnc = prewarm


AGENT_NAME = os.getenv("AGENT_NAME", "mindia")


@server.rtc_session(agent_name=AGENT_NAME)
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {
        "room": ctx.room.name,
    }

    # Override dispatched cloud URL with direct regional URL to eliminate 15s region fetch timeout
    direct_url = os.getenv("LIVEKIT_URL")
    if direct_url and hasattr(ctx, "_info") and ctx._info:
        ctx._info.url = direct_url

    assistant = Assistant(ctx=ctx)

    session = AgentSession(
        stt=deepgram.STT(
            model="nova-3",
            language="multi",
        ),
        llm=google.LLM(
            model="gemini-3.5-flash-lite",
        ),
        tts=murf.TTS(
            voice="Anisha",
            locale="en-IN",
            style="Conversation",
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=1),
            text_pacing=True,
        ),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=False,
    )

    user_id = await get_caller_identity(ctx)
    assistant.user_id = user_id
    assistant.handoff_ctx.user_id = user_id

    room_name = ctx.room.name
    assistant.call_id = room_name
    create_call_record(call_id=room_name, user_id=user_id, channel="BROWSER")

    async def _on_shutdown():
        logger.info(f"Finalizing call analytics for room '{room_name}'")
        finalize_call_analytics(call_id=room_name)

    ctx.add_shutdown_callback(_on_shutdown)

    # Start session atomically (joins room + publishes audio track simultaneously)
    await session.start(
        agent=assistant,
        room=ctx.room,
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else noise_cancellation.BVC()
                ),
            ),
        ),
    )
    logger.info(
        f"[VOICE_PIPELINE] AGENT_CONNECTED & STT_STARTED: Multi-Agent session initialized in room '{ctx.room.name}'."
    )

    cust = get_customer(user_id) or get_customer("cust_radhika") or get_customer("cust_default")

    greeting = (
        "Welcome back, Radhika Sharma! I'm Anisha, your local shopping assistant. How can I help you today?"
    )

    if cust and cust.get("name"):
        name = cust["name"]
        past = cust.get("past_orders") or "ORD_RADHIKA_101: 2 packs of Basmati Rice (5kg) for ₹640 (Confirmed)"
        assistant.handoff_ctx.name = name
        assistant.handoff_ctx.order_id = "ORD_RADHIKA_101"
        lang = (cust.get("language_preference") or "").lower()
        update_last_interaction(user_id)

        # Inject customer memory into agent instructions
        dynamic_prompt = MAIN_COMMERCE_SYSTEM_PROMPT + f"\n\nCURRENT CUSTOMER MEMORY:\n- Name: {name}\n- Customer ID: {user_id}\n- Past Orders: {past}\n- Preference: {cust.get('preferred_delivery_slot', 'Morning 10 AM')}\n"
        await assistant.update_instructions(dynamic_prompt)

        greeting = f"Welcome back, {name}! How can I help you today?"

    logger.info(f"[VOICE_PIPELINE] Speaking welcome greeting: '{greeting}'")
    await session.say(
        greeting,
        allow_interruptions=True,
    )


class HealthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        self.wfile.write(b'{"status":"ok","service":"vaanid-voice-agent"}')

    def do_HEAD(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()

    def log_message(self, format, *args):
        return


_health_server_started = False


def start_health_server():
    global _health_server_started
    if _health_server_started:
        return
    _health_server_started = True

    port = int(os.getenv("PORT", "10000"))
    try:
        httpd = HTTPServer(("0.0.0.0", port), HealthHandler)
        thread = threading.Thread(target=httpd.serve_forever, daemon=True)
        thread.start()
        logger.info(f"Health check HTTP server started on port {port}")
    except Exception as e:
        logger.warning(f"Could not start health check server on port {port}: {e}")


# Start health check server on module load so Render port is always detected
start_health_server()

if __name__ == "__main__":
    cli.run_app(server)
