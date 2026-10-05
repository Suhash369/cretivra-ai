from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.database.models import AgentTaskDB, AgentRunDB

class TaskManager:
    TASK_STATES = [
        "PENDING",
        "PLANNING",
        "RUNNING",
        "WAITING",
        "WAITING_FOR_APPROVAL",
        "COMPLETED",
        "FAILED",
        "RETRYING",
        "CANCELLED"
    ]

    def get_next_runnable_task(self, db: Session, run_id: str) -> Optional[AgentTaskDB]:
        """
        Returns the next task ready for execution in topological order,
        ensuring parent tasks are COMPLETED.
        """
        tasks = db.query(AgentTaskDB).filter(
            AgentTaskDB.run_id == run_id
        ).order_by(AgentTaskDB.task_order).all()

        completed_ids = {t.id for t in tasks if t.status == "COMPLETED"}
        failed_or_cancelled_ids = {t.id for t in tasks if t.status in ["FAILED", "CANCELLED"]}

        # Auto-cancel any pending tasks whose parent failed or was cancelled
        if failed_or_cancelled_ids:
            for t in tasks:
                if t.status == "PENDING" and t.parent_task_id in failed_or_cancelled_ids:
                    t.status = "CANCELLED"
                    t.error = "Cancelled because upstream task dependency failed."
                    failed_or_cancelled_ids.add(t.id)
            db.commit()

        for t in tasks:
            if t.status in ["PENDING", "RETRYING"]:
                # Check dependency
                if not t.parent_task_id or t.parent_task_id in completed_ids:
                    return t
        return None

    def cancel_downstream_tasks(self, db: Session, run_id: str, failed_task_id: str):
        """
        Recursively marks all downstream tasks depending on failed_task_id as CANCELLED.
        """
        tasks = db.query(AgentTaskDB).filter(AgentTaskDB.run_id == run_id).all()
        to_cancel = {failed_task_id}
        changed = True
        while changed:
            changed = False
            for t in tasks:
                if t.status in ["PENDING", "WAITING", "RETRYING"] and t.parent_task_id in to_cancel:
                    if t.id not in to_cancel:
                        t.status = "CANCELLED"
                        t.error = "Cancelled due to failure of upstream task."
                        to_cancel.add(t.id)
                        changed = True
        db.commit()

    def cancel_remaining_pending(self, db: Session, run_id: str):
        """
        Cancels any remaining PENDING or RETRYING tasks when an agent run aborts.
        """
        tasks = db.query(AgentTaskDB).filter(
            AgentTaskDB.run_id == run_id,
            AgentTaskDB.status.in_(["PENDING", "RETRYING", "WAITING"])
        ).all()
        for t in tasks:
            t.status = "CANCELLED"
            if not t.error:
                t.error = "Run terminated before task could be executed."
        db.commit()

    def calculate_progress(self, db: Session, run_id: str) -> Dict[str, Any]:
        tasks = db.query(AgentTaskDB).filter(AgentTaskDB.run_id == run_id).all()
        if not tasks:
            return {"total": 0, "completed": 0, "failed": 0, "running": 0, "waiting_approval": 0, "percentage": 0, "status": "PLANNING"}

        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == "COMPLETED")
        failed = sum(1 for t in tasks if t.status == "FAILED")
        running = sum(1 for t in tasks if t.status in ["RUNNING", "RETRYING"])
        waiting_approval = sum(1 for t in tasks if t.status == "WAITING_FOR_APPROVAL")
        cancelled = sum(1 for t in tasks if t.status == "CANCELLED")

        percentage = round((completed / total) * 100, 1)

        status = "RUNNING"
        if waiting_approval > 0:
            status = "WAITING_FOR_APPROVAL"
        elif running > 0:
            status = "RUNNING"
        elif failed > 0:
            # If any task failed and no tasks are currently executing, the run has failed
            status = "FAILED"
        elif completed == total:
            status = "COMPLETED"
        elif (completed + cancelled) == total:
            status = "FAILED" if failed > 0 or completed == 0 else "COMPLETED"

        return {
            "total": total,
            "completed": completed,
            "failed": failed,
            "cancelled": cancelled,
            "running": running,
            "waiting_approval": waiting_approval,
            "percentage": percentage,
            "status": status
        }

    def cancel_all_tasks(self, db: Session, run_id: str):
        tasks = db.query(AgentTaskDB).filter(
            AgentTaskDB.run_id == run_id,
            AgentTaskDB.status.in_(["PENDING", "RUNNING", "WAITING", "WAITING_FOR_APPROVAL", "RETRYING"])
        ).all()
        for t in tasks:
            t.status = "CANCELLED"
        db.commit()

task_manager = TaskManager()
