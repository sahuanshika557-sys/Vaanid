"""Handoff service and context management for multi-agent voice pipeline."""

import logging
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger("agent.services.handoff")

MAX_HANDOFF_DEPTH = 2


@dataclass
class HandoffContext:
    user_id: str = "cust_default"
    name: str | None = None
    language: str = "English"
    intent: str = "OTHER"
    user_request: str = ""
    order_id: str | None = None
    relevant_product_info: str | None = None
    previous_tool_results: str | None = None
    relevant_memory: str | None = None
    escalation_status: str | None = None
    handoff_reason: str = ""
    handoff_count: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "user_id": self.user_id,
            "name": self.name,
            "language": self.language,
            "intent": self.intent,
            "user_request": self.user_request,
            "order_id": self.order_id,
            "relevant_product_info": self.relevant_product_info,
            "previous_tool_results": self.previous_tool_results,
            "relevant_memory": self.relevant_memory,
            "escalation_status": self.escalation_status,
            "handoff_reason": self.handoff_reason,
            "handoff_count": self.handoff_count,
        }

    def can_handoff(self) -> bool:
        """Check if automatic handoff chain is within limit (max depth = 2)."""
        return self.handoff_count < MAX_HANDOFF_DEPTH
