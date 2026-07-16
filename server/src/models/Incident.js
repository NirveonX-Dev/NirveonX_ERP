const mongoose = require("mongoose");
const { Schema } = mongoose;

const IncidentSchema = new Schema({
  title: { type: String, required: true },
  product: { type: String, default: "" },
  severity: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
  status: { type: String, enum: ["open", "investigating", "resolved"], default: "open" },
  reportedBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Incident", IncidentSchema);
