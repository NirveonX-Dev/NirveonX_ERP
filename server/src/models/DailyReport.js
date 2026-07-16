const mongoose = require("mongoose");
const { Schema } = mongoose;

const DailyReportSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },
  hours: { type: Number, default: 8 },
  summary: { type: String, default: "" },
  blockers: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("DailyReport", DailyReportSchema);
