"""Automated unit and integration test suite for Day 6 Outbound Call features."""

import os
import tempfile

import pytest

from database.memory import (
    create_order,
    get_order,
    get_order_by_user_or_sip,
    get_retry_count,
    init_db,
    is_user_opted_out,
    log_call_outcome,
    record_user_opt_out,
    seed_test_order,
    update_order_status,
)
from telephony.outbound.dial import format_sip_uri, validate_environment


@pytest.fixture
def temp_db():
    """Provide temporary SQLite database for isolated test execution."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tf:
        db_path = tf.name
    init_db(db_path)
    yield db_path
    try:
        if os.path.exists(db_path):
            os.remove(db_path)
    except OSError:
        pass


def test_seed_and_get_test_order(temp_db):
    """Test 1: Seed Part 23 test order for Ramesh and query by user/sip."""
    seed_res = seed_test_order(linphone_username="ramesh123", db_path=temp_db)
    assert seed_res["order_id"] == "ORD_RAMESH_101"
    assert seed_res["customer_name"] == "Ramesh"
    assert seed_res["product_name"] == "Basmati Rice"
    assert seed_res["quantity"] == 2.0
    assert seed_res["estimated_total"] == 640.0
    assert seed_res["status"] == "PENDING"

    # Query order by order_id
    order_id_lookup = get_order("ORD_RAMESH_101", db_path=temp_db)
    assert order_id_lookup is not None
    assert order_id_lookup["status"] == "PENDING"

    # Query order by SIP address
    sip_lookup = get_order_by_user_or_sip(
        "sip:ramesh123@sip.linphone.org", db_path=temp_db
    )
    assert sip_lookup is not None
    assert sip_lookup["customer_name"] == "Ramesh"


def test_order_status_transitions(temp_db):
    """Test 2: Order status transition (PENDING -> CONFIRMED -> CANCELLED)."""
    create_order(
        order_id="ORD_TRANS_101",
        user_id="cust_trans",
        customer_name="Ankit",
        phone_or_sip="sip:ankit@sip.linphone.org",
        product_name="Atta",
        quantity=1,
        estimated_total=250.0,
        status="PENDING",
        db_path=temp_db,
    )

    assert update_order_status("ORD_TRANS_101", "CONFIRMED", db_path=temp_db) is True
    rec_confirmed = get_order("ORD_TRANS_101", db_path=temp_db)
    assert rec_confirmed["status"] == "CONFIRMED"

    assert update_order_status("ORD_TRANS_101", "CANCELLED", db_path=temp_db) is True
    rec_cancelled = get_order("ORD_TRANS_101", db_path=temp_db)
    assert rec_cancelled["status"] == "CANCELLED"

    # Invalid status should return False
    assert (
        update_order_status("ORD_TRANS_101", "INVALID_STATUS", db_path=temp_db) is False
    )


def test_opt_out_recording_and_enforcement(temp_db):
    """Test 3: OPT-OUT recording and enforcement."""
    sip_target = "sip:optout_user@sip.linphone.org"
    assert is_user_opted_out(sip_target, db_path=temp_db) is False

    res = record_user_opt_out(sip_target, user_id="cust_optout", db_path=temp_db)
    assert res is True
    assert is_user_opted_out(sip_target, db_path=temp_db) is True


def test_call_outcome_logging_and_retry_limits(temp_db):
    """Test 4: Call outcome logging and MAX_RETRIES=2 limit enforcement."""
    dest = "sip:busy_user@sip.linphone.org"

    # Log Attempt 1 (NO_ANSWER)
    log_call_outcome(
        call_id="call_001",
        order_id="ORD_101",
        user_id="cust_busy",
        destination=dest,
        outcome="NO_ANSWER",
        db_path=temp_db,
    )
    assert get_retry_count(dest, db_path=temp_db) == 1

    # Log Attempt 2 (REJECTED)
    log_call_outcome(
        call_id="call_002",
        order_id="ORD_101",
        user_id="cust_busy",
        destination=dest,
        outcome="REJECTED",
        db_path=temp_db,
    )
    assert get_retry_count(dest, db_path=temp_db) == 2


def test_sip_uri_formatting():
    """Test 5: Helper function formatting SIP URIs."""
    assert format_sip_uri("ramesh") == "sip:ramesh@sip.linphone.org"
    assert (
        format_sip_uri("sip:ramesh@sip.linphone.org") == "sip:ramesh@sip.linphone.org"
    )
    assert format_sip_uri("test@linphone.org") == "sip:test@linphone.org"


def test_dial_safety_precheck(monkeypatch: pytest.MonkeyPatch):
    """Test 6: Dial script safety pre-checks for unconfigured environment."""
    monkeypatch.setenv("LIVEKIT_URL", "")
    monkeypatch.setenv("LIVEKIT_API_KEY", "")
    monkeypatch.setenv("LIVEKIT_API_SECRET", "")
    monkeypatch.setenv("LIVEKIT_SIP_OUTBOUND_TRUNK_ID", "")

    valid, missing = validate_environment("")
    assert valid is False
    assert len(missing) >= 4
