import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Leaves() {
  const { canReview } = useAuth();
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: "casual", startDate: "", endDate: "", reason: "" });

  function load() {
    api.get("/leaves").then((res) => setRows(res.data));
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    await api.post("/leaves", form);
    setOpen(false);
    setForm({ type: "casual", startDate: "", endDate: "", reason: "" });
    load();
  }

  async function decide(id, status) {
    await api.patch(`/leaves/${id}/decision`, { status });
    load();
  }

  return (
    <Layout title="Leaves">
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={() => setOpen(true)}>Request leave</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Employee</th>
              <th className="text-left px-4 py-2 font-medium">Type</th>
              <th className="text-left px-4 py-2 font-medium">Dates</th>
              <th className="text-left px-4 py-2 font-medium">Reason</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              {canReview && <th className="text-right px-4 py-2 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-t border-slate-100">
                <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar user={r.userId} size={6} />{r.userId?.name}</div></td>
                <td className="px-4 py-2 capitalize">{r.type}</td>
                <td className="px-4 py-2">{r.startDate} to {r.endDate}</td>
                <td className="px-4 py-2 text-slate-500">{r.reason}</td>
                <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                {canReview && (
                  <td className="px-4 py-2 text-right">
                    {r.status === "pending" && (
                      <div className="flex justify-end gap-2">
                        <button className="text-emerald-600 text-xs hover:underline" onClick={() => decide(r._id, "approved")}>Approve</button>
                        <button className="text-red-600 text-xs hover:underline" onClick={() => decide(r._id, "rejected")}>Reject</button>
                      </div>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No leave requests yet</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Request leave">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="casual">Casual</option>
              <option value="sick">Sick</option>
              <option value="annual">Annual</option>
              <option value="unpaid">Unpaid</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Start date</label>
              <input type="date" required className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label">End date</label>
              <input type="date" required className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Reason</label>
            <textarea className="input" rows={2} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Submit request</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
