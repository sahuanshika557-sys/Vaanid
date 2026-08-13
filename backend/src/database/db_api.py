"""CLI wrapper for frontend Next.js API routes to interact with SQLite database cleanly without native Node C++ addons."""

import json
import sys
from datetime import datetime
from pathlib import Path

# Ensure backend/src is on sys.path
backend_src = str(Path(__file__).parent.parent.resolve())
if backend_src not in sys.path:
    sys.path.insert(0, backend_src)

from database.memory import (  # noqa: E402
    create_call_record,
    create_escalation_record,
    finalize_call_analytics,
    get_analytics_breakdowns,
    get_analytics_failures,
    get_analytics_summary,
    get_analytics_trends,
    get_escalation_by_ref,
    get_escalations,
    get_recent_calls,
    init_db,
    update_escalation_status,
)


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No command provided"}))
        sys.exit(1)

    cmd = sys.argv[1]

    try:
        init_db()

        if cmd == "get_escalations":
            status = (
                sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != "null" else None
            )
            urgency = (
                sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != "null" else None
            )
            search = (
                sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] != "null" else None
            )

            res = get_escalations(status=status, urgency=urgency, search=search)
            print(json.dumps({"success": True, "escalations": res}))

        elif cmd == "get_by_ref":
            ref_id = sys.argv[2] if len(sys.argv) > 2 else ""
            res = get_escalation_by_ref(ref_id)
            print(json.dumps({"success": True, "escalation": res}))

        elif cmd == "update_status":
            ref_id = sys.argv[2] if len(sys.argv) > 2 else ""
            status = sys.argv[3] if len(sys.argv) > 3 else ""
            res = update_escalation_status(ref_id, status)
            print(json.dumps({"success": True, "escalation": res}))

        elif cmd == "create":
            payload_json = sys.argv[2] if len(sys.argv) > 2 else "{}"
            payload = json.loads(payload_json)
            res = create_escalation_record(
                user_id=payload.get("user_id", "cust_default"),
                customer_name=payload.get("customer_name"),
                issue_type=payload.get("issue_type", "OTHER_ESCALATION"),
                issue_summary=payload.get("issue_summary", ""),
                verified_information=payload.get("verified_information"),
                urgency=payload.get("urgency"),
                language=payload.get("language"),
                preferred_followup_method=payload.get("preferred_followup_method"),
            )
            print(json.dumps(res))

        # Day 8 — Analytics Commands
        elif cmd == "get_analytics_summary":
            res = get_analytics_summary()
            print(json.dumps({"success": True, **res}))

        elif cmd == "get_recent_calls":
            limit = (
                int(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2].isdigit() else 20
            )
            offset = (
                int(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3].isdigit() else 0
            )
            channel = (
                sys.argv[4] if len(sys.argv) > 4 and sys.argv[4] != "null" else None
            )
            language = (
                sys.argv[5] if len(sys.argv) > 5 and sys.argv[5] != "null" else None
            )
            intent = (
                sys.argv[6] if len(sys.argv) > 6 and sys.argv[6] != "null" else None
            )
            outcome = (
                sys.argv[7] if len(sys.argv) > 7 and sys.argv[7] != "null" else None
            )
            search = (
                sys.argv[8] if len(sys.argv) > 8 and sys.argv[8] != "null" else None
            )

            res = get_recent_calls(
                limit=limit,
                offset=offset,
                channel=channel,
                language=language,
                intent=intent,
                outcome=outcome,
                search=search,
            )
            print(json.dumps({"success": True, **res}))

        elif cmd == "get_analytics_trends":
            timeframe = sys.argv[2] if len(sys.argv) > 2 else "7d"
            res = get_analytics_trends(timeframe=timeframe)
            print(json.dumps({"success": True, "trends": res}))

        elif cmd == "get_analytics_failures":
            res = get_analytics_failures()
            print(json.dumps({"success": True, **res}))

        elif cmd == "get_analytics_breakdowns":
            res = get_analytics_breakdowns()
            print(json.dumps({"success": True, **res}))

        elif cmd == "start_call":
            payload_json = sys.argv[2] if len(sys.argv) > 2 else "{}"
            payload = json.loads(payload_json)
            res = create_call_record(
                call_id=payload.get(
                    "call_id", f"call_{int(datetime.now().timestamp())}"
                ),
                user_id=payload.get("user_id", "cust_default"),
                channel=payload.get("channel", "BROWSER"),
                started_at=payload.get("started_at"),
                language=payload.get("language", "English"),
                intent=payload.get("intent", "OTHER"),
            )
            print(json.dumps({"success": True, "call": res}))

        elif cmd == "finalize_call":
            payload_json = sys.argv[2] if len(sys.argv) > 2 else "{}"
            payload = json.loads(payload_json)
            res = finalize_call_analytics(
                call_id=payload.get("call_id", ""),
                ended_at=payload.get("ended_at"),
                outcome=payload.get("outcome"),
                failure_reason=payload.get("failure_reason"),
                intent=payload.get("intent"),
                language=payload.get("language"),
                escalated=payload.get("escalated"),
                success_condition=payload.get("success_condition"),
            )
            print(json.dumps({"success": True, "call": res}))

        else:
            print(json.dumps({"error": f"Unknown command {cmd}"}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
