from typing import Dict, Any, Optional
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.models import ApprovalDB, AgentRunDB, AgentTaskDB
from app.core.logging import logger

class ApprovalManager:
    def create_approval_request(
        self,
        db: Session,
        run_id: str,
        task_id: Optional[str],
        tool_name: str,
        action_type: str,
        description: str,
        payload: Dict[str, Any],
        risk_level: str = "HIGH"
    ) -> ApprovalDB:
        approval = ApprovalDB(
            run_id=run_id,
            task_id=task_id,
            tool_name=tool_name,
            action_type=action_type,
            description=description,
            payload=payload,
            risk_level=risk_level,
            status="pending"
        )
        db.add(approval)

        # Update run and task status to WAITING_FOR_APPROVAL
        run = db.query(AgentRunDB).filter(AgentRunDB.id == run_id).first()
        if run:
            run.status = "WAITING_FOR_APPROVAL"

        if task_id:
            task = db.query(AgentTaskDB).filter(AgentTaskDB.id == task_id).first()
            if task:
                task.status = "WAITING_FOR_APPROVAL"

        db.commit()
        db.refresh(approval)
        logger.info(f"Created approval request {approval.id} for run {run_id} ({tool_name}, risk={risk_level})")
        return approval

    def resolve_approval(
        self,
        db: Session,
        approval_id: str,
        action: str,  # "approve", "deny", "edit"
        modified_payload: Optional[Dict[str, Any]] = None
    ) -> Optional[ApprovalDB]:
        approval = db.query(ApprovalDB).filter(ApprovalDB.id == approval_id).first()
        if not approval or approval.status != "pending":
            return None

        status_map = {
            "approve": "approved",
            "deny": "denied",
            "edit": "modified"
        }
        approval.status = status_map.get(action, "denied")
        approval.responded_at = datetime.utcnow()
        if modified_payload:
            approval.modified_payload = modified_payload

        # If approved/modified, resume run status to RUNNING
        run = db.query(AgentRunDB).filter(AgentRunDB.id == approval.run_id).first()
        if run and approval.status in ["approved", "modified"]:
            run.status = "RUNNING"
        elif run and approval.status == "denied":
            run.status = "FAILED"
            run.error = f"Action rejected by user: {approval.description}"

        db.commit()
        db.refresh(approval)
        return approval

approval_manager = ApprovalManager()
