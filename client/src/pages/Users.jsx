import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = {
  name: "", username: "", email: "", employeeId: "", contactEmail: "", whatsappNumber: "", dob: "", password: "", role: "staff", deptKey: "appdev",
  title: "", employmentType: "fulltime", internshipEndDate: "",
};

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  const activeUsers = users.filter((u) => !u.isBlocked);
  const blockedUsers = users.filter((u) => u.isBlocked);

  function load() {
    api.get("/users").then((res) => setUsers(res.data));
  }

  useEffect(() => {
    load();
    api.get("/departments").then((res) => setDepts(res.data));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError("");
    setOpen(true);
  }

  function openEdit(u) {
    setEditing(u);
    setForm({ ...u, password: "" });
    setError("");
    setOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const body = { ...form };
      // Blank means "leave as-is" / "not assigned yet" - never send an empty
      // string, since that would collide with every other blank employeeId
      // against the unique index once a second person is also left blank.
      if (!body.employeeId || !body.employeeId.trim()) delete body.employeeId;
      if (editing) {
        if (!body.password) delete body.password;
        await api.put(`/users/${editing._id}`, body);
      } else {
        await api.post("/users", body);
      }
      setOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    }
  }

  async function toggleBlock(u) {
    if (u._id === me._id) return;
    if (!confirm(`${u.isBlocked ? "Unblock" : "Block"} ${u.name}?`)) return;
    await api.patch(`/users/${u._id}/block`, { isBlocked: !u.isBlocked });
    load();
  }

  async function handleDelete(u) {
    if (!confirm(`Delete ${u.name}? This can't be undone.`)) return;
    await api.delete(`/users/${u._id}`);
    load();
  }

  return (
    <Layout title="Users">
      <div className="flex justify-end mb-4">
        <button className="btn-primary" onClick={openCreate}>Add user</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[680px]">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Name</th>
              <th className="text-left px-4 py-2 font-medium">Employee ID</th>
              <th className="text-left px-4 py-2 font-medium">Username</th>
              <th className="text-left px-4 py-2 font-medium">Role</th>
              <th className="text-left px-4 py-2 font-medium">Department</th>
              <th className="text-right px-4 py-2 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeUsers.map((u) => (
              <tr key={u._id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <Avatar user={u} size={7} />
                    <span>{u.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2 text-slate-500">{u.employeeId || <span className="text-slate-300">Not set</span>}</td>
                <td className="px-4 py-2 text-slate-500">{u.username}</td>
                <td className="px-4 py-2 capitalize">{u.role}</td>
                <td className="px-4 py-2">{u.deptKey}</td>
                <td className="px-4 py-2">
                  <div className="flex justify-end gap-2">
                    <button className="text-brand-600 hover:underline text-xs" onClick={() => openEdit(u)}>Edit</button>
                    <button
                      className="text-xs hover:underline text-amber-600"
                      onClick={() => toggleBlock(u)}
                      disabled={u._id === me._id}
                    >
                      Block
                    </button>
                    <button className="text-red-600 hover:underline text-xs" onClick={() => handleDelete(u)} disabled={u._id === me._id}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {activeUsers.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">No active employees</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {blockedUsers.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-slate-500 mb-1">Previously Worked Employees</h2>
          <p className="text-xs text-slate-400 mb-3">Blocked accounts, no longer able to log in to the ERP.</p>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead className="bg-slate-50 text-slate-500 text-xs">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Name</th>
                  <th className="text-left px-4 py-2 font-medium">Employee ID</th>
                  <th className="text-left px-4 py-2 font-medium">Username</th>
                  <th className="text-left px-4 py-2 font-medium">Role</th>
                  <th className="text-left px-4 py-2 font-medium">Department</th>
                  <th className="text-right px-4 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blockedUsers.map((u) => (
                  <tr key={u._id} className="border-t border-slate-100 opacity-70">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <Avatar user={u} size={7} />
                        <span>{u.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-slate-500">{u.employeeId || <span className="text-slate-300">Not set</span>}</td>
                    <td className="px-4 py-2 text-slate-500">{u.username}</td>
                    <td className="px-4 py-2 capitalize">{u.role}</td>
                    <td className="px-4 py-2">{u.deptKey}</td>
                    <td className="px-4 py-2">
                      <div className="flex justify-end gap-2">
                        <button className="text-brand-600 hover:underline text-xs" onClick={() => openEdit(u)}>Edit</button>
                        <button className="text-xs hover:underline text-emerald-600" onClick={() => toggleBlock(u)}>
                          Unblock
                        </button>
                        <button className="text-red-600 hover:underline text-xs" onClick={() => handleDelete(u)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit user" : "Add user"}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <div className="rounded-md bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Full name</label>
              <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Username</label>
              <input className="input" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div>
              <label className="label">Employee ID (optional)</label>
              <input className="input" placeholder="e.g. EMP001" value={form.employeeId || ""} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
            </div>
            <div>
              <label className="label">Email (login)</label>
              <input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="label">Contact email</label>
              <input type="email" className="input" value={form.contactEmail || ""} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
            <div>
              <label className="label">WhatsApp number</label>
              <input type="tel" className="input" placeholder="e.g. +91 98765 43210" value={form.whatsappNumber || ""} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} />
            </div>
            <div>
              <label className="label">Date of birth</label>
              <input type="date" className="input" value={form.dob || ""} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
            </div>
            <div>
              <label className="label">{editing ? "New password (optional)" : "Password"}</label>
              <input type="password" className="input" required={!editing} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div>
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="staff">Staff</option>
                <option value="teamlead">Team Lead</option>
                <option value="hr">HR</option>
                <option value="lead">Leadership</option>
                <option value="superadmin">Super Admin</option>
              </select>
            </div>
            <div>
              <label className="label">Department</label>
              <select className="input" value={form.deptKey} onChange={(e) => setForm({ ...form, deptKey: e.target.value })}>
                {depts.map((d) => <option key={d.key} value={d.key}>{d.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Employment type</label>
              <select className="input" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                <option value="fulltime">Full-time</option>
                <option value="intern">Intern</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
            {form.employmentType === "intern" && (
              <div>
                <label className="label">Internship end date</label>
                <input type="date" className="input" value={form.internshipEndDate || ""} onChange={(e) => setForm({ ...form, internshipEndDate: e.target.value })} />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary">{editing ? "Save changes" : "Create user"}</button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}