import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import api from "../lib/api";

function today() { return new Date().toISOString().slice(0, 10); }

export default function Reports() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ date: today(), hours: 8, summary: "", blockers: "" });

  function load() {
    api.get("/reports").then((res) => setRows(res.data));
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    await api.post("/reports", form);
    setOpen(false);
    setForm({ date: today(), hours: 8, summary: "", blockers: "" });
    load();
  }

  return (
    <Layout title="Daily Reports">
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={() => setOpen(true)}>Submit report</button>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r._id} className="card p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar user={r.userId} size={6} />
                <div className="text-sm font-medium">{r.userId?.name}</div>
              </div>
              <div className="text-xs text-slate-400">{r.date} &middot; {r.hours}h</div>
            </div>
            <div className="text-sm text-slate-600 mt-2">{r.summary}</div>
            {r.blockers && <div className="text-sm text-red-500 mt-1">Blockers: {r.blockers}</div>}
          </div>
        ))}
        {rows.length === 0 && <div className="text-center text-slate-400 py-8">No reports submitted yet</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Submit daily report">
        <form onSubmit={handleCreate} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input type="date" required className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Hours worked</label>
              <input type="number" min={0} max={24} className="input" value={form.hours} onChange={(e) => setForm({ ...form, hours: Number(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="label">Summary</label>
            <textarea required className="input" rows={3} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
          </div>
          <div>
            <label className="label">Blockers (optional)</label>
            <textarea className="input" rows={2} value={form.blockers} onChange={(e) => setForm({ ...form, blockers: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Submit</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
