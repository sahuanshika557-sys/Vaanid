"""CLI wrapper for frontend Next.js API routes to interact with SQLite database cleanly without native Node C++ addons."""

import json
import sys
from pathlib import Path

# Ensure backend/src is on sys.path
backend_src = str(Path(__file__).parent.parent.resolve())
if backend_src not in sys.path:
    sys.path.insert(0, backend_src)

from database.memory import (  # noqa: E402
    create_escalation_record,
    get_escalation_by_ref,
    get_escalations,
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

        else:
            print(json.dumps({"error": f"Unknown command {cmd}"}))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()
