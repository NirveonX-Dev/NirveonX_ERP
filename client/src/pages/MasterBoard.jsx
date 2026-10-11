import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const COLUMNS = [
  { key: "backlog", label: "Backlog" },
  { key: "todo", label: "To do" },
  { key: "inprogress", label: "In progress" },
  { key: "review", label: "Review" },
  { key: "done", label: "Done" },
];

const STREAMS = [
  { key: "ux-architecture", label: "UX & Architecture" },
  { key: "auth", label: "Auth" },
  { key: "dashboard", label: "Dashboard" },
  { key: "product-shell", label: "Product Shell" },
  { key: "syllabus", label: "Syllabus" },
  { key: "content-ai", label: "Content / AI" },
  { key: "payments", label: "Payments" },
  { key: "profile", label: "Profile" },
  { key: "notifications", label: "Notifications" },
  { key: "infra", label: "Infra" },
  { key: "qa", label: "QA" },
];
const streamLabel = (k) => STREAMS.find((s) => s.key === k)?.label || k;

const PRIORITY_BADGE = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

const EMPTY_FORM = {
  title: "", description: "", acceptanceCriteria: "",
  stream: "ux-architecture", status: "backlog", priority: "medium",
  storyPoints: "", dueDate: "", assignees: [], dependsOn: [],
};

export default function MasterBoard() {
  const { isSuperAdmin, user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [streamFilter, setStreamFilter] = useState("all");

  // create / edit modal
  const [editing, setEditing] = useState(null); // ticket being edited, or null
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // multi-select + bulk assign
  const [selected, setSelected] = useState(new Set());
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPick, setAssignPick] = useState(new Set());
  const [assignMode, setAssignMode] = useState("set");

  function load() {
    const q = streamFilter !== "all" ? `?stream=${streamFilter}` : "";
    api.get(`/masterboard${q}`).then((res) => setTickets(res.data));
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [streamFilter]);
  useEffect(() => { api.get("/users").then((res) => setUsers(res.data)); }, []);

  const byStatus = useMemo(() => {
    const map = Object.fromEntries(COLUMNS.map((c) => [c.key, []]));
    tickets.forEach((t) => { (map[t.status] || map.backlog).push(t); });
    return map;
  }, [tickets]);

  // ── selection ──
  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  const clearSelection = () => setSelected(new Set());

  // ── create / edit ──
  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  }
  function openEdit(t) {
    setEditing(t);
    setForm({
      title: t.title, description: t.description || "", acceptanceCriteria: t.acceptanceCriteria || "",
      stream: t.stream, status: t.status, priority: t.priority,
      storyPoints: t.storyPoints ?? "", dueDate: t.dueDate || "",
      assignees: (t.assignees || []).map((a) => a._id),
      dependsOn: (t.dependsOn || []).map((d) => d._id),
    });
    setOpen(true);
  }
  async function handleSave(e) {
    e.preventDefault();
    const body = {
      ...form,
      storyPoints: form.storyPoints === "" ? null : Number(form.storyPoints),
      dueDate: form.dueDate || null,
    };
    if (editing) await api.put(`/masterboard/${editing._id}`, body);
    else await api.post("/masterboard", body);
    setOpen(false);
    load();
  }
  async function removeTicket(id) {
    if (!confirm("Delete this ticket?")) return;
    await api.delete(`/masterboard/${id}`);
    setOpen(false);
    load();
  }
  async function moveTicket(t, status) {
    await api.patch(`/masterboard/${t._id}/status`, { status });
    load();
  }

  // ── bulk assign ──
  function openAssign() {
    setAssignPick(new Set());
    setAssignMode("set");
    setAssignOpen(true);
  }
  function toggleAssignPick(id) {
    setAssignPick((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  async function handleBulkAssign() {
    await api.post("/masterboard/assign", {
      ticketIds: [...selected],
      assignees: [...assignPick],
      mode: assignMode,
    });
    setAssignOpen(false);
    clearSelection();
    load();
  }

  const isMine = (t) => (t.assignees || []).some((a) => a._id === user?._id);

  return (
    <Layout title="Master Board">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select className="input w-auto" value={streamFilter} onChange={(e) => setStreamFilter(e.target.value)}>
          <option value="all">All streams</option>
          {STREAMS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <div className="flex-1" />
        {isSuperAdmin && selected.size > 0 && (
          <>
            <span className="text-sm text-slate-500">{selected.size} selected</span>
            <button className="btn-secondary" onClick={clearSelection}>Clear</button>
            <button className="btn-primary" onClick={openAssign}>Assign…</button>
          </>
        )}
        {isSuperAdmin && selected.size === 0 && (
          <button className="btn-primary" onClick={openCreate}>New ticket</button>
        )}
      </div>

      {!isSuperAdmin && (
        <div className="mb-4 text-xs text-slate-500">
          View only — tickets assigned to you are highlighted. You can move your own tickets across columns.
        </div>
      )}

      {/* board */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {COLUMNS.map((col) => (
          <div key={col.key} className="bg-slate-100 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">{col.label}</span>
              <span className="text-xs text-slate-400 font-mono">{byStatus[col.key].length}</span>
            </div>
            <div className="space-y-2">
              {byStatus[col.key].map((t) => {
                const mine = isMine(t);
                const blockers = (t.dependsOn || []).filter((d) => d.status !== "done");
                return (
                  <div
                    key={t._id}
                    className={`card p-3 ${selected.has(t._id) ? "ring-2 ring-brand-500" : ""} ${mine ? "border-l-4 border-l-brand-500" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {isSuperAdmin && (
                          <input
                            type="checkbox"
                            className="mt-0.5 shrink-0"
                            checked={selected.has(t._id)}
                            onChange={() => toggleSelect(t._id)}
                          />
                        )}
                        <span className="text-[11px] font-mono text-slate-400 shrink-0">{t.key}</span>
                      </div>
                      <span className={`badge shrink-0 ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span>
                    </div>

                    <button
                      className="text-sm font-medium mt-1 text-left hover:text-brand-600 w-full"
                      onClick={() => (isSuperAdmin ? openEdit(t) : null)}
                    >
                      {t.title}
                    </button>

                    <div className="flex flex-wrap items-center gap-1 mt-2">
                      <span className="badge bg-brand-50 text-brand-700">{streamLabel(t.stream)}</span>
                      {t.storyPoints != null && (
                        <span className="badge bg-slate-100 text-slate-600 font-mono">{t.storyPoints} pt</span>
                      )}
                    </div>

                    {blockers.length > 0 && (
                      <div className="mt-2 text-[11px] text-red-600">
                        ⛔ Blocked by {blockers.map((b) => b.key).join(", ")}
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-3">
                      <div className="flex -space-x-1">
                        {(t.assignees || []).length === 0 && <span className="text-xs text-slate-400">Unassigned</span>}
                        {(t.assignees || []).map((a) => (
                          <div key={a._id} className="ring-2 ring-white rounded-full"><Avatar user={a} size={6} /></div>
                        ))}
                      </div>
                      {(isSuperAdmin || mine) && (
                        <select
                          className="text-xs border border-slate-200 rounded px-1 py-0.5"
                          value={t.status}
                          onChange={(e) => moveTicket(t, e.target.value)}
                        >
                          {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                        </select>
                      )}
                    </div>
                  </div>
                );
              })}
              {byStatus[col.key].length === 0 && (
                <div className="text-center text-xs text-slate-400 py-6">—</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* create / edit modal (superadmin) */}
      <Modal open={open} onClose={() => setOpen(false)} title={editing ? `Edit ${editing.key}` : "New ticket"} maxWidth="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Acceptance criteria (what "done" means)</label>
            <textarea className="input" rows={2} value={form.acceptanceCriteria} onChange={(e) => setForm({ ...form, acceptanceCriteria: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="label">Stream</label>
              <select className="input" value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })}>
                {STREAMS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {COLUMNS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
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
              <label className="label">Points</label>
              <input type="number" min="0" className="input" value={form.storyPoints} onChange={(e) => setForm({ ...form, storyPoints: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Due date</label>
              <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Assignees</label>
              <select
                multiple
                className="input h-24"
                value={form.assignees}
                onChange={(e) => setForm({ ...form, assignees: [...e.target.selectedOptions].map((o) => o.value) })}
              >
                {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Blocked by (dependencies)</label>
            <select
              multiple
              className="input h-20"
              value={form.dependsOn}
              onChange={(e) => setForm({ ...form, dependsOn: [...e.target.selectedOptions].map((o) => o.value) })}
            >
              {tickets.filter((t) => t._id !== editing?._id).map((t) => (
                <option key={t._id} value={t._id}>{t.key} — {t.title}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-between items-center pt-2">
            {editing ? (
              <button type="button" className="text-sm text-red-500" onClick={() => removeTicket(editing._id)}>Delete</button>
            ) : <span />}
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
              <button type="submit" className="btn-primary">{editing ? "Save" : "Create"}</button>
            </div>
          </div>
        </form>
      </Modal>

      {/* bulk assign modal */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} title={`Assign ${selected.size} ticket${selected.size > 1 ? "s" : ""}`}>
        <div className="space-y-3">
          <div className="flex gap-2 text-sm">
            <button
              className={`px-3 py-1 rounded ${assignMode === "set" ? "bg-brand-600 text-white" : "bg-slate-100"}`}
              onClick={() => setAssignMode("set")}
            >Replace</button>
            <button
              className={`px-3 py-1 rounded ${assignMode === "add" ? "bg-brand-600 text-white" : "bg-slate-100"}`}
              onClick={() => setAssignMode("add")}
            >Add to existing</button>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
            {users.map((u) => (
              <label key={u._id} className="flex items-center gap-3 py-2 cursor-pointer">
                <input type="checkbox" checked={assignPick.has(u._id)} onChange={() => toggleAssignPick(u._id)} />
                <Avatar user={u} size={7} />
                <span className="text-sm flex-1">{u.name}</span>
                <span className="text-xs text-slate-400">{u.title || u.deptKey}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button className="btn-secondary" onClick={() => setAssignOpen(false)}>Cancel</button>
            <button className="btn-primary" onClick={handleBulkAssign} disabled={assignMode === "set" ? false : assignPick.size === 0}>
              {assignMode === "set" ? "Set assignees" : "Add assignees"}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
