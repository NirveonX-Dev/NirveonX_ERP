const mongoose = require("mongoose");
const { Schema } = mongoose;

const TaskSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  deptKey: { type: String, required: true },
  assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  status: { type: String, enum: ["backlog", "todo", "inprogress", "done"], default: "todo" },
  priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  dueDate: { type: String, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Task", TaskSchema);
