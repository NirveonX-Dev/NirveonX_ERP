const COLORS = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  open: "bg-amber-50 text-amber-700",
  inprogress: "bg-sky-50 text-sky-700",
  investigating: "bg-sky-50 text-sky-700",
  resolved: "bg-emerald-50 text-emerald-700",
  todo: "bg-slate-100 text-slate-600",
  backlog: "bg-slate-100 text-slate-500",
  done: "bg-emerald-50 text-emerald-700",
  valid: "bg-emerald-50 text-emerald-700",
  expiring: "bg-amber-50 text-amber-700",
  expired: "bg-red-50 text-red-700",
  requested: "bg-amber-50 text-amber-700",
  assigned: "bg-emerald-50 text-emerald-700",
  returned: "bg-slate-100 text-slate-500",
  unread: "bg-amber-50 text-amber-700",
  read: "bg-slate-100 text-slate-500",
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-slate-100 text-slate-600",
  critical: "bg-red-100 text-red-800",
};

export default function StatusBadge({ status }) {
  const cls = COLORS[status] || "bg-slate-100 text-slate-600";
  return <span className={`badge ${cls}`}>{status}</span>;
}
