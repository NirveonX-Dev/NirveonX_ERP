const mongoose = require("mongoose");
const { Schema } = mongoose;

const LeaveSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, enum: ["sick", "casual", "annual", "unpaid", "other"], default: "casual" },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  reason: { type: String, default: "" },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  decidedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

module.exports = mongoose.model("Leave", LeaveSchema);
