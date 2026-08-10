"""Automated test suite for Local Commerce customer memory database layer."""

import os
import tempfile

import pytest

from database.memory import (
    create_customer,
    delete_customer,
    get_customer,
    init_db,
    update_customer,
    update_last_interaction,
)


@pytest.fixture
def temp_db():
    """Fixture providing a temporary SQLite database path."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tf:
        db_path = tf.name
    init_db(db_path)
    yield db_path
    try:
        if os.path.exists(db_path):
            os.remove(db_path)
    except OSError:
        pass


def test_init_db_creates_tables(temp_db):
    """Test that init_db creates schema without errors."""
    assert os.path.exists(temp_db)


def test_create_and_get_customer(temp_db):
    """Test creating a new customer and retrieving by user_id."""
    user_id = "cust_test_123"
    rec = create_customer(
        user_id=user_id,
        name="Ramesh",
        language_preference="Hindi",
        preferred_delivery_slot="Evening",
        usual_quantity="5 kg",
        db_path=temp_db,
    )
    assert rec["user_id"] == user_id
    assert rec["name"] == "Ramesh"
    assert rec["language_preference"] == "Hindi"
    assert rec["preferred_delivery_slot"] == "Evening"
    assert rec["usual_quantity"] == "5 kg"

    fetched = get_customer(user_id, db_path=temp_db)
    assert fetched is not None
    assert fetched["name"] == "Ramesh"


def test_get_nonexistent_customer(temp_db):
    """Test lookup for customer that does not exist."""
    res = get_customer("cust_nonexistent", db_path=temp_db)
    assert res is None


def test_update_customer_fields(temp_db):
    """Test updating existing customer preferences."""
    user_id = "cust_test_456"
    create_customer(user_id=user_id, name="Ankit", db_path=temp_db)

    updated = update_customer(
        user_id=user_id,
        preferred_delivery_slot="Morning",
        usual_quantity="2 L",
        db_path=temp_db,
    )
    assert updated is not None
    assert updated["name"] == "Ankit"
    assert updated["preferred_delivery_slot"] == "Morning"
    assert updated["usual_quantity"] == "2 L"


def test_delete_customer_forget_me(temp_db):
    """Test deleting customer memory ("Forget Me" scenario)."""
    user_id = "cust_test_789"
    create_customer(user_id=user_id, name="Sita", db_path=temp_db)
    assert get_customer(user_id, db_path=temp_db) is not None

    deleted = delete_customer(user_id, db_path=temp_db)
    assert deleted is True

    assert get_customer(user_id, db_path=temp_db) is None


def test_update_last_interaction(temp_db):
    """Test updating last_interaction timestamp."""
    user_id = "cust_test_timestamp"
    create_customer(user_id=user_id, name="Priya", db_path=temp_db)

    res = update_last_interaction(user_id, db_path=temp_db)
    assert res is True

    cust = get_customer(user_id, db_path=temp_db)
    assert cust["last_interaction"] is not None
