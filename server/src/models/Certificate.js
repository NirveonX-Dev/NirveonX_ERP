const mongoose = require("mongoose");
const { Schema } = mongoose;

const CertificateSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  issuer: { type: String, default: "" },
  issueDate: { type: String, required: true },
  expiryDate: { type: String, default: null },
  linkUrl: { type: String, default: "" },
  status: { type: String, enum: ["valid", "expiring", "expired"], default: "valid" },
}, { timestamps: true });

module.exports = mongoose.model("Certificate", CertificateSchema);
