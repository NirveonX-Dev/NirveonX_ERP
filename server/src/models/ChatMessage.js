const mongoose = require("mongoose");
const { Schema } = mongoose;

// channelId: "company" | deptKey | "dm:<smallerId>_<largerId>"
// No video attachments by design. imageUrl points to an externally hosted image
// (e.g. Cloudinary). linkUrl is a plain shared link, rendered as a clickable URL.
const ChatMessageSchema = new Schema({
  channelId: { type: String, required: true },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, default: "" },
  imageUrl: { type: String, default: null },
  linkUrl: { type: String, default: null },
}, { timestamps: true });

ChatMessageSchema.index({ channelId: 1, createdAt: 1 });

module.exports = mongoose.model("ChatMessage", ChatMessageSchema);
