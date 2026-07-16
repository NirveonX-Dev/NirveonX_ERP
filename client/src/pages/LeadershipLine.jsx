import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function LeadershipLine() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", text: "" });
  const [replyDrafts, setReplyDrafts] = useState({});

  function load() {
    api.get("/leadershipline").then((res) => setRows(res.data));
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    await api.post("/leadershipline", form);
    setOpen(false);
    setForm({ subject: "", text: "" });
    load();
  }

  async function sendReply(id) {
    const reply = replyDrafts[id];
    if (!reply) return;
    await api.patch(`/leadershipline/${id}/reply`, { reply });
    setReplyDrafts({ ...replyDrafts, [id]: "" });
    load();
  }

  return (
    <Layout title="Leadership Line">
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={() => setOpen(true)}>Message leadership</button>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r._id} className="card p-4">
            <div className="flex items-center gap-2">
              <Avatar user={r.userId} size={6} />
              <div className="text-sm font-medium">{r.userId?.name}</div>
              <span className="text-xs text-slate-400">&middot; {r.subject}</span>
            </div>
            <div className="text-sm text-slate-600 mt-2">{r.text}</div>
            {r.reply && (
              <div className="mt-3 bg-brand-50 rounded-md p-3 text-sm text-brand-700">
                <strong>Leadership:</strong> {r.reply}
              </div>
            )}
            {!r.reply && user?.role === "lead" && (
              <div className="mt-3 flex gap-2">
                <input
                  className="input"
                  placeholder="Write a reply..."
                  value={replyDrafts[r._id] || ""}
                  onChange={(e) => setReplyDrafts({ ...replyDrafts, [r._id]: e.target.value })}
                />
                <button className="btn-secondary text-xs" onClick={() => sendReply(r._id)}>Send</button>
              </div>
            )}
          </div>
        ))}
        {rows.length === 0 && <div className="text-center text-slate-400 py-8">No messages yet</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Message leadership">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Subject</label>
            <input required className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea required className="input" rows={4} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Send</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
