import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import StatusBadge from "../components/StatusBadge";
import Avatar from "../components/Avatar";
import api from "../lib/api";

export default function Certificates() {
  const [rows, setRows] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", issuer: "", issueDate: "", expiryDate: "", linkUrl: "", status: "valid" });

  function load() {
    api.get("/certificates").then((res) => setRows(res.data));
  }
  useEffect(load, []);

  async function handleCreate(e) {
    e.preventDefault();
    await api.post("/certificates", form);
    setOpen(false);
    setForm({ name: "", issuer: "", issueDate: "", expiryDate: "", linkUrl: "", status: "valid" });
    load();
  }

  async function remove(id) {
    if (!confirm("Delete this certificate?")) return;
    await api.delete(`/certificates/${id}`);
    load();
  }

  return (
    <Layout title="Certificates">
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={() => setOpen(true)}>Add certificate</button>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Employee</th>
              <th className="text-left px-4 py-2 font-medium">Certificate</th>
              <th className="text-left px-4 py-2 font-medium">Issuer</th>
              <th className="text-left px-4 py-2 font-medium">Expiry</th>
              <th className="text-left px-4 py-2 font-medium">Status</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r._id} className="border-t border-slate-100">
                <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar user={r.userId} size={6} />{r.userId?.name}</div></td>
                <td className="px-4 py-2">
                  {r.linkUrl ? <a className="text-brand-600 hover:underline" href={r.linkUrl} target="_blank" rel="noreferrer">{r.name}</a> : r.name}
                </td>
                <td className="px-4 py-2 text-slate-500">{r.issuer}</td>
                <td className="px-4 py-2 text-slate-500">{r.expiryDate || "-"}</td>
                <td className="px-4 py-2"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-2 text-right">
                  <button className="text-red-600 text-xs hover:underline" onClick={() => remove(r._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No certificates yet</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add certificate">
        <form onSubmit={handleCreate} className="space-y-3">
          <div>
            <label className="label">Certificate name</label>
            <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="label">Issuer</label>
            <input className="input" value={form.issuer} onChange={(e) => setForm({ ...form, issuer: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Issue date</label>
              <input type="date" required className="input" value={form.issueDate} onChange={(e) => setForm({ ...form, issueDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Expiry date</label>
              <input type="date" className="input" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Link (optional)</label>
            <input className="input" placeholder="https://..." value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">Add certificate</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}
