import React, { useEffect, useState } from 'react';
import {
  FolderGit2,
  Plus,
  RotateCw,
  Search,
  FileCode,
  Brain,
  Layers,
  ArrowRight,
  Folder,
} from 'lucide-react';
import { listProjectsApi, createProjectApi } from '../../services/playgroundApi';

interface ProjectSummary {
  id: string;
  name: string;
  description?: string;
  updated_at?: string;
}

interface ProjectsWorkspaceProps {
  onSelectProject?: (id: string) => void;
  onNewTaskWithProject?: (projectId: string) => void;
}

export function ProjectsWorkspace({
  onSelectProject,
  onNewTaskWithProject,
}: ProjectsWorkspaceProps) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const data = await listProjectsApi();
      setProjects(data);
    } catch (e) {
      console.error('Failed to fetch projects:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async () => {
    if (!newName.trim()) return;
    try {
      await createProjectApi({ name: newName.trim(), description: newDesc.trim() });
      setShowCreateModal(false);
      setNewName('');
      setNewDesc('');
      fetchProjects();
    } catch (e) {
      console.error('Failed to create project:', e);
    }
  };

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--background)] text-[var(--foreground)] overflow-hidden p-6 transition-colors duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--foreground)] tracking-tight">Projects</h1>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Maintain sandboxed files, persistent memories, and tool context across tasks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchProjects}
            className="p-2 rounded-lg bg-[var(--surface-secondary)] border border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors asura-btn-interactive"
            title="Refresh projects"
          >
            <RotateCw size={15} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06B6D4] text-black text-xs font-semibold hover:bg-[#06B6D4]/90 transition-colors shadow-sm asura-btn-interactive"
          >
            <Plus size={14} />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm mb-4">
        <Search size={13} className="absolute left-3 top-2.5 text-[var(--muted-foreground)]" />
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-3 py-1.5 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:border-[#06B6D4]/40"
        />
      </div>

      {/* Projects Grid */}
      <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full p-8 text-center text-xs text-[var(--muted-foreground)]">
            Loading projects...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full p-12 text-center text-xs text-[var(--muted-foreground)] rounded-xl border border-dashed border-[var(--border)]">
            No projects created yet. Create a project to give Asura sandboxed file memory.
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelectProject && onSelectProject(p.id)}
              className="p-5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-[#06B6D4]/40 transition-all cursor-pointer flex flex-col justify-between group asura-card-interactive shadow-xs"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-[#06B6D4] mb-3">
                  <FolderGit2 size={18} />
                </div>
                <h3 className="text-sm font-semibold text-[var(--foreground)] group-hover:text-[#06B6D4] transition-colors truncate">
                  {p.name}
                </h3>
                {p.description && (
                  <p className="text-xs text-[var(--muted-foreground)] mt-1 line-clamp-2 leading-relaxed">
                    {p.description}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
                <span>
                  {p.updated_at ? `Updated ${new Date(p.updated_at).toLocaleDateString()}` : 'Active Sandbox'}
                </span>
                <ArrowRight size={13} className="text-[var(--muted-foreground)] group-hover:text-[#06B6D4] transition-colors" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 shadow-2xl animate-scale text-[var(--foreground)]">
            <h2 className="text-base font-semibold text-[var(--foreground)]">Create New Project</h2>
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
              Set up a sandboxed workspace for Asura to build and remember context.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-[11px] font-medium text-[var(--muted-foreground)] uppercase tracking-wider block mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cretivra Marketing Workspace"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-[var(--surface-secondary)] border border-[var(--border)] rounded-xl text-xs text-[var(--foreground)] focus:outline-none focus:border-[#06B6D4]/50"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-[#8891A8] uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  placeholder="Briefly describe the purpose or domain..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-[#151C2E] border border-[#232D45] rounded-xl text-xs text-[#E7EAF4] focus:outline-none focus:border-[#06B6D4]/50 resize-none"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs text-[#8891A8] hover:text-[#E7EAF4] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newName.trim()}
                className="px-4 py-1.5 rounded-lg bg-[#06B6D4] text-[#060911] text-xs font-semibold hover:bg-[#06B6D4]/90 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
