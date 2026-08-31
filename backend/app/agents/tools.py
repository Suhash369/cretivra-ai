from typing import Callable, Dict, Any, List, Optional
from pydantic import BaseModel

class Tool(BaseModel):
    name: str
    description: str
    enabled: bool = True
    requires_approval: bool = True

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Tool] = {}
        self._register_default_tools()

    def _register_default_tools(self):
        self.register(Tool(name="web_search", description="Search the web for up-to-date information.", enabled=False))
        self.register(Tool(name="file_search", description="Search local conversation files and documents.", enabled=True))
        self.register(Tool(name="calculator", description="Perform exact mathematical calculations.", enabled=True))

    def register(self, tool: Tool):
        self._tools[tool.name] = tool

    def get_tool(self, name: str) -> Optional[Tool]:
        return self._tools.get(name)

    def list_tools(self) -> List[Tool]:
        return list(self._tools.values())

tool_registry = ToolRegistry()
