"""SQLite database layer for persistent Local Commerce customer memory."""

import logging
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from database.schema import CREATE_CUSTOMERS_INDEX, CREATE_CUSTOMERS_TABLE

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
            cursor.execute(CREATE_CUSTOMERS_TABLE)
            cursor.execute(CREATE_CUSTOMERS_INDEX)
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

    set_clause = ", ".join(f"{field} = ?" for field in updates.keys())
    values = list(updates.values()) + [user_id]

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
