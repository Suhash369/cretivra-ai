import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import init_db
from app.agents.runtime.planner import planner
from app.agents.runtime.task_manager import task_manager
from app.tools.registry import tool_registry

init_db()
client = TestClient(app)


def test_intent_classification():
    assert planner.classify_intent("Build a website for my startup") == "build_web_app"
    assert planner.classify_intent("Deep research the AI CRM market in 2026") == "deep_research"
    assert planner.classify_intent("Analyze this sales dataset and find revenue drops") == "data_analysis"
    assert planner.classify_intent("Create a presentation on quantum computing") == "presentation"
    assert planner.classify_intent("Generate a pdf report for our board meeting") == "document"
    assert planner.classify_intent("Find leads for our enterprise software") == "sales_leads"
    assert planner.classify_intent("Research quantum computing, calculate cost in Python, and generate a presentation deck") == "composite_autonomous_goal"

def test_tools_catalog_endpoint():
    res = client.get("/api/tools")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 8
    tool_names = [t["name"] for t in data]
    assert "web_search" in tool_names
    assert "calculator" in tool_names
    assert "python_executor" in tool_names
    assert "file_writer" in tool_names
    assert "pdf_generator" in tool_names

def test_skills_catalog_endpoint():
    res = client.get("/api/skills")
    assert res.status_code == 200
    data = res.json()
    skill_ids = [s["id"] for s in data]
    assert "deep-research" in skill_ids
    assert "website-builder" in skill_ids
    assert "data-analyst" in skill_ids

def test_calculator_tool_execution():
    import asyncio
    res = asyncio.run(tool_registry.execute("calculator", {"expression": "12 * 12 + 6"}, {}))
    assert res.success is True
    assert res.output["result"] == 150

def test_python_executor_tool():
    import asyncio
    code = "import sys\nprint('Asura Sandbox Execution')\nsys.stdout.flush()"
    res = asyncio.run(tool_registry.execute("python_executor", {"code": code}, {}))
    assert res.success is True
    assert "Asura Sandbox Execution" in res.output["stdout"]
    assert res.output["exit_code"] == 0

def test_project_crud_and_file_writing():
    # 1. Create project
    p_res = client.post("/api/projects", json={"name": "Test Playground Project", "description": "Unit testing"})
    assert p_res.status_code == 201
    proj_data = p_res.json()
    proj_id = proj_data["id"]

    # 2. Write file into project
    f_res = client.post(f"/api/projects/{proj_id}/files", json={
        "path": "test.txt",
        "content": "Hello Asura Playground!",
        "mime_type": "text/plain"
    })
    assert f_res.status_code == 200
    assert f_res.json()["status"] == "saved"

    # 3. Get project detail and verify file listed
    detail_res = client.get(f"/api/projects/{proj_id}")
    assert detail_res.status_code == 200
    files = detail_res.json()["files"]
    assert any(f["path"] == "test.txt" for f in files)

def test_agent_run_creation_and_task_graph():
    # 1. Start agent run
    run_res = client.post("/api/agents/runs", json={
        "prompt": "Build a landing page for Cretivra AI",
        "model_id": "cretivra-1"
    })
    assert run_res.status_code == 201
    run_data = run_res.json()
    run_id = run_data["run_id"]
    assert run_data["intent"] == "build_web_app"

    # 2. Inspect run detail & tasks
    detail_res = client.get(f"/api/agents/runs/{run_id}")
    assert detail_res.status_code == 200
    detail = detail_res.json()
    assert len(detail["tasks"]) >= 3
    assert detail["progress"]["total"] == len(detail["tasks"])

def test_approval_workflow():
    # 1. Start run that creates an approval requirement or create directly
    from app.database.database import SessionLocal
    from app.agents.runtime.approval_manager import approval_manager
    db = SessionLocal()
    try:
        run_res = client.post("/api/agents/runs", json={"prompt": "General task with approval"})
        run_id = run_res.json()["run_id"]

        approval = approval_manager.create_approval_request(
            db=db,
            run_id=run_id,
            task_id=None,
            tool_name="email",
            action_type="send_email",
            description="Send outreach to customer@example.com",
            payload={"to": "customer@example.com", "subject": "Hello"},
            risk_level="HIGH"
        )
        assert approval.status == "pending"

        # Test approve endpoint
        appr_res = client.post(f"/api/agents/runs/{run_id}/approve", json={
            "approval_id": approval.id,
            "action": "approve"
        })
        assert appr_res.status_code == 200
        assert appr_res.json()["status"] == "approved"
    finally:
        db.close()


def test_task_failure_propagation_and_accurate_status():
    from app.database.database import SessionLocal
    from app.database.models import AgentRunDB, AgentTaskDB, UserDB
    from app.agents.runtime.task_manager import task_manager

    db = SessionLocal()
    try:
        user = db.query(UserDB).first()
        if not user:
            user = UserDB(email="tester_agent@cretivra.ai", password_hash="dummy_hash")
            db.add(user)
            db.commit()

        run = AgentRunDB(
            user_id=user.id,
            agent_id="asura-orchestrator",
            prompt="Failing task pipeline test",
            intent="general_task",
            status="RUNNING"
        )
        db.add(run)
        db.commit()

        # Task 1: Will fail
        t1 = AgentTaskDB(
            run_id=run.id,
            task_order=1,
            task_type="coding",
            description="Task 1 (Broken)",
            status="PENDING"
        )
        db.add(t1)
        db.commit()

        # Task 2: Depends on Task 1
        t2 = AgentTaskDB(
            run_id=run.id,
            parent_task_id=t1.id,
            task_order=2,
            task_type="document",
            description="Task 2 (Dependent)",
            status="PENDING"
        )
        db.add(t2)
        db.commit()

        # 1. Simulate Task 1 failure
        t1.status = "FAILED"
        t1.error = "Simulated syntax execution error"
        db.commit()

        # 2. Check get_next_runnable_task: Task 2 depends on failed Task 1, so it should auto-cancel
        next_task = task_manager.get_next_runnable_task(db, run.id)
        assert next_task is None

        # 3. Refresh and verify t2 is now CANCELLED
        db.refresh(t2)
        assert t2.status == "CANCELLED"

        # 4. Progress calculation must report status="FAILED", not RUNNING or COMPLETED
        progress = task_manager.calculate_progress(db, run.id)
        assert progress["status"] == "FAILED"
        assert progress["failed"] == 1
        assert progress["cancelled"] == 1
        assert progress["completed"] == 0
    finally:
        db.close()


def test_run_artifacts_zip_export():
    import zipfile
    import io
    from app.database.database import SessionLocal
    from app.database.models import AgentRunDB, UserDB, ArtifactDB

    db = SessionLocal()
    try:
        user = db.query(UserDB).first()
        run = AgentRunDB(
            user_id=user.id,
            agent_id="asura-orchestrator",
            prompt="Zip export test",
            intent="general_task",
            status="COMPLETED"
        )
        db.add(run)
        db.commit()

        # Add mock artifacts
        art1 = ArtifactDB(
            run_id=run.id,
            name="summary.html",
            path="summary.html",
            type="WEBSITE",
            size=120,
            mime_type="text/html",
            download_url="/api/artifacts/download/summary.html",
            metadata_json={"content": "<h1>Deliverable 1</h1>"}
        )
        art2 = ArtifactDB(
            run_id=run.id,
            name="notes.txt",
            path="notes.txt",
            type="SOURCE_CODE",
            size=50,
            mime_type="text/plain",
            download_url="/api/artifacts/download/notes.txt",
            metadata_json={"content": "Verified notes from Cretivra AI"}
        )
        db.add_all([art1, art2])
        db.commit()

        # Call zip export endpoint
        res = client.get(f"/api/artifacts/run/{run.id}/zip")
        assert res.status_code == 200
        assert res.headers["content-type"] == "application/zip"

        # Verify ZIP contains both files
        with zipfile.ZipFile(io.BytesIO(res.content)) as zf:
            namelist = zf.namelist()
            assert "summary.html" in namelist
            assert "notes.txt" in namelist
            assert zf.read("summary.html").decode("utf-8") == "<h1>Deliverable 1</h1>"
    finally:
        db.close()


