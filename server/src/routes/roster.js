const express = require("express");
const Roster = require("../models/Roster");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.weekStart) filter.weekStart = req.query.weekStart;
    const rows = await Roster.find(filter).populate("userId", "name avatarColor deptKey");
    // If a user was deleted without their roster rows being cleaned up (old
    // data from before this was fixed), populate() resolves userId to null.
    // Drop those instead of sending them to the client, where nothing
    // upstream expects a null user and would crash on render.
    res.json(rows.filter((r) => r.userId));
  } catch (err) { next(err); }
});

router.put("/", requireRole("hr", "lead", "teamlead", "superadmin"), async (req, res, next) => {
  try {
    const { userId, weekStart, days } = req.body;
    const row = await Roster.findOneAndUpdate(
      { userId, weekStart },
      { userId, weekStart, days },
      { new: true, upsert: true, runValidators: true }
    ).populate("userId", "name avatarColor deptKey");
    res.json(row);
  } catch (err) { next(err); }
});

module.exports = router;