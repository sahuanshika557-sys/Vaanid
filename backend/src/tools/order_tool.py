"""Order total calculator tool for Local Commerce Voice Agent."""

import logging
from typing import Any

from tools.catalogue_tool import (
    DATA_SOURCE_NAME,
    is_catalogue_simulated_failure,
    lookup_product_data,
)

logger = logging.getLogger("agent.tools.order")


def calculate_order_data(
    items: list[dict[str, Any]],
) -> dict[str, Any]:
    """Calculate the total price for a list of items based on catalogue pricing."""
    if is_catalogue_simulated_failure():
        logger.warning("Order calculation failed: Catalogue failure simulated.")
        return {
            "success": False,
            "error": "CATALOGUE_UNAVAILABLE",
            "message": "Catalogue service is currently offline or unreachable.",
            "data_source": DATA_SOURCE_NAME,
        }

    if not items:
        return {
            "success": False,
            "error": "NO_ITEMS_PROVIDED",
            "message": "Please specify at least one product and quantity to calculate order total.",
            "data_source": DATA_SOURCE_NAME,
        }

    calculated_items = []
    total_amount = 0.0

    for idx, raw_item in enumerate(items):
        query = raw_item.get("product_query") or raw_item.get("product_id") or ""
        qty_raw = raw_item.get("quantity", 1.0)

        # Validate quantity format
        try:
            qty = float(qty_raw)
            if qty <= 0 or qty > 1000:
                raise ValueError("Quantity out of valid bounds (1 to 1000).")
        except (ValueError, TypeError):
            return {
                "success": False,
                "reason": "INVALID_QUANTITY",
                "message": f"Invalid quantity '{qty_raw}' requested for item #{idx + 1}. Quantity must be a positive number.",
                "data_source": DATA_SOURCE_NAME,
            }

        # Lookup product details
        lookup = lookup_product_data(str(query))

        if not lookup.get("found"):
            if lookup.get("error") == "CATALOGUE_UNAVAILABLE":
                return lookup
            if lookup.get("multiple_matches"):
                return {
                    "success": False,
                    "reason": "AMBIGUOUS_PRODUCT",
                    "query": query,
                    "message": lookup.get("message"),
                    "data_source": DATA_SOURCE_NAME,
                }
            return {
                "success": False,
                "reason": "PRODUCT_NOT_FOUND",
                "query": query,
                "message": f"Product '{query}' could not be found in the current catalogue.",
                "data_source": DATA_SOURCE_NAME,
            }

        stock = lookup["stock_quantity"]
        if qty > stock:
            return {
                "success": False,
                "reason": "INSUFFICIENT_STOCK",
                "product_name": lookup["product_name"],
                "available": stock,
                "requested": qty,
                "message": (
                    f"Only {stock} units of {lookup['product_name']} are currently available. "
                    f"I cannot calculate a total for {qty} units."
                ),
                "data_source": DATA_SOURCE_NAME,
            }

        unit_price = float(lookup["price"])
        subtotal = round(unit_price * qty, 2)
        total_amount += subtotal

        calculated_items.append(
            {
                "product_id": lookup["product_id"],
                "product_name": lookup["product_name"],
                "quantity": qty if int(qty) != qty else int(qty),
                "unit": lookup["unit"],
                "unit_price": unit_price,
                "subtotal": subtotal,
            }
        )

    return {
        "success": True,
        "items": calculated_items,
        "total": round(total_amount, 2),
        "currency": "INR",
        "data_source": DATA_SOURCE_NAME,
        "disclaimer": "This is an estimated total calculation based on local catalogue data. No order has been placed or confirmed.",
    }
