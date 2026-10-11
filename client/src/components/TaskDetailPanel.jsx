import { useEffect, useMemo, useRef, useState } from "react";
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
  // Team leads and above (teamlead/lead/hr/superadmin) can (re)assign from here.
  const { canReview: canAssign } = useAuth();
  const [tagMsg, setTagMsg] = useState("");
  const [tagged, setTagged] = useState([]); // [{_id, name, avatarColor}] resolved from @mentions
  const [tagDone, setTagDone] = useState(false);

  // @mention autocomplete state
  const [mentionQuery, setMentionQuery] = useState(null); // string after @, or null when not mentioning
  const [mentionStart, setMentionStart] = useState(0);
  const [activeIdx, setActiveIdx] = useState(0);
  const taRef = useRef(null);

  useEffect(() => {
    function onEsc(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [onClose]);

  // reset the tag form whenever a different ticket is opened
  useEffect(() => { setTagMsg(""); setTagged([]); setTagDone(false); setMentionQuery(null); }, [task?._id]);

  const suggestions = useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.toLowerCase();
    return users.filter((u) => u.name.toLowerCase().includes(q)).slice(0, 6);
  }, [mentionQuery, users]);

  if (!task) return null;

  // assignees array, falling back to the legacy single assigneeId for old tasks.
  const assigneeList = task.assignees && task.assignees.length
    ? task.assignees
    : (task.assigneeId ? [task.assigneeId] : []);
  const assigneeIdSet = new Set(assigneeList.map((a) => a._id));

  async function toggleAssignee(userId) {
    const ids = new Set(assigneeList.map((a) => a._id));
    ids.has(userId) ? ids.delete(userId) : ids.add(userId);
    await api.put(`/tasks/${task._id}`, { assignees: [...ids] });
    onChange?.();
  }
  async function setStatus(status) {
    await api.patch(`/tasks/${task._id}/status`, { status });
    onChange?.();
  }

  // Detect an in-progress "@word" immediately left of the caret.
  function handleTagChange(e) {
    const val = e.target.value;
    setTagMsg(val);
    setTagDone(false);
    const caret = e.target.selectionStart;
    const upto = val.slice(0, caret);
    const m = upto.match(/@(\w*)$/);
    if (m) { setMentionQuery(m[1]); setMentionStart(caret - m[0].length); setActiveIdx(0); }
    else setMentionQuery(null);
  }

  function pickMention(user) {
    // Replace the "@partial" with "@Full Name " and remember the resolved user.
    const before = tagMsg.slice(0, mentionStart);
    const after = tagMsg.slice(taRef.current?.selectionStart ?? tagMsg.length);
    const inserted = `@${user.name} `;
    setTagMsg(before + inserted + after);
    setMentionQuery(null);
    if (!tagged.some((t) => t._id === user._id)) setTagged([...tagged, user]);
    // restore focus + caret after the inserted mention
    requestAnimationFrame(() => {
      const pos = (before + inserted).length;
      taRef.current?.focus();
      taRef.current?.setSelectionRange(pos, pos);
    });
  }

  function handleTagKeyDown(e) {
    if (mentionQuery === null || suggestions.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => (i + 1) % suggestions.length); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => (i - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); pickMention(suggestions[activeIdx]); }
    else if (e.key === "Escape") { setMentionQuery(null); }
  }

  // Keep `tagged` in sync: only people still @mentioned in the text get the DM.
  const effectiveTagged = tagged.filter((u) => tagMsg.includes(`@${u.name}`));

  async function sendTag() {
    if (effectiveTagged.length === 0) return;
    await api.post(`/tasks/${task._id}/tag`, {
      userIds: effectiveTagged.map((u) => u._id),
      message: tagMsg,
    });
    setTagDone(true);
    setTagMsg("");
    setTagged([]);
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

          {/* assignment (multiple people allowed) */}
          <div>
            <label className="label">Assignees</label>
            {canAssign ? (
              <div className="mt-1 max-h-44 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100">
                {users.map((u) => (
                  <label key={u._id} className="flex items-center gap-2 px-2 py-1.5 cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={assigneeIdSet.has(u._id)} onChange={() => toggleAssignee(u._id)} />
                    <Avatar user={u} size={6} />
                    <span className="text-sm flex-1">{u.name}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {assigneeList.length > 0 ? assigneeList.map((a) => (
                  <span key={a._id} className="flex items-center gap-1.5">
                    <Avatar user={a} size={6} /><span className="text-sm">{a.name}</span>
                  </span>
                )) : <span className="text-sm text-slate-400">Unassigned</span>}
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

          {/* tag + message → DM, with @mention autocomplete */}
          <div>
            <label className="label">Tag teammates about this ticket</label>
            <p className="text-xs text-slate-400 mb-2">
              Type <span className="font-mono">@</span> to mention someone. Each person mentioned gets a DM in Team Chat referencing {task.ticketKey || "this ticket"}.
            </p>
            <div className="relative">
              <textarea
                ref={taRef}
                className="input"
                rows={3}
                placeholder="Write a message… use @ to tag teammates"
                value={tagMsg}
                onChange={handleTagChange}
                onKeyDown={handleTagKeyDown}
              />
              {mentionQuery !== null && suggestions.length > 0 && (
                <div className="absolute z-10 left-2 right-2 mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {suggestions.map((u, i) => (
                    <button
                      key={u._id}
                      type="button"
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm ${i === activeIdx ? "bg-brand-50" : "hover:bg-slate-50"}`}
                      onMouseDown={(e) => { e.preventDefault(); pickMention(u); }}
                      onMouseEnter={() => setActiveIdx(i)}
                    >
                      <Avatar user={u} size={6} />
                      <span className="flex-1">{u.name}</span>
                      <span className="text-xs text-slate-400">{u.title || u.deptKey}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {effectiveTagged.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {effectiveTagged.map((u) => (
                  <span key={u._id} className="badge bg-brand-50 text-brand-700">@{u.name}</span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mt-2">
              <button className="btn-primary" onClick={sendTag} disabled={effectiveTagged.length === 0}>
                Send{effectiveTagged.length > 0 ? ` to ${effectiveTagged.length}` : ""}
              </button>
              {tagDone && <span className="text-xs text-emerald-600">Sent ✓</span>}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
