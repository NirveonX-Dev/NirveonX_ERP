import { useEffect, useState } from "react";
import Avatar from "./Avatar";
import Markdown from "./Markdown";
import api from "../lib/api";
import { PROJECT_COLORS } from "../lib/projects";
import { useAuth } from "../context/AuthContext";

const STATUS_LABEL = { backlog: "Backlog", todo: "To do", inprogress: "In progress", done: "Done" };
const PRIORITY_BADGE = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

// Right-side slide-in panel showing a ticket's full detail. Shared by the Tasks
// kanban and the Master Board. `canAssign` (superadmin) shows the assignee
// picker; everyone can tag a teammate about the ticket (posts a DM).
export default function TaskDetailPanel({ task, users = [], onClose, onChange }) {
  const { isSuperAdmin } = useAuth();
  const [tagUser, setTagUser] = useState("");
  const [tagMsg, setTagMsg] = useState("");
  const [tagDone, setTagDone] = useState(false);

  useEffect(() => {
    function onEsc(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  // reset the tag form whenever a different ticket is opened
  useEffect(() => { setTagUser(""); setTagMsg(""); setTagDone(false); }, [task?._id]);

  if (!task) return null;

  async function setAssignee(assigneeId) {
    await api.put(`/tasks/${task._id}`, { assigneeId: assigneeId || null });
    onChange?.();
  }
  async function setStatus(status) {
    await api.patch(`/tasks/${task._id}/status`, { status });
    onChange?.();
  }
  async function sendTag() {
    if (!tagUser) return;
    await api.post(`/tasks/${task._id}/tag`, { userId: tagUser, message: tagMsg });
    setTagDone(true);
    setTagMsg("");
  }

  const blockers = (task.dependsOn || []).filter((d) => d.status !== "done");

  return (
    <>
      {/* backdrop */}
      <div className="fixed inset-0 z-40 bg-ink/30" onClick={onClose} aria-hidden="true" />
      {/* panel */}
      <aside className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col animate-[slidein_0.18s_ease-out]">
        <style>{`@keyframes slidein{from{transform:translateX(100%)}to{transform:translateX(0)}}`}</style>

        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="min-w-0">
            <div className="text-[11px] font-mono text-slate-400">{task.ticketKey || "—"}</div>
            <h3 className="font-semibold text-ink leading-snug">{task.title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none shrink-0">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* meta chips */}
          <div className="flex flex-wrap gap-1.5">
            <span className={`badge ${PROJECT_COLORS[task.project] || "bg-slate-100 text-slate-600"}`}>{task.project}</span>
            <span className={`badge ${PRIORITY_BADGE[task.priority]}`}>{task.priority}</span>
            {task.size && <span className="badge bg-slate-100 text-slate-600 font-mono">{task.size}</span>}
            <span className="badge bg-slate-100 text-slate-600">{STATUS_LABEL[task.status]}</span>
            {(task.tags || []).map((t) => (
              <span key={t} className="badge bg-brand-50 text-brand-700">{t}</span>
            ))}
          </div>

          {blockers.length > 0 && (
            <div className="text-xs text-red-600">
              ⛔ Blocked by {blockers.map((b) => b.ticketKey || b.title).join(", ")}
            </div>
          )}

          {task.description && <div className="text-sm text-slate-600">{task.description}</div>}

          {/* full body */}
          {task.body ? <Markdown text={task.body} /> : (
            <div className="text-sm text-slate-400 italic">No detailed description.</div>
          )}

          {task.dueDate && <div className="text-xs text-slate-500">Due: {task.dueDate}</div>}

          <hr className="border-slate-100" />

          {/* assignment */}
          <div>
            <label className="label">Assignee</label>
            {isSuperAdmin ? (
              <select className="input" value={task.assigneeId?._id || ""} onChange={(e) => setAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                {task.assigneeId ? <><Avatar user={task.assigneeId} size={7} /><span className="text-sm">{task.assigneeId.name}</span></>
                  : <span className="text-sm text-slate-400">Unassigned</span>}
              </div>
            )}
          </div>

          {/* status (assignee or admin) */}
          <div>
            <label className="label">Status</label>
            <select className="input" value={task.status} onChange={(e) => setStatus(e.target.value)}>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>

          <hr className="border-slate-100" />

          {/* tag + message → DM */}
          <div>
            <label className="label">Tag a teammate about this ticket</label>
            <p className="text-xs text-slate-400 mb-2">Sends them a DM in Team Chat referencing {task.ticketKey || "this ticket"}.</p>
            <select className="input mb-2" value={tagUser} onChange={(e) => { setTagUser(e.target.value); setTagDone(false); }}>
              <option value="">Select a teammate…</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
            <textarea
              className="input mb-2"
              rows={2}
              placeholder="Optional message…"
              value={tagMsg}
              onChange={(e) => setTagMsg(e.target.value)}
            />
            <div className="flex items-center gap-2">
              <button className="btn-primary" onClick={sendTag} disabled={!tagUser}>Send</button>
              {tagDone && <span className="text-xs text-emerald-600">Sent ✓</span>}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
