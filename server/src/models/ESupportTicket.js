const mongoose = require("mongoose");
const { Schema } = mongoose;

const ESupportTicketSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, enum: ["access", "hardware", "software"], default: "access" },
  subject: { type: String, required: true },
  description: { type: String, default: "" },
  status: { type: String, enum: ["open", "inprogress", "resolved"], default: "open" },
}, { timestamps: true });

module.exports = mongoose.model("ESupportTicket", ESupportTicketSchema);
