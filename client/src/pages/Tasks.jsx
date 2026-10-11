import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import TaskDetailPanel from "../components/TaskDetailPanel";
import api from "../lib/api";
import { PROJECTS, PROJECT_COLORS } from "../lib/projects";

const COLUMNS = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To do" },
  { key: "inprogress", label: "In progress" },
  { key: "done", label: "Done" },
];
const PRIORITY_BADGE = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

const EMPTY_FORM = {
  title: "", description: "", body: "", project: "Other", deptKey: "appdev",
  assigneeId: "", priority: "medium", size: "", tags: "", dueDate: "", dependsOn: [],
};

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [detail, setDetail] = useState(null);

  function load() { api.get("/tasks").then((res) => setTasks(res.data)); }
  useEffect(() => { load(); api.get("/users").then((res) => setUsers(res.data)); }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const body = {
      ...form,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      dueDate: form.dueDate || null,
      // The form picks a single assignee for convenience; store it as the
      // assignees array (the source of truth). Add more via the board/detail panel.
      assignees: form.assigneeId ? [form.assigneeId] : [],
    };
    delete body.assigneeId;
    await api.post("/tasks", body);
    setOpen(false);
    setForm(EMPTY_FORM);
    load();
  }

  async function moveTask(task, status) {
    await api.patch(`/tasks/${task._id}/status`, { status });
    load();
  }

  const refreshDetail = async () => {
    load();
    if (detail) {
      const res = await api.get("/tasks");
      const fresh = res.data.find((t) => t._id === detail._id);
      if (fresh) setDetail(fresh);
    }
  };

  return (
    <Layout title="Tasks">
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={() => { setForm(EMPTY_FORM); setOpen(true); }}>New task</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="bg-slate-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">{col.label}</span>
              <span className="text-xs text-slate-400 font-mono">{tasks.filter((t) => t.status === col.key).length}</span>
            </div>
            <div className="space-y-2">
              {tasks.filter((t) => t.status === col.key).map((t) => {
                const blockers = (t.dependsOn || []).filter((d) => d.status !== "done");
                return (
                  <div key={t._id} className="card p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">{t.ticketKey}</span>
                      </div>
                      <button
                        className="shrink-0 text-slate-400 hover:text-brand-600 text-base leading-none"
                        title="Open ticket"
                        onClick={() => setDetail(t)}
                      >↗</button>
                    </div>

                    <button className="text-sm font-medium mt-1 text-left hover:text-brand-600 w-full leading-snug" onClick={() => setDetail(t)}>
                      {t.title}
                    </button>

                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      <span className={`badge ${PROJECT_COLORS[t.project] || "bg-slate-100 text-slate-600"}`}>{t.project}</span>
                      <span className={`badge ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span>
                      {t.size && <span className="badge bg-slate-100 text-slate-600 font-mono">{t.size}</span>}
                      {(t.tags || []).slice(0, 2).map((tag) => (
                        <span key={tag} className="badge bg-brand-50 text-brand-700">{tag}</span>
                      ))}
                    </div>

                    {blockers.length > 0 && (
                      <div className="mt-2 text-[11px] text-red-600">⛔ {blockers.map((b) => b.ticketKey).join(", ")}</div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      {(() => {
                        const list = t.assignees && t.assignees.length ? t.assignees : (t.assigneeId ? [t.assigneeId] : []);
                        return list.length > 0 ? (
                          <div className="flex -space-x-1">
                            {list.map((a) => (
                              <div key={a._id} className="ring-2 ring-white rounded-full"><Avatar user={a} size={6} /></div>
                            ))}
                          </div>
                        ) : <span className="text-xs text-slate-400">Unassigned</span>;
                      })()}
                      <select
                        className="text-xs border border-slate-200 rounded px-1 py-0.5"
                        value={t.status}
                        onChange={(e) => moveTask(t, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New task" maxWidth="max-w-2xl">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Short summary (one line)</label>
            <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Full ticket (markdown — WHAT &amp; WHY, ACCEPTANCE CRITERIA, …)</label>
            <textarea className="input font-mono text-xs" rows={8} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder={"## WHAT & WHY\n...\n\n## ACCEPTANCE CRITERIA\n- [ ] ...\n\n## HOW TO TEST\n..."} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Project</label>
              <select className="input" value={form.project} onChange={(e) => setForm({ ...form, project: e.target.value })}>
                {PROJECTS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Size</label>
              <select className="input" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}>
                <option value="">—</option>
                {["XS", "S", "M", "L", "XL"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Due date</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.deptKey} onChange={(e) => setForm({ ...form, deptKey: e.target.value })} />
            </div>
            <div>
              <label className="label">Assignee</label>
              <select className="input" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Tags (comma separated)</label>
            <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="full-stack, urgent" />
          </div>
          <div>
            <label className="label">Blocked by (dependencies)</label>
            <select multiple className="input h-20" value={form.dependsOn}
              onChange={(e) => setForm({ ...form, dependsOn: [...e.target.selectedOptions].map((o) => o.value) })}>
              {tasks.map((t) => <option key={t._id} value={t._id}>{t.ticketKey} — {t.title}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create task</button>
          </div>
        </form>
      </Modal>

      {detail && (
        <TaskDetailPanel task={detail} users={users} onClose={() => setDetail(null)} onChange={refreshDetail} />
      )}
    </Layout>
  );
}
