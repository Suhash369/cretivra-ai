from typing import Dict, Any, List, Optional
from pydantic import BaseModel

class ReplanAction(BaseModel):
    should_retry: bool
    remediation_task: Optional[Dict[str, Any]] = None
    adjusted_input: Optional[Dict[str, Any]] = None
    reason: str

class Replanner:
    MAX_RETRIES = 3

    def replan(
        self,
        task: Dict[str, Any],
        error_message: str,
        retry_count: int
    ) -> ReplanAction:
        """
        Determines self-correction remediation strategy when a task fails verification or execution.
        """
        if retry_count >= self.MAX_RETRIES:
            return ReplanAction(
                should_retry=False,
                reason=f"Exceeded maximum retry limit of {self.MAX_RETRIES} attempts. Escalating to user."
            )

        task_type = task.get("task_type", "")
        task_input = task.get("input_data", {})

        # Self-correction logic for code failures
        if task_type in ["coding", "code", "build"]:
            # Append error diagnosis to input
            adjusted_input = dict(task_input)
            adjusted_input["previous_error"] = error_message
            adjusted_input["instruction"] = f"Fix the following error: {error_message}"
            return ReplanAction(
                should_retry=True,
                adjusted_input=adjusted_input,
                reason=f"Attempting self-correction (retry {retry_count + 1}/{self.MAX_RETRIES}) by patching syntax/runtime error."
            )

        # Self-correction logic for research failures
        if task_type in ["research", "search"]:
            adjusted_input = dict(task_input)
            query = adjusted_input.get("query", "")
            adjusted_input["query"] = f"{query} facts data 2026"
            return ReplanAction(
                should_retry=True,
                adjusted_input=adjusted_input,
                reason=f"Expanding search query parameters for improved factual retrieval (retry {retry_count + 1})."
            )

        # General retry
        return ReplanAction(
            should_retry=True,
            adjusted_input=task_input,
            reason=f"Retrying task execution with fallback parameters (retry {retry_count + 1})."
        )

replanner = Replanner()
