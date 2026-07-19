import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const DEPT_LABELS = {
  appdev: "App Development",
  webdev: "Web Development",
  devops: "DevOps",
  growth: "Growth",
  research: "Research",
  hr: "HR",
};

function KpiCard({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-2xl font-bold text-ink mt-1">{value}</div>
    </div>
  );
}

function SectionHeader({ title, linkTo, linkLabel }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="font-semibold text-sm text-ink">{title}</h2>
      {linkTo && <Link to={linkTo} className="text-xs text-brand-600 hover:underline">{linkLabel}</Link>}
    </div>
  );
}

export default function Dashboard() {
  const { user, canReview } = useAuth();
  const [summary, setSummary] = useState(null);
  const [interns, setInterns] = useState([]);
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    api.get("/dashboard/summary").then((res) => setSummary(res.data));
    if (["hr", "lead", "superadmin"].includes(user?.role)) {
      api.get("/notifications/internships-ending").then((res) => setInterns(res.data));
    }
    api.get("/dashboard/overview").then((res) => setOverview(res.data));
  }, [user, canReview]);

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

      {!canReview && (
        <div className="mt-8 text-sm text-slate-500">
          Use the sidebar to jump into tasks, leaves, chat, and the rest of the ERP.
        </div>
      )}

      {overview && (
        <div className="mt-8 space-y-6">
          {overview.topLeader && (
            <div className="card p-4">
              <SectionHeader title="This week's leader" linkTo="/leaderboard" linkLabel="Full leaderboard" />
              <div className="flex items-center gap-3">
                <span className="text-xl">🏆</span>
                <Avatar user={overview.topLeader.user} size={7} />
                <span className="text-sm font-medium flex-1">{overview.topLeader.user.name}</span>
                <span className="font-mono font-bold text-brand-600">{overview.topLeader.totalPoints} pts</span>
              </div>
            </div>
          )}

          <div className={canReview ? "grid lg:grid-cols-2 gap-6" : ""}>
            {canReview && (
              <div className="card p-4">
                <SectionHeader title="Department load" />
                <div className="space-y-3">
                  {overview.departmentLoad.map((d) => {
                    const pct = d.total ? Math.round((d.done / d.total) * 100) : 0;
                    return (
                      <div key={d.deptKey}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-slate-600">{DEPT_LABELS[d.deptKey] || d.deptKey}</span>
                          <span className="text-slate-400 font-mono">{d.done}/{d.total}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="card p-4">
              <SectionHeader title="Latest on Leadership Line" linkTo="/leadershipline" linkLabel="Open inbox" />
              <div className="space-y-3">
                {overview.latestLeadershipLine.map((m) => (
                  <div key={m._id} className="flex items-start gap-2">
                    <Avatar user={m.userId} size={6} />
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{m.subject}</div>
                      <div className="text-xs text-slate-500 truncate">{m.text}</div>
                    </div>
                  </div>
                ))}
                {overview.latestLeadershipLine.length === 0 && (
                  <div className="text-sm text-slate-400">No messages yet</div>
                )}
              </div>
            </div>
          </div>

          {canReview && (
            <div className="card p-4">
              <SectionHeader title="Pending approvals" linkTo="/approvals" linkLabel="View all" />
              <div className="divide-y divide-slate-100">
                {overview.pendingApprovalsPreview.map((a) => (
                  <div key={`${a.kind}-${a.id}`} className="py-2.5 flex items-center gap-3 text-sm">
                    <Avatar user={a.requestedBy} size={6} />
                    <span className="flex-1 min-w-0 truncate">{a.requestedBy?.name} - <span className="text-slate-500">{a.summary}</span></span>
                    <span className="badge bg-slate-100 text-slate-600 capitalize shrink-0">{a.kind}</span>
                  </div>
                ))}
                {overview.pendingApprovalsPreview.length === 0 && (
                  <div className="py-6 text-center text-sm text-slate-400">Nothing pending</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}