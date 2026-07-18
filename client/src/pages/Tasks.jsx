import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import api from "../lib/api";

const COLUMNS = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To do" },
  { key: "inprogress", label: "In progress" },
  { key: "done", label: "Done" },
];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", deptKey: "appdev", assigneeId: "", priority: "medium", dueDate: "" });

  function load() {
    api.get("/tasks").then((res) => setTasks(res.data));
  }

  useEffect(() => {
    load();
    api.get("/users").then((res) => setUsers(res.data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const body = { ...form };
    if (!body.assigneeId) delete body.assigneeId;
    await api.post("/tasks", body);
    setOpen(false);
    setForm({ title: "", description: "", deptKey: "appdev", assigneeId: "", priority: "medium", dueDate: "" });
    load();
  }

  async function moveTask(task, status) {
    await api.patch(`/tasks/${task._id}/status`, { status });
    load();
  }

  async function removeTask(id) {
    if (!confirm("Delete this task?")) return;
    await api.delete(`/tasks/${id}`);
    load();
  }

  return (
    <Layout title="Tasks">
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={() => setOpen(true)}>New task</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="bg-slate-100 rounded-xl p-3">
            <div className="text-xs font-semibold text-slate-500 uppercase mb-3 px-1">{col.label}</div>
            <div className="space-y-2">
              {tasks.filter((t) => t.status === col.key).map((t) => (
                <div key={t._id} className="card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-sm font-medium">{t.title}</div>
                    <span className={`badge shrink-0 ${t.priority === "high" ? "bg-red-50 text-red-700" : t.priority === "medium" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                      {t.priority}
                    </span>
                  </div>
                  {t.description && <div className="text-xs text-slate-500 mt-1">{t.description}</div>}
                  <div className="flex items-center justify-between mt-3">
                    {t.assigneeId ? <Avatar user={t.assigneeId} size={6} /> : <span className="text-xs text-slate-400">Unassigned</span>}
                    <div className="flex gap-1">
                      <select
                        className="text-xs border border-slate-200 rounded px-1 py-0.5"
                        value={t.status}
                        onChange={(e) => moveTask(t, e.target.value)}
                      >
                        {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                      </select>
                      <button className="text-xs text-red-500" onClick={() => removeTask(t._id)}>&times;</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New task">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Assignee</label>
              <select className="input" value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.deptKey} onChange={(e) => setForm({ ...form, deptKey: e.target.value })} />
            </div>
            <div>
              <label className="label">Due date</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Create task</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}