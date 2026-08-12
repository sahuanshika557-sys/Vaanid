import os
import tempfile

import pytest

from database.memory import (
    create_escalation_record,
    get_escalation_by_ref,
    get_escalations,
    init_db,
    update_escalation_status,
)
from tools.escalation_tool import determine_urgency, sanitize_sensitive_text


@pytest.fixture
def temp_db():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as f:
        db_path = f.name
    init_db(db_path)
    yield db_path
    try:
        if os.path.exists(db_path):
            os.remove(db_path)
    except Exception:
        pass


def test_sanitize_sensitive_text():
    """Verify secrets like cards, OTPs, PINs, and CVVs are stripped."""
    raw = "My OTP is 482190 and card is 4532-1234-5678-9010"
    sanitized = sanitize_sensitive_text(raw)
    assert "482190" not in sanitized
    assert "4532-1234-5678-9010" not in sanitized
    assert "[CARD_NUMBER_REDACTED]" in sanitized


def test_determine_urgency():
    """Verify urgency levels LOW, MEDIUM, HIGH."""
    assert (
        determine_urgency("PAYMENT_REFUND", "Payment deducted ₹640 but order failed")
        == "HIGH"
    )
    assert (
        determine_urgency("ORDER_DISPUTE", "Damaged item received in package")
        == "MEDIUM"
    )
    assert (
        determine_urgency("ORDER_DISPUTE", "General question about order arrival")
        == "LOW"
    )


def test_create_escalation_record(temp_db):
    """Test successful creation of escalation record with unique reference ID."""
    res = create_escalation_record(
        user_id="cust_test_101",
        customer_name="Ramesh Kumar",
        issue_type="PAYMENT_REFUND",
        issue_summary="Payment deducted ₹640 for 2 Basmati Rice packs but order pending.",
        verified_information="Order ORD_RAMESH_101 created",
        urgency="HIGH",
        language="Hindi",
        preferred_followup_method="Phone",
        db_path=temp_db,
    )

    assert res["success"] is True
    assert res["is_duplicate"] is False
    assert res["reference_id"].startswith("LC-2026-")
    assert res["urgency"] == "HIGH"
    assert res["status"] == "OPEN"

    # Fetch and verify from SQLite
    rec = get_escalation_by_ref(res["reference_id"], db_path=temp_db)
    assert rec is not None
    assert rec["customer_name"] == "Ramesh Kumar"
    assert rec["user_id"] == "cust_test_101"


def test_duplicate_escalation_protection(temp_db):
    """Verify system prevents duplicate open escalations for the same user and issue type."""
    # First escalation creation
    res1 = create_escalation_record(
        user_id="cust_dup_user",
        customer_name="Priya Sharma",
        issue_type="ORDER_DISPUTE",
        issue_summary="Missing 1 unit of mustard oil.",
        db_path=temp_db,
    )
    assert res1["success"] is True
    assert res1["is_duplicate"] is False

    # Second escalation attempt with same user and issue_type
    res2 = create_escalation_record(
        user_id="cust_dup_user",
        customer_name="Priya Sharma",
        issue_type="ORDER_DISPUTE",
        issue_summary="Another report of missing mustard oil.",
        db_path=temp_db,
    )
    assert res2["success"] is True
    assert res2["is_duplicate"] is True
    assert res2["reference_id"] == res1["reference_id"]


def test_update_escalation_status(temp_db):
    """Verify updating status to IN_PROGRESS and RESOLVED."""
    res = create_escalation_record(
        user_id="cust_status_user",
        customer_name="Anand Verma",
        issue_type="ORDER_DISPUTE",
        issue_summary="Damaged package.",
        db_path=temp_db,
    )
    ref_id = res["reference_id"]

    updated = update_escalation_status(ref_id, "IN_PROGRESS", db_path=temp_db)
    assert updated is not None
    assert updated["status"] == "IN_PROGRESS"

    resolved = update_escalation_status(ref_id, "RESOLVED", db_path=temp_db)
    assert resolved is not None
    assert resolved["status"] == "RESOLVED"

    # Listing should show resolved
    all_escalations = get_escalations(status="RESOLVED", db_path=temp_db)
    assert len(all_escalations) == 1
    assert all_escalations[0]["reference_id"] == ref_id
