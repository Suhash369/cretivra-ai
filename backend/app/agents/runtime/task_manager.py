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

        for t in tasks:
            if t.status in ["PENDING", "RETRYING"]:
                # Check dependency
                if not t.parent_task_id or t.parent_task_id in completed_ids:
                    return t
        return None

    def calculate_progress(self, db: Session, run_id: str) -> Dict[str, Any]:
        tasks = db.query(AgentTaskDB).filter(AgentTaskDB.run_id == run_id).all()
        if not tasks:
            return {"total": 0, "completed": 0, "percentage": 0, "status": "PLANNING"}

        total = len(tasks)
        completed = sum(1 for t in tasks if t.status == "COMPLETED")
        failed = sum(1 for t in tasks if t.status == "FAILED")
        running = sum(1 for t in tasks if t.status == "RUNNING")
        waiting_approval = sum(1 for t in tasks if t.status == "WAITING_FOR_APPROVAL")

        percentage = round((completed / total) * 100, 1)

        status = "RUNNING"
        if waiting_approval > 0:
            status = "WAITING_FOR_APPROVAL"
        elif failed > 0 and (completed + failed) == total:
            status = "FAILED"
        elif completed == total:
            status = "COMPLETED"

        return {
            "total": total,
            "completed": completed,
            "failed": failed,
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
