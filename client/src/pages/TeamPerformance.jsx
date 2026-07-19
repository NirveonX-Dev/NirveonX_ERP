import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function TeamPerformance() {
  const { user, isSuperAdmin } = useAuth();
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ toUserId: "", points: 5, note: "" });
  const [error, setError] = useState("");

  function load() {
    api.get("/performance").then((res) => setRows(res.data));
  }
  useEffect(() => {
    load();
    api.get("/users").then((res) => setUsers(res.data));
  }, []);

  // Nobody can log points for themselves. And only a Super Admin can log
  // points for leadership members - everyone else only sees non-leadership
  // teammates in this list.
  const eligibleUsers = users.filter((u) => {
    if (u._id === user._id) return false;
    if (u.role === "lead" && !isSuperAdmin) return false;
    return true;
  });

  function openModal() {
    setError("");
    setForm({ toUserId: "", points: 5, note: "" });
    setOpen(true);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/performance", form);
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't log points");
    }
  }

  return (
    <Layout title="Team Performance">
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={openModal}>Log points</button>
      </div>
      <div className="card divide-y divide-slate-100">
        {rows.map((r) => (
          <div key={r._id} className="px-4 py-2.5 flex items-center gap-3 text-sm">
            <Avatar user={r.toUserId} size={6} />
            <div className="flex-1">
              <span className="font-medium">{r.toUserId?.name}</span>
              <span className="text-slate-400"> from {r.fromUserId?.name}</span>
              {r.note && <span className="text-slate-500"> - {r.note}</span>}
            </div>
            <div className="font-semibold text-brand-600">+{r.points}</div>
            <div className="text-xs text-slate-400 w-20 text-right">{r.date}</div>
          </div>
        ))}
        {rows.length === 0 && <div className="px-4 py-10 text-center text-slate-400">No performance points logged yet</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Log performance points">
        <form onSubmit={handleCreate} className="space-y-3">
          {error && <div className="rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}
          <div>
            <label className="label">Teammate</label>
            <select required className="input" value={form.toUserId} onChange={(e) => setForm({ ...form, toUserId: e.target.value })}>
              <option value="">Select teammate</option>
              {eligibleUsers.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
            {!isSuperAdmin && (
              <p className="text-xs text-slate-400 mt-1">Only a Super Admin can log points for leadership members.</p>
            )}
          </div>
          <div>
            <label className="label">Points (1-10)</label>
            <input type="number" min={1} max={10} className="input" value={form.points} onChange={(e) => setForm({ ...form, points: Number(e.target.value) })} />
          </div>
          <div>
            <label className="label">Note (optional)</label>
            <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Log points</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
