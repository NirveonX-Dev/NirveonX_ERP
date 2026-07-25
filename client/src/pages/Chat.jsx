import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import Modal from "../components/Modal";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { useChatUnread } from "../context/ChatUnreadContext";

const CHANNELS = [
  { id: "company", label: "Company forum" },
  { id: "appdev", label: "App Dev" },
  { id: "webdev", label: "Web Dev" },
  { id: "devops", label: "DevOps" },
  { id: "growth", label: "Growth" },
  { id: "research", label: "Research" },
  { id: "hr", label: "HR" },
];

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;
const URL_RE = /^https?:\/\//i;

function formatMessageTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (isToday) return time;
  const isThisYear = d.getFullYear() === now.getFullYear();
  const datePart = d.toLocaleDateString([], { month: "short", day: "numeric", year: isThisYear ? undefined : "numeric" });
  return `${datePart}, ${time}`;
}

// Coarse pointer (touch) devices don't have a convenient Shift key, so on
// those Enter just inserts a newline and people tap Send instead. On
// desktop/laptop, Enter sends and Shift+Enter adds a newline.
const isTouchDevice =
  typeof window !== "undefined" && window.matchMedia?.("(pointer: coarse)").matches;

// Turns *word* into bold and preserves line breaks, without pulling in a full
// markdown library for one symbol.
function renderMessageText(text) {
  return text.split("\n").map((line, li, lines) => {
    const parts = line.split(/(\*[^*\n]+\*)/g).map((part, i) => {
      if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
        return <strong key={i}>{part.slice(1, -1)}</strong>;
      }
      return part;
    });
    return (
      <span key={li}>
        {parts}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

export default function Chat() {
  const { user, canReview } = useAuth();
  const { channels: unreadChannels, dms: unreadDms, markRead } = useChatUnread();
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [channel, setChannel] = useState({ type: "channel", id: "company", label: "Company forum" });
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  // On mobile there isn't room for the channel list and the conversation side
  // by side, so we show one or the other. Desktop always shows both (see
  // lg: classes below) and ignores this.
  const [showChatOnMobile, setShowChatOnMobile] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // New-group modal
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupMemberIds, setNewGroupMemberIds] = useState([]);

  // Manage-members modal for a group the current user created
  const [manageGroup, setManageGroup] = useState(null); // group object or null

  useEffect(() => { api.get("/users").then((res) => setUsers(res.data)); }, []);

  function loadGroups() {
    api.get("/chat/groups").then((res) => setGroups(res.data));
  }
  useEffect(loadGroups, []);

  function load() {
    const params = channel.type === "dm" ? { with: channel.id } : null;
    const url = channel.type === "dm" ? "/chat" : `/chat/${channel.id}`;
    api.get(url, { params }).then((res) => setMessages(res.data));
  }

  // No Socket.io - polls every 4 seconds instead. Simple, and avoids the
  // WebSocket cold-start problem on free hosting tiers.
  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  // Opening a channel/DM clears its unread badge, here and in the sidebar
  useEffect(() => {
    markRead({ type: channel.type, id: channel.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    const body = { text: "" };
    if (URL_RE.test(trimmed) && IMAGE_EXT.test(trimmed)) {
      body.imageUrl = trimmed;
    } else if (URL_RE.test(trimmed)) {
      body.linkUrl = trimmed;
    } else {
      body.text = trimmed;
    }
    if (channel.type === "dm") body.withUserId = channel.id;
    else body.channelId = channel.id;

    await api.post("/chat", body);
    setText("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    load();
  }

  // Enter sends (like most chat apps); Shift+Enter adds a line break. On
  // touch devices there's no convenient Shift key, so Enter just adds a
  // line break there and people tap the Send button instead.
  function handleKeyDown(e) {
    if (e.key !== "Enter" || e.shiftKey || isTouchDevice) return;
    e.preventDefault();
    send(e);
  }

  // Grows the textarea as the person types multi-line messages, capped so it
  // doesn't take over the screen.
  function handleTextChange(e) {
    setText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  async function createGroup(e) {
    e.preventDefault();
    const name = newGroupName.trim();
    if (!name) return;
    const res = await api.post("/chat/groups", { name, memberIds: newGroupMemberIds });
    setGroupModalOpen(false);
    setNewGroupName("");
    setNewGroupMemberIds([]);
    loadGroups();
    setChannel({ type: "channel", id: `group:${res.data._id}`, label: res.data.name });
    setShowChatOnMobile(true);
  }

  function toggleNewGroupMember(id) {
    setNewGroupMemberIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function toggleManageMember(id) {
    if (!manageGroup) return;
    const isMember = manageGroup.members.some((m) => m._id === id);
    const body = isMember ? { remove: [id] } : { add: [id] };
    const res = await api.patch(`/chat/groups/${manageGroup._id}/members`, body);
    setManageGroup(res.data);
    loadGroups();
  }

  async function deleteGroup(group) {
    if (!window.confirm(`Delete "${group.name}" and all its messages? This can't be undone.`)) return;
    await api.delete(`/chat/groups/${group._id}`);
    setManageGroup(null);
    loadGroups();
    if (channel.id === `group:${group._id}`) {
      setChannel({ type: "channel", id: "company", label: "Company forum" });
    }
  }

  return (
    <Layout title="Team Chat">
      <div className="flex gap-4 h-[calc(100vh-9rem)] lg:h-[calc(100vh-8rem)]">
        <div className={`${showChatOnMobile ? "hidden lg:block" : "block"} w-full lg:w-56 shrink-0 space-y-4 overflow-y-auto`}>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase mb-1 px-1">Channels</div>
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                onClick={() => { setChannel({ type: "channel", id: c.id, label: c.label }); setShowChatOnMobile(true); }}
                className={`w-full text-left rounded-md px-3 py-1.5 text-sm flex items-center justify-between ${channel.id === c.id && channel.type === "channel" ? "bg-brand-600 text-white" : "hover:bg-slate-100"}`}
              >
                <span># {c.label}</span>
                {unreadChannels[c.id] > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-accent text-white text-[10px] font-semibold px-1">
                    {unreadChannels[c.id] > 99 ? "99+" : unreadChannels[c.id]}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div>
            <div className="flex items-center justify-between mb-1 px-1">
              <div className="text-xs font-semibold text-slate-400 uppercase">Groups</div>
              {canReview && (
                <button
                  onClick={() => setGroupModalOpen(true)}
                  className="text-xs text-brand-600 hover:underline"
                >
                  + New
                </button>
              )}
            </div>
            {groups.map((g) => {
              const cid = `group:${g._id}`;
              return (
                <button
                  key={g._id}
                  onClick={() => { setChannel({ type: "channel", id: cid, label: g.name }); setShowChatOnMobile(true); }}
                  className={`w-full text-left rounded-md px-3 py-1.5 text-sm flex items-center justify-between ${channel.id === cid && channel.type === "channel" ? "bg-brand-600 text-white" : "hover:bg-slate-100"}`}
                >
                  <span className="truncate"># {g.name}</span>
                  {unreadChannels[cid] > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-accent text-white text-[10px] font-semibold px-1">
                      {unreadChannels[cid] > 99 ? "99+" : unreadChannels[cid]}
                    </span>
                  )}
                </button>
              );
            })}
            {groups.length === 0 && (
              <div className="text-xs text-slate-400 px-3 py-1">
                {canReview ? "No groups yet - create one" : "No groups yet"}
              </div>
            )}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase mb-1 px-1">Direct messages</div>
            {users.filter((u) => u._id !== user._id).map((u) => (
              <button
                key={u._id}
                onClick={() => { setChannel({ type: "dm", id: u._id, label: u.name }); setShowChatOnMobile(true); }}
                className={`w-full text-left rounded-md px-3 py-1.5 text-sm flex items-center justify-between ${channel.id === u._id && channel.type === "dm" ? "bg-brand-600 text-white" : "hover:bg-slate-100"}`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Avatar user={u} size={5} />
                  <span className="min-w-0 truncate">
                    <span className="block truncate">{u.name}</span>
                    {u.title && <span className="block text-xs opacity-60 truncate">{u.title}</span>}
                  </span>
                </span>
                {unreadDms[u._id] > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center min-w-[1.1rem] h-[1.1rem] rounded-full bg-accent text-white text-[10px] font-semibold px-1">
                    {unreadDms[u._id] > 99 ? "99+" : unreadDms[u._id]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className={`${showChatOnMobile ? "flex" : "hidden lg:flex"} flex-1 card flex-col min-w-0`}>
          <div className="px-4 py-3 border-b border-slate-100 font-medium text-sm flex items-center gap-2">
            <button
              onClick={() => setShowChatOnMobile(false)}
              aria-label="Back to channel list"
              className="lg:hidden -ml-1 p-1 text-slate-400 hover:text-slate-700"
            >
              &#8592;
            </button>
            <span className="truncate flex-1">{channel.type === "dm" ? channel.label : `# ${channel.label}`}</span>
            {channel.id?.startsWith("group:") && (() => {
              const g = groups.find((g) => `group:${g._id}` === channel.id);
              return g && g.createdBy?._id === user._id ? (
                <button
                  onClick={() => setManageGroup(g)}
                  className="text-xs text-slate-400 hover:text-brand-600 shrink-0"
                >
                  Manage
                </button>
              ) : null;
            })()}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div key={m._id} className="flex items-start gap-2">
                <Avatar user={m.senderId} size={6} />
                <div>
                  <div className="text-xs text-slate-400">
                    {m.senderId?.name}
                    {m.senderId?.title && <span className="opacity-70"> &middot; {m.senderId.title}</span>}
                    {m.createdAt && (
                      <span className="opacity-60" title={new Date(m.createdAt).toLocaleString()}>
                        {" "}&middot; {formatMessageTime(m.createdAt)}
                      </span>
                    )}
                  </div>
                  {m.text && <div className="text-sm mt-0.5 whitespace-pre-wrap">{renderMessageText(m.text)}</div>}
                  {m.imageUrl && <img src={m.imageUrl} alt="shared" className="mt-1 max-w-xs rounded-md border border-slate-200" />}
                  {m.linkUrl && (
                    <a href={m.linkUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline text-sm break-all mt-0.5 block">
                      {m.linkUrl}
                    </a>
                  )}
                </div>
              </div>
            ))}
            {messages.length === 0 && <div className="text-center text-slate-400 text-sm py-8">No messages yet - say hello</div>}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={send} className="p-3 border-t border-slate-100">
            <div className="flex gap-2 items-end">
              <textarea
                ref={textareaRef}
                className="input resize-none py-2 leading-snug"
                rows={1}
                placeholder="Message, or paste an image/link URL..."
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
              />
              <button type="submit" className="btn-primary">Send</button>
            </div>
            <div className="text-[11px] text-slate-400 mt-1 px-0.5 hidden sm:block">
              *bold* &middot; Shift+Enter for a new line
            </div>
          </form>
        </div>
      </div>

      <Modal
        open={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        title="New group"
        footer={
          <>
            <button type="button" onClick={() => setGroupModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" form="new-group-form" className="btn-primary">Create</button>
          </>
        }
      >
        <form id="new-group-form" onSubmit={createGroup} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink block mb-1">Group name</label>
            <input
              className="input"
              placeholder="e.g. Side project - internal tool"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink block mb-1">Members</label>
            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100">
              {users.filter((u) => u._id !== user._id).map((u) => (
                <label key={u._id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={newGroupMemberIds.includes(u._id)}
                    onChange={() => toggleNewGroupMember(u._id)}
                  />
                  <Avatar user={u} size={5} />
                  <span className="truncate">{u.name}</span>
                </label>
              ))}
            </div>
            <div className="text-xs text-slate-400 mt-1">You're added automatically.</div>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!manageGroup}
        onClose={() => setManageGroup(null)}
        title={manageGroup ? `Manage "${manageGroup.name}"` : ""}
        footer={
          <button type="button" onClick={() => manageGroup && deleteGroup(manageGroup)} className="text-sm text-red-600 hover:underline">
            Delete group
          </button>
        }
      >
        {manageGroup && (
          <div>
            <label className="text-sm font-medium text-ink block mb-1">Members</label>
            <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-md divide-y divide-slate-100">
              {users.filter((u) => u._id !== user._id).map((u) => {
                const isMember = manageGroup.members.some((m) => m._id === u._id);
                return (
                  <label key={u._id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-slate-50">
                    <input type="checkbox" checked={isMember} onChange={() => toggleManageMember(u._id)} />
                    <Avatar user={u} size={5} />
                    <span className="truncate">{u.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </Modal>
    </Layout>
  );
}