const mongoose = require("mongoose");
const { Schema } = mongoose;

const SkillMatrixSchema = new Schema({
  deptKey: { type: String, required: true },
  skill: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  level: { type: Number, min: 1, max: 5, default: 3 },
}, { timestamps: true });

module.exports = mongoose.model("SkillMatrix", SkillMatrixSchema);
