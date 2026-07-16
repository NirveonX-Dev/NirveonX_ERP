const mongoose = require("mongoose");
const { Schema } = mongoose;

const LeadershipMessageSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, required: true },
  text: { type: String, required: true },
  status: { type: String, enum: ["unread", "read"], default: "unread" },
  reply: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model("LeadershipMessage", LeadershipMessageSchema);
