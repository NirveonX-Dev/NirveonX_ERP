const mongoose = require("mongoose");
const { Schema } = mongoose;

// Tracks, per user per channel/DM, when they last opened/read that conversation.
// Unread counts are computed on the fly by comparing message timestamps against
// this value - no per-message "read" flags to maintain.
const ChatReadStateSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  channelId: { type: String, required: true },
  lastReadAt: { type: Date, default: () => new Date(0) },
}, { timestamps: true });

ChatReadStateSchema.index({ userId: 1, channelId: 1 }, { unique: true });

module.exports = mongoose.model("ChatReadState", ChatReadStateSchema);