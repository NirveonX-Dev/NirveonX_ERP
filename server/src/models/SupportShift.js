const mongoose = require("mongoose");
const { Schema } = mongoose;

const SupportShiftSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  date: { type: String, required: true },
  shiftType: { type: String, enum: ["morning", "evening", "night"], default: "morning" },
}, { timestamps: true });

module.exports = mongoose.model("SupportShift", SupportShiftSchema);
