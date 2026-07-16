const mongoose = require("mongoose");
const { Schema } = mongoose;

const PerformanceLogSchema = new Schema({
  fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  points: { type: Number, min: 1, max: 10, required: true },
  note: { type: String, default: "" },
  date: { type: String, default: () => new Date().toISOString().slice(0, 10) },
}, { timestamps: true });

module.exports = mongoose.model("PerformanceLog", PerformanceLogSchema);
