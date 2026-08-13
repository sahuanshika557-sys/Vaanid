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

CREATE_ORDERS_TABLE = """
CREATE TABLE IF NOT EXISTS orders (
    order_id TEXT PRIMARY KEY,
    user_id TEXT,
    customer_name TEXT,
    phone_or_sip TEXT,
    product_name TEXT,
    quantity REAL,
    estimated_total REAL,
    status TEXT CHECK(status IN ('PENDING', 'CONFIRMED', 'CANCELLED')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

CREATE_ORDERS_INDEX = """
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_phone_or_sip ON orders(phone_or_sip);
"""

CREATE_CALL_LOGS_TABLE = """
CREATE TABLE IF NOT EXISTS call_logs (
    call_id TEXT PRIMARY KEY,
    order_id TEXT,
    user_id TEXT,
    destination TEXT,
    outcome TEXT CHECK(outcome IN ('ANSWERED', 'NO_ANSWER', 'BUSY', 'REJECTED', 'VOICEMAIL', 'USER_OPTED_OUT', 'COMPLETED', 'FAILED', 'USER_HANGUP', 'DIALING')),
    timestamp TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0
);
"""

CREATE_CALL_LOGS_INDEX = """
CREATE INDEX IF NOT EXISTS idx_call_logs_destination ON call_logs(destination);
CREATE INDEX IF NOT EXISTS idx_call_logs_user_id ON call_logs(user_id);
"""

CREATE_OPT_OUTS_TABLE = """
CREATE TABLE IF NOT EXISTS opt_outs (
    destination TEXT PRIMARY KEY,
    user_id TEXT,
    opted_out_at TEXT NOT NULL
);
"""

CREATE_ESCALATIONS_TABLE = """
CREATE TABLE IF NOT EXISTS escalations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reference_id TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    customer_name TEXT,
    issue_type TEXT CHECK(issue_type IN ('PAYMENT_REFUND', 'ORDER_DISPUTE', 'OTHER_ESCALATION')) NOT NULL,
    issue_summary TEXT NOT NULL,
    verified_information TEXT,
    urgency TEXT CHECK(urgency IN ('LOW', 'MEDIUM', 'HIGH')) NOT NULL DEFAULT 'MEDIUM',
    language TEXT DEFAULT 'English',
    preferred_followup_method TEXT DEFAULT 'Phone',
    status TEXT CHECK(status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED')) NOT NULL DEFAULT 'OPEN',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

CREATE_ESCALATIONS_INDEX = """
CREATE INDEX IF NOT EXISTS idx_escalations_user_id ON escalations(user_id);
CREATE INDEX IF NOT EXISTS idx_escalations_reference_id ON escalations(reference_id);
CREATE INDEX IF NOT EXISTS idx_escalations_status ON escalations(status);
"""

CREATE_CALLS_TABLE = """
CREATE TABLE IF NOT EXISTS calls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    call_id TEXT UNIQUE NOT NULL,
    user_id TEXT,
    channel TEXT CHECK(channel IN ('BROWSER', 'SIP')) NOT NULL DEFAULT 'BROWSER',
    started_at TEXT NOT NULL,
    ended_at TEXT,
    duration_seconds INTEGER DEFAULT 0,
    language TEXT DEFAULT 'English',
    intent TEXT DEFAULT 'OTHER',
    success_condition TEXT,
    outcome TEXT CHECK(outcome IN ('SUCCESS', 'FAILED', 'IN_PROGRESS')) DEFAULT 'IN_PROGRESS',
    failure_reason TEXT CHECK(failure_reason IN ('USER_HANGUP', 'INCOMPLETE_TASK', 'TOOL_FAILURE', 'API_FAILURE', 'NO_RESPONSE', 'UNKNOWN', 'NONE')) DEFAULT 'NONE',
    escalated INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

CREATE_CALLS_INDEX = """
CREATE INDEX IF NOT EXISTS idx_calls_call_id ON calls(call_id);
CREATE INDEX IF NOT EXISTS idx_calls_created_at ON calls(created_at);
CREATE INDEX IF NOT EXISTS idx_calls_outcome ON calls(outcome);
CREATE INDEX IF NOT EXISTS idx_calls_channel ON calls(channel);
CREATE INDEX IF NOT EXISTS idx_calls_language ON calls(language);
CREATE INDEX IF NOT EXISTS idx_calls_intent ON calls(intent);
"""
