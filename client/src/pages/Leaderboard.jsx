import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import api from "../lib/api";

const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get("/performance/leaderboard").then((res) => setRows(res.data));
  }, []);

  return (
    <Layout title="Leaderboard">
      <div className="card divide-y divide-slate-100">
        {rows.map((r, i) => (
          <div key={r.user._id} className="px-4 py-3 flex items-center gap-3">
            <div className="w-6 text-center font-semibold text-slate-400">{MEDALS[i] || i + 1}</div>
            <Avatar user={r.user} />
            <div className="flex-1">
              <div className="text-sm font-medium">{r.user.name}</div>
              <div className="text-xs text-slate-400">{r.entries} entries logged</div>
            </div>
            <div className="text-lg font-bold text-brand-600">{r.totalPoints}</div>
          </div>
        ))}
        {rows.length === 0 && <div className="px-4 py-10 text-center text-slate-400">No points logged yet</div>}
      </div>
    </Layout>
  );
}
