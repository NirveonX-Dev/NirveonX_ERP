const mongoose = require("mongoose");
const { Schema } = mongoose;

const AssetSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["hardware", "software", "license", "access"], default: "hardware" },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", default: null },
  accessLink: { type: String, default: "" },
  status: { type: String, enum: ["requested", "assigned", "returned"], default: "assigned" },
  assignedDate: { type: String, default: () => new Date().toISOString().slice(0, 10) },
}, { timestamps: true });

module.exports = mongoose.model("Asset", AssetSchema);
