const mongoose = require("mongoose");
const { Schema } = mongoose;

// Rich ticket for the Master App build-out. Deliberately separate from the
// generic Task model: these need project streams, multiple collaborating
// assignees, cross-ticket dependencies ("blocked by") and an ordered backlog
// that the simple Task schema can't express. Created + assigned by the
// superadmin on the Master Board; everyone else sees them read-only, and each
// intern's assigned tickets are surfaced on their Dashboard home.
const MasterTicketSchema = new Schema({
  // Short human key shown on the card, e.g. "MA-12". Auto-assigned on create
  // (see routes/masterboard.js) so the board reads like a real tracker.
  key: { type: String, unique: true, index: true },

  title: { type: String, required: true, trim: true },
  description: { type: String, default: "" },

  // Acceptance criteria — what "done" means for this ticket. Interns kept
  // asking "is this enough?"; spelling it out per ticket removes the guesswork.
  acceptanceCriteria: { type: String, default: "" },

  // Workstream the ticket belongs to. Starts with the Master mobile-app
  // streams; free-form string so new streams can be added without a migration.
  stream: {
    type: String,
    default: "ux-architecture",
    // ux-architecture | auth | dashboard | product-shell | syllabus |
    // content-ai | payments | profile | notifications | infra | qa
  },

  status: {
    type: String,
    enum: ["backlog", "todo", "inprogress", "review", "done"],
    default: "backlog",
  },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },

  // Multiple assignees — interns collaborate, so a ticket can be shared.
  assignees: [{ type: Schema.Types.ObjectId, ref: "User" }],

  // Other tickets that must be done first. Rendered as "Blocked by" on the
  // card; the board warns before you start a ticket whose blockers aren't done.
  dependsOn: [{ type: Schema.Types.ObjectId, ref: "MasterTicket" }],

  storyPoints: { type: Number, default: null },
  dueDate: { type: String, default: null }, // "YYYY-MM-DD"

  // Manual ordering within a status column (drag-free for now: a number the
  // board sorts by, lower = higher up). New tickets go to the bottom.
  order: { type: Number, default: 0 },

  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("MasterTicket", MasterTicketSchema);
