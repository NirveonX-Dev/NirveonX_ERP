import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import api from "../lib/api";

const DEPT_LABELS = {
  appdev: "App Development",
  webdev: "Web Development",
  devops: "DevOps",
  growth: "Growth",
  research: "Research",
  hr: "HR",
  leadership: "Leadership",
};

function formatRole(role) {
  if (!role) return "Employee";
  return role
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function getEmployeeStatus(user) {
  if (!user) return "Inactive";
  if (user.isBlocked) return "Inactive";
  if (user.employmentType === "intern") return "On Leave";
  return "Active";
}

export default function EmployeeProfile() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;
    api
      .get(`/users/${id}`)
      .then((res) => {
        if (!ignore) setUser(res.data);
      })
      .catch(() => {
        if (!ignore) setUser(null);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  const department = useMemo(
    () => DEPT_LABELS[user?.deptKey] || user?.deptKey || "Unassigned",
    [user]
  );

  if (loading) {
    return (
      <Layout title="Employee profile">
        <div className="card p-8 text-center text-sm text-slate-500">Loading employee profile...</div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout title="Employee profile">
        <div className="card p-8 text-center">
          <div className="text-xl font-semibold text-ink">Employee not found</div>
          <p className="mt-2 text-sm text-slate-500">The selected employee could not be loaded.</p>
          <Link to="/users" className="btn-primary mt-4 inline-flex">Back to Employees</Link>
        </div>
      </Layout>
    );
  }

  const status = getEmployeeStatus(user);

  return (
    <Layout title="Employee profile">
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Link to="/users" className="text-sm text-brand-600 hover:underline">← Back to Employees</Link>
          </div>
        </div>

        <div className="card p-5 sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar user={user} size={12} />
              <div>
                <h2 className="text-2xl font-semibold text-ink">{user.name}</h2>
                <p className="text-sm text-slate-500">{user.title || formatRole(user.role)}</p>
              </div>
            </div>
            <span className={`badge ${status === "Active" ? "bg-emerald-50 text-emerald-700" : status === "On Leave" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
              {status}
            </span>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Employee Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Employee ID</span>
                <span className="font-medium text-ink">{user.employeeId || "EMP-000"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Department</span>
                <span className="font-medium text-ink">{department}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Designation</span>
                <span className="font-medium text-ink">{user.title || formatRole(user.role)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Role</span>
                <span className="font-medium text-ink capitalize">{formatRole(user.role)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Employment Type</span>
                <span className="font-medium text-ink capitalize">{user.employmentType || "Full-time"}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-4">Contact Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Email</span>
                <a href={`mailto:${user.email}`} className="font-medium text-brand-600 break-all">{user.email}</a>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Phone</span>
                <span className="font-medium text-ink">{user.whatsappNumber || user.phone || "Not provided"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Location</span>
                <span className="font-medium text-ink">{user.location || user.homeAddress || user.internProfile?.homeAddress || "Not provided"}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Username</span>
                <span className="font-medium text-ink">{user.username}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
