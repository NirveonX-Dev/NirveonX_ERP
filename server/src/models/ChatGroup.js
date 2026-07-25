const mongoose = require("mongoose");
const { Schema } = mongoose;

// A user-created group chat (side projects, cross-department teams, etc).
// Distinct from the fixed department channels and DMs - membership is
// explicit and editable by the creator. Chat messages for a group use
// channelId `group:<this _id>`, reusing the existing ChatMessage model.
const ChatGroupSchema = new Schema({
  name: { type: String, required: true, trim: true },
  members: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

module.exports = mongoose.model("ChatGroup", ChatGroupSchema);