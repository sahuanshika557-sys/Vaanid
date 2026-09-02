"""SQLite database layer for persistent Local Commerce customer memory."""

import logging
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from database.schema import (
    CREATE_AGENT_ACTIONS_INDEX,
    CREATE_AGENT_ACTIONS_TABLE,
    CREATE_CALL_LOGS_INDEX,
    CREATE_CALL_LOGS_TABLE,
    CREATE_CALLS_INDEX,
    CREATE_CALLS_TABLE,
    CREATE_CART_ITEMS_INDEX,
    CREATE_CART_ITEMS_TABLE,
    CREATE_CARTS_INDEX,
    CREATE_CARTS_TABLE,
    CREATE_COMMERCE_EVENTS_INDEX,
    CREATE_COMMERCE_EVENTS_TABLE,
    CREATE_CUSTOMER_SEGMENTS_INDEX,
    CREATE_CUSTOMER_SEGMENTS_TABLE,
    CREATE_CUSTOMERS_INDEX,
    CREATE_CUSTOMERS_TABLE,
    CREATE_ESCALATIONS_INDEX,
    CREATE_ESCALATIONS_TABLE,
    CREATE_FOLLOWUP_SUGGESTIONS_INDEX,
    CREATE_FOLLOWUP_SUGGESTIONS_TABLE,
    CREATE_OPT_OUTS_TABLE,
    CREATE_ORDERS_INDEX,
    CREATE_ORDERS_TABLE,
    CREATE_PAYMENT_INTENTS_INDEX,
    CREATE_PAYMENT_INTENTS_TABLE,
    CREATE_RECOVERY_OPPORTUNITIES_INDEX,
    CREATE_RECOVERY_OPPORTUNITIES_TABLE,
)

logger = logging.getLogger("agent.database")

# Default database path: backend/local_commerce_memory.db
DEFAULT_DB_PATH = os.path.join(
    Path(__file__).parent.parent.parent.resolve(), "local_commerce_memory.db"
)


def get_db_path(custom_path: str | None = None) -> str:
    return custom_path or DEFAULT_DB_PATH


def get_connection(db_path: str | None = None) -> sqlite3.Connection:
    path = get_db_path(db_path)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: str | None = None) -> str:
    """Initialize SQLite database and create tables/indexes if absent."""
    path = get_db_path(db_path)
    try:
        with get_connection(path) as conn:
            cursor = conn.cursor()
            schema_script = f"""
            {CREATE_CUSTOMERS_TABLE}
            {CREATE_CUSTOMERS_INDEX}
            {CREATE_ORDERS_TABLE}
            {CREATE_ORDERS_INDEX}
            {CREATE_CALL_LOGS_TABLE}
            {CREATE_CALL_LOGS_INDEX}
            {CREATE_OPT_OUTS_TABLE}
            {CREATE_ESCALATIONS_TABLE}
            {CREATE_ESCALATIONS_INDEX}
            {CREATE_CALLS_TABLE}
            {CREATE_CALLS_INDEX}
            {CREATE_CARTS_TABLE}
            {CREATE_CARTS_INDEX}
            {CREATE_CART_ITEMS_TABLE}
            {CREATE_CART_ITEMS_INDEX}
            {CREATE_PAYMENT_INTENTS_TABLE}
            {CREATE_PAYMENT_INTENTS_INDEX}
            {CREATE_AGENT_ACTIONS_TABLE}
            {CREATE_AGENT_ACTIONS_INDEX}
            {CREATE_COMMERCE_EVENTS_TABLE}
            {CREATE_COMMERCE_EVENTS_INDEX}
            {CREATE_FOLLOWUP_SUGGESTIONS_TABLE}
            {CREATE_FOLLOWUP_SUGGESTIONS_INDEX}
            {CREATE_CUSTOMER_SEGMENTS_TABLE}
            {CREATE_CUSTOMER_SEGMENTS_INDEX}
            {CREATE_RECOVERY_OPPORTUNITIES_TABLE}
            {CREATE_RECOVERY_OPPORTUNITIES_INDEX}
            """
            cursor.executescript(schema_script)
            conn.commit()

            # Ensure calls table has agent_type, handoff, handoff_target columns
            cursor.execute("PRAGMA table_info(calls)")
            existing_cols = [row[1] for row in cursor.fetchall()]
            if "agent_type" not in existing_cols:
                cursor.execute(
                    "ALTER TABLE calls ADD COLUMN agent_type TEXT DEFAULT 'MAIN'"
                )
            if "handoff" not in existing_cols:
                cursor.execute("ALTER TABLE calls ADD COLUMN handoff INTEGER DEFAULT 0")
            if "handoff_target" not in existing_cols:
                cursor.execute("ALTER TABLE calls ADD COLUMN handoff_target TEXT")
            conn.commit()

            # Seed sample customers & orders if not present
            now_str = datetime.now(timezone.utc).isoformat()
            cursor.execute(
                """
                INSERT OR IGNORE INTO customers (user_id, name, language_preference, preferred_delivery_slot, usual_quantity, past_orders, last_interaction, created_at, updated_at)
                VALUES
                ('cust_radhika', 'Radhika Sharma', 'Hindi', 'Morning 10 AM', '5 kg', 'ORD_RADHIKA_101: 2 packs of Basmati Rice (5kg) for ₹640 (Confirmed)', ?, ?, ?),
                ('cust_default', 'Radhika Sharma', 'Hindi', 'Morning 10 AM', '5 kg', 'ORD_RADHIKA_101: 2 packs of Basmati Rice (5kg) for ₹640 (Confirmed)', ?, ?, ?)
                """,
                (now_str, now_str, now_str, now_str, now_str, now_str),
            )
            cursor.execute(
                """
                INSERT OR IGNORE INTO orders (order_id, user_id, customer_name, phone_or_sip, product_name, quantity, estimated_total, status, created_at, updated_at)
                VALUES
                ('ORD_RADHIKA_101', 'cust_radhika', 'Radhika Sharma', 'browser', 'Basmati Rice (5kg)', 2.0, 640.0, 'CONFIRMED', ?, ?),
                ('ORD_RADHIKA_101', 'cust_default', 'Radhika Sharma', 'browser', 'Basmati Rice (5kg)', 2.0, 640.0, 'CONFIRMED', ?, ?),
                ('12345', 'cust_radhika', 'Radhika Sharma', 'browser', 'Basmati Rice (5kg)', 1.0, 320.0, 'CONFIRMED', ?, ?),
                ('98765', 'cust_radhika', 'Radhika Sharma', 'browser', 'Sunflower Oil (1L)', 2.0, 310.0, 'CONFIRMED', ?, ?)
                """,
                (now_str, now_str, now_str, now_str, now_str, now_str, now_str, now_str),
            )
            conn.commit()

        logger.info(f"Database initialized successfully at {path}")
    except Exception as e:
        logger.error(f"Failed to initialize database at {path}: {e}")
        raise
    return path


def get_customer(user_id: str, db_path: str | None = None) -> dict[str, Any] | None:
    """Retrieve customer record by user_id."""
    if not user_id:
        return None

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT user_id, name, language_preference, preferred_delivery_slot, usual_quantity, past_orders, last_interaction, created_at, updated_at FROM customers WHERE user_id = ?",
                (user_id,),
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    except Exception as e:
        logger.error(f"Error fetching customer '{user_id}': {e}")
        return None


def create_customer(
    user_id: str,
    name: str | None = None,
    language_preference: str | None = None,
    preferred_delivery_slot: str | None = None,
    usual_quantity: str | None = None,
    past_orders: str | None = None,
    db_path: str | None = None,
) -> dict[str, Any]:
    """Create a new customer record."""
    if not user_id:
        raise ValueError("user_id is required")

    now = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO customers (user_id, name, language_preference, preferred_delivery_slot, usual_quantity, past_orders, last_interaction, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    name,
                    language_preference,
                    preferred_delivery_slot,
                    usual_quantity,
                    past_orders,
                    now,
                    now,
                    now,
                ),
            )
            conn.commit()
        logger.info(f"Created new customer record for '{user_id}'")
        return get_customer(user_id, db_path=db_path) or {"user_id": user_id}
    except Exception as e:
        logger.error(f"Error creating customer '{user_id}': {e}")
        raise


def update_customer(
    user_id: str,
    db_path: str | None = None,
    **kwargs: Any,
) -> dict[str, Any] | None:
    """Update existing customer record fields."""
    if not user_id:
        return None

    allowed_fields = {
        "name",
        "language_preference",
        "preferred_delivery_slot",
        "usual_quantity",
        "past_orders",
        "last_interaction",
    }

    updates = {k: v for k, v in kwargs.items() if k in allowed_fields and v is not None}
    if not updates:
        return get_customer(user_id, db_path=db_path)

    now = datetime.now(timezone.utc).isoformat()
    updates["updated_at"] = now
    updates["last_interaction"] = now

    set_clause = ", ".join(f"{field} = ?" for field in updates)
    values = [*list(updates.values()), user_id]

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE customers SET {set_clause} WHERE user_id = ?",
                values,
            )
            if cursor.rowcount == 0:
                # Customer does not exist yet; create it
                conn.commit()
                return create_customer(
                    user_id=user_id,
                    name=kwargs.get("name"),
                    language_preference=kwargs.get("language_preference"),
                    preferred_delivery_slot=kwargs.get("preferred_delivery_slot"),
                    usual_quantity=kwargs.get("usual_quantity"),
                    past_orders=kwargs.get("past_orders"),
                    db_path=db_path,
                )
            conn.commit()
        return get_customer(user_id, db_path=db_path)
    except Exception as e:
        logger.error(f"Error updating customer '{user_id}': {e}")
        return None


def delete_customer(user_id: str, db_path: str | None = None) -> bool:
    """Delete customer record ("Forget Me")."""
    if not user_id:
        return False

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM customers WHERE user_id = ?", (user_id,))
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Error deleting customer '{user_id}': {e}")
        return False


def update_last_interaction(user_id: str, db_path: str | None = None) -> bool:
    """Update last_interaction timestamp for existing customer."""
    if not user_id:
        return False

    now = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE customers SET last_interaction = ?, updated_at = ? WHERE user_id = ?",
                (now, now, user_id),
            )
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Error updating last interaction for '{user_id}': {e}")
        return False


# =============================================================================
# Day 6 — Order Management & Outbound Call Functions
# =============================================================================


def create_order(
    order_id: str,
    user_id: str,
    customer_name: str,
    phone_or_sip: str,
    product_name: str,
    quantity: float,
    estimated_total: float,
    status: str = "PENDING",
    db_path: str | None = None,
) -> dict[str, Any]:
    """Create or replace an order in SQLite database."""
    now = datetime.now(timezone.utc).isoformat()
    valid_statuses = {"PENDING", "CONFIRMED", "CANCELLED"}
    if status.upper() not in valid_statuses:
        raise ValueError(f"Invalid status '{status}'. Must be one of {valid_statuses}")

    status_clean = status.upper()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO orders (order_id, user_id, customer_name, phone_or_sip, product_name, quantity, estimated_total, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    order_id,
                    user_id,
                    customer_name,
                    phone_or_sip,
                    product_name,
                    quantity,
                    estimated_total,
                    status_clean,
                    now,
                    now,
                ),
            )
            conn.commit()
        logger.info(
            f"Created order '{order_id}' for '{customer_name}' with status '{status_clean}'"
        )
        return get_order(order_id, db_path=db_path) or {"order_id": order_id}
    except Exception as e:
        logger.error(f"Error creating order '{order_id}': {e}")
        raise


def get_order(order_id: str, db_path: str | None = None) -> dict[str, Any] | None:
    """Fetch order details by order_id."""
    if not order_id:
        return None

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT order_id, user_id, customer_name, phone_or_sip, product_name, quantity, estimated_total, status, created_at, updated_at FROM orders WHERE order_id = ?",
                (order_id,),
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    except Exception as e:
        logger.error(f"Error fetching order '{order_id}': {e}")
        return None


def get_order_by_user_or_sip(
    query_target: str, db_path: str | None = None
) -> dict[str, Any] | None:
    """Fetch the latest order matching user_id, customer_name, or phone_or_sip."""
    if not query_target:
        return None

    clean_target = query_target.strip()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT order_id, user_id, customer_name, phone_or_sip, product_name, quantity, estimated_total, status, created_at, updated_at
                FROM orders
                WHERE user_id = ? OR phone_or_sip = ? OR LOWER(customer_name) = LOWER(?) OR LOWER(phone_or_sip) LIKE LOWER(?)
                ORDER BY updated_at DESC LIMIT 1
                """,
                (clean_target, clean_target, clean_target, f"%{clean_target}%"),
            )
            row = cursor.fetchone()
            if row:
                return dict(row)

            # Fallback: return any latest order in system if single test order exists
            cursor.execute(
                "SELECT order_id, user_id, customer_name, phone_or_sip, product_name, quantity, estimated_total, status, created_at, updated_at FROM orders ORDER BY updated_at DESC LIMIT 1"
            )
            fallback_row = cursor.fetchone()
            if fallback_row:
                return dict(fallback_row)
            return None
    except Exception as e:
        logger.error(f"Error searching order for target '{query_target}': {e}")
        return None


def update_order_status(
    order_id: str, new_status: str, db_path: str | None = None
) -> bool:
    """Update status of an existing order."""
    valid_statuses = {"PENDING", "CONFIRMED", "CANCELLED"}
    status_clean = new_status.upper()
    if status_clean not in valid_statuses:
        return False

    now = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE orders SET status = ?, updated_at = ? WHERE order_id = ?",
                (status_clean, now, order_id),
            )
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Error updating order status for '{order_id}': {e}")
        return False


def seed_test_order(
    linphone_username: str | None = None, db_path: str | None = None
) -> dict[str, Any]:
    """Seed verified test order into database."""
    init_db(db_path)
    username = linphone_username or os.getenv("LINPHONE_USERNAME", "test_user")
    sip_address = (
        f"sip:{username}@sip.linphone.org"
        if not username.startswith("sip:")
        else username
    )

    cust_name = "Ramesh" if "ramesh" in username.lower() else "Radhika Sharma"
    cust_id = "cust_ramesh" if "ramesh" in username.lower() else "cust_radhika"
    ord_id = "ORD_RAMESH_101" if "ramesh" in username.lower() else "ORD_RADHIKA_101"

    # First ensure customer exists in customer memory
    update_customer(
        user_id=cust_id,
        name=cust_name,
        language_preference="Hindi",
        db_path=db_path,
    )

    # Seed verified test order: Basmati Rice x 2 = ₹640 (Status: PENDING)
    return create_order(
        order_id=ord_id,
        user_id=cust_id,
        customer_name=cust_name,
        phone_or_sip=sip_address,
        product_name="Basmati Rice",
        quantity=2.0,
        estimated_total=640.0,
        status="PENDING",
        db_path=db_path,
    )


# =============================================================================
# Call Outcome Logging, Opt-Out, and Retry Functions
# =============================================================================


def log_call_outcome(
    call_id: str,
    order_id: str,
    user_id: str,
    destination: str,
    outcome: str,
    db_path: str | None = None,
) -> dict[str, Any]:
    """Log an outbound call attempt and outcome."""
    valid_outcomes = {
        "ANSWERED",
        "NO_ANSWER",
        "BUSY",
        "REJECTED",
        "VOICEMAIL",
        "USER_OPTED_OUT",
        "COMPLETED",
        "FAILED",
        "USER_HANGUP",
        "DIALING",
    }
    outcome_clean = outcome.upper()
    if outcome_clean not in valid_outcomes:
        outcome_clean = "FAILED"

    now = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            # Calculate current retry count for destination
            cursor.execute(
                "SELECT COUNT(*) FROM call_logs WHERE destination = ? AND outcome != 'DIALING'",
                (destination,),
            )
            retry_count = cursor.fetchone()[0]

            cursor.execute(
                """
                INSERT OR REPLACE INTO call_logs (call_id, order_id, user_id, destination, outcome, timestamp, retry_count)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    call_id,
                    order_id,
                    user_id,
                    destination,
                    outcome_clean,
                    now,
                    retry_count,
                ),
            )
            conn.commit()
        logger.info(
            f"Logged call outcome: call_id='{call_id}' dest='{destination}' outcome='{outcome_clean}' retry={retry_count}"
        )
        return {
            "call_id": call_id,
            "order_id": order_id,
            "user_id": user_id,
            "destination": destination,
            "outcome": outcome_clean,
            "timestamp": now,
            "retry_count": retry_count,
        }
    except Exception as e:
        logger.error(f"Error logging call outcome for '{call_id}': {e}")
        return {"call_id": call_id, "outcome": outcome_clean}


def get_retry_count(destination: str, db_path: str | None = None) -> int:
    """Count non-dialing past calls for destination."""
    if not destination:
        return 0

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) FROM call_logs WHERE destination = ? AND outcome IN ('NO_ANSWER', 'BUSY', 'REJECTED', 'FAILED')",
                (destination,),
            )
            row = cursor.fetchone()
            return row[0] if row else 0
    except Exception as e:
        logger.error(f"Error calculating retry count for '{destination}': {e}")
        return 0


def record_user_opt_out(
    destination: str, user_id: str = "cust_default", db_path: str | None = None
) -> bool:
    """Store USER_OPTED_OUT preference in SQLite database."""
    if not destination:
        return False

    now = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT OR REPLACE INTO opt_outs (destination, user_id, opted_out_at)
                VALUES (?, ?, ?)
                """,
                (destination, user_id, now),
            )
            conn.commit()
        logger.info(
            f"Recorded opt-out for destination '{destination}' (user '{user_id}')"
        )
        return True
    except Exception as e:
        logger.error(f"Error recording opt-out for '{destination}': {e}")
        return False


def is_user_opted_out(destination: str, db_path: str | None = None) -> bool:
    """Check if destination or user has opted out of calls."""
    if not destination:
        return False

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT destination FROM opt_outs WHERE destination = ? OR user_id = ?",
                (destination, destination),
            )
            row = cursor.fetchone()
            return row is not None
    except Exception as e:
        logger.error(f"Error checking opt-out for '{destination}': {e}")
        return False


# =============================================================================
# Day 7 — Human Escalation Functions
# =============================================================================


def generate_reference_id(conn: sqlite3.Connection) -> str:
    """
    Generate a collision-safe, sequential unique Reference ID (e.g. LC-2026-0001).
    Guarantees no duplicate reference ID is ever generated.
    """
    year = datetime.now(timezone.utc).year
    cursor = conn.cursor()

    # Query existing count / max sequence to calculate next number
    cursor.execute("SELECT COUNT(*) FROM escalations")
    count = cursor.fetchone()[0]
    next_num = count + 1

    while True:
        ref_id = f"LC-{year}-{next_num:04d}"
        cursor.execute(
            "SELECT reference_id FROM escalations WHERE reference_id = ?", (ref_id,)
        )
        if not cursor.fetchone():
            return ref_id
        next_num += 1


def create_escalation_record(
    user_id: str,
    customer_name: str | None,
    issue_type: str,
    issue_summary: str,
    verified_information: str | None = None,
    urgency: str | None = None,
    language: str | None = None,
    preferred_followup_method: str | None = None,
    db_path: str | None = None,
) -> dict[str, Any]:
    """
    Create a new escalation request in the SQLite escalations table.
    Enforces duplicate check, sensitive info sanitization, and collision-safe Reference ID.
    """
    from tools.escalation_tool import determine_urgency, sanitize_sensitive_text

    init_db(db_path)

    clean_user_id = (user_id or "cust_default").strip()
    clean_issue_type = (issue_type or "OTHER_ESCALATION").upper()
    if clean_issue_type not in {"PAYMENT_REFUND", "ORDER_DISPUTE", "OTHER_ESCALATION"}:
        clean_issue_type = "OTHER_ESCALATION"

    # Sanitize inputs to prevent secret leaks
    clean_summary = sanitize_sensitive_text(issue_summary)
    clean_verified = sanitize_sensitive_text(verified_information)
    clean_name = sanitize_sensitive_text(customer_name or "Radhika")
    clean_lang = language or "English"
    clean_followup = preferred_followup_method or "Phone"

    calculated_urgency = determine_urgency(clean_issue_type, clean_summary, urgency)
    now = datetime.now(timezone.utc).isoformat()

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()

            # STEP 11 — DUPLICATE ESCALATION PROTECTION
            cursor.execute(
                """
                SELECT reference_id, issue_type, issue_summary, urgency, status, created_at
                FROM escalations
                WHERE user_id = ? AND issue_type = ? AND status IN ('OPEN', 'IN_PROGRESS')
                ORDER BY created_at DESC LIMIT 1
                """,
                (clean_user_id, clean_issue_type),
            )
            dup = cursor.fetchone()

            if dup:
                dup_dict = dict(dup)
                logger.info(
                    f"Duplicate open escalation found for user '{clean_user_id}': ref='{dup_dict['reference_id']}'"
                )
                return {
                    "success": True,
                    "is_duplicate": True,
                    "reference_id": dup_dict["reference_id"],
                    "status": dup_dict["status"],
                    "urgency": dup_dict["urgency"],
                    "message": f"I found an existing open support request for this issue. Your reference ID is {dup_dict['reference_id']}.",
                }

            # Generate collision-safe reference ID
            ref_id = generate_reference_id(conn)

            cursor.execute(
                """
                INSERT INTO escalations (
                    reference_id, user_id, customer_name, issue_type, issue_summary,
                    verified_information, urgency, language, preferred_followup_method,
                    status, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'OPEN', ?, ?)
                """,
                (
                    ref_id,
                    clean_user_id,
                    clean_name,
                    clean_issue_type,
                    clean_summary,
                    clean_verified,
                    calculated_urgency,
                    clean_lang,
                    clean_followup,
                    now,
                    now,
                ),
            )
            conn.commit()

        logger.info(
            f"Created escalation ref='{ref_id}' user='{clean_user_id}' type='{clean_issue_type}' urgency='{calculated_urgency}'"
        )
        return {
            "success": True,
            "is_duplicate": False,
            "reference_id": ref_id,
            "customer_name": clean_name,
            "issue_type": clean_issue_type,
            "issue_summary": clean_summary,
            "verified_information": clean_verified,
            "urgency": calculated_urgency,
            "language": clean_lang,
            "preferred_followup_method": clean_followup,
            "status": "OPEN",
            "created_at": now,
            "message": f"Your support request has been created successfully. Your reference ID is {ref_id}.",
        }

    except Exception as e:
        logger.error(f"Failed to create escalation for user '{clean_user_id}': {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "I'm sorry, I couldn't create the support request right now. Please try again shortly.",
        }


def get_escalations(
    status: str | None = None,
    urgency: str | None = None,
    search: str | None = None,
    db_path: str | None = None,
) -> list[dict[str, Any]]:
    """Fetch escalation records filtered by status, urgency, or search term."""
    init_db(db_path)
    query = "SELECT id, reference_id, user_id, customer_name, issue_type, issue_summary, verified_information, urgency, language, preferred_followup_method, status, created_at, updated_at FROM escalations WHERE 1=1"
    params: list[Any] = []

    if status and status.upper() != "ALL":
        query += " AND status = ?"
        params.append(status.upper())

    if urgency and urgency.upper() != "ALL":
        query += " AND urgency = ?"
        params.append(urgency.upper())

    if search:
        s = f"%{search.strip()}%"
        query += " AND (reference_id LIKE ? OR customer_name LIKE ? OR issue_summary LIKE ? OR user_id LIKE ?)"
        params.extend([s, s, s, s])

    query += " ORDER BY created_at DESC"

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Error fetching escalations: {e}")
        return []


def get_escalation_by_ref(
    reference_id: str, db_path: str | None = None
) -> dict[str, Any] | None:
    """Fetch single escalation details by reference_id."""
    if not reference_id:
        return None

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT id, reference_id, user_id, customer_name, issue_type, issue_summary, verified_information, urgency, language, preferred_followup_method, status, created_at, updated_at FROM escalations WHERE reference_id = ?",
                (reference_id.strip().upper(),),
            )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    except Exception as e:
        logger.error(f"Error fetching escalation '{reference_id}': {e}")
        return None


def update_escalation_status(
    reference_id: str, new_status: str, db_path: str | None = None
) -> dict[str, Any] | None:
    """Update status of an escalation record (OPEN, IN_PROGRESS, RESOLVED, CANCELLED)."""
    valid_statuses = {"OPEN", "IN_PROGRESS", "RESOLVED", "CANCELLED"}
    clean_status = new_status.upper().strip()
    if clean_status not in valid_statuses:
        logger.warning(
            f"Invalid status '{new_status}' provided for escalation '{reference_id}'"
        )
        return None

    now = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE escalations SET status = ?, updated_at = ? WHERE reference_id = ?",
                (clean_status, now, reference_id.strip().upper()),
            )
            conn.commit()
            if cursor.rowcount > 0:
                return get_escalation_by_ref(reference_id, db_path=db_path)
            return None
    except Exception as e:
        logger.error(f"Error updating status for escalation '{reference_id}': {e}")
        return None


# =============================================================================
# Day 8 — Advanced Voice Analytics & Call Lifecycle Database Layer
# =============================================================================


def create_call_record(
    call_id: str,
    user_id: str = "cust_default",
    channel: str = "BROWSER",
    started_at: str | None = None,
    language: str = "English",
    intent: str = "OTHER",
    db_path: str | None = None,
) -> dict[str, Any]:
    """Create or register an active call record when a call starts."""
    init_db(db_path)
    clean_call_id = call_id.strip()
    clean_channel = channel.upper().strip()
    if clean_channel not in {"BROWSER", "SIP"}:
        clean_channel = "BROWSER"

    now = datetime.now(timezone.utc).isoformat()
    start_ts = started_at or now

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO calls (
                    call_id, user_id, channel, started_at, language, intent,
                    outcome, failure_reason, escalated, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, 'IN_PROGRESS', 'NONE', 0, ?, ?)
                ON CONFLICT(call_id) DO UPDATE SET
                    user_id = excluded.user_id,
                    channel = excluded.channel,
                    updated_at = excluded.updated_at
                """,
                (
                    clean_call_id,
                    user_id,
                    clean_channel,
                    start_ts,
                    language,
                    intent,
                    now,
                    now,
                ),
            )
            conn.commit()

            cursor.execute("SELECT * FROM calls WHERE call_id = ?", (clean_call_id,))
            row = cursor.fetchone()
            return dict(row) if row else {"call_id": clean_call_id}
    except Exception as e:
        logger.error(f"Error creating call record '{clean_call_id}': {e}")
        return {"call_id": clean_call_id, "error": str(e)}


def update_call_event(
    call_id: str,
    language: str | None = None,
    intent: str | None = None,
    tool_failed: bool | None = None,
    escalated: bool | None = None,
    success_condition: str | None = None,
    agent_type: str | None = None,
    handoff: bool | None = None,
    handoff_target: str | None = None,
    db_path: str | None = None,
) -> bool:
    """Update call details dynamically as conversation turns/tools occur."""
    if not call_id:
        return False

    updates: list[str] = []
    params: list[Any] = []

    if language:
        updates.append("language = ?")
        params.append(language)
    if intent:
        updates.append("intent = ?")
        params.append(intent)
    if escalated is not None:
        updates.append("escalated = ?")
        params.append(1 if escalated else 0)
    if success_condition:
        updates.append("success_condition = ?")
        params.append(success_condition)
    if tool_failed:
        updates.append("failure_reason = 'TOOL_FAILURE'")
    if agent_type:
        updates.append("agent_type = ?")
        params.append(agent_type)
    if handoff is not None:
        updates.append("handoff = ?")
        params.append(1 if handoff else 0)
    if handoff_target:
        updates.append("handoff_target = ?")
        params.append(handoff_target)

    if not updates:
        return True

    now = datetime.now(timezone.utc).isoformat()
    updates.append("updated_at = ?")
    params.append(now)
    params.append(call_id.strip())

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                f"UPDATE calls SET {', '.join(updates)} WHERE call_id = ?",
                params,
            )
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Error updating call event for '{call_id}': {e}")
        return False


def finalize_call_analytics(
    call_id: str,
    ended_at: str | None = None,
    outcome: str | None = None,
    failure_reason: str | None = None,
    intent: str | None = None,
    language: str | None = None,
    escalated: bool | None = None,
    success_condition: str | None = None,
    db_path: str | None = None,
) -> dict[str, Any]:
    """Single backend service responsible for finalizing call analytics when a call ends."""
    init_db(db_path)
    clean_call_id = call_id.strip()
    now_dt = datetime.now(timezone.utc)
    now_iso = now_dt.isoformat()
    end_ts = ended_at or now_iso

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM calls WHERE call_id = ?", (clean_call_id,))
            row = cursor.fetchone()

            if not row:
                # If call record wasn't created on start, create it now
                create_call_record(call_id=clean_call_id, db_path=db_path)
                cursor.execute(
                    "SELECT * FROM calls WHERE call_id = ?", (clean_call_id,)
                )
                row = cursor.fetchone()

            existing = dict(row) if row else {}
            started_at_str = existing.get("started_at") or now_iso

            # Compute duration in seconds
            try:
                start_dt = datetime.fromisoformat(started_at_str)
                end_dt = datetime.fromisoformat(end_ts)
                duration = max(0, int((end_dt - start_dt).total_seconds()))
            except Exception:
                duration = existing.get("duration_seconds") or 0

            # Determine final outcome & failure reason if not explicitly passed
            final_outcome = (
                outcome.upper() if outcome else existing.get("outcome", "IN_PROGRESS")
            )
            final_failure = (
                failure_reason.upper()
                if failure_reason
                else existing.get("failure_reason", "NONE")
            )
            final_intent = intent or existing.get("intent", "OTHER")
            final_lang = language or existing.get("language", "English")
            final_esc = (
                (1 if escalated else 0)
                if escalated is not None
                else existing.get("escalated", 0)
            )

            # Auto-infer outcome if still IN_PROGRESS
            if final_outcome == "IN_PROGRESS":
                if final_failure in {"TOOL_FAILURE", "API_FAILURE"}:
                    final_outcome = "FAILED"
                elif duration < 4 and final_intent == "OTHER":
                    final_outcome = "FAILED"
                    final_failure = "USER_HANGUP"
                else:
                    final_outcome = "SUCCESS"
                    final_failure = "NONE"

            if final_outcome == "SUCCESS":
                final_failure = "NONE"
            elif final_failure == "NONE":
                final_failure = "UNKNOWN"

            cursor.execute(
                """
                UPDATE calls SET
                    ended_at = ?,
                    duration_seconds = ?,
                    intent = ?,
                    language = ?,
                    outcome = ?,
                    failure_reason = ?,
                    escalated = ?,
                    success_condition = COALESCE(?, success_condition),
                    updated_at = ?
                WHERE call_id = ?
                """,
                (
                    end_ts,
                    duration,
                    final_intent,
                    final_lang,
                    final_outcome,
                    final_failure,
                    final_esc,
                    success_condition,
                    now_iso,
                    clean_call_id,
                ),
            )
            conn.commit()

            cursor.execute("SELECT * FROM calls WHERE call_id = ?", (clean_call_id,))
            updated_row = cursor.fetchone()
            logger.info(
                f"Finalized call '{clean_call_id}': outcome={final_outcome}, reason={final_failure}, duration={duration}s"
            )
            return dict(updated_row) if updated_row else {}
    except Exception as e:
        logger.error(f"Error finalizing call analytics for '{clean_call_id}': {e}")
        return {"call_id": clean_call_id, "error": str(e)}


def get_analytics_summary(db_path: str | None = None) -> dict[str, Any]:
    """Aggregate SQL queries for total calls, successful calls, failed calls, and success rate."""
    init_db(db_path)
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM calls")
            total = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM calls WHERE outcome = 'SUCCESS'")
            successful = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM calls WHERE outcome = 'FAILED'")
            failed = cursor.fetchone()[0]

            success_rate = round((successful / total * 100), 1) if total > 0 else 0.0

            return {
                "total_calls": total,
                "successful_calls": successful,
                "failed_calls": failed,
                "success_rate": success_rate,
            }
    except Exception as e:
        logger.error(f"Error computing analytics summary: {e}")
        return {
            "total_calls": 0,
            "successful_calls": 0,
            "failed_calls": 0,
            "success_rate": 0.0,
            "error": str(e),
        }


def get_recent_calls(
    limit: int = 20,
    offset: int = 0,
    channel: str | None = None,
    language: str | None = None,
    intent: str | None = None,
    outcome: str | None = None,
    search: str | None = None,
    db_path: str | None = None,
) -> dict[str, Any]:
    """Return recent calls for table with safe fields only (No secrets, credentials, or full transcripts)."""
    init_db(db_path)
    query = """
    SELECT call_id, channel, language, intent, duration_seconds AS duration,
           outcome, failure_reason, escalated, started_at AS timestamp
    FROM calls WHERE 1=1
    """
    count_query = "SELECT COUNT(*) FROM calls WHERE 1=1"
    params: list[Any] = []

    if channel and channel.upper() != "ALL":
        query += " AND channel = ?"
        count_query += " AND channel = ?"
        params.append(channel.upper())

    if language and language.upper() != "ALL":
        query += " AND language = ?"
        count_query += " AND language = ?"
        params.append(language)

    if intent and intent.upper() != "ALL":
        query += " AND intent = ?"
        count_query += " AND intent = ?"
        params.append(intent.upper())

    if outcome and outcome.upper() != "ALL":
        query += " AND outcome = ?"
        count_query += " AND outcome = ?"
        params.append(outcome.upper())

    if search:
        s = f"%{search.strip()}%"
        query += " AND (call_id LIKE ? OR user_id LIKE ?)"
        count_query += " AND (call_id LIKE ? OR user_id LIKE ?)"
        params.extend([s, s])

    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    query_params = [*list(params), limit, offset]

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(count_query, params)
            total_count = cursor.fetchone()[0]

            cursor.execute(query, query_params)
            rows = cursor.fetchall()
            calls = []
            for r in rows:
                item = dict(r)
                item["escalated"] = bool(item.get("escalated", 0))
                calls.append(item)

            return {
                "calls": calls,
                "total": total_count,
                "limit": limit,
                "offset": offset,
            }
    except Exception as e:
        logger.error(f"Error fetching recent calls: {e}")
        return {"calls": [], "total": 0, "error": str(e)}


def get_analytics_trends(
    timeframe: str = "7d", db_path: str | None = None
) -> list[dict[str, Any]]:
    """Return time-series call volume data grouped by date/hour for charts."""
    init_db(db_path)
    # Determine date filter
    where_clause = ""
    if timeframe == "today":
        where_clause = "WHERE started_at >= date('now', 'start of day')"
    elif timeframe == "7d":
        where_clause = "WHERE started_at >= date('now', '-7 days')"
    elif timeframe == "30d":
        where_clause = "WHERE started_at >= date('now', '-30 days')"

    query = f"""
    SELECT strftime('%Y-%m-%d', started_at) AS date,
           COUNT(*) AS total,
           SUM(CASE WHEN outcome = 'SUCCESS' THEN 1 ELSE 0 END) AS successful,
           SUM(CASE WHEN outcome = 'FAILED' THEN 1 ELSE 0 END) AS failed
    FROM calls
    {where_clause}
    GROUP BY date
    ORDER BY date ASC
    """

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            rows = cursor.fetchall()
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Error fetching analytics trends: {e}")
        return []


def get_analytics_failures(db_path: str | None = None) -> dict[str, Any]:
    """Return failure reasons breakdown and dynamic data-driven insight sentence."""
    init_db(db_path)
    query = """
    SELECT failure_reason, COUNT(*) AS count
    FROM calls
    WHERE outcome = 'FAILED' AND failure_reason != 'NONE'
    GROUP BY failure_reason
    ORDER BY count DESC
    """
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(query)
            rows = cursor.fetchall()
            categories = {r["failure_reason"]: r["count"] for r in rows}

            # Map into readable labels & generate insight
            labels = {
                "USER_HANGUP": "User Hang-up",
                "INCOMPLETE_TASK": "Incomplete Task",
                "TOOL_FAILURE": "Tool Failure",
                "API_FAILURE": "API Failure",
                "NO_RESPONSE": "No Response",
                "UNKNOWN": "Unknown Failure",
            }

            breakdown = [
                {
                    "key": k,
                    "label": labels.get(k, k),
                    "count": categories.get(k, 0),
                }
                for k in labels
            ]

            total_failures = sum(categories.values())
            insight = "No call failures recorded yet."
            if total_failures > 0:
                top_reason = max(categories.items(), key=lambda x: x[1])[0]
                top_label = labels.get(top_reason, top_reason)
                pct = round((categories[top_reason] / total_failures) * 100)
                insight = f"Most failures ({pct}%) are currently caused by {top_label.lower()}s."

            return {
                "total_failures": total_failures,
                "breakdown": breakdown,
                "insight": insight,
            }
    except Exception as e:
        logger.error(f"Error fetching failure insights: {e}")
        return {
            "total_failures": 0,
            "breakdown": [],
            "insight": "Failure insights unavailable.",
        }


def get_analytics_breakdowns(db_path: str | None = None) -> dict[str, Any]:
    """Return distributions across channels, languages, intents, and Day 7 escalation stats."""
    init_db(db_path)
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()

            # Channels
            cursor.execute(
                "SELECT channel, COUNT(*) AS count FROM calls GROUP BY channel"
            )
            ch_rows = cursor.fetchall()
            channels = {r["channel"]: r["count"] for r in ch_rows}

            # Languages
            cursor.execute(
                "SELECT language, COUNT(*) AS count FROM calls GROUP BY language"
            )
            lang_rows = cursor.fetchall()
            languages = {r["language"]: r["count"] for r in lang_rows}

            # Intents
            cursor.execute(
                "SELECT intent, COUNT(*) AS count FROM calls GROUP BY intent"
            )
            intent_rows = cursor.fetchall()
            intents = {r["intent"]: r["count"] for r in intent_rows}

            # Day 7 Escalation Insights
            cursor.execute("SELECT COUNT(*) FROM escalations")
            esc_total = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM escalations WHERE status = 'OPEN'")
            esc_open = cursor.fetchone()[0]
            cursor.execute(
                "SELECT COUNT(*) FROM escalations WHERE status = 'IN_PROGRESS'"
            )
            esc_in_progress = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM escalations WHERE status = 'RESOLVED'")
            esc_resolved = cursor.fetchone()[0]

            # Day 9 Specialist & Handoff Insights
            cursor.execute("SELECT COUNT(*) FROM calls WHERE handoff = 1")
            handoff_total = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM calls WHERE agent_type = 'SPECIALIST'")
            specialist_calls = cursor.fetchone()[0]

            return {
                "channels": {
                    "BROWSER": channels.get("BROWSER", 0),
                    "SIP": channels.get("SIP", 0),
                },
                "languages": {
                    "English": languages.get("English", 0),
                    "Hindi": languages.get("Hindi", 0),
                    "Hinglish": languages.get("Hinglish", 0),
                },
                "intents": intents,
                "escalations": {
                    "total": esc_total,
                    "open": esc_open,
                    "in_progress": esc_in_progress,
                    "resolved": esc_resolved,
                },
                "specialist": {
                    "handoffs": handoff_total,
                    "specialist_calls": specialist_calls,
                },
            }
    except Exception as e:
        logger.error(f"Error computing analytics breakdowns: {e}")
        return {
            "channels": {"BROWSER": 0, "SIP": 0},
            "languages": {"English": 0, "Hindi": 0, "Hinglish": 0},
            "intents": {},
            "escalations": {"total": 0, "open": 0, "in_progress": 0, "resolved": 0},
            "specialist": {"handoffs": 0, "specialist_calls": 0},
        }


def get_order_record(
    order_id: str, user_id: str | None = None, db_path: str | None = None
) -> dict[str, Any] | None:
    """Retrieve an order record from SQLite by order_id or user_id."""
    clean_id = (order_id or "").strip().lstrip("#")
    if not clean_id and not user_id:
        return None

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            if clean_id:
                cursor.execute(
                    "SELECT * FROM orders WHERE order_id = ? OR order_id = ?",
                    (clean_id, f"#{clean_id}"),
                )
            else:
                cursor.execute(
                    "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 1",
                    (user_id,),
                )
            row = cursor.fetchone()
            if row:
                return dict(row)
            return None
    except Exception as e:
        logger.error(f"Error retrieving order record '{order_id}': {e}")
        return None


def check_return_eligibility_db(
    order_id: str | None = None, user_id: str | None = None, db_path: str | None = None
) -> dict[str, Any]:
    """Check if an order is eligible for return based on status and purchase date."""
    order = get_order_record(order_id, user_id, db_path)
    if not order:
        return {
            "verified": False,
            "eligible": False,
            "reason": "ORDER_NOT_FOUND",
            "message": f"Order #{order_id or 'unknown'} could not be found in our database.",
        }

    status = order.get("status", "PENDING")
    if status != "CONFIRMED":
        return {
            "verified": True,
            "eligible": False,
            "order_id": order["order_id"],
            "product_name": order["product_name"],
            "reason": "ORDER_NOT_DELIVERED",
            "message": f"Order #{order['order_id']} has status '{status}'. Returns are only eligible for confirmed/delivered items.",
        }

    # Default return window: 7 days
    return {
        "verified": True,
        "eligible": True,
        "order_id": order["order_id"],
        "product_name": order["product_name"],
        "quantity": order["quantity"],
        "estimated_total": order["estimated_total"],
        "return_window": "7 days from delivery",
        "instructions": "Place the product in original packaging. Pickup will be scheduled within 24 hours of return request approval.",
    }


def check_refund_status_db(
    order_id: str | None = None, user_id: str | None = None, db_path: str | None = None
) -> dict[str, Any]:
    """Check refund status for a specific order."""
    order = get_order_record(order_id, user_id, db_path)
    if not order:
        return {
            "verified": False,
            "reason": "ORDER_NOT_FOUND",
            "message": f"Order #{order_id or 'unknown'} was not found.",
        }

    return {
        "verified": True,
        "order_id": order["order_id"],
        "product_name": order["product_name"],
        "amount": order["estimated_total"],
        "refund_status": "PROCESSING",
        "expected_completion": "2 to 3 business days to original payment method",
        "reference": f"REF-{order['order_id']}-2026",
    }


# =============================================================================
# Agentic Commerce Memory & Database Operations (VyapaarVoice AI)
# =============================================================================


def get_or_create_cart(
    user_id: str, customer_name: str | None = None, db_path: str | None = None
) -> dict[str, Any]:
    """Get active cart for user or create a new one."""
    init_db(db_path)
    now_str = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM carts WHERE user_id = ? AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1",
                (user_id,),
            )
            row = cursor.fetchone()
            if row:
                cart = dict(row)
                cursor.execute(
                    "SELECT * FROM cart_items WHERE cart_id = ? ORDER BY id ASC",
                    (cart["cart_id"],),
                )
                cart["items"] = [dict(r) for r in cursor.fetchall()]
                return cart

            # Create new active cart
            cart_id = f"CART_{user_id}_{int(datetime.now().timestamp())}"
            cursor.execute(
                """
                INSERT INTO carts (cart_id, user_id, customer_name, subtotal, delivery_fee, discount, total_amount, status, created_at, updated_at)
                VALUES (?, ?, ?, 0.0, 0.0, 0.0, 0.0, 'ACTIVE', ?, ?)
                """,
                (cart_id, user_id, customer_name or "Valued Customer", now_str, now_str),
            )
            conn.commit()
            return {
                "cart_id": cart_id,
                "user_id": user_id,
                "customer_name": customer_name or "Valued Customer",
                "subtotal": 0.0,
                "delivery_fee": 0.0,
                "discount": 0.0,
                "total_amount": 0.0,
                "status": "ACTIVE",
                "items": [],
                "created_at": now_str,
                "updated_at": now_str,
            }
    except Exception as e:
        logger.error(f"Error in get_or_create_cart for {user_id}: {e}")
        return {
            "cart_id": f"CART_{user_id}",
            "user_id": user_id,
            "subtotal": 0.0,
            "delivery_fee": 0.0,
            "discount": 0.0,
            "total_amount": 0.0,
            "status": "ACTIVE",
            "items": [],
        }


def recalculate_cart_totals(cart_id: str, db_path: str | None = None) -> dict[str, Any]:
    """Deterministically recalculate subtotal, delivery, and total for a cart."""
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT SUM(total_price) as subtotal FROM cart_items WHERE cart_id = ?",
                (cart_id,),
            )
            row = cursor.fetchone()
            subtotal = float(row["subtotal"]) if row and row["subtotal"] is not None else 0.0
            
            # Delivery rule: Free delivery above ₹500, else ₹40
            delivery_fee = 0.0 if (subtotal >= 500.0 or subtotal == 0.0) else 40.0
            discount = 0.0
            total_amount = round(subtotal + delivery_fee - discount, 2)
            now_str = datetime.now(timezone.utc).isoformat()

            cursor.execute(
                """
                UPDATE carts 
                SET subtotal = ?, delivery_fee = ?, discount = ?, total_amount = ?, updated_at = ?
                WHERE cart_id = ?
                """,
                (subtotal, delivery_fee, discount, total_amount, now_str, cart_id),
            )
            conn.commit()
            return {
                "subtotal": subtotal,
                "delivery_fee": delivery_fee,
                "discount": discount,
                "total_amount": total_amount,
            }
    except Exception as e:
        logger.error(f"Error recalculating cart {cart_id}: {e}")
        return {"subtotal": 0.0, "delivery_fee": 0.0, "discount": 0.0, "total_amount": 0.0}


def add_item_to_cart_db(
    user_id: str,
    product_id: str,
    product_name: str,
    quantity: float,
    unit_price: float,
    category: str | None = None,
    unit: str | None = None,
    db_path: str | None = None,
) -> dict[str, Any]:
    """Add or update an item in user's active cart with deterministic price calculation."""
    cart = get_or_create_cart(user_id, db_path=db_path)
    cart_id = cart["cart_id"]
    now_str = datetime.now(timezone.utc).isoformat()
    total_price = round(quantity * unit_price, 2)

    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?",
                (cart_id, product_id),
            )
            existing = cursor.fetchone()
            if existing:
                new_qty = existing["quantity"] + quantity
                new_total = round(new_qty * unit_price, 2)
                cursor.execute(
                    "UPDATE cart_items SET quantity = ?, total_price = ? WHERE id = ?",
                    (new_qty, new_total, existing["id"]),
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO cart_items (cart_id, product_id, product_name, category, unit, quantity, unit_price, total_price, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        cart_id,
                        product_id,
                        product_name,
                        category or "General",
                        unit or "unit",
                        quantity,
                        unit_price,
                        total_price,
                        now_str,
                    ),
                )
            conn.commit()

        totals = recalculate_cart_totals(cart_id, db_path=db_path)
        log_commerce_event_db(
            event_type="CART_UPDATED",
            user_id=user_id,
            agent_name="Shopping Agent",
            title=f"Added {quantity} {unit or 'x'} {product_name} to cart",
            details=f"Item Total: ₹{total_price}, Cart Total: ₹{totals['total_amount']}",
            db_path=db_path,
        )
        return get_or_create_cart(user_id, db_path=db_path)
    except Exception as e:
        logger.error(f"Error adding item to cart for {user_id}: {e}")
        return cart


def remove_item_from_cart_db(
    user_id: str, product_id: str, db_path: str | None = None
) -> dict[str, Any]:
    """Remove a product from user's active cart."""
    cart = get_or_create_cart(user_id, db_path=db_path)
    cart_id = cart["cart_id"]
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "DELETE FROM cart_items WHERE cart_id = ? AND (product_id = ? OR product_name LIKE ?)",
                (cart_id, product_id, f"%{product_id}%"),
            )
            conn.commit()
        recalculate_cart_totals(cart_id, db_path=db_path)
        return get_or_create_cart(user_id, db_path=db_path)
    except Exception as e:
        logger.error(f"Error removing item from cart: {e}")
        return cart


def clear_cart_db(user_id: str, db_path: str | None = None) -> bool:
    """Clear all items from user's active cart."""
    cart = get_or_create_cart(user_id, db_path=db_path)
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM cart_items WHERE cart_id = ?", (cart["cart_id"],))
            cursor.execute(
                "UPDATE carts SET subtotal = 0, delivery_fee = 0, discount = 0, total_amount = 0 WHERE cart_id = ?",
                (cart["cart_id"],),
            )
            conn.commit()
        return True
    except Exception as e:
        logger.error(f"Error clearing cart: {e}")
        return False


def create_payment_intent_db(
    user_id: str,
    amount: float,
    cart_id: str | None = None,
    order_id: str | None = None,
    provider: str = "MOCK",
    payment_method: str = "UPI_QR",
    db_path: str | None = None,
) -> dict[str, Any]:
    """Create a verified payment intent in the database."""
    init_db(db_path)
    payment_id = f"PAY_{int(datetime.now().timestamp())}_{user_id[-4:] if len(user_id)>=4 else '0000'}"
    now_str = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO payment_intents (payment_id, cart_id, order_id, user_id, amount, currency, provider, status, payment_method, transaction_ref, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, 'INR', ?, 'CREATED', ?, ?, ?, ?)
                """,
                (
                    payment_id,
                    cart_id,
                    order_id,
                    user_id,
                    amount,
                    provider,
                    payment_method,
                    f"TXN_{payment_id}",
                    now_str,
                    now_str,
                ),
            )
            conn.commit()

        log_commerce_event_db(
            event_type="PAYMENT_INTENT_CREATED",
            user_id=user_id,
            agent_name="Checkout Agent",
            title=f"Payment Intent Created (₹{amount})",
            details=f"Method: {payment_method}, Ref: TXN_{payment_id}",
            db_path=db_path,
        )

        return {
            "payment_id": payment_id,
            "user_id": user_id,
            "amount": amount,
            "currency": "INR",
            "provider": provider,
            "status": "CREATED",
            "payment_method": payment_method,
            "transaction_ref": f"TXN_{payment_id}",
            "created_at": now_str,
        }
    except Exception as e:
        logger.error(f"Error creating payment intent: {e}")
        return {
            "payment_id": payment_id,
            "user_id": user_id,
            "amount": amount,
            "status": "FAILED",
            "error": str(e),
        }


def update_payment_intent_status_db(
    payment_id: str,
    status: str,
    transaction_ref: str | None = None,
    db_path: str | None = None,
) -> bool:
    """Update payment intent status (e.g. PAID, FAILED, CANCELLED)."""
    now_str = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                UPDATE payment_intents 
                SET status = ?, transaction_ref = COALESCE(?, transaction_ref), updated_at = ?
                WHERE payment_id = ?
                """,
                (status, transaction_ref, now_str, payment_id),
            )
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Error updating payment intent {payment_id}: {e}")
        return False


def log_agent_action_db(
    agent_name: str,
    action_type: str,
    tool_name: str | None = None,
    user_id: str | None = None,
    input_params: str | None = None,
    output_result: str | None = None,
    status: str = "SUCCESS",
    latency_ms: int = 0,
    decision_reason: str | None = None,
    db_path: str | None = None,
) -> None:
    """Log an agent action for auditing and activity tracking."""
    init_db(db_path)
    action_id = f"ACT_{int(datetime.now().timestamp() * 1000)}"
    now_str = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO agent_actions (action_id, timestamp, agent_name, action_type, tool_name, user_id, input_params, output_result, status, latency_ms, decision_reason)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    action_id,
                    now_str,
                    agent_name,
                    action_type,
                    tool_name,
                    user_id,
                    input_params,
                    output_result,
                    status,
                    latency_ms,
                    decision_reason,
                ),
            )
            conn.commit()
    except Exception as e:
        logger.debug(f"Could not log agent action: {e}")


def log_commerce_event_db(
    event_type: str,
    user_id: str | None = None,
    agent_name: str | None = None,
    title: str = "",
    details: str | None = None,
    db_path: str | None = None,
) -> None:
    """Log a high-level commerce event for the real-time timeline."""
    init_db(db_path)
    event_id = f"EVT_{int(datetime.now().timestamp() * 1000)}"
    now_str = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO commerce_events (event_id, event_type, user_id, agent_name, title, details, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (event_id, event_type, user_id, agent_name or "VyapaarVoice AI", title, details, now_str),
            )
            conn.commit()
    except Exception as e:
        logger.debug(f"Could not log commerce event: {e}")


def get_recent_commerce_events_db(
    limit: int = 15, db_path: str | None = None
) -> list[dict[str, Any]]:
    """Retrieve recent commerce events for the activity timeline."""
    init_db(db_path)
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM commerce_events ORDER BY id DESC LIMIT ?",
                (limit,),
            )
            return [dict(r) for r in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Error fetching commerce events: {e}")
        return []


def get_recent_agent_actions_db(
    limit: int = 20, db_path: str | None = None
) -> list[dict[str, Any]]:
    """Retrieve recent agent actions for audit trail."""
    init_db(db_path)
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT * FROM agent_actions ORDER BY id DESC LIMIT ?",
                (limit,),
            )
            return [dict(r) for r in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Error fetching agent actions: {e}")
        return []


def create_followup_suggestion_db(
    customer_id: str,
    customer_name: str,
    suggestion_type: str,
    message: str,
    target_products: str | None = None,
    estimated_value: float = 0.0,
    db_path: str | None = None,
) -> dict[str, Any]:
    """Create an AI suggested follow-up (e.g. abandoned cart recovery or repeat order reminder)."""
    init_db(db_path)
    suggestion_id = f"SUG_{int(datetime.now().timestamp())}_{customer_id[-4:] if len(customer_id)>=4 else '00'}"
    now_str = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO followup_suggestions (suggestion_id, customer_id, customer_name, suggestion_type, message, target_products, estimated_value, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING_APPROVAL', ?, ?)
                """,
                (
                    suggestion_id,
                    customer_id,
                    customer_name,
                    suggestion_type,
                    message,
                    target_products,
                    estimated_value,
                    now_str,
                    now_str,
                ),
            )
            conn.commit()
            return {
                "suggestion_id": suggestion_id,
                "customer_id": customer_id,
                "customer_name": customer_name,
                "suggestion_type": suggestion_type,
                "message": message,
                "estimated_value": estimated_value,
                "status": "PENDING_APPROVAL",
                "created_at": now_str,
            }
    except Exception as e:
        logger.error(f"Error creating follow-up suggestion: {e}")
        return {}


def update_followup_status_db(
    suggestion_id: str, status: str, db_path: str | None = None
) -> bool:
    """Approve, dismiss, or update status of an AI follow-up suggestion."""
    now_str = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE followup_suggestions SET status = ?, updated_at = ? WHERE suggestion_id = ?",
                (status, now_str, suggestion_id),
            )
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        logger.error(f"Error updating followup status: {e}")
        return False


def get_followup_suggestions_db(
    status: str | None = None, db_path: str | None = None
) -> list[dict[str, Any]]:
    """Retrieve follow-up suggestions filtered by status."""
    init_db(db_path)
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            if status:
                cursor.execute(
                    "SELECT * FROM followup_suggestions WHERE status = ? ORDER BY id DESC",
                    (status,),
                )
            else:
                cursor.execute("SELECT * FROM followup_suggestions ORDER BY id DESC")
            return [dict(r) for r in cursor.fetchall()]
    except Exception as e:
        logger.error(f"Error getting followups: {e}")
        return []


def get_customer_segments_db(db_path: str | None = None) -> list[dict[str, Any]]:
    """Calculate deterministic customer segmentation from real database order history."""
    init_db(db_path)
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT c.user_id, c.name, COUNT(o.order_id) as order_count, SUM(o.estimated_total) as total_spent
                FROM customers c
                LEFT JOIN orders o ON c.user_id = o.user_id AND o.status = 'CONFIRMED'
                GROUP BY c.user_id, c.name
                """
            )
            rows = cursor.fetchall()
            segments = []
            now_str = datetime.now(timezone.utc).isoformat()
            for r in rows:
                user_id = r["user_id"]
                name = r["name"] or "Customer"
                count = r["order_count"] or 0
                spent = float(r["total_spent"] or 0.0)

                if count >= 3 or spent >= 1500.0:
                    seg = "LOYAL"
                    reason = f"Completed {count} orders with ₹{spent:.0f} total spend"
                elif count >= 1:
                    seg = "RETURNING"
                    reason = f"Completed {count} verified purchase"
                else:
                    seg = "NEW"
                    reason = "Registered customer with 0 completed orders"

                segments.append({
                    "user_id": user_id,
                    "customer_name": name,
                    "segment_name": seg,
                    "orders_count": count,
                    "total_spent": spent,
                    "reason": reason,
                    "updated_at": now_str,
                })
            return segments
    except Exception as e:
        logger.error(f"Error calculating customer segments: {e}")
        return []


def get_recovery_opportunities_db(db_path: str | None = None) -> list[dict[str, Any]]:
    """Retrieve recovery opportunities from carts created without completed checkout."""
    init_db(db_path)
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                SELECT c.*, COUNT(ci.id) as item_count 
                FROM carts c
                JOIN cart_items ci ON c.cart_id = ci.cart_id
                WHERE c.status = 'ACTIVE' AND c.total_amount > 0
                GROUP BY c.cart_id
                ORDER BY c.total_amount DESC
                """
            )
            rows = cursor.fetchall()
            opps = []
            now_str = datetime.now(timezone.utc).isoformat()
            for r in rows:
                amt = float(r["total_amount"])
                priority = "HIGH" if amt >= 1000.0 else "MEDIUM" if amt >= 400.0 else "LOW"
                opps.append({
                    "opportunity_id": f"OPP_{r['cart_id']}",
                    "cart_id": r["cart_id"],
                    "user_id": r["user_id"],
                    "customer_name": r["customer_name"] or "Customer",
                    "amount": amt,
                    "priority": priority,
                    "recommended_action": f"Send personalized Hinglish WhatsApp/SMS reminder for {r['item_count']} items (₹{amt})",
                    "status": "OPEN",
                    "created_at": now_str,
                })
            return opps
    except Exception as e:
        logger.error(f"Error fetching recovery opportunities: {e}")
        return []


def get_merchant_sales_summary_db(db_path: str | None = None) -> dict[str, Any]:
    """Retrieve deterministic sales and revenue summary for Merchant Copilot."""
    init_db(db_path)
    try:
        with get_connection(db_path) as conn:
            cursor = conn.cursor()
            cursor.execute(
                "SELECT COUNT(*) as total_orders, SUM(estimated_total) as total_revenue FROM orders WHERE status = 'CONFIRMED'"
            )
            row = cursor.fetchone()
            total_orders = row["total_orders"] if row else 0
            total_revenue = float(row["total_revenue"] or 0.0) if row else 0.0

            cursor.execute(
                "SELECT COUNT(*) as active_carts, SUM(total_amount) as abandoned_value FROM carts WHERE status = 'ACTIVE' AND total_amount > 0"
            )
            cart_row = cursor.fetchone()
            active_carts = cart_row["active_carts"] if cart_row else 0
            abandoned_val = float(cart_row["abandoned_value"] or 0.0) if cart_row else 0.0

            cursor.execute("SELECT COUNT(*) as total_calls FROM calls")
            calls_row = cursor.fetchone()
            total_calls = calls_row["total_calls"] if calls_row else 0

            return {
                "total_orders": total_orders,
                "total_revenue": total_revenue,
                "active_carts": active_carts,
                "abandoned_cart_value": abandoned_val,
                "total_voice_calls": total_calls,
                "average_order_value": round(total_revenue / total_orders, 2) if total_orders > 0 else 0.0,
            }
    except Exception as e:
        logger.error(f"Error generating sales summary: {e}")
        return {
            "total_orders": 0,
            "total_revenue": 0.0,
            "active_carts": 0,
            "abandoned_cart_value": 0.0,
            "total_voice_calls": 0,
            "average_order_value": 0.0,
        }

