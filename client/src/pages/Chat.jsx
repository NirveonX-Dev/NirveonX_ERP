import { useEffect, useRef, useState } from "react";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

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

export default function Chat() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [channel, setChannel] = useState({ type: "channel", id: "company", label: "Company forum" });
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { api.get("/users").then((res) => setUsers(res.data)); }, []);

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
    load();
  }

  return (
    <Layout title="Team Chat">
      <div className="flex gap-4 h-[calc(100vh-8rem)]">
        <div className="w-56 shrink-0 space-y-4 overflow-y-auto">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase mb-1 px-1">Channels</div>
            {CHANNELS.map((c) => (
              <button
                key={c.id}
                onClick={() => setChannel({ type: "channel", id: c.id, label: c.label })}
                className={`w-full text-left rounded-md px-3 py-1.5 text-sm ${channel.id === c.id && channel.type === "channel" ? "bg-brand-600 text-white" : "hover:bg-slate-100"}`}
              >
                # {c.label}
              </button>
            ))}
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase mb-1 px-1">Direct messages</div>
            {users.filter((u) => u._id !== user._id).map((u) => (
              <button
                key={u._id}
                onClick={() => setChannel({ type: "dm", id: u._id, label: u.name })}
                className={`w-full text-left rounded-md px-3 py-1.5 text-sm flex items-center gap-2 ${channel.id === u._id && channel.type === "dm" ? "bg-brand-600 text-white" : "hover:bg-slate-100"}`}
              >
                <Avatar user={u} size={5} /> {u.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 card flex flex-col min-w-0">
          <div className="px-4 py-3 border-b border-slate-100 font-medium text-sm">
            {channel.type === "dm" ? channel.label : `# ${channel.label}`}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m) => (
              <div key={m._id} className="flex items-start gap-2">
                <Avatar user={m.senderId} size={6} />
                <div>
                  <div className="text-xs text-slate-400">{m.senderId?.name}</div>
                  {m.text && <div className="text-sm mt-0.5">{m.text}</div>}
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
          <form onSubmit={send} className="p-3 border-t border-slate-100 flex gap-2">
            <input
              className="input"
              placeholder="Message, or paste an image/link URL..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button type="submit" className="btn-primary">Send</button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
