const mongoose = require("mongoose");
const { Schema } = mongoose;

// One document per user per week. days keyed mon..sun with values office|wfh|oncall|leave|off
const RosterSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  weekStart: { type: String, required: true }, // ISO date of Monday
  days: {
    mon: { type: String, default: "wfh" },
    tue: { type: String, default: "wfh" },
    wed: { type: String, default: "wfh" },
    thu: { type: String, default: "wfh" },
    fri: { type: String, default: "wfh" },
    sat: { type: String, default: "off" },
    sun: { type: String, default: "off" },
  },
}, { timestamps: true });

RosterSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model("Roster", RosterSchema);