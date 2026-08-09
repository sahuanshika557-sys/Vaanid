"""Database schema for Local Commerce customer memory."""

CREATE_CUSTOMERS_TABLE = """
CREATE TABLE IF NOT EXISTS customers (
    user_id TEXT PRIMARY KEY,
    name TEXT,
    language_preference TEXT,
    preferred_delivery_slot TEXT,
    usual_quantity TEXT,
    past_orders TEXT,
    last_interaction TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

CREATE_CUSTOMERS_INDEX = """
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
"""
