import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const EMPTY_FORM = {
  name: "",
  username: "",
  email: "",
  contactEmail: "",
  whatsappNumber: "",
  dob: "",
  password: "",
  role: "staff",
  deptKey: "appdev",
  title: "",
  employmentType: "fulltime",
  internshipEndDate: "",
};

const DEPT_LABELS = {
  appdev: "App Development",
  webdev: "Web Development",
  devops: "DevOps",
  growth: "Growth",
  research: "Research",
  hr: "HR",
  leadership: "Leadership",
};

const STATUS_CLASSES = {
  Active: "bg-emerald-50 text-emerald-700",
  "On Leave": "bg-amber-50 text-amber-700",
  Inactive: "bg-red-50 text-red-700",
};

function formatRole(role) {
  if (!role) return "Employee";
  return role
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getEmployeeStatus(user) {
  if (user?.isBlocked) return "Inactive";
  if (user?.employmentType === "intern") return "On Leave";
  return "Active";
}

function getEmployeeId(user, index) {
  const rawId = user?.employeeId || user?.employee_id || user?.id || user?._id;
  if (typeof rawId === "string") {
    const val = rawId.toUpperCase();
    if (val.startsWith("EMP")) return val;
  }
  return `EMP${String(index + 1).padStart(3, "0")}`;
}

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [designationFilter, setDesignationFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const deptMap = useMemo(
    () =>
      Object.fromEntries(
        [...depts, { key: "leadership", name: "Leadership" }].map((d) => [d.key, d.name])
      ),
    [depts]
  );

  const designationOptions = useMemo(
    () =>
      [...new Set(users.map((u) => (u.title || formatRole(u.role)).trim()).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
      ),
    [users]
  );

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
      if (editing) {
        const body = { ...form };
        if (!body.password) delete body.password;
        await api.put(`/users/${editing._id}`, body);
      } else {
        await api.post("/users", form);
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

  const filteredUsers = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return users.filter((u, index) => {
      const status = getEmployeeStatus(u);
      const designation = u.title || formatRole(u.role);
      const deptName = deptMap[u.deptKey] || DEPT_LABELS[u.deptKey] || u.deptKey || "";
      const employeeId = getEmployeeId(u, index);
      const searchTarget = [
        u.name,
        u.email,
        u.contactEmail,
        u.username,
        employeeId,
        deptName,
        designation,
        u.role,
        u.whatsappNumber,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchTarget.includes(query);
      const matchesDepartment = deptFilter === "all" || u.deptKey === deptFilter;
      const matchesDesignation = designationFilter === "all" || designation === designationFilter;
      const matchesStatus = statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesDepartment && matchesDesignation && matchesStatus;
    });
  }, [users, searchTerm, deptFilter, designationFilter, statusFilter, deptMap]);

  return (
    <Layout title="Employees">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-ink">Employees</h2>
            <p className="text-sm text-slate-500 mt-1">Manage and view all employees</p>
          </div>
          <button className="btn-primary" onClick={openCreate}>Add employee</button>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <circle cx="8.5" cy="8.5" r="5.25" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M13 13L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search employees by name, email, department..."
                className="input pl-10"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <select className="input" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                <option value="all">Department</option>
                {Object.entries(deptMap).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              <select className="input" value={designationFilter} onChange={(e) => setDesignationFilter(e.target.value)}>
                <option value="all">Designation</option>
                {designationOptions.map((label) => (
                  <option key={label} value={label}>{label}</option>
                ))}
              </select>

              <select className="input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Employment Status</option>
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="card px-6 py-12 text-center">
            <div className="text-xl font-semibold text-ink">No employees found</div>
            <p className="mt-2 text-sm text-slate-500">Try searching with a different name, email, department, or employee ID.</p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((u, index) => {
              const deptLabel = deptMap[u.deptKey] || DEPT_LABELS[u.deptKey] || u.deptKey || "Unassigned";
              const designation = u.title || formatRole(u.role);
              const status = getEmployeeStatus(u);
              const employeeId = getEmployeeId(u, index);

              return (
                <div key={u._id} className="card p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar user={u} size={8} />
                      <div className="min-w-0">
                        <div className="font-semibold text-ink truncate">{u.name}</div>
                        <div className="text-sm text-slate-500 truncate">{designation}</div>
                      </div>
                    </div>
                    <span className={`badge ${STATUS_CLASSES[status] || STATUS_CLASSES.Active}`}>{status}</span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-600">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Department</span>
                      <span className="font-medium text-ink text-right">{deptLabel}</span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-slate-500">Employee ID</span>
                      <span className="font-medium text-ink">{employeeId}</span>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 shrink-0">Email</span>
                      <a href={`mailto:${u.email}`} className="text-brand-600 hover:underline break-all">{u.email}</a>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 shrink-0">Phone</span>
                      <span className="break-all">{u.whatsappNumber || u.phone || "Not provided"}</span>
                    </div>

                    {(u.location || u.homeAddress || u.internProfile?.homeAddress) && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500 shrink-0">Location</span>
                        <span className="break-all">{u.location || u.homeAddress || u.internProfile?.homeAddress}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-2 pt-3 border-t border-slate-100">
                    <Link to={`/users/${u._id}`} className="btn-secondary flex-1 justify-center text-xs">View Profile</Link>
                    {me && ["hr", "lead", "superadmin"].includes(me.role) && (
                      <>
                        <button className="text-brand-600 hover:underline text-xs" onClick={() => openEdit(u)}>Edit</button>
                        <button
                          className="text-amber-600 hover:underline text-xs"
                          onClick={() => toggleBlock(u)}
                          disabled={u._id === me._id}
                        >
                          {u.isBlocked ? "Unblock" : "Block"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? "Edit employee" : "Add employee"}>
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
