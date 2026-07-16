const mongoose = require("mongoose");
const { Schema } = mongoose;

// One document per user per week. days keyed mon..sun with values office|wfh|oncall|leave|off
const RosterSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  weekStart: { type: String, required: true }, // ISO date of Monday
  days: {
    mon: { type: String, default: "office" },
    tue: { type: String, default: "office" },
    wed: { type: String, default: "office" },
    thu: { type: String, default: "office" },
    fri: { type: String, default: "office" },
    sat: { type: String, default: "off" },
    sun: { type: String, default: "off" },
  },
}, { timestamps: true });

RosterSchema.index({ userId: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model("Roster", RosterSchema);
