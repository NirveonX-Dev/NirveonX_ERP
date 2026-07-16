import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function ESupport() {
  const { canReview } = useAuth();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: "access", subject: "", description: "" });

  function load() {
    api.get("/esupport").then((res) => setRows(res.data));
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    await api.post("/esupport", form);
    setOpen(false);
    setForm({ category: "access", subject: "", description: "" });
    load();
  }

  async function setStatus(id, status) {
    await api.patch(`/esupport/${id}/status`, { status });
    load();
  }

  return (
    <Layout title="eSupport Query">
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={() => setOpen(true)}>New ticket</button>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r._id} className="card p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <Avatar user={r.userId} size={6} />
                <div>
                  <div className="text-sm font-medium">{r.subject}</div>
                  <div className="text-xs text-slate-400 capitalize">{r.category} &middot; {r.userId?.name}</div>
                </div>
              </div>
              {canReview ? (
                <select className="text-xs border border-slate-200 rounded px-1 py-0.5 h-fit" value={r.status} onChange={(e) => setStatus(r._id, e.target.value)}>
                  <option value="open">Open</option>
                  <option value="inprogress">In progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              ) : <StatusBadge status={r.status} />}
            </div>
            {r.description && <div className="text-sm text-slate-600 mt-2">{r.description}</div>}
          </div>
        ))}
        {rows.length === 0 && <div className="text-center text-slate-400 py-8">No tickets yet</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New eSupport ticket">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="access">Access</option>
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
            </select>
          </div>
          <div>
            <label className="label">Subject</label>
            <input required className="input" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Submit ticket</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
