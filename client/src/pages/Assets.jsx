import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function Assets() {
  const { canReview } = useAuth();
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "hardware", assignedTo: "", accessLink: "", status: "assigned" });

  function load() {
    api.get("/assets").then((res) => setRows(res.data));
  }
  useEffect(() => {
    load();
    api.get("/users").then((res) => setUsers(res.data));
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    const path = canReview ? "/assets" : "/assets/request";
    const body = canReview ? form : { name: form.name, type: form.type, accessLink: form.accessLink };
    await api.post(path, body);
    setOpen(false);
    setForm({ name: "", type: "hardware", assignedTo: "", accessLink: "", status: "assigned" });
    load();
  }

  async function updateStatus(id, status) {
    await api.put(`/assets/${id}`, { status });
    load();
  }

  return (
    <Layout title="Assets">
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={() => setOpen(true)}>{canReview ? "Add asset" : "Request asset"}</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Asset</th>
              <th className="text-left px-4 py-2 font-medium">Type</th>
              <th className="text-left px-4 py-2 font-medium">Assigned to</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              {canReview && <th className="text-right px-4 py-2 font-medium">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  {r.accessLink ? <a className="text-brand-600 hover:underline" href={r.accessLink} target="_blank" rel="noreferrer">{r.name}</a> : r.name}
                </td>
                <td className="px-4 py-2 capitalize">{r.type}</td>
                <td className="px-4 py-2">{r.assignedTo ? <div className="flex items-center gap-2"><Avatar user={r.assignedTo} size={6} />{r.assignedTo.name}</div> : "-"}</td>
                <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                {canReview && (
                  <td className="px-4 py-2 text-right">
                    {r.status === "requested" && (
                      <button className="text-emerald-600 text-xs hover:underline" onClick={() => updateStatus(r._id, "assigned")}>Approve</button>
                    )}
                    {r.status === "assigned" && (
                      <button className="text-slate-500 text-xs hover:underline ml-2" onClick={() => updateStatus(r._id, "returned")}>Mark returned</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400">No assets recorded</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={canReview ? "Add asset" : "Request asset"}>
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Asset name</label>
            <input required className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="hardware">Hardware</option>
              <option value="software">Software</option>
              <option value="license">License</option>
              <option value="access">Access</option>
            </select>
          </div>
          {canReview && (
            <div>
              <label className="label">Assign to</label>
              <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Access link (optional)</label>
            <input className="input" placeholder="https://..." value={form.accessLink} onChange={(e) => setForm({ ...form, accessLink: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{canReview ? "Add asset" : "Send request"}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
