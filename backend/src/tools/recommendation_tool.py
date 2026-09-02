"""AI Product Recommendation Engine for VyapaarVoice AI (Track 1 — Agentic Commerce)."""

import logging
from typing import Any

from database.memory import log_agent_action_db, log_commerce_event_db
from tools.catalogue_tool import load_catalogue

logger = logging.getLogger("agent.tools.recommendation")


def recommend_products_data(
    query: str | None = None,
    budget: float | None = None,
    category: str | None = None,
    user_id: str | None = None,
) -> dict[str, Any]:
    """Recommend in-stock catalogue items based on budget, category, and preferences.
    
    All recommendations are derived from verified inventory data, never hallucinated.
    """
    catalogue = load_catalogue()
    if not catalogue:
        return {
            "success": False,
            "count": 0,
            "recommendations": [],
            "message": "Product catalogue is currently unavailable.",
        }

    # Filter by in-stock only (stock_quantity > 0)
    available = [p for p in catalogue if p.get("stock_quantity", 0) > 0]

    # Category filter if provided
    if category and category.lower() != "all":
        cat_lower = category.lower()
        matched = [p for p in available if p.get("category", "").lower() == cat_lower]
        if matched:
            available = matched

    # Budget filter if provided
    recommendations = []
    if budget is not None and budget > 0:
        # Sort by price ascending to fit maximum value in budget
        available_sorted = sorted(available, key=lambda x: x.get("price", 0))
        running_total = 0.0
        for p in available_sorted:
            price = float(p.get("price", 0))
            if running_total + price <= budget or not recommendations:
                reason = []
                if price <= budget:
                    reason.append(f"Fits within your ₹{budget:.0f} budget (Price: ₹{price:.0f})")
                stock = p.get("stock_quantity", 0)
                if stock >= 10:
                    reason.append("High stock available for same-day delivery")
                elif stock > 0:
                    reason.append(f"Only {stock} units left in stock")
                
                recommendations.append({
                    "product_id": p.get("product_id"),
                    "name": p.get("product_name"),
                    "category": p.get("category"),
                    "price": price,
                    "unit": p.get("unit"),
                    "stock": stock,
                    "reason": " • ".join(reason),
                })
                running_total += price
                if len(recommendations) >= 4:
                    break
    else:
        # General top recommendations
        for p in available[:4]:
            recommendations.append({
                "product_id": p.get("product_id"),
                "name": p.get("product_name"),
                "category": p.get("category"),
                "price": float(p.get("price", 0)),
                "unit": p.get("unit"),
                "stock": p.get("stock_quantity", 0),
                "reason": f"Popular in {p.get('category', 'Store')} • In stock ({p.get('stock_quantity', 0)} available)",
            })

    total_est = sum(r["price"] for r in recommendations)
    
    # Log agent decision
    log_agent_action_db(
        agent_name="Discovery & Recommendation Agent",
        action_type="PRODUCT_RECOMMENDATION",
        tool_name="recommend_products_data",
        user_id=user_id,
        input_params=f"Budget: {budget}, Category: {category}, Query: {query}",
        output_result=f"{len(recommendations)} products recommended (Total: ₹{total_est})",
        status="SUCCESS",
        decision_reason=f"Filtered {len(available)} available items against ₹{budget or 'unlimited'} budget constraint.",
    )

    log_commerce_event_db(
        event_type="PRODUCT_RECOMMENDED",
        user_id=user_id,
        agent_name="Discovery Agent",
        title=f"Recommended {len(recommendations)} products",
        details=", ".join(r["name"] for r in recommendations),
    )

    return {
        "success": True,
        "count": len(recommendations),
        "budget": budget,
        "estimated_bundle_total": round(total_est, 2),
        "recommendations": recommendations,
        "message": f"Shortlisted {len(recommendations)} verified products totaling ₹{total_est:.0f}.",
    }
