"""Unit tests for Agentic Commerce tools (VyapaarVoice AI)."""

from services.payment_service import MockPaymentProvider
from tools.cart_tool import manage_cart_data
from tools.merchant_copilot_tools import (
    get_low_stock_products,
    get_sales_summary,
    query_merchant_copilot,
)
from tools.recommendation_tool import recommend_products_data


def test_recommendation_tool_with_budget():
    res = recommend_products_data(budget=1000.0)
    assert res["success"] is True
    assert "recommendations" in res
    assert len(res["recommendations"]) > 0
    assert res["estimated_bundle_total"] <= 1000.0 or len(res["recommendations"]) == 1


def test_recommendation_tool_with_category():
    res = recommend_products_data(category="Groceries")
    assert res["success"] is True
    for r in res["recommendations"]:
        assert r["category"].lower() == "groceries"


def test_cart_management():
    # 1. Clear cart
    manage_cart_data(action="clear", user_id="test_user_pytest")

    # 2. Add product
    add_res = manage_cart_data(
        action="add",
        product_name="Basmati Rice",
        quantity=2.0,
        user_id="test_user_pytest",
    )
    assert add_res["success"] is True
    assert add_res["cart"]["subtotal"] == 640.0

    # 3. View cart
    view_res = manage_cart_data(action="view", user_id="test_user_pytest")
    assert view_res["success"] is True
    assert len(view_res["cart"]["items"]) >= 1

    # 4. Remove item
    remove_res = manage_cart_data(
        action="remove", product_name="Basmati Rice", user_id="test_user_pytest"
    )
    assert remove_res["success"] is True


def test_mock_payment_service():
    provider = MockPaymentProvider()
    intent = provider.create_intent(user_id="test_user_pytest", amount=640.0)
    assert intent["success"] is True
    assert intent["status"] == "CREATED"
    assert "upi_intent_url" in intent

    verify = provider.verify_payment(intent["payment_id"])
    assert verify["verified"] is True
    assert verify["status"] == "PAID"


def test_merchant_copilot_queries():
    summary = get_sales_summary()
    assert "total_orders" in summary
    assert "total_revenue" in summary

    low_stock = get_low_stock_products(threshold=10)
    assert isinstance(low_stock, list)

    q_res = query_merchant_copilot("Kaunsa product low stock mein hai?")
    assert q_res["success"] is True
    assert len(q_res["answer"]) > 0
