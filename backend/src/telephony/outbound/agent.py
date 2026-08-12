"""Outbound Voice AI Agent for Local Commerce Order Status calls via LiveKit SIP & Linphone."""

import asyncio
import json
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

# Ensure backend/src is on the Python path
BACKEND_SRC = Path(__file__).parent.parent.parent.resolve()
if str(BACKEND_SRC) not in sys.path:
    sys.path.insert(0, str(BACKEND_SRC))

from livekit.agents import (  # noqa: E402
    Agent,
    AgentServer,
    AgentSession,
    JobContext,
    JobProcess,
    RunContext,
    cli,
    function_tool,
    room_io,
    tokenize,
)
from livekit.plugins import (  # noqa: E402
    deepgram,
    google,
    murf,
    silero,
)
from livekit.plugins.turn_detector.multilingual import MultilingualModel  # noqa: E402

from database.memory import (  # noqa: E402
    delete_customer,
    get_customer,
    get_order_by_user_or_sip,
    init_db,
    is_user_opted_out,
    log_call_outcome,
    record_user_opt_out,
    seed_test_order,
    update_customer,
)
from tools.catalogue_tool import lookup_product_data  # noqa: E402
from tools.order_tool import calculate_order_data  # noqa: E402

logger = logging.getLogger("agent.outbound")


# Load environment variables
load_dotenv(".env.local")
load_dotenv(".env")

OUTBOUND_SYSTEM_PROMPT = """You are an AI customer support assistant representing Murf AI and Local Commerce businesses making an OUTBOUND call.

IDENTITY & PURPOSE:
- Name: Anisha, Local Commerce Assistant.
- Role: Professional AI Customer Support Representative making an outbound order update call to a verified customer.
- Nature: You are an AI assistant. Never claim to be a human being.

OUTBOUND CALL GREETING RULES:
- First two sentences MUST clearly state:
  1. Who is calling ("Hello, this is the Local Commerce Assistant calling about your recent order.")
  2. Why you are calling ("I'm calling to provide a verified order update.")
  3. How the user can stop the call ("If this isn't a good time, you can end the call at any time.")
- Then ask: "May I confirm that I'm speaking with you?"
- DO NOT reveal sensitive order details or product items until the caller acknowledges or asks for order information.

VERIFIED ORDER INFORMATION RULES:
- You MUST call get_order_status to retrieve verified order information from the database before making claims about order status.
- NEVER invent, hallucinate, or guess:
  - order ID
  - product name
  - quantity
  - price or total
  - delivery date
  - order status
- STATUS RESPONSES:
  - If order status is PENDING: Tell the customer their order is currently pending (e.g. "आपका ऑर्डर अभी pending है।" or "Your order is currently pending.").
  - If order status is CONFIRMED: Tell the customer their order is confirmed (e.g. "आपका ऑर्डर confirmed है।" or "Your order is confirmed.").
  - If order status is CANCELLED: Tell the customer their order is cancelled (e.g. "आपका ऑर्डर cancelled है।" or "Your order is cancelled.").

OPT-OUT RULES (MANDATORY):
- If the user says "Don't call me again", "Stop calling me", "Remove my number", "Dobara call mat karna", or similar opt-out phrases:
  1. Call opt_out_user tool immediately.
  2. State: "Understood. I won't continue this call."
  3. Do NOT argue or attempt to persuade the caller.

DAY 5 CATALOGUE & CALCULATOR TOOLS:
- If the user asks about product details in their order or catalogue availability, call lookup_product.
- If the user asks for total calculations, call calculate_order_total.
- If a tool fails or finds no result, state: "I couldn't verify that product from the current catalogue."

LANGUAGE & SCRIPT MIRRORING:
- Automatically mirror the caller's language register (English, Hindi in Devanagari, or Hinglish).
- Example:
  - English: "What is my order status?" -> "Your order is currently pending."
  - Hinglish: "Mera order status kya hai?" -> "Aapka order abhi pending hai."
  - Hindi: "मेरा ऑर्डर स्टेटस क्या है?" -> "आपका ऑर्डर अभी pending है।"
- Enforce all guardrails identically across all languages.

VOICE-FIRST RESPONSE STYLE:
- Use short sentences under 20 words.
- Never use bullet points, tables, markdown syntax, or technical jargon.
"""


class OutboundAssistant(Agent):
    def __init__(
        self,
        user_id: str = "cust_default",
        destination: str = "sip:default@sip.linphone.org",
        ctx: JobContext | None = None,
    ) -> None:
        self.user_id = user_id
        self.destination = destination
        self.ctx = ctx
        self.opted_out = False
        super().__init__(instructions=OUTBOUND_SYSTEM_PROMPT)

    async def _publish_tool_event(self, tool_name: str, payload: dict) -> None:
        """Send real-time status events to connected participants via LiveKit data channel."""
        if self.ctx and self.ctx.room and self.ctx.room.local_participant:
            try:
                event_data = json.dumps(
                    {
                        "type": "outbound_event",
                        "tool_name": tool_name,
                        "data": payload,
                    }
                ).encode("utf-8")
                await self.ctx.room.local_participant.publish_data(
                    event_data,
                    topic="outbound_event",
                )
            except Exception as e:
                logger.warning(f"Could not publish outbound event: {e}")

    @function_tool
    async def get_order_status(
        self, context: RunContext, order_id: str | None = None
    ) -> dict:
        """Retrieve verified order status and order details from the database.

        Args:
            order_id: Optional specific order ID (e.g. 'ORD_RAMESH_101'). If omitted, retrieves caller's order.
        """
        logger.info(
            f"[OUTBOUND_TOOL] get_order_status order_id={order_id} user_id={self.user_id}"
        )
        target = order_id or self.user_id or self.destination
        order = get_order_by_user_or_sip(target)
        if order:
            res = {"found": True, **order}
        else:
            res = {
                "found": False,
                "message": "No verified order record found for this caller.",
            }

        await self._publish_tool_event("get_order_status", res)
        return res

    @function_tool
    async def opt_out_user(self, context: RunContext) -> dict:
        """Record customer opt-out preference when they ask to stop receiving outbound calls.

        WHEN TO CALL:
        Call this tool immediately whenever the caller requests not to be called again ("Don't call me again", "Stop calling me", "Remove my number", "Dobara call mat karna").
        """
        logger.info(f"[OUTBOUND_TOOL] opt_out_user destination={self.destination}")
        self.opted_out = True
        record_user_opt_out(self.destination, user_id=self.user_id)
        log_call_outcome(
            call_id=f"call_{int(asyncio.get_event_loop().time())}",
            order_id="UNKNOWN",
            user_id=self.user_id,
            destination=self.destination,
            outcome="USER_OPTED_OUT",
        )
        res = {"success": True, "message": "User preference set to USER_OPTED_OUT."}
        await self._publish_tool_event("opt_out_user", res)

        # Schedule room disconnect after response
        if self.ctx and self.ctx.room:
            self._disconnect_task = asyncio.create_task(self._delayed_disconnect())

        return res

    async def _delayed_disconnect(self, delay_seconds: float = 2.5) -> None:
        await asyncio.sleep(delay_seconds)
        if self.ctx and self.ctx.room:
            try:
                await self.ctx.room.disconnect()
                logger.info(f"Disconnected room for opt-out caller {self.destination}")
            except Exception as e:
                logger.warning(f"Error disconnecting room after opt-out: {e}")

    @function_tool
    async def lookup_product(self, context: RunContext, product_query: str) -> dict:
        """Find product catalogue information such as availability, price, and stock levels.

        Args:
            product_query: Product search phrase (e.g. 'basmati rice').
        """
        res = lookup_product_data(product_query)
        await self._publish_tool_event("lookup_product", res)
        return res

    @function_tool
    async def calculate_order_total(
        self,
        context: RunContext,
        product_query: str,
        quantity: float = 1.0,
        additional_items_json: str | None = None,
    ) -> dict:
        """Calculate estimated total price for requested product quantities."""
        items = [{"product_query": product_query, "quantity": quantity}]
        if additional_items_json:
            try:
                parsed = json.loads(additional_items_json)
                if isinstance(parsed, list):
                    items.extend(parsed)
            except Exception as e:
                logger.warning(f"Could not parse additional items: {e}")
        res = calculate_order_data(items)
        await self._publish_tool_event("calculate_order_total", res)
        return res

    @function_tool
    async def lookup_caller(
        self, context: RunContext, user_id: str | None = None
    ) -> dict:
        """Look up customer memory record."""
        target_id = user_id or self.user_id
        cust = get_customer(target_id)
        if cust:
            return {"found": True, **cust}
        return {"found": False, "user_id": target_id}

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
        """Save customer memory after receiving explicit consent."""
        target_id = user_id or self.user_id
        res = update_customer(
            user_id=target_id,
            name=name,
            language_preference=language_preference,
            preferred_delivery_slot=preferred_delivery_slot,
            usual_quantity=usual_quantity,
            past_orders=past_orders,
        )
        return {"success": bool(res)}

    @function_tool
    async def forget_caller(
        self, context: RunContext, user_id: str | None = None
    ) -> dict:
        """Delete saved customer memory upon explicit request."""
        target_id = user_id or self.user_id
        success = delete_customer(target_id)
        return {"success": success}


def zero_load(*args, **kwargs) -> float:
    return 0.0


server = AgentServer(port=0, load_threshold=10.0, load_fnc=zero_load)


def prewarm(proc: JobProcess):
    proc.userdata["vad"] = silero.VAD.load()
    init_db()
    seed_test_order()


server.setup_fnc = prewarm

AGENT_NAME = os.getenv("AGENT_NAME", "my-agent")


@server.rtc_session(agent_name=AGENT_NAME)
async def my_agent(ctx: JobContext):
    ctx.log_context_fields = {"room": ctx.room.name}
    init_db()
    seed_test_order()

    # 1. Connect to LiveKit room
    await ctx.connect()
    logger.info(
        f"[OUTBOUND_VOICE_PIPELINE] CONNECTED: LiveKit room '{ctx.room.name}' connected."
    )

    # 2. Wait for remote SIP participant (Linphone user) to join room
    participant = await ctx.wait_for_participant()
    logger.info(
        f"[OUTBOUND_VOICE_PIPELINE] Remote participant '{participant.identity}' joined room."
    )

    # 3. Determine real destination / user_id from connected participant
    user_id = participant.identity or "cust_ramesh"
    destination = user_id if "sip:" in user_id else f"sip:{user_id}@sip.linphone.org"

    # 4. Opt-out pre-check for real destination
    if is_user_opted_out(destination) or is_user_opted_out(user_id):
        logger.warning(
            f"Aborting outbound call session for opted-out destination '{destination}'"
        )
        log_call_outcome(
            call_id=f"call_{int(asyncio.get_event_loop().time())}",
            order_id="UNKNOWN",
            user_id=user_id,
            destination=destination,
            outcome="USER_OPTED_OUT",
        )
        return

    assistant = OutboundAssistant(user_id=user_id, destination=destination, ctx=ctx)

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
            tokenizer=tokenize.basic.SentenceTokenizer(min_sentence_len=2),
            text_pacing=True,
        ),
        turn_detection=MultilingualModel(),
        vad=ctx.proc.userdata["vad"],
        preemptive_generation=True,
    )

    await session.start(
        agent=assistant,
        room=ctx.room,
        room_options=room_io.RoomOptions(
            close_on_disconnect=False,
        ),
    )

    @session.on("user_speech_committed")
    def _on_user_speech(msg):
        logger.info(f"[OUTBOUND_VOICE_PIPELINE] USER_SPOKE: '{msg.content}'")

    # Initial mandatory outbound opening greeting (Part 2 & Part 8 requirement)
    greeting = (
        "Hello, this is the Local Commerce Assistant calling about your recent order. "
        "I'm calling to provide a verified order update. If this isn't a good time, you can end the call at any time. "
        "May I confirm that I'm speaking with you?"
    )

    log_call_outcome(
        call_id=f"call_{int(asyncio.get_event_loop().time())}",
        order_id="ORD_RAMESH_101",
        user_id=user_id,
        destination=destination,
        outcome="ANSWERED",
    )

    await session.say(greeting, allow_interruptions=True)

    # Keep session active for multi-turn conversation until user hangs up or opts out
    logger.info(
        "[OUTBOUND_VOICE_PIPELINE] Greeting completed. Session active for multi-turn conversation."
    )
    disconnect_event = asyncio.Event()

    @ctx.room.on("disconnected")
    def _on_room_disconnected(*args):
        logger.info("[OUTBOUND_VOICE_PIPELINE] Call disconnected by participant.")
        if not disconnect_event.is_set():
            disconnect_event.set()

    await disconnect_event.wait()


if __name__ == "__main__":
    cli.run_app(server)
