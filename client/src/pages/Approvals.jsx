import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import Avatar from "../components/Avatar";
import api from "../lib/api";

export default function Approvals() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get("/approvals").then((res) => setRows(res.data));
  }, []);

  return (
    <Layout title="Approvals">
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={`${r.kind}-${r.id}`} className="card p-4 flex items-center gap-3">
            <Avatar user={r.requestedBy} />
            <div className="flex-1">
              <div className="text-sm font-medium">{r.requestedBy?.name}</div>
              <div className="text-sm text-slate-500">{r.summary}</div>
            </div>
            <span className="badge bg-slate-100 text-slate-600 capitalize">{r.kind}</span>
          </div>
        ))}
        {rows.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            Nothing pending. Approve or reject requests from the Leaves and Assets pages directly.
          </div>
        )}
      </div>
    </Layout>
  );
}
