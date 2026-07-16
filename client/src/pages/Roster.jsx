import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";

const DAYS = [["mon", "Mon"], ["tue", "Tue"], ["wed", "Wed"], ["thu", "Thu"], ["fri", "Fri"], ["sat", "Sat"], ["sun", "Sun"]];
const OPTIONS = ["office", "wfh", "oncall", "leave", "off"];
const COLORS = { office: "bg-emerald-100 text-emerald-700", wfh: "bg-sky-100 text-sky-700", oncall: "bg-purple-100 text-purple-700", leave: "bg-amber-100 text-amber-700", off: "bg-slate-100 text-slate-500" };

function mondayOf(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff)).toISOString().slice(0, 10);
}

export default function Roster() {
  const { canReview } = useAuth();
  const [weekStart, setWeekStart] = useState(mondayOf(new Date()));
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);

  function load() {
    api.get("/roster", { params: { weekStart } }).then((res) => setRows(res.data));
  }
  useEffect(load, [weekStart]);
  useEffect(() => { api.get("/users").then((res) => setUsers(res.data)); }, []);

  async function setDay(userId, dayKey, value) {
    const existing = rows.find((r) => r.userId._id === userId);
    const days = existing ? { ...existing.days } : { mon: "office", tue: "office", wed: "office", thu: "office", fri: "office", sat: "off", sun: "off" };
    days[dayKey] = value;
    await api.put("/roster", { userId, weekStart, days });
    load();
  }

  function dayValue(userId, dayKey) {
    const existing = rows.find((r) => r.userId._id === userId);
    return existing?.days?.[dayKey] || "office";
  }

  return (
    <Layout title="Roster">
      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-slate-500">Week of</label>
        <input type="date" className="input w-auto" value={weekStart} onChange={(e) => setWeekStart(mondayOf(e.target.value))} />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[700px]">
          <thead className="bg-slate-50 text-slate-500 text-xs">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Employee</th>
              {DAYS.map(([k, l]) => <th key={k} className="text-center px-2 py-2 font-medium">{l}</th>)}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className="border-t border-slate-100">
                <td className="px-4 py-2"><div className="flex items-center gap-2"><Avatar user={u} size={6} />{u.name}</div></td>
                {DAYS.map(([k]) => (
                  <td key={k} className="px-1 py-2 text-center">
                    {canReview ? (
                      <select
                        className={`text-xs rounded px-1 py-0.5 border-0 ${COLORS[dayValue(u._id, k)]}`}
                        value={dayValue(u._id, k)}
                        onChange={(e) => setDay(u._id, k, e.target.value)}
                      >
                        {OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : (
                      <span className={`badge ${COLORS[dayValue(u._id, k)]}`}>{dayValue(u._id, k)}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
