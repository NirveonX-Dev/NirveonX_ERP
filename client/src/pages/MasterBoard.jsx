import { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import TaskDetailPanel from "../components/TaskDetailPanel";
import api from "../lib/api";
import { PROJECTS, PROJECT_COLORS } from "../lib/projects";
import { useAuth } from "../context/AuthContext";

const PRIORITY_BADGE = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};
const STATUS_LABEL = { backlog: "Backlog", todo: "To do", inprogress: "In progress", done: "Done" };

// The Master Board is a POOL of tickets (all Tasks), filtered by project. The
// superadmin multi-selects cards and bulk-assigns; each card has a ↗ button
// that opens the full ticket in the shared right-side detail panel. Assigning
// here writes to the same Task, so it shows up in that person's Tasks kanban.
export default function MasterBoard() {
  // Team leads and above (teamlead/lead/hr/superadmin) can assign + manage the board.
  const { canReview: canAssign } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [project, setProject] = useState("Master App");

  const [selected, setSelected] = useState(new Set());
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignPick, setAssignPick] = useState(new Set()); // user ids to assign
  const [assignMode, setAssignMode] = useState("set"); // set | add
  const [detail, setDetail] = useState(null);

  function load() {
    const q = project === "all" ? "" : `?project=${encodeURIComponent(project)}`;
    api.get(`/tasks${q}`).then((res) => setTasks(res.data));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [project]);
  useEffect(() => { api.get("/users").then((res) => setUsers(res.data)); }, []);

  // assignees array, falling back to the legacy single assigneeId for old tasks.
  const assigneesOf = (t) => (t.assignees && t.assignees.length ? t.assignees : (t.assigneeId ? [t.assigneeId] : []));

  const counts = useMemo(() => {
    const c = {};
    tasks.forEach((t) => { c[t.status] = (c[t.status] || 0) + 1; });
    return c;
  }, [tasks]);

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  const clearSel = () => setSelected(new Set());

  function toggleAssignPick(id) {
    setAssignPick((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function openAssign() {
    setAssignPick(new Set());
    setAssignMode("set");
    setAssignOpen(true);
  }
  async function bulkAssign() {
    await api.post("/tasks/assign", {
      taskIds: [...selected],
      assigneeIds: [...assignPick],
      mode: assignMode,
    });
    setAssignOpen(false);
    clearSel();
    load();
  }

  const refreshDetail = async () => {
    load();
    if (detail) {
      const res = await api.get(`/tasks?project=${encodeURIComponent(project)}`);
      const fresh = res.data.find((t) => t._id === detail._id);
      if (fresh) setDetail(fresh);
    }
  };

  return (
    <Layout title="Master Board">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex flex-wrap gap-1.5">
          <button
            className={`px-3 py-1.5 rounded-md text-sm ${project === "all" ? "bg-ink text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
            onClick={() => setProject("all")}
          >All</button>
          {PROJECTS.map((p) => (
            <button
              key={p}
              className={`px-3 py-1.5 rounded-md text-sm ${project === p ? "bg-ink text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              onClick={() => setProject(p)}
            >{p}</button>
          ))}
        </div>
        <div className="flex-1" />
        {canAssign && selected.size > 0 && (
          <>
            <span className="text-sm text-slate-500">{selected.size} selected</span>
            <button className="btn-secondary" onClick={clearSel}>Clear</button>
            <button className="btn-primary" onClick={openAssign}>Assign…</button>
          </>
        )}
      </div>

      {/* progress strip */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs text-slate-500">
        <span>Total: <strong className="text-ink">{tasks.length}</strong></span>
        {Object.keys(STATUS_LABEL).map((s) => (
          <span key={s}>{STATUS_LABEL[s]}: <strong className="text-ink">{counts[s] || 0}</strong></span>
        ))}
      </div>

      {/* the pool — selectable list of cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {tasks.map((t) => {
          const blockers = (t.dependsOn || []).filter((d) => d.status !== "done");
          return (
            <div key={t._id} className={`card p-4 ${selected.has(t._id) ? "ring-2 ring-brand-500" : ""}`}>
              <div className="flex items-start gap-2">
                {canAssign && (
                  <input type="checkbox" className="mt-1 shrink-0" checked={selected.has(t._id)} onChange={() => toggle(t._id)} />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-400">{t.ticketKey}</span>
                    <span className={`badge ${PROJECT_COLORS[t.project] || "bg-slate-100 text-slate-600"}`}>{t.project}</span>
                  </div>
                  <div className="text-sm font-medium mt-1 leading-snug">{t.title}</div>
                </div>
                <button
                  className="shrink-0 text-slate-400 hover:text-brand-600 text-lg leading-none"
                  title="Open ticket"
                  onClick={() => setDetail(t)}
                >↗</button>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-3">
                <span className={`badge ${PRIORITY_BADGE[t.priority]}`}>{t.priority}</span>
                {t.size && <span className="badge bg-slate-100 text-slate-600 font-mono">{t.size}</span>}
                <span className="badge bg-slate-100 text-slate-600">{STATUS_LABEL[t.status]}</span>
                {(t.tags || []).slice(0, 3).map((tag) => (
                  <span key={tag} className="badge bg-brand-50 text-brand-700">{tag}</span>
                ))}
              </div>

              {blockers.length > 0 && (
                <div className="mt-2 text-[11px] text-red-600">⛔ Blocked by {blockers.map((b) => b.ticketKey).join(", ")}</div>
              )}

              <div className="mt-3 flex items-center gap-2">
                {assigneesOf(t).length > 0 ? (
                  <>
                    <div className="flex -space-x-1">
                      {assigneesOf(t).map((a) => (
                        <div key={a._id} className="ring-2 ring-white rounded-full"><Avatar user={a} size={6} /></div>
                      ))}
                    </div>
                    <span className="text-xs text-slate-500 truncate">
                      {assigneesOf(t).map((a) => a.name).join(", ")}
                    </span>
                  </>
                ) : <span className="text-xs text-slate-400">Unassigned</span>}
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div className="col-span-full text-center text-sm text-slate-400 py-12">No tickets in this project yet.</div>
        )}
      </div>

      {/* bulk assign modal — multi-select */}
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
          <p className="text-xs text-slate-400">
            {assignMode === "set"
              ? "Replace the assignees on the selected tickets with the people you pick (pick none to unassign)."
              : "Add the people you pick to whoever is already on the selected tickets."}
          </p>
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
            <button className="btn-primary" onClick={bulkAssign} disabled={assignMode === "add" && assignPick.size === 0}>
              {assignMode === "set" ? (assignPick.size === 0 ? "Unassign all" : `Set ${assignPick.size}`) : `Add ${assignPick.size}`}
            </button>
          </div>
        </div>
      </Modal>

      {detail && (
        <TaskDetailPanel task={detail} users={users} onClose={() => setDetail(null)} onChange={refreshDetail} />
      )}
    </Layout>
  );
}
