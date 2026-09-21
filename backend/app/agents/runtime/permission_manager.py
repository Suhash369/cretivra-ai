from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.database.models import ToolPermissionDB
from app.core.logging import logger

class PermissionManager:
    RISK_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

    def requires_approval(self, risk_level: str, tool_name: str, user_id: Optional[str] = None, db: Optional[Session] = None) -> bool:
        """
        Determines whether a tool execution requires human-in-the-loop approval.
        HIGH and CRITICAL actions require explicit confirmation by default.
        """
        if risk_level in ["HIGH", "CRITICAL"]:
            # Check if user has explicit auto_approve permission
            if db and user_id:
                perm = db.query(ToolPermissionDB).filter(
                    ToolPermissionDB.user_id == user_id,
                    ToolPermissionDB.tool_name == tool_name
                ).first()
                if perm and perm.auto_approve and perm.is_allowed:
                    return False
            return True
        return False

    def is_tool_allowed(self, tool_name: str, user_id: Optional[str] = None, db: Optional[Session] = None) -> bool:
        if db and user_id:
            perm = db.query(ToolPermissionDB).filter(
                ToolPermissionDB.user_id == user_id,
                ToolPermissionDB.tool_name == tool_name
            ).first()
            if perm and not perm.is_allowed:
                return False
        return True

permission_manager = PermissionManager()
