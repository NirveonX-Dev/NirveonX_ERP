const mongoose = require("mongoose");
const { Schema } = mongoose;

// An operational alert fired by one of our apps (Medzzapp, Master, …) when
// something breaks that the team should know about — e.g. all AI providers are
// down, or a payment gateway is failing. Shown in the ERP "App Alerts" section.
//
// Alerts are DE-DUPLICATED by `dedupeKey`: a repeating failure bumps `count`
// and `lastSeen` on the existing active alert instead of creating a new row, so
// an outage is one line that climbs, not a flood.
const AppAlertSchema = new Schema({
  app: { type: String, required: true },                 // "medzzapp" | "master" | …
  source: { type: String, default: "" },                 // subsystem, e.g. "ai-gateway"
  severity: { type: String, enum: ["info", "warning", "critical"], default: "warning" },
  title: { type: String, required: true },
  message: { type: String, default: "" },
  dedupeKey: { type: String, required: true, index: true },
  meta: { type: Schema.Types.Mixed, default: {} },       // provider list, status codes, etc.
  count: { type: Number, default: 1 },
  status: { type: String, enum: ["active", "resolved"], default: "active", index: true },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  resolvedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  resolvedAt: { type: Date, default: null },
}, { timestamps: true });

// One ACTIVE alert per dedupeKey. (Resolved ones can accumulate as history.)
AppAlertSchema.index({ dedupeKey: 1, status: 1 });

module.exports = mongoose.model("AppAlert", AppAlertSchema);
