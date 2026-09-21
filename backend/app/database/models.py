import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class UserDB(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=True)
    password_hash = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_subscribed = Column(Boolean, default=False)
    subscription_expires_at = Column(DateTime, nullable=True)
    plan_name = Column(String, default="15-Day Pass")
    created_at = Column(DateTime, default=datetime.utcnow)

    conversations = relationship("ConversationDB", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("PaymentDB", back_populates="user", cascade="all, delete-orphan", order_by="desc(PaymentDB.created_at)")
    suggestions = relationship("SuggestionDB", back_populates="user", cascade="all, delete-orphan")
    projects = relationship("ProjectDB", back_populates="user", cascade="all, delete-orphan")
    agent_runs = relationship("AgentRunDB", back_populates="user", cascade="all, delete-orphan")

class ConversationDB(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=generate_uuid)
    title = Column(String, default="New Conversation")
    model_id = Column(String, default="cretivra-1", nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserDB", back_populates="conversations")
    messages = relationship("MessageDB", back_populates="conversation", cascade="all, delete-orphan", order_by="MessageDB.created_at")
    attachments = relationship("AttachmentDB", back_populates="conversation", cascade="all, delete-orphan")

class MessageDB(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String, nullable=False)  # user, assistant, system
    content = Column(Text, nullable=False)
    reasoning_status = Column(String, nullable=True)  # Thinking, Analyzing, Completed, etc.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversation = relationship("ConversationDB", back_populates="messages")
    attachments = relationship("AttachmentDB", back_populates="message")

class AttachmentDB(Base):
    __tablename__ = "attachments"

    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    message_id = Column(String, ForeignKey("messages.id"), nullable=True, index=True)
    filename = Column(String, nullable=False)
    mime_type = Column(String, nullable=False)
    path = Column(String, nullable=False)
    size = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("ConversationDB", back_populates="attachments")
    message = relationship("MessageDB", back_populates="attachments")

class ModelSettingDB(Base):
    __tablename__ = "model_settings"

    id = Column(String, primary_key=True)  # e.g., "cretivra-1"
    display_name = Column(String, nullable=False)
    underlying_model = Column(String, nullable=False)
    description = Column(String, nullable=True)
    provider = Column(String, default="ollama")
    capabilities = Column(JSON, default=list)
    context_length = Column(Integer, default=4096)
    enabled = Column(Boolean, default=True)
    version = Column(String, default="1.0")
    icon = Column(String, nullable=True)
    category = Column(String, default="General")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SystemSettingDB(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class PaymentDB(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, default=20.0, nullable=False)
    currency = Column(String, default="INR", nullable=False)
    gateway = Column(String, default="razorpay")  # razorpay, upi, manual
    payment_id = Column(String, nullable=True)
    order_id = Column(String, nullable=True)
    status = Column(String, default="completed")  # completed, pending, failed
    plan_name = Column(String, default="15-Day Pass")
    days_added = Column(Integer, default=15)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="payments")

class SuggestionDB(Base):
    __tablename__ = "suggestions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    user_email = Column(String, nullable=True)
    user_name = Column(String, nullable=True)
    category = Column(String, default="suggestion")  # suggestion, feature, bug, comment
    comment = Column(Text, nullable=False)
    rating = Column(Integer, nullable=True)  # 1 to 5
    page_url = Column(String, nullable=True)
    device_info = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, reviewed, resolved
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="suggestions")

# =============================================================================
# ASURA PLAYGROUND — AGENT RUNTIME, PROJECTS & TOOLING MODELS
# =============================================================================

class ProjectDB(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    root_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("UserDB", back_populates="projects")
    files = relationship("ProjectFileDB", back_populates="project", cascade="all, delete-orphan")
    memories = relationship("ProjectMemoryDB", back_populates="project", cascade="all, delete-orphan")
    runs = relationship("AgentRunDB", back_populates="project", cascade="all, delete-orphan")
    artifacts = relationship("ArtifactDB", back_populates="project", cascade="all, delete-orphan")
    knowledge_sources = relationship("KnowledgeSourceDB", back_populates="project", cascade="all, delete-orphan")

class ProjectFileDB(Base):
    __tablename__ = "project_files"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    path = Column(String, nullable=False)  # Relative file path inside project sandbox
    content = Column(Text, nullable=True)
    size = Column(Integer, default=0)
    mime_type = Column(String, default="text/plain")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    project = relationship("ProjectDB", back_populates="files")

class ProjectMemoryDB(Base):
    __tablename__ = "project_memory"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False, index=True)
    key = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String, default="requirement")  # requirement, decision, architecture, issue
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("ProjectDB", back_populates="memories")

class AgentDB(Base):
    __tablename__ = "agents"

    id = Column(String, primary_key=True)  # e.g., "orchestrator", "coder", "researcher", "analyst"
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    role = Column(String, default="specialist")
    system_prompt = Column(Text, nullable=True)
    default_model_id = Column(String, default="cretivra-1")
    capabilities = Column(JSON, default=list)
    is_custom = Column(Boolean, default=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class AgentSkillDB(Base):
    __tablename__ = "agent_skills"

    id = Column(String, primary_key=True)  # e.g., "deep-research", "website-builder"
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, default="General")
    tools = Column(JSON, default=list)
    supported_models = Column(JSON, default=list)
    input_schema = Column(JSON, default=dict)
    output_schema = Column(JSON, default=dict)
    verification_rules = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class AgentRunDB(Base):
    __tablename__ = "agent_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True, index=True)
    agent_id = Column(String, default="asura-orchestrator")
    prompt = Column(Text, nullable=False)
    intent = Column(String, default="general_task")
    status = Column(String, default="PENDING")  # PENDING, PLANNING, RUNNING, WAITING, WAITING_FOR_APPROVAL, COMPLETED, FAILED, RETRYING, CANCELLED
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    duration = Column(Float, default=0.0)
    tokens = Column(Integer, default=0)
    estimated_cost = Column(Float, default=0.0)
    result = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserDB", back_populates="agent_runs")
    project = relationship("ProjectDB", back_populates="runs")
    tasks = relationship("AgentTaskDB", back_populates="run", cascade="all, delete-orphan", order_by="AgentTaskDB.task_order")
    executions = relationship("ToolExecutionDB", back_populates="run", cascade="all, delete-orphan")
    artifacts = relationship("ArtifactDB", back_populates="run", cascade="all, delete-orphan")
    approvals = relationship("ApprovalDB", back_populates="run", cascade="all, delete-orphan")

class AgentTaskDB(Base):
    __tablename__ = "agent_tasks"

    id = Column(String, primary_key=True, default=generate_uuid)
    run_id = Column(String, ForeignKey("agent_runs.id"), nullable=False, index=True)
    parent_task_id = Column(String, ForeignKey("agent_tasks.id"), nullable=True)
    task_order = Column(Integer, default=1)
    task_type = Column(String, nullable=False)  # research, architecture, coding, testing, verification
    description = Column(Text, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, PLANNING, RUNNING, WAITING, WAITING_FOR_APPROVAL, COMPLETED, FAILED, RETRYING, CANCELLED
    priority = Column(Integer, default=1)
    model_id = Column(String, default="cretivra-1")
    tool_name = Column(String, nullable=True)
    input_data = Column(JSON, default=dict)
    output_data = Column(JSON, default=dict)
    error = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    run = relationship("AgentRunDB", back_populates="tasks")
    subtasks = relationship("AgentTaskDB", backref="parent_task", remote_side=[id])
    steps = relationship("AgentStepDB", back_populates="task", cascade="all, delete-orphan", order_by="AgentStepDB.step_number")

class AgentStepDB(Base):
    __tablename__ = "agent_steps"

    id = Column(String, primary_key=True, default=generate_uuid)
    task_id = Column(String, ForeignKey("agent_tasks.id"), nullable=False, index=True)
    step_number = Column(Integer, default=1)
    step_type = Column(String, default="plan")  # plan, tool_call, observation, verification, thought
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("AgentTaskDB", back_populates="steps")

class ToolRegistryDB(Base):
    __tablename__ = "tool_registry"

    name = Column(String, primary_key=True)  # e.g. web_search, code_executor, file_writer
    description = Column(Text, nullable=False)
    risk_level = Column(String, default="LOW")  # LOW, MEDIUM, HIGH, CRITICAL
    input_schema = Column(JSON, default=dict)
    output_schema = Column(JSON, default=dict)
    timeout_seconds = Column(Integer, default=30)
    requires_approval = Column(Boolean, default=False)
    enabled = Column(Boolean, default=True)

class ToolExecutionDB(Base):
    __tablename__ = "tool_executions"

    id = Column(String, primary_key=True, default=generate_uuid)
    step_id = Column(String, nullable=True)
    run_id = Column(String, ForeignKey("agent_runs.id"), nullable=False, index=True)
    tool_name = Column(String, nullable=False)
    input_payload = Column(JSON, default=dict)
    output_payload = Column(JSON, default=dict)
    error = Column(Text, nullable=True)
    duration_ms = Column(Float, default=0.0)
    status = Column(String, default="success")  # success, failed, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    run = relationship("AgentRunDB", back_populates="executions")

class ToolPermissionDB(Base):
    __tablename__ = "tool_permissions"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    tool_name = Column(String, nullable=False)
    is_allowed = Column(Boolean, default=True)
    auto_approve = Column(Boolean, default=False)

class ArtifactDB(Base):
    __tablename__ = "artifacts"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True, index=True)
    run_id = Column(String, ForeignKey("agent_runs.id"), nullable=True, index=True)
    type = Column(String, nullable=False)  # PDF, PPTX, DOCX, CSV, XLSX, JSON, ZIP, SOURCE_CODE, IMAGE, WEBSITE, REPORT, DASHBOARD
    name = Column(String, nullable=False)
    path = Column(String, nullable=False)
    size = Column(Integer, default=0)
    mime_type = Column(String, default="application/octet-stream")
    download_url = Column(String, nullable=False)
    metadata_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("ProjectDB", back_populates="artifacts")
    run = relationship("AgentRunDB", back_populates="artifacts")

class ApprovalDB(Base):
    __tablename__ = "approvals"

    id = Column(String, primary_key=True, default=generate_uuid)
    run_id = Column(String, ForeignKey("agent_runs.id"), nullable=False, index=True)
    task_id = Column(String, ForeignKey("agent_tasks.id"), nullable=True)
    tool_name = Column(String, nullable=False)
    action_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    payload = Column(JSON, default=dict)
    risk_level = Column(String, default="HIGH")  # HIGH, CRITICAL
    status = Column(String, default="pending")  # pending, approved, denied, modified
    modified_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    responded_at = Column(DateTime, nullable=True)

    run = relationship("AgentRunDB", back_populates="approvals")

class AuditLogDB(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    run_id = Column(String, nullable=True)
    action = Column(String, nullable=False)
    details = Column(JSON, default=dict)
    ip_address = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class KnowledgeSourceDB(Base):
    __tablename__ = "knowledge_sources"

    id = Column(String, primary_key=True, default=generate_uuid)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    source_type = Column(String, default="file")  # file, url, text
    content = Column(Text, nullable=False)
    chunks_count = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("ProjectDB", back_populates="knowledge_sources")

class WorkflowDB(Base):
    __tablename__ = "workflows"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    steps_json = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class WorkflowRunDB(Base):
    __tablename__ = "workflow_runs"

    id = Column(String, primary_key=True, default=generate_uuid)
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=False, index=True)
    run_id = Column(String, ForeignKey("agent_runs.id"), nullable=False, index=True)
    status = Column(String, default="RUNNING")
    created_at = Column(DateTime, default=datetime.utcnow)

