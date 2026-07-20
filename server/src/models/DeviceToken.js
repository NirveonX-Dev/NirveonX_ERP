const mongoose = require("mongoose");
const { Schema } = mongoose;

// One document per (user, browser/device). A user can have several - e.g. a
// phone browser and a laptop browser both register their own token, and both
// get notified.
const DeviceTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  userAgent: { type: String, default: "" },
}, { timestamps: true });

DeviceTokenSchema.index({ userId: 1 });

module.exports = mongoose.model("DeviceToken", DeviceTokenSchema);
