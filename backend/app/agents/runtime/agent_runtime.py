import os
import json
import time
import asyncio
from typing import AsyncGenerator, Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.logging import logger
from app.database.models import AgentRunDB, AgentTaskDB, ProjectDB, ArtifactDB
from app.services.project_service import project_service
from app.services.artifact_service import artifact_service
from app.agents.runtime.planner import planner
from app.agents.runtime.task_manager import task_manager
from app.agents.runtime.execution_engine import execution_engine
from app.agents.runtime.approval_manager import approval_manager

class AgentRuntime:
    async def create_and_execute_run(
        self,
        db: Session,
        user_id: str,
        prompt: str,
        project_id: Optional[str] = None,
        model_id: Optional[str] = "cretivra-1"
    ) -> AgentRunDB:
        """
        Creates a new persistent run, creates its plan, associates project sandbox, and kicks off execution.
        """
        # Ensure project exists or create a default sandbox project
        if not project_id:
            clean_proj_name = prompt[:30].strip().title() or "Playground Project"
            proj = project_service.create_project(
                db=db,
                user_id=user_id,
                name=clean_proj_name,
                description=f"Auto-generated workspace for: {prompt[:60]}"
            )
            project_id = proj.id

        intent = planner.classify_intent(prompt)

        run = AgentRunDB(
            user_id=user_id,
            project_id=project_id,
            agent_id="asura-orchestrator",
            prompt=prompt,
            intent=intent,
            status="RUNNING",
            started_at=datetime.utcnow()
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        # Generate Task Graph (DAG)
        planner.generate_plan(db=db, run_id=run.id, prompt=prompt, intent=intent)

        logger.info(f"Initialized AgentRun {run.id} for user {user_id} with intent '{intent}'")
        return run

    async def execute_run_stream(
        self,
        db: Session,
        run_id: str
    ) -> AsyncGenerator[str, None]:
        """
        Executes the run tasks sequentially or in dependency order,
        yielding SSE formatted event chunks with live progress.
        """
        run = db.query(AgentRunDB).filter(AgentRunDB.id == run_id).first()
        if not run:
            yield f"data: {json.dumps({'event': 'error', 'message': f'Run {run_id} not found.'})}\n\n"
            return

        project = db.query(ProjectDB).filter(ProjectDB.id == run.project_id).first()
        project_root = project.root_path if project else os.path.join(settings.UPLOAD_DIR, "projects", run.project_id or "default")

        context = {
            "project_root": project_root,
            "user_id": run.user_id,
            "project_id": run.project_id
        }

        # 1. Emit run started event
        yield self._sse_frame("agent.run.started", {
            "run_id": run.id,
            "prompt": run.prompt,
            "intent": run.intent,
            "project_id": run.project_id,
            "status": run.status
        })
        await asyncio.sleep(0.1)

        # 2. Emit plan created event
        tasks = db.query(AgentTaskDB).filter(AgentTaskDB.run_id == run.id).order_by(AgentTaskDB.task_order).all()
        yield self._sse_frame("agent.plan.created", {
            "run_id": run.id,
            "task_count": len(tasks),
            "tasks": [
                {
                    "id": t.id,
                    "order": t.task_order,
                    "type": t.task_type,
                    "description": t.description,
                    "model_id": t.model_id,
                    "tool_name": t.tool_name,
                    "status": t.status
                } for t in tasks
            ]
        })
        await asyncio.sleep(0.1)

        # 3. Task Execution Loop
        start_ts = time.time()
        while True:
            # Refresh run status from DB
            db.refresh(run)
            if run.status in ["CANCELLED", "FAILED", "WAITING_FOR_APPROVAL"]:
                break

            next_task = task_manager.get_next_runnable_task(db, run.id)
            if not next_task:
                # Check if all completed
                progress = task_manager.calculate_progress(db, run.id)
                if progress["status"] == "COMPLETED":
                    run.status = "COMPLETED"
                elif progress["waiting_approval"] > 0:
                    run.status = "WAITING_FOR_APPROVAL"
                else:
                    run.status = "COMPLETED"
                db.commit()
                break

            # Task Started
            yield self._sse_frame("agent.task.started", {
                "run_id": run.id,
                "task_id": next_task.id,
                "task_order": next_task.task_order,
                "task_type": next_task.task_type,
                "description": next_task.description,
                "model_id": next_task.model_id,
                "tool_name": next_task.tool_name
            })
            await asyncio.sleep(0.15)

            if next_task.tool_name:
                yield self._sse_frame("agent.tool.started", {
                    "run_id": run.id,
                    "task_id": next_task.id,
                    "tool_name": next_task.tool_name,
                    "input": next_task.input_data
                })

            success, output, err_msg, approval_id = await execution_engine.execute_task(
                db=db,
                run_id=run.id,
                task=next_task,
                context=context
            )

            if approval_id:
                yield self._sse_frame("agent.approval.required", {
                    "run_id": run.id,
                    "task_id": next_task.id,
                    "approval_id": approval_id,
                    "tool_name": next_task.tool_name,
                    "description": next_task.description,
                    "message": "This action requires your confirmation."
                })
                run.status = "WAITING_FOR_APPROVAL"
                db.commit()
                break

            if next_task.tool_name:
                yield self._sse_frame("agent.tool.completed", {
                    "run_id": run.id,
                    "task_id": next_task.id,
                    "tool_name": next_task.tool_name,
                    "success": success,
                    "error": err_msg
                })

            if success:
                yield self._sse_frame("agent.task.completed", {
                    "run_id": run.id,
                    "task_id": next_task.id,
                    "task_order": next_task.task_order,
                    "description": next_task.description,
                    "status": "COMPLETED"
                })
            else:
                yield self._sse_frame("agent.task.failed", {
                    "run_id": run.id,
                    "task_id": next_task.id,
                    "description": next_task.description,
                    "error": err_msg,
                    "status": "FAILED"
                })

            # Check if any new artifacts were produced
            new_artifacts = artifact_service.list_artifacts(db, run_id=run.id)
            if new_artifacts:
                yield self._sse_frame("agent.artifacts.updated", {
                    "run_id": run.id,
                    "artifacts": [
                        {
                            "id": a.id,
                            "name": a.name,
                            "type": a.type,
                            "size": a.size,
                            "download_url": a.download_url
                        } for a in new_artifacts
                    ]
                })

            await asyncio.sleep(0.1)

        # 4. Finalize Run
        duration = round(time.time() - start_ts, 2)
        run.duration = duration
        run.completed_at = datetime.utcnow()

        final_artifacts = artifact_service.list_artifacts(db, run_id=run.id)
        artifact_count = len(final_artifacts)

        if run.status == "COMPLETED":
            run.result = f"Task completed successfully in {duration}s. Generated {artifact_count} artifact(s)."
        elif run.status != "WAITING_FOR_APPROVAL":
            run.status = "FAILED"
            run.error = "Run terminated with errors."

        db.commit()
        db.refresh(run)

        yield self._sse_frame("agent.run.completed", {
            "run_id": run.id,
            "status": run.status,
            "duration": duration,
            "artifact_count": artifact_count,
            "result": run.result,
            "error": run.error
        })

    def _sse_frame(self, event_type: str, data: Dict[str, Any]) -> str:
        payload = {"event": event_type, "data": data, "timestamp": datetime.utcnow().isoformat()}
        return f"data: {json.dumps(payload)}\n\n"

agent_runtime = AgentRuntime()
