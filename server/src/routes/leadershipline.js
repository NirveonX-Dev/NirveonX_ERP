const express = require("express");
const LeadershipMessage = require("../models/LeadershipMessage");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const filter = ["lead", "superadmin"].includes(req.user.role) ? {} : { userId: req.user._id };
    const rows = await LeadershipMessage.find(filter).populate("userId", "name avatarColor deptKey").sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const row = await LeadershipMessage.create({ ...req.body, userId: req.user._id });
    await row.populate("userId", "name avatarColor deptKey");
    res.status(201).json(row);
  } catch (err) { next(err); }
});

router.patch("/:id/reply", requireRole("lead", "superadmin"), async (req, res, next) => {
  try {
    const row = await LeadershipMessage.findByIdAndUpdate(
      req.params.id,
      { reply: req.body.reply, status: "read" },
      { new: true }
    ).populate("userId", "name avatarColor deptKey");
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { next(err); }
});

module.exports = router;
