const express = require("express");
const PerformanceLog = require("../models/PerformanceLog");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const rows = await PerformanceLog.find()
      .populate("fromUserId", "name avatarColor")
      .populate("toUserId", "name avatarColor")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/", requireRole("hr", "lead", "teamlead", "superadmin"), async (req, res, next) => {
  try {
    const { toUserId, points, note } = req.body;
    if (!toUserId || !points) return res.status(400).json({ error: "toUserId and points required" });

    if (toUserId === req.user._id.toString()) {
      return res.status(400).json({ error: "You can't log points for yourself" });
    }

    const target = await User.findById(toUserId);
    if (!target) return res.status(404).json({ error: "That user was not found" });

    if (target.role === "lead" && req.user.role !== "superadmin") {
      return res.status(403).json({ error: "Only a Super Admin can log points for leadership members" });
    }

    const row = await PerformanceLog.create({ fromUserId: req.user._id, toUserId, points, note });
    await row.populate("fromUserId", "name avatarColor");
    await row.populate("toUserId", "name avatarColor");
    res.status(201).json(row);
  } catch (err) { next(err); }
});

router.get("/leaderboard", async (req, res, next) => {
  try {
    const agg = await PerformanceLog.aggregate([
      { $group: { _id: "$toUserId", totalPoints: { $sum: "$points" }, entries: { $sum: 1 } } },
      { $sort: { totalPoints: -1 } },
    ]);
    const users = await User.find({ _id: { $in: agg.map((a) => a._id) } });
    const userMap = Object.fromEntries(users.map((u) => [u._id.toString(), u.toSafeJSON()]));
    const rows = agg.map((a) => ({
      user: userMap[a._id.toString()],
      totalPoints: a.totalPoints,
      entries: a.entries,
    })).filter((r) => r.user);
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
