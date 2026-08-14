"""Unit and integration tests for Day 9 Multi-Agent Specialist Handoff."""

import pytest

from database.memory import init_db
from services.handoff_service import MAX_HANDOFF_DEPTH, HandoffContext
from tools.returns_refunds_tools import (
    check_refund_status_data,
    check_return_eligibility_data,
    get_order_details_data,
)


@pytest.fixture(autouse=True)
def setup_database():
    """Ensure database schema and seed orders are initialized before tests."""
    init_db()


def test_handoff_context_defaults():
    ctx = HandoffContext(user_id="cust_123")
    assert ctx.user_id == "cust_123"
    assert ctx.handoff_count == 0
    assert ctx.can_handoff() is True


def test_handoff_context_anti_loop_limit():
    ctx = HandoffContext(user_id="cust_123")
    ctx.handoff_count = MAX_HANDOFF_DEPTH
    assert ctx.can_handoff() is False


def test_check_return_eligibility_existing_order():
    res = check_return_eligibility_data(order_id="12345", user_id="cust_default")
    assert res.get("verified") is True
    assert res.get("eligible") is True
    assert res.get("order_id") == "12345"
    assert "Basmati Rice" in res.get("product_name", "")


def test_check_return_eligibility_nonexistent_order():
    res = check_return_eligibility_data(order_id="999999", user_id="cust_default")
    assert res.get("verified") is False
    assert res.get("eligible") is False
    assert res.get("reason") == "ORDER_NOT_FOUND"


def test_check_refund_status_existing_order():
    res = check_refund_status_data(order_id="12345", user_id="cust_default")
    assert res.get("verified") is True
    assert res.get("order_id") == "12345"
    assert res.get("refund_status") == "PROCESSING"
    assert "REF-12345" in res.get("reference", "")


def test_get_order_details():
    res = get_order_details_data(order_id="12345", user_id="cust_default")
    assert res.get("found") is True
    assert res["order"]["order_id"] == "12345"
