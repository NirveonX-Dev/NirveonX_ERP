const mongoose = require("mongoose");
const { Schema } = mongoose;

const AppraisalSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  period: { type: String, required: true }, // e.g. "2026-H1"
  rating: { type: Number, min: 1, max: 5, default: 3 },
  feedback: { type: String, default: "" },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
}, { timestamps: true });

module.exports = mongoose.model("Appraisal", AppraisalSchema);
