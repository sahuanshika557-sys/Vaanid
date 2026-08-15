"""CLI Outbound Dial Script for LiveKit SIP + Linphone calls.

Usage:
    uv run python src/telephony/outbound/dial.py --to <LINPHONE_USERNAME_OR_SIP_ADDRESS>
"""

import argparse
import asyncio
import logging
import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv

# Ensure backend/src is on Python path
BACKEND_SRC = Path(__file__).parent.parent.parent.resolve()
if str(BACKEND_SRC) not in sys.path:
    sys.path.insert(0, str(BACKEND_SRC))

from database.memory import (  # noqa: E402
    get_retry_count,
    init_db,
    is_user_opted_out,
    log_call_outcome,
    seed_test_order,
)

logger = logging.getLogger("agent.outbound.dial")

# Load environment variables
load_dotenv(".env.local")
load_dotenv(".env")


def format_sip_uri(raw_target: str) -> str:
    """Format raw username or SIP string into valid Linphone SIP address."""
    clean = raw_target.strip()
    if clean.startswith("sip:"):
        return clean
    if "@" in clean:
        return f"sip:{clean}"
    return f"sip:{clean}@sip.linphone.org"


def validate_environment(target_sip: str) -> tuple[bool, list[str]]:
    """Perform mandatory Part 20 Safety Check before attempting any SIP call."""
    missing: list[str] = []

    livekit_url = os.getenv("LIVEKIT_URL")
    livekit_api_key = os.getenv("LIVEKIT_API_KEY")
    livekit_api_secret = os.getenv("LIVEKIT_API_SECRET")
    sip_trunk_id = os.getenv("LIVEKIT_SIP_OUTBOUND_TRUNK_ID")
    linphone_user = os.getenv("LINPHONE_USERNAME")

    if not livekit_url or "your-project" in livekit_url:
        missing.append("LIVEKIT_URL (e.g. wss://your-project.livekit.cloud)")
    if not livekit_api_key or "your_livekit_api_key" in livekit_api_key:
        missing.append("LIVEKIT_API_KEY")
    if not livekit_api_secret or "your_livekit_api_secret" in livekit_api_secret:
        missing.append("LIVEKIT_API_SECRET")
    if not sip_trunk_id or "your_sip_outbound_trunk_id" in sip_trunk_id:
        missing.append(
            "LIVEKIT_SIP_OUTBOUND_TRUNK_ID (e.g. ST_xxxxxx from LiveKit Cloud SIP Trunks)"
        )
    if not target_sip and (
        not linphone_user or "your_linphone_username" in linphone_user
    ):
        missing.append(
            "LINPHONE_USERNAME or --to argument (e.g. sip:username@sip.linphone.org)"
        )

    return len(missing) == 0, missing


async def dial_outbound(target_user: str | None = None) -> bool:
    """Perform pre-checks and initiate outbound call via LiveKit SIP API."""
    init_db()

    # Determine SIP destination
    raw_target = target_user or os.getenv("LINPHONE_USERNAME") or ""
    sip_address = format_sip_uri(raw_target) if raw_target else ""

    # PART 20: SAFETY PRE-CHECK
    is_valid, missing_keys = validate_environment(sip_address)
    if not is_valid:
        print("\n==================================================================")
        print("[ERROR] SAFETY CHECK FAILED -- CANNOT DIAL OUTBOUND CALL")
        print("==================================================================")
        print("The following required environment variables are missing or default:\n")
        for key in missing_keys:
            print(f"  * {key}")
        print("\n[ACTION REQUIRED]:")
        print("1. Open 'backend/.env.local'")
        print("2. Fill in your real LiveKit Cloud & Linphone credentials")
        print("3. Re-run this command.")
        print("==================================================================\n")
        return False

    # Ensure test order is present in DB for Ramesh / caller
    seed_test_order(linphone_username=raw_target)

    # PART 13: OPT-OUT PRE-CHECK
    if is_user_opted_out(sip_address) or is_user_opted_out(raw_target):
        print("\n==================================================================")
        print("[OPT-OUT PRE-CHECK] CALL ABORTED")
        print("==================================================================")
        print(f"Target destination '{sip_address}' has explicitly opted out of calls.")
        print("The agent will NEVER dial opted-out numbers.")
        print("==================================================================\n")
        log_call_outcome(
            call_id=f"call_{uuid.uuid4().hex[:8]}",
            order_id="ORD_RADHIKA_101",
            user_id="cust_radhika",
            destination=sip_address,
            outcome="USER_OPTED_OUT",
        )
        return False

    # PART 15: RETRY LIMIT PRE-CHECK
    max_retries = int(os.getenv("MAX_RETRIES", "2"))
    past_retries = get_retry_count(sip_address)
    if past_retries >= max_retries:
        print("\n==================================================================")
        print("[RETRY LIMIT EXCEEDED] CALL ABORTED")
        print("==================================================================")
        print(f"Target '{sip_address}' has failed {past_retries} times.")
        print(f"Maximum retry limit ({max_retries}) reached. Stopping retries.")
        print("==================================================================\n")
        return False

    # LiveKit Credentials
    livekit_url = os.environ["LIVEKIT_URL"]
    livekit_api_key = os.environ["LIVEKIT_API_KEY"]
    livekit_api_secret = os.environ["LIVEKIT_API_SECRET"]
    sip_trunk_id = os.environ["LIVEKIT_SIP_OUTBOUND_TRUNK_ID"]

    room_name = f"outbound-call-{uuid.uuid4().hex[:6]}"
    call_id = f"call_{uuid.uuid4().hex[:8]}"

    print(f"\n[DIALING] Initiating outbound SIP call to {sip_address}...")
    print(f"  * Room: {room_name}")
    print(f"  * Trunk ID: {sip_trunk_id}")

    log_call_outcome(
        call_id=call_id,
        order_id="ORD_RADHIKA_101",
        user_id="cust_radhika",
        destination=sip_address,
        outcome="DIALING",
    )

    try:
        from livekit.api import (
            CreateAgentDispatchRequest,
            CreateSIPParticipantRequest,
            LiveKitAPI,
        )

        # Convert wss:// to http/https for REST API client if needed
        http_url = livekit_url.replace("wss://", "https://").replace("ws://", "http://")

        clean_username = raw_target.replace("sip:", "").split("@")[0]

        async with LiveKitAPI(
            url=http_url, api_key=livekit_api_key, api_secret=livekit_api_secret
        ) as api:
            # 1. Dispatch agent worker to join the room
            agent_name = os.getenv("AGENT_NAME", "my-agent")
            try:
                dispatch_req = CreateAgentDispatchRequest(
                    agent_name=agent_name,
                    room=room_name,
                )
                await api.agent_dispatch.create_dispatch(dispatch_req)
                print(
                    f"[DISPATCH] Dispatched agent '{agent_name}' to room '{room_name}'"
                )
            except Exception as e:
                logger.warning(f"Agent dispatch notice: {e}")

            # 2. Create SIP participant to dial Linphone destination
            sip_req = CreateSIPParticipantRequest(
                sip_trunk_id=sip_trunk_id,
                sip_call_to=clean_username,
                room_name=room_name,
                participant_identity=raw_target or "cust_radhika",
                participant_name="Radhika Sharma",
            )
            response = await api.sip.create_sip_participant(sip_req)

            print(
                f"[SUCCESS] SIP Participant Created Successfully! ID: {response.participant_id}"
            )
            print("[STATUS] Call is now ringing on Linphone application.")
            return True

    except Exception as e:
        err_msg = str(e)
        print("\n==================================================================")
        print("[FAILED] OUTBOUND SIP CALL FAILED")
        print("==================================================================")
        print(f"Error details: {err_msg}")
        print("Possible causes:")
        print("  * Invalid LIVEKIT_SIP_OUTBOUND_TRUNK_ID")
        print("  * Outbound SIP Trunk not configured in LiveKit Cloud dashboard")
        print("  * Destination Linphone app is offline or username incorrect")
        print("==================================================================\n")

        outcome_status = (
            "REJECTED" if "486" in err_msg or "busy" in err_msg.lower() else "FAILED"
        )
        log_call_outcome(
            call_id=call_id,
            order_id="ORD_RADHIKA_101",
            user_id="cust_radhika",
            destination=sip_address,
            outcome=outcome_status,
        )
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Dial outbound SIP call via LiveKit Cloud to Linphone."
    )
    parser.add_argument(
        "--to",
        type=str,
        default=None,
        help="Target Linphone username or SIP address (e.g. sip:user@sip.linphone.org or user)",
    )
    args = parser.parse_args()

    success = asyncio.run(dial_outbound(args.to))
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
