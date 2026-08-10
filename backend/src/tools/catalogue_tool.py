"""Product catalogue lookup tool for Local Commerce Voice Agent."""

import csv
import logging
import os
from pathlib import Path
from typing import Any

logger = logging.getLogger("agent.tools.catalogue")

DATA_SOURCE_NAME = "Local Commerce Static Catalogue"

DEVANAGARI_PRODUCT_MAP = {
    "बासमती चावल": "Basmati Rice",
    "चावल": "Basmati Rice",
    "सूरजमुखी तेल": "Sunflower Oil",
    "सरसों का तेल": "Mustard Oil",
    "सरसों तेल": "Mustard Oil",
    "आटा": "Atta",
    "तूर दाल": "Toor Dal",
    "तुअर दाल": "Toor Dal",
    "दाल": "Toor Dal",
    "आम": "Mangoes",
    "सेब": "Apples",
    "केला": "Bananas",
    "टमाटर": "Tomatoes",
    "प्याज": "Onions",
    "आलू": "Potatoes",
    "दूध": "Milk",
    "चाय": "Tea",
    "ब्रेड": "Bread",
}


def _get_csv_path() -> Path:
    """Find products.csv location across workspace paths."""
    base_dir = Path(__file__).parent.parent.parent.resolve()
    paths = [
        base_dir / "data" / "products.csv",
        base_dir.parent / "data" / "products.csv",
        Path.cwd() / "data" / "products.csv",
        Path.cwd() / "backend" / "data" / "products.csv",
    ]
    for p in paths:
        if p.exists():
            return p
    return base_dir / "data" / "products.csv"


def load_catalogue() -> list[dict[str, Any]]:
    """Load products from CSV file into memory."""
    csv_path = _get_csv_path()
    if not csv_path.exists():
        logger.error(f"Catalogue file missing at {csv_path}")
        return []

    products = []
    try:
        with open(csv_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                products.append(
                    {
                        "product_id": row["product_id"].strip(),
                        "product_name": row["product_name"].strip(),
                        "category": row["category"].strip(),
                        "description": row["description"].strip(),
                        "price": float(row["price"].strip()),
                        "currency": row["currency"].strip(),
                        "stock_quantity": int(row["stock_quantity"].strip()),
                        "unit": row["unit"].strip(),
                        "seller_name": row["seller_name"].strip(),
                        "location": row["location"].strip(),
                        "last_updated": row["last_updated"].strip(),
                    }
                )
    except Exception as e:
        logger.error(f"Error reading catalogue CSV from {csv_path}: {e}")
        return []
    return products


def is_catalogue_simulated_failure() -> bool:
    """Check if SIMULATE_CATALOGUE_FAILURE environment variable is set."""
    val = os.getenv("SIMULATE_CATALOGUE_FAILURE", "false").lower()
    return val in ("true", "1", "yes", "on")


def lookup_product_data(query: str) -> dict[str, Any]:
    """Search catalogue for a product query and return formatted lookup result."""
    if is_catalogue_simulated_failure():
        logger.warning(
            "Catalogue failure simulated via SIMULATE_CATALOGUE_FAILURE=true"
        )
        return {
            "found": False,
            "success": False,
            "error": "CATALOGUE_UNAVAILABLE",
            "message": "Catalogue service is currently offline or unreachable.",
            "data_source": DATA_SOURCE_NAME,
        }

    if not query or not query.strip():
        return {
            "found": False,
            "success": True,
            "message": "Please provide a valid product name or search term.",
            "data_source": DATA_SOURCE_NAME,
        }

    raw_query = query.strip()
    clean_query = raw_query.lower()

    # Translate Devanagari Hindi query if matched
    if raw_query in DEVANAGARI_PRODUCT_MAP:
        clean_query = DEVANAGARI_PRODUCT_MAP[raw_query].lower()
    else:
        for dev_k, eng_v in DEVANAGARI_PRODUCT_MAP.items():
            if dev_k in raw_query:
                clean_query = eng_v.lower()
                break

    products = load_catalogue()
    if not products:
        return {
            "found": False,
            "success": False,
            "error": "CATALOGUE_EMPTY_OR_MISSING",
            "message": "Unable to load catalogue dataset.",
            "data_source": DATA_SOURCE_NAME,
        }

    # 1. Exact match by product_id
    id_matches = [p for p in products if p["product_id"].lower() == clean_query]
    if len(id_matches) == 1:
        return _format_product_result(id_matches[0])

    # 2. Exact match by product_name
    name_matches = [p for p in products if p["product_name"].lower() == clean_query]
    if len(name_matches) == 1:
        return _format_product_result(name_matches[0])

    # 3. Substring match in product_name
    partial_name_matches = [
        p for p in products if clean_query in p["product_name"].lower()
    ]
    if len(partial_name_matches) == 1:
        return _format_product_result(partial_name_matches[0])

    if len(partial_name_matches) > 1:
        return {
            "found": False,
            "success": True,
            "multiple_matches": True,
            "match_count": len(partial_name_matches),
            "matching_products": [
                f"{p['product_name']} ({p['currency']} {p['price']}/{p['unit']})"
                for p in partial_name_matches
            ],
            "message": (
                "Found multiple matching products: "
                + ", ".join(p["product_name"] for p in partial_name_matches)
                + ". Please specify which item you meant."
            ),
            "data_source": DATA_SOURCE_NAME,
        }

    # 4. Search description or category
    broad_matches = [
        p
        for p in products
        if clean_query in p["category"].lower()
        or clean_query in p["description"].lower()
    ]
    if len(broad_matches) == 1:
        return _format_product_result(broad_matches[0])

    if len(broad_matches) > 1:
        return {
            "found": False,
            "success": True,
            "multiple_matches": True,
            "match_count": len(broad_matches),
            "matching_products": [
                f"{p['product_name']} ({p['currency']} {p['price']}/{p['unit']})"
                for p in broad_matches[:5]
            ],
            "message": (
                f"Found multiple items matching '{query}': "
                + ", ".join(p["product_name"] for p in broad_matches[:5])
                + ". Please specify which product you would like."
            ),
            "data_source": DATA_SOURCE_NAME,
        }

    return {
        "found": False,
        "success": True,
        "message": f"Product '{query}' was not found in the current catalogue.",
        "data_source": DATA_SOURCE_NAME,
    }


def _format_product_result(p: dict[str, Any]) -> dict[str, Any]:
    stock = p["stock_quantity"]
    if stock == 0:
        stock_status = "Out of stock"
    elif stock <= 5:
        stock_status = f"Low stock ({stock} units remaining)"
    else:
        stock_status = f"In stock ({stock} units available)"

    return {
        "found": True,
        "success": True,
        "product_id": p["product_id"],
        "product_name": p["product_name"],
        "category": p["category"],
        "description": p["description"],
        "price": p["price"],
        "currency": p["currency"],
        "unit": p["unit"],
        "stock_quantity": stock,
        "stock_status": stock_status,
        "seller_name": p["seller_name"],
        "location": p["location"],
        "last_updated": p["last_updated"],
        "data_source": DATA_SOURCE_NAME,
    }
