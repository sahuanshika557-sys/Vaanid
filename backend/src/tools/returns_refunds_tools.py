"""Returns and Refunds specialist tools for Local Commerce Voice Agent."""

import logging
from typing import Any

from database.memory import (
    check_refund_status_db,
    check_return_eligibility_db,
    get_order_record,
)

logger = logging.getLogger("agent.tools.returns_refunds")


def check_return_eligibility_data(
    order_id: str | None = None, user_id: str | None = None
) -> dict[str, Any]:
    """Check if an order item is eligible for return."""
    logger.info(
        f"Checking return eligibility for order_id='{order_id}', user_id='{user_id}'"
    )
    res = check_return_eligibility_db(order_id=order_id, user_id=user_id)
    return res


def check_refund_status_data(
    order_id: str | None = None, user_id: str | None = None
) -> dict[str, Any]:
    """Check refund status for a customer's order."""
    logger.info(
        f"Checking refund status for order_id='{order_id}', user_id='{user_id}'"
    )
    res = check_refund_status_db(order_id=order_id, user_id=user_id)
    return res


def get_order_details_data(
    order_id: str | None = None, user_id: str | None = None
) -> dict[str, Any]:
    """Retrieve full order details for verification."""
    logger.info(
        f"Retrieving order details for order_id='{order_id}', user_id='{user_id}'"
    )
    record = get_order_record(order_id=order_id, user_id=user_id)
    if record:
        return {"found": True, "order": record}
    return {
        "found": False,
        "message": f"Order #{order_id or 'unknown'} was not found in our system.",
    }
