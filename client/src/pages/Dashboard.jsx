import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

function KpiCard({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-ink mt-1">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [interns, setInterns] = useState([]);

  useEffect(() => {
    api.get("/dashboard/summary").then((res) => setSummary(res.data));
    if (["hr", "lead"].includes(user?.role)) {
      api.get("/notifications/internships-ending").then((res) => setInterns(res.data));
    }
  }, [user]);

  return (
    <Layout title={`Welcome, ${user?.name?.split(" ")[0]}`}>
      {interns.length > 0 && (
        <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3">
          <strong>{interns.length}</strong> internship{interns.length > 1 ? "s" : ""} ending within 3 days:{" "}
          {interns.map((i) => i.name).join(", ")}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Total employees" value={summary?.totalEmployees ?? "..."} />
        <KpiCard label="Active interns" value={summary?.activeInterns ?? "..."} />
        <KpiCard label="Pending approvals" value={summary?.pendingApprovals ?? "..."} />
        <KpiCard label="Open tickets" value={summary?.openTickets ?? "..."} />
        <KpiCard label="My open tasks" value={summary?.myOpenTasks ?? "..."} />
      </div>
      <div className="mt-8 text-sm text-slate-500">
        Use the sidebar to jump into tasks, leaves, chat, and the rest of the ERP.
      </div>
    </Layout>
  );
}
