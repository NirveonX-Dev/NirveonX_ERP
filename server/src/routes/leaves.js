const express = require("express");
const Leave = require("../models/Leave");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const filter = ["hr", "lead", "teamlead"].includes(req.user.role) ? {} : { userId: req.user._id };
    const leaves = await Leave.find(filter).populate("userId", "name avatarColor deptKey").sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const leave = await Leave.create({ ...req.body, userId: req.user._id });
    await leave.populate("userId", "name avatarColor deptKey");
    res.status(201).json(leave);
  } catch (err) { next(err); }
});

router.patch("/:id/decision", requireRole("hr", "lead", "teamlead"), async (req, res, next) => {
  try {
    const { status } = req.body; // approved | rejected
    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status, decidedBy: req.user._id },
      { new: true }
    ).populate("userId", "name avatarColor deptKey");
    if (!leave) return res.status(404).json({ error: "Leave request not found" });
    res.json(leave);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ error: "Not found" });
    const isOwner = leave.userId.toString() === req.user._id.toString();
    if (!isOwner && !["hr", "lead"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not allowed" });
    }
    await leave.deleteOne();
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
