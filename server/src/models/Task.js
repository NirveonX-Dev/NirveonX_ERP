const mongoose = require("mongoose");
const { Schema } = mongoose;

// Tasks are the single source of truth for all work — the Tasks kanban and the
// Master Board are two views over the SAME records. The Master Board filters by
// `project` and is where the superadmin pools + assigns tickets; once assigned,
// the task shows up in the assignee's Tasks kanban automatically (same doc).
//
// The extra fields below (ticketKey, project, tags, size, body, dependsOn) let
// a task carry a full descriptive ticket (WHAT & WHY / ACCEPTANCE CRITERIA /
// HOW TO TEST / …) instead of just a one-line title.

// Keep in sync with PROJECTS in client/src/lib/projects.js
const PROJECTS = ["Master App", "Master Web App", "Medzzapp Mobile", "ERP", "Other"];

const TaskSchema = new Schema({
  // Short human key shown on the card, e.g. "V-54". Auto-assigned on create.
  ticketKey: { type: String, unique: true, sparse: true, index: true },

  title: { type: String, required: true },
  description: { type: String, default: "" }, // short one-liner (kept for back-compat)

  // Full ticket body as markdown (WHAT & WHY, WHERE THIS FITS, WHAT TO BUILD,
  // ACCEPTANCE CRITERIA, HOW TO TEST, OUT OF SCOPE, …). Rendered in the detail panel.
  body: { type: String, default: "" },

  // Which product/project this ticket belongs to — drives the Master Board filter.
  project: { type: String, enum: PROJECTS, default: "Other" },

  deptKey: { type: String, required: true }, // who (department) — distinct from project (what)

  // Free-form labels like "full-stack", "urgent", "S". Rendered as chips.
  tags: [{ type: String }],

  // Rough effort size (XS/S/M/L/XL) — optional, shown on the card.
  size: { type: String, enum: ["XS", "S", "M", "L", "XL", ""], default: "" },

  assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },

  // Other tasks that must be done first ("depends on V-53").
  dependsOn: [{ type: Schema.Types.ObjectId, ref: "Task" }],

  status: { type: String, enum: ["backlog", "todo", "inprogress", "done"], default: "todo" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  dueDate: { type: String, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const Task = mongoose.model("Task", TaskSchema);
Task.PROJECTS = PROJECTS;
module.exports = Task;
