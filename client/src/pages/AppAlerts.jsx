import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../lib/api";

// App Alerts - operational alerts fired by our apps (Medzzapp, etc.) when
// something breaks: all AI providers down, payment gateway failing, and so on.
// Alerts are de-duplicated server-side (a repeating failure bumps "count"), so
// an outage is one climbing row, not a flood.

const SEV = {
  critical: { dot: "bg-red-500", pill: "bg-red-50 text-red-700", label: "Critical" },
  warning:  { dot: "bg-amber-500", pill: "bg-amber-50 text-amber-700", label: "Warning" },
  info:     { dot: "bg-sky-500", pill: "bg-sky-50 text-sky-700", label: "Info" },
};
const FILTERS = [
  { key: "active", label: "Active" },
  { key: "resolved", label: "Resolved" },
  { key: "all", label: "All" },
];

function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function AppAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    api.get(`/alerts?status=${filter}`)
      .then((res) => { setAlerts(res.data.alerts || []); setActiveCount(res.data.activeCount || 0); })
      .finally(() => setLoading(false));
  }
  useEffect(load, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function resolve(id) {
    await api.post(`/alerts/${id}/resolve`);
    load();
  }
  async function resolveAll() {
    if (!window.confirm("Mark all active alerts as resolved?")) return;
    await api.post("/alerts/resolve-all");
    load();
  }

  return (
    <Layout title="App Alerts">
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1 text-sm rounded-md ${filter === f.key ? "bg-white shadow-sm font-medium" : "text-slate-500"}`}
            >
              {f.label}
              {f.key === "active" && activeCount > 0 && (
                <span className="ml-1.5 text-xs bg-red-500 text-white rounded-full px-1.5">{activeCount}</span>
              )}
            </button>
          ))}
        </div>
        {activeCount > 0 && (
          <button className="btn-secondary text-sm" onClick={resolveAll}>Resolve all</button>
        )}
      </div>

      {loading ? (
        <div className="text-sm text-slate-400 py-8 text-center">Loading…</div>
      ) : alerts.length === 0 ? (
        <div className="card p-8 text-center">
          <div className="text-2xl mb-2">✅</div>
          <div className="text-sm font-medium text-slate-700">
            {filter === "active" ? "No active alerts" : "Nothing here"}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Apps report failures here (e.g. all AI providers down). Quiet is good.
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((a) => {
            const sev = SEV[a.severity] || SEV.warning;
            return (
              <div key={a._id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${sev.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{a.title}</span>
                      <span className={`text-[11px] px-1.5 py-0.5 rounded ${sev.pill}`}>{sev.label}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">{a.app}</span>
                      {a.count > 1 && (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-white">×{a.count}</span>
                      )}
                    </div>
                    {a.message && <div className="text-sm text-slate-600 mt-1">{a.message}</div>}
                    <div className="text-xs text-slate-400 mt-1.5">
                      {a.source && <span>{a.source} · </span>}
                      {a.count > 1 ? `first ${timeAgo(a.firstSeen)}, last ${timeAgo(a.lastSeen)}` : timeAgo(a.lastSeen)}
                      {a.status === "resolved" && <span className="text-emerald-600"> · resolved</span>}
                    </div>
                  </div>
                  {a.status === "active" && (
                    <button className="btn-secondary text-xs shrink-0" onClick={() => resolve(a._id)}>Resolve</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
