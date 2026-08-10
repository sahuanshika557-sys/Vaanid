"""Unit tests for product catalogue lookup tool."""

import pytest

from tools.catalogue_tool import is_catalogue_simulated_failure, lookup_product_data


def test_lookup_existing_product() -> None:
    """Test 1: Lookup existing product by query (Basmati Rice)."""
    res = lookup_product_data("Basmati Rice")
    assert res["found"] is True
    assert res["success"] is True
    assert res["product_name"] == "Basmati Rice"
    assert res["price"] == 320.0
    assert res["currency"] == "INR"
    assert res["unit"] == "5 kg"
    assert res["stock_quantity"] == 25
    assert "In stock" in res["stock_status"]


def test_lookup_unknown_product() -> None:
    """Test 2: Lookup non-existent product."""
    res = lookup_product_data("XYZ Super Dragon Fruit Chips")
    assert res["found"] is False
    assert res["success"] is True
    assert "not found" in res["message"].lower()


def test_lookup_case_insensitive_and_partial() -> None:
    """Test 3: Case-insensitive search."""
    res1 = lookup_product_data("basmati rice")
    res2 = lookup_product_data("BASMATI RICE")
    assert res1["found"] is True
    assert res2["found"] is True
    assert res1["product_id"] == res2["product_id"] == "P001"


def test_lookup_low_stock() -> None:
    """Test 5: Low stock status identification (<= 5 units)."""
    res = lookup_product_data("Aashirvaad Whole Wheat Atta")
    assert res["found"] is True
    assert res["stock_quantity"] == 3
    assert "Low stock" in res["stock_status"]


def test_lookup_out_of_stock() -> None:
    """Test 6: Out of stock status identification (0 units)."""
    res = lookup_product_data("Toor Dal")
    assert res["found"] is True
    assert res["stock_quantity"] == 0
    assert "Out of stock" in res["stock_status"]


def test_lookup_multiple_matches() -> None:
    """Test ambiguous query with multiple matches (oil)."""
    res = lookup_product_data("oil")
    assert res["found"] is False
    assert res.get("multiple_matches") is True
    assert res.get("match_count", 0) >= 2


def test_catalogue_simulated_failure(monkeypatch: pytest.MonkeyPatch) -> None:
    """Test 10: Simulated catalogue failure via environment variable."""
    monkeypatch.setenv("SIMULATE_CATALOGUE_FAILURE", "true")
    assert is_catalogue_simulated_failure() is True

    res = lookup_product_data("Basmati Rice")
    assert res["found"] is False
    assert res["success"] is False
    assert res["error"] == "CATALOGUE_UNAVAILABLE"
