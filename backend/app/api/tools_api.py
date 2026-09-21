from fastapi import APIRouter
from app.tools.registry import tool_registry

router = APIRouter(prefix="", tags=["Tools"])

DEFAULT_SKILLS = [
    {
        "id": "deep-research",
        "name": "Deep Research",
        "category": "Research",
        "description": "Multi-source web crawling, passage extraction, BM25 reranking, and citation verification.",
        "tools": ["web_search", "web_fetch", "pdf_generator"]
    },
    {
        "id": "website-builder",
        "name": "Web Application Builder",
        "category": "Build",
        "description": "Scaffolding, architecture design, HTML/CSS/JS generation, and browser DOM verification.",
        "tools": ["file_writer", "file_reader", "browser", "pdf_generator"]
    },
    {
        "id": "data-analyst",
        "name": "Data Analyst",
        "category": "Analyze",
        "description": "CSV/Excel data profiling, statistical summary calculations, and anomaly detection.",
        "tools": ["data_analyzer", "python_executor", "pdf_generator"]
    },
    {
        "id": "presentation-generation",
        "name": "Executive Presentation",
        "category": "Create",
        "description": "Automated 16:9 widescreen Microsoft PowerPoint deck and executive summary generation.",
        "tools": ["ppt_generator", "pdf_generator"]
    },
    {
        "id": "document-generation",
        "name": "Document Synthesis",
        "category": "Create",
        "description": "Publication-grade vector PDF whitepapers, proposals, and architecture manuals with ReportLab.",
        "tools": ["pdf_generator"]
    },
    {
        "id": "code-generation",
        "name": "Code Specialist",
        "category": "Build",
        "description": "Full-stack software engineering, debugging, and sandboxed test execution.",
        "tools": ["python_executor", "file_writer", "file_reader"]
    }
]

@router.get("/tools")
def list_tools():
    tools = tool_registry.list_tools()
    return [
        {
            "name": t.name,
            "description": t.description,
            "risk_level": t.risk_level,
            "timeout_seconds": t.timeout_seconds,
            "requires_approval": t.requires_approval,
            "enabled": t.enabled,
            "input_schema": t.input_schema,
            "output_schema": t.output_schema
        } for t in tools
    ]

@router.get("/skills")
def list_skills():
    return DEFAULT_SKILLS
