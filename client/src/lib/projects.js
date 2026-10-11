// Mirror of the PROJECTS enum in server/src/models/Task.js — the hardcoded
// product list the Master Board filters by. Add a project here AND in the
// model enum to introduce a new one.
export const PROJECTS = ["Master App", "Master Web App", "Medzzapp Mobile", "ERP", "Other"];

export const PROJECT_COLORS = {
  "Master App": "bg-brand-50 text-brand-700",
  "Master Web App": "bg-indigo-50 text-indigo-700",
  "Medzzapp Mobile": "bg-emerald-50 text-emerald-700",
  ERP: "bg-amber-50 text-amber-700",
  Other: "bg-slate-100 text-slate-600",
};
