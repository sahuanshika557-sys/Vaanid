"""Unit tests for order total calculator tool."""

import pytest

from tools.order_tool import calculate_order_data


def test_order_total_single_item() -> None:
    """Test 7: Order total calculation for single item (2 x 320 = 640)."""
    items = [{"product_query": "Basmati Rice", "quantity": 2}]
    res = calculate_order_data(items)
    assert res["success"] is True
    assert res["total"] == 640.0
    assert res["currency"] == "INR"
    assert len(res["items"]) == 1
    assert res["items"][0]["subtotal"] == 640.0


def test_order_total_multiple_items() -> None:
    """Test 8: Order total calculation for multiple products."""
    items = [
        {"product_query": "Basmati Rice", "quantity": 1},  # 320
        {"product_query": "Fortune Sunflower Oil", "quantity": 2},  # 2 * 165 = 330
    ]
    res = calculate_order_data(items)
    assert res["success"] is True
    assert res["total"] == 650.0
    assert len(res["items"]) == 2


def test_order_total_insufficient_stock() -> None:
    """Test 9: Stock validation when requested quantity > available stock."""
    # Aashirvaad Atta stock is 3
    items = [{"product_query": "Aashirvaad Whole Wheat Atta", "quantity": 5}]
    res = calculate_order_data(items)
    assert res["success"] is False
    assert res["reason"] == "INSUFFICIENT_STOCK"
    assert res["available"] == 3
    assert res["requested"] == 5.0


def test_order_total_invalid_quantity() -> None:
    """Test quantity validation (negative/zero/invalid quantity)."""
    items = [{"product_query": "Basmati Rice", "quantity": -2}]
    res = calculate_order_data(items)
    assert res["success"] is False
    assert res["reason"] == "INVALID_QUANTITY"


def test_order_total_simulated_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test order calculator behavior under simulated failure."""
    monkeypatch.setenv("SIMULATE_CATALOGUE_FAILURE", "true")
    items = [{"product_query": "Basmati Rice", "quantity": 2}]
    res = calculate_order_data(items)
    assert res["success"] is False
    assert res["error"] == "CATALOGUE_UNAVAILABLE"
