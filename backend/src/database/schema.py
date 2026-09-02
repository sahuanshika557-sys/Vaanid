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
    agent_type TEXT CHECK(agent_type IN ('MAIN', 'SPECIALIST')) DEFAULT 'MAIN',
    handoff INTEGER DEFAULT 0,
    handoff_target TEXT,
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

# =============================================================================
# Agentic Commerce Schema Additions (VyapaarVoice AI)
# =============================================================================

CREATE_CARTS_TABLE = """
CREATE TABLE IF NOT EXISTS carts (
    cart_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    customer_name TEXT,
    delivery_preference TEXT DEFAULT 'STANDARD',
    subtotal REAL DEFAULT 0.0,
    delivery_fee REAL DEFAULT 0.0,
    discount REAL DEFAULT 0.0,
    total_amount REAL DEFAULT 0.0,
    status TEXT CHECK(status IN ('ACTIVE', 'CONVERTED', 'ABANDONED', 'CLEARED')) DEFAULT 'ACTIVE',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

CREATE_CARTS_INDEX = """
CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);
CREATE INDEX IF NOT EXISTS idx_carts_status ON carts(status);
"""

CREATE_CART_ITEMS_TABLE = """
CREATE TABLE IF NOT EXISTS cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    unit TEXT,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (cart_id) REFERENCES carts(cart_id) ON DELETE CASCADE
);
"""

CREATE_CART_ITEMS_INDEX = """
CREATE INDEX IF NOT EXISTS idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
"""

CREATE_PAYMENT_INTENTS_TABLE = """
CREATE TABLE IF NOT EXISTS payment_intents (
    payment_id TEXT PRIMARY KEY,
    cart_id TEXT,
    order_id TEXT,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'INR',
    provider TEXT DEFAULT 'MOCK',
    status TEXT CHECK(status IN ('CREATED', 'PENDING', 'PAID', 'FAILED', 'CANCELLED')) DEFAULT 'CREATED',
    payment_method TEXT DEFAULT 'UPI_QR',
    transaction_ref TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

CREATE_PAYMENT_INTENTS_INDEX = """
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payment_intents(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_cart_id ON payment_intents(cart_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_intents(status);
"""

CREATE_AGENT_ACTIONS_TABLE = """
CREATE TABLE IF NOT EXISTS agent_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_id TEXT UNIQUE NOT NULL,
    timestamp TEXT NOT NULL,
    agent_name TEXT NOT NULL,
    action_type TEXT NOT NULL,
    tool_name TEXT,
    user_id TEXT,
    input_params TEXT,
    output_result TEXT,
    status TEXT CHECK(status IN ('SUCCESS', 'FAILURE', 'BLOCKED', 'APPROVAL_REQUIRED')) DEFAULT 'SUCCESS',
    latency_ms INTEGER DEFAULT 0,
    decision_reason TEXT
);
"""

CREATE_AGENT_ACTIONS_INDEX = """
CREATE INDEX IF NOT EXISTS idx_agent_actions_agent_name ON agent_actions(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_actions_action_type ON agent_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_agent_actions_timestamp ON agent_actions(timestamp);
"""

CREATE_COMMERCE_EVENTS_TABLE = """
CREATE TABLE IF NOT EXISTS commerce_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT UNIQUE NOT NULL,
    event_type TEXT NOT NULL,
    user_id TEXT,
    agent_name TEXT,
    title TEXT NOT NULL,
    details TEXT,
    timestamp TEXT NOT NULL
);
"""

CREATE_COMMERCE_EVENTS_INDEX = """
CREATE INDEX IF NOT EXISTS idx_commerce_events_type ON commerce_events(event_type);
CREATE INDEX IF NOT EXISTS idx_commerce_events_timestamp ON commerce_events(timestamp);
"""

CREATE_FOLLOWUP_SUGGESTIONS_TABLE = """
CREATE TABLE IF NOT EXISTS followup_suggestions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    suggestion_id TEXT UNIQUE NOT NULL,
    customer_id TEXT NOT NULL,
    customer_name TEXT,
    suggestion_type TEXT CHECK(suggestion_type IN ('ABANDONED_CART', 'REPEAT_ORDER', 'LOW_STOCK_ALERT', 'PROMOTION', 'FEEDBACK')) NOT NULL,
    message TEXT NOT NULL,
    target_products TEXT,
    estimated_value REAL DEFAULT 0.0,
    status TEXT CHECK(status IN ('PENDING_APPROVAL', 'APPROVED', 'DISMISSED', 'SENT')) DEFAULT 'PENDING_APPROVAL',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

CREATE_FOLLOWUP_SUGGESTIONS_INDEX = """
CREATE INDEX IF NOT EXISTS idx_followup_status ON followup_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_followup_customer_id ON followup_suggestions(customer_id);
"""

CREATE_CUSTOMER_SEGMENTS_TABLE = """
CREATE TABLE IF NOT EXISTS customer_segments (
    user_id TEXT PRIMARY KEY,
    customer_name TEXT,
    segment_name TEXT CHECK(segment_name IN ('NEW', 'RETURNING', 'LOYAL', 'HIGH_VALUE', 'AT_RISK', 'ABANDONED_CART')) NOT NULL,
    total_spent REAL DEFAULT 0.0,
    orders_count INTEGER DEFAULT 0,
    reason TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

CREATE_CUSTOMER_SEGMENTS_INDEX = """
CREATE INDEX IF NOT EXISTS idx_segments_segment_name ON customer_segments(segment_name);
"""

CREATE_RECOVERY_OPPORTUNITIES_TABLE = """
CREATE TABLE IF NOT EXISTS recovery_opportunities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    opportunity_id TEXT UNIQUE NOT NULL,
    cart_id TEXT,
    user_id TEXT NOT NULL,
    customer_name TEXT,
    amount REAL NOT NULL,
    priority TEXT CHECK(priority IN ('HIGH', 'MEDIUM', 'LOW')) DEFAULT 'MEDIUM',
    recommended_action TEXT NOT NULL,
    status TEXT CHECK(status IN ('OPEN', 'RECOVERED', 'DISMISSED')) DEFAULT 'OPEN',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""

CREATE_RECOVERY_OPPORTUNITIES_INDEX = """
CREATE INDEX IF NOT EXISTS idx_recovery_status ON recovery_opportunities(status);
"""
