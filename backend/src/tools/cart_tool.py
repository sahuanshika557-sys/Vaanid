"""Smart Cart & Checkout Management Tool for VyapaarVoice AI (Track 1 — Agentic Commerce)."""

import logging
from typing import Any

from database.memory import (
    add_item_to_cart_db,
    clear_cart_db,
    create_payment_intent_db,
    get_or_create_cart,
    log_agent_action_db,
    log_commerce_event_db,
    remove_item_from_cart_db,
)
from tools.catalogue_tool import lookup_product_data

logger = logging.getLogger("agent.tools.cart")


def manage_cart_data(
    action: str,
    product_name: str | None = None,
    quantity: float = 1.0,
    user_id: str = "cust_default",
) -> dict[str, Any]:
    """Autonomous tool to manipulate customer shopping cart deterministically.
    
    Actions:
    - 'add': Add product to cart by verifying price & stock in catalogue
    - 'remove': Remove product from cart
    - 'view': View current active cart contents and totals
    - 'clear': Clear all items from cart
    - 'checkout': Create payment intent for cart total
    """
    action_clean = action.strip().lower()
    
    if action_clean == "view":
        cart = get_or_create_cart(user_id)
        return {
            "success": True,
            "action": "view",
            "cart": cart,
            "message": f"Cart has {len(cart['items'])} items. Subtotal: ₹{cart['subtotal']}, Delivery: ₹{cart['delivery_fee']}, Total: ₹{cart['total_amount']}",
        }

    if action_clean == "clear":
        clear_cart_db(user_id)
        log_commerce_event_db(
            event_type="CART_CLEARED",
            user_id=user_id,
            agent_name="Shopping Agent",
            title="Cart cleared",
            details="All items removed from active cart",
        )
        return {
            "success": True,
            "action": "clear",
            "message": "Your shopping cart has been cleared.",
            "cart": get_or_create_cart(user_id),
        }

    if action_clean == "add":
        if not product_name:
            return {"success": False, "message": "Please specify a product name to add."}

        # Lookup in verified catalogue
        lookup = lookup_product_data(product_name)
        if not lookup.get("found"):
            return {
                "success": False,
                "message": lookup.get("message", f"Sorry, '{product_name}' was not found in our store catalogue."),
            }

        p_name = lookup["product_name"]
        p_id = lookup["product_id"]
        stock = lookup.get("stock_quantity", 0)
        unit_price = float(lookup["price"])
        unit = lookup.get("unit", "pack")
        category = lookup.get("category", "General")
        qty = max(1.0, float(quantity))
        
        if stock <= 0:
            return {
                "success": False,
                "message": f"Sorry, {p_name} is currently out of stock.",
            }
        
        if qty > stock:
            qty = float(stock)

        updated_cart = add_item_to_cart_db(
            user_id=user_id,
            product_id=p_id,
            product_name=p_name,
            category=category,
            unit=unit,
            quantity=qty,
            unit_price=unit_price,
        )

        log_agent_action_db(
            agent_name="Shopping Agent",
            action_type="CART_ADD",
            tool_name="manage_cart_data",
            user_id=user_id,
            input_params=f"Product: {p_name}, Qty: {qty}",
            output_result=f"Cart Total: ₹{updated_cart['total_amount']}",
            status="SUCCESS",
            decision_reason=f"Verified stock ({stock} avail) and unit price (₹{unit_price}) before adding.",
        )

        return {
            "success": True,
            "action": "add",
            "added_product": p_name,
            "quantity": qty,
            "unit_price": unit_price,
            "cart": updated_cart,
            "message": f"Added {qty} {unit} of {p_name} to cart. New Total: ₹{updated_cart['total_amount']}",
        }

    if action_clean == "remove":
        if not product_name:
            return {"success": False, "message": "Please specify product name to remove."}
        
        updated_cart = remove_item_from_cart_db(user_id, product_name)
        return {
            "success": True,
            "action": "remove",
            "removed_product": product_name,
            "cart": updated_cart,
            "message": f"Removed '{product_name}' from cart. New Total: ₹{updated_cart['total_amount']}",
        }

    if action_clean == "checkout":
        cart = get_or_create_cart(user_id)
        if not cart.get("items"):
            return {"success": False, "message": "Your cart is empty. Add products before checkout."}

        total = cart["total_amount"]
        payment_intent = create_payment_intent_db(
            user_id=user_id,
            cart_id=cart["cart_id"],
            amount=total,
            provider="MOCK_UPI",
        )

        log_agent_action_db(
            agent_name="Checkout Agent",
            action_type="PAYMENT_INTENT",
            tool_name="manage_cart_data",
            user_id=user_id,
            input_params=f"Cart: {cart['cart_id']}, Amount: ₹{total}",
            output_result=f"Payment ID: {payment_intent.get('payment_id')}",
            status="SUCCESS",
            decision_reason="Initiated verified payment intent for active cart items.",
        )

        return {
            "success": True,
            "action": "checkout",
            "payment_intent": payment_intent,
            "cart": cart,
            "message": f"Payment intent for ₹{total} created. Please scan QR or approve UPI request.",
        }

    return {"success": False, "message": f"Unknown cart action: {action}"}
