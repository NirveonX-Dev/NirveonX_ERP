import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Support247() {
  const { canReview } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", product: "", severity: "medium" });

  function load() {
    api.get("/support247/incidents").then((res) => setIncidents(res.data));
    api.get("/support247/shifts").then((res) => setShifts(res.data));
  }
  useEffect(() => {
    load();
    api.get("/users").then((res) => setUsers(res.data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    await api.post("/support247/incidents", form);
    setOpen(false);
    setForm({ title: "", product: "", severity: "medium" });
    load();
  }

  async function setStatus(id, status) {
    await api.patch(`/support247/incidents/${id}/status`, { status });
    load();
  }

  return (
    <Layout title="Support 24x7">
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm">Product incidents</h2>
            <button className="btn-primary text-xs" onClick={() => setOpen(true)}>Report incident</button>
          </div>
          <div className="space-y-2">
            {incidents.map((i) => (
              <div key={i._id} className="card p-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">{i.title}</div>
                  <span className={`badge ${i.severity === "critical" ? "bg-red-100 text-red-800" : i.severity === "high" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>
                    {i.severity}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">{i.product}</div>
                <div className="mt-2">
                  {canReview ? (
                    <select className="text-xs border border-slate-200 rounded px-1 py-0.5" value={i.status} onChange={(e) => setStatus(i._id, e.target.value)}>
                      <option value="open">Open</option>
                      <option value="investigating">Investigating</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  ) : <StatusBadge status={i.status} />}
                </div>
              </div>
            ))}
            {incidents.length === 0 && <div className="text-slate-400 text-sm">No incidents reported</div>}
          </div>
        </div>

        <div>
          <h2 className="font-semibold text-sm mb-3">Shift coverage</h2>
          <div className="card divide-y divide-slate-100">
            {shifts.map((s) => (
              <div key={s._id} className="px-4 py-2 flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><Avatar user={s.userId} size={6} />{s.userId?.name}</div>
                <div className="text-slate-500">{s.date} &middot; <span className="capitalize">{s.shiftType}</span></div>
              </div>
            ))}
            {shifts.length === 0 && <div className="px-4 py-6 text-slate-400 text-sm text-center">No shifts scheduled</div>}
          </div>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Report incident">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Product</label>
            <input className="input" value={form.product} onChange={(e) => setForm({ ...form, product: e.target.value })} />
          </div>
          <div>
            <label className="label">Severity</label>
            <select className="input" value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Report</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
