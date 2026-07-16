import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Appraisals() {
  const { canReview } = useAuth();
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ userId: "", period: "", rating: 3, feedback: "" });

  function load() {
    api.get("/appraisals").then((res) => setRows(res.data));
  }
  useEffect(() => {
    load();
    api.get("/users").then((res) => setUsers(res.data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    await api.post("/appraisals", form);
    setOpen(false);
    setForm({ userId: "", period: "", rating: 3, feedback: "" });
    load();
  }

  return (
    <Layout title="Appraisals">
      {canReview && (
        <div className="flex justify-end mb-4">
          <button className="btn-primary" onClick={() => setOpen(true)}>New appraisal</button>
        </div>
      )}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r._id} className="card p-4 flex items-start gap-3">
            <Avatar user={r.userId} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div className="font-medium text-sm">{r.userId?.name} &middot; {r.period}</div>
                <div className="text-xs text-amber-600 font-semibold">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
              </div>
              <div className="text-sm text-slate-600 mt-1">{r.feedback}</div>
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-center text-slate-400 py-8">No appraisals yet</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New appraisal">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Employee</label>
            <select required className="input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              <option value="">Select employee</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Period (e.g. 2026-H1)</label>
            <input required className="input" value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
          </div>
          <div>
            <label className="label">Rating (1-5)</label>
            <input type="number" min={1} max={5} className="input" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Feedback</label>
            <textarea className="input" rows={3} value={form.feedback} onChange={(e) => setForm({ ...form, feedback: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save appraisal</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
