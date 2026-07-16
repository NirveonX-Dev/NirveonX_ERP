const express = require("express");
const Task = require("../models/Task");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.deptKey) filter.deptKey = req.query.deptKey;
    const tasks = await Task.find(filter).populate("assigneeId", "name avatarColor").sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const task = await Task.create({ ...req.body, createdBy: req.user._id });
    await task.populate("assigneeId", "name avatarColor");
    res.status(201).json(task);
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("assigneeId", "name avatarColor");
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) { next(err); }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
      .populate("assigneeId", "name avatarColor");
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
