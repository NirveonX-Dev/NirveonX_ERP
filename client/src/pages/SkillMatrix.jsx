import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function SkillMatrix() {
  const { canReview } = useAuth();
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ deptKey: "appdev", skill: "", userId: "", level: 3 });

  function load() {
    api.get("/skillmatrix").then((res) => setRows(res.data));
  }
  useEffect(() => {
    load();
    api.get("/users").then((res) => setUsers(res.data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    await api.post("/skillmatrix", form);
    setOpen(false);
    setForm({ deptKey: "appdev", skill: "", userId: "", level: 3 });
    load();
  }

  const byDept = rows.reduce((acc, r) => {
    (acc[r.deptKey] = acc[r.deptKey] || []).push(r);
    return acc;
  }, {});

  return (
    <Layout title="Skill Matrix">
      {canReview && (
        <div className="flex justify-end mb-4">
          <button className="btn-primary" onClick={() => setOpen(true)}>Add skill rating</button>
        </div>
      )}
      <div className="space-y-6">
        {Object.entries(byDept).map(([dept, items]) => (
          <div key={dept}>
            <h3 className="text-sm font-semibold text-slate-500 uppercase mb-2">{dept}</h3>
            <div className="card divide-y divide-slate-100">
              {items.map((r) => (
                <div key={r._id} className="px-4 py-2.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2"><Avatar user={r.userId} size={6} />{r.userId?.name} &middot; <span className="text-slate-500">{r.skill}</span></div>
                  <div className="text-amber-500">{"★".repeat(r.level)}{"☆".repeat(5 - r.level)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="text-center text-slate-400 py-8">No skill ratings yet</div>}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add skill rating">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Employee</label>
            <select required className="input" value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              <option value="">Select employee</option>
              {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Department</label>
              <input className="input" value={form.deptKey} onChange={(e) => setForm({ ...form, deptKey: e.target.value })} />
            </div>
            <div>
              <label className="label">Skill</label>
              <input required className="input" value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Level (1-5)</label>
            <input type="number" min={1} max={5} className="input" value={form.level} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
