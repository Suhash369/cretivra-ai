import time
import json
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session

from app.tools.registry import tool_registry, ToolExecutionResult
from app.agents.runtime.permission_manager import permission_manager
from app.agents.runtime.approval_manager import approval_manager
from app.agents.runtime.observation_engine import observation_engine
from app.agents.runtime.verification_engine import verification_engine, VerificationResult
from app.agents.runtime.replanner import replanner
from app.database.models import ToolExecutionDB, AgentStepDB, AgentTaskDB, AgentRunDB
from app.core.logging import logger

class ExecutionEngine:
    async def execute_task(
        self,
        db: Session,
        run_id: str,
        task: AgentTaskDB,
        context: Dict[str, Any]
    ) -> Tuple[bool, Any, Optional[str], Optional[str]]:
        """
        Executes an individual task: permission check -> tool call -> observation -> verification -> self-correction.
        Returns: (success, output, error, approval_id_if_pending)
        """
        tool_name = task.tool_name
        if not tool_name:
            # Task without tool, mark completed
            task.status = "COMPLETED"
            task.completed_at = time.strftime("%Y-%m-%d %H:%M:%S")
            db.commit()
            return True, task.output_data or {"message": "Step executed"}, None, None

        tool = tool_registry.get_tool(tool_name)
        if not tool:
            task.status = "FAILED"
            task.error = f"Tool '{tool_name}' not found."
            db.commit()
            return False, None, task.error, None

        # 1. Permission & Approval Check
        run = db.query(AgentRunDB).filter(AgentRunDB.id == run_id).first()
        user_id = run.user_id if run else None

        if permission_manager.requires_approval(tool.risk_level, tool_name, user_id, db):
            # Check if there is an approved record already
            existing_approval = db.query(AgentStepDB).filter(
                AgentStepDB.task_id == task.id,
                AgentStepDB.step_type == "approval_granted"
            ).first()

            if not existing_approval:
                approval = approval_manager.create_approval_request(
                    db=db,
                    run_id=run_id,
                    task_id=task.id,
                    tool_name=tool_name,
                    action_type="tool_execution",
                    description=f"Action requires user confirmation: {tool_name} ({task.description})",
                    payload=task.input_data or {},
                    risk_level=tool.risk_level
                )
                task.status = "WAITING_FOR_APPROVAL"
                db.commit()
                return False, None, "Waiting for user approval.", approval.id

        # 2. Tool Execution
        task.status = "RUNNING"
        step_log = AgentStepDB(
            task_id=task.id,
            step_number=(len(task.steps) + 1),
            step_type="tool_call",
            content=f"Calling tool '{tool_name}' with payload: {json.dumps(task.input_data)[:300]}"
        )
        db.add(step_log)
        db.commit()

        exec_context = dict(context)
        exec_context["db"] = db
        exec_context["run_id"] = run_id
        exec_context["task_id"] = task.id
        exec_context["project_id"] = run.project_id if run else None

        exec_res: ToolExecutionResult = await tool_registry.execute(
            name=tool_name,
            payload=task.input_data or {},
            context=exec_context
        )

        # 3. Observation
        obs = observation_engine.format_observation(tool_name, exec_res)
        obs_step = AgentStepDB(
            task_id=task.id,
            step_number=(len(task.steps) + 1),
            step_type="observation",
            content=json.dumps(obs)[:1000]
        )
        db.add(obs_step)

        # Record ToolExecutionDB
        tool_exec = ToolExecutionDB(
            run_id=run_id,
            step_id=obs_step.id,
            tool_name=tool_name,
            input_payload=task.input_data or {},
            output_payload=exec_res.output if isinstance(exec_res.output, (dict, list)) else {"raw": str(exec_res.output)[:1000]},
            error=exec_res.error,
            duration_ms=exec_res.duration_ms,
            status="success" if exec_res.success else "failed"
        )
        db.add(tool_exec)
        db.commit()

        # 4. Verification
        if not exec_res.success:
            # Self-correction check
            replan_act = replanner.replan(
                task={"task_type": task.task_type, "input_data": task.input_data},
                error_message=exec_res.error or "Unknown failure",
                retry_count=task.retry_count
            )
            if replan_act.should_retry:
                task.retry_count += 1
                task.status = "RETRYING"
                task.input_data = replan_act.adjusted_input

                # Manus 2.0 Self-Healing: If Python code failed, invoke Cretivra Coder to repair the code
                if task.tool_name == "python_executor" and task.input_data and "code" in task.input_data:
                    repaired_code = await self._heal_code(
                        original_code=task.input_data.get("code", ""),
                        error_message=exec_res.error or "Runtime error",
                        description=task.description
                    )
                    if repaired_code:
                        task.input_data["code"] = repaired_code
                        logger.info(f"Self-healed Python code for task {task.id} (attempt {task.retry_count})")

                heal_step = AgentStepDB(
                    task_id=task.id,
                    step_number=(len(task.steps) + 1),
                    step_type="self_healing",
                    content=f"Self-correction loop triggered (retry {task.retry_count}/3): {replan_act.reason}"
                )
                db.add(heal_step)
                db.commit()
                logger.info(f"Task {task.id} scheduled for self-correction: {replan_act.reason}")
                return await self.execute_task(db, run_id, task, context)
            else:
                task.status = "FAILED"
                task.error = exec_res.error
                db.commit()
                return False, None, exec_res.error, None

        # Domain Verification
        verif: VerificationResult = verification_engine.verify(
            domain=task.task_type,
            task_input=task.input_data or {},
            task_output=exec_res.output
        )

        verif_step = AgentStepDB(
            task_id=task.id,
            step_number=(len(task.steps) + 1),
            step_type="verification",
            content=f"Verification ({verif.domain}): passed={verif.passed}. {verif.feedback}"
        )
        db.add(verif_step)

        if not verif.passed:
            replan_act = replanner.replan(
                task={"task_type": task.task_type, "input_data": task.input_data},
                error_message=verif.feedback or "Verification check failed",
                retry_count=task.retry_count
            )
            if replan_act.should_retry:
                task.retry_count += 1
                task.status = "RETRYING"
                task.input_data = replan_act.adjusted_input

                if task.tool_name == "python_executor" and task.input_data and "code" in task.input_data:
                    repaired_code = await self._heal_code(
                        original_code=task.input_data.get("code", ""),
                        error_message=verif.feedback or "Verification check failed",
                        description=task.description
                    )
                    if repaired_code:
                        task.input_data["code"] = repaired_code

                db.commit()
                return await self.execute_task(db, run_id, task, context)
            else:
                task.status = "FAILED"
                task.error = verif.feedback
                db.commit()
                return False, exec_res.output, verif.feedback, None

        task.status = "COMPLETED"
        task.output_data = exec_res.output if isinstance(exec_res.output, (dict, list)) else {"raw": str(exec_res.output)}
        task.completed_at = time.strftime("%Y-%m-%d %H:%M:%S")
        db.commit()
        return True, exec_res.output, None, None

    async def _heal_code(self, original_code: str, error_message: str, description: str) -> Optional[str]:
        """
        Autonomously repairs failing code using Cretivra Coder LLM diagnostics.
        """
        try:
            import re
            from app.providers.ollama import ollama_provider
            messages = [
                {
                    "role": "system",
                    "content": (
                        "You are Cretivra Coder, a frontier autonomous self-healing software intelligence. "
                        "A Python script failed during execution. Analyze the traceback and fix the code completely so it runs cleanly without errors. "
                        "Return ONLY the complete, executable Python code inside a single ```python ... ``` block. Do not include conversational text."
                    )
                },
                {
                    "role": "user",
                    "content": f"Task: {description}\n\nExecution Traceback / Error:\n{error_message}\n\nOriginal Code:\n```python\n{original_code}\n```"
                }
            ]
            res = await ollama_provider.chat(
                model="cretivra-coder",
                messages=messages,
                options={"temperature": 0.1}
            )
            text = res.get("message", {}).get("content", "")
            m = re.search(r"```(?:python)?\s*(.*?)\s*```", text, re.DOTALL)
            if m:
                code = m.group(1).strip()
                if code:
                    return code
            if text.strip() and not text.strip().startswith("{"):
                return text.strip()
        except Exception as e:
            logger.warning(f"Self-healing code attempt failed: {e}")
        return None

execution_engine = ExecutionEngine()

