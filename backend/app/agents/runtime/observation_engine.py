from typing import Dict, Any, Optional
from app.tools.registry import ToolExecutionResult

class ObservationEngine:
    def format_observation(self, tool_name: str, result: ToolExecutionResult) -> Dict[str, Any]:
        """
        Structures raw tool outputs into an observation payload with metadata and error trapping.
        """
        observation = {
            "tool": tool_name,
            "success": result.success,
            "duration_ms": result.duration_ms,
            "artifacts_generated": [a.get("name") for a in result.artifacts]
        }

        if result.success:
            observation["data"] = result.output
            observation["summary"] = self._summarize_output(tool_name, result.output)
        else:
            observation["error"] = result.error or "Tool execution failed."
            observation["summary"] = f"Failed with error: {result.error}"

        return observation

    def _summarize_output(self, tool_name: str, output: Any) -> str:
        if not output:
            return "Empty response."
        if isinstance(output, dict):
            if "results" in output and isinstance(output["results"], list):
                return f"Discovered {len(output['results'])} relevant web sources."
            if "stdout" in output:
                stdout_len = len(output.get("stdout", ""))
                return f"Code execution completed (stdout: {stdout_len} chars, exit_code: {output.get('exit_code', 0)})."
            if "download_url" in output:
                return f"Generated document file ready: {output.get('filename')}."
            if "files" in output:
                return f"Workspace contains {output.get('count', len(output.get('files', [])))} files."
            if "summary" in output:
                return f"Data analysis profiled {output.get('summary', {}).get('row_count', 0)} records."
        return str(output)[:200]

observation_engine = ObservationEngine()
