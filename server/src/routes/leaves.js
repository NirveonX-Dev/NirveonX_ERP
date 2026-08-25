const express = require("express");
const Leave = require("../models/Leave");
const Roster = require("../models/Roster");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Monday-start week, matching the convention used in Roster.jsx - returns "YYYY-MM-DD"
function mondayOf(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff)).toISOString().slice(0, 10);
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

// Every calendar date from startDate to endDate inclusive, as "YYYY-MM-DD" strings
function eachDate(startDate, endDate) {
  const dates = [];
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// Marks (or un-marks) every day of an approved leave as "leave" on that
// person's Roster. Un-marking only clears a day if it's still "leave" - if a
// team lead manually changed it to something else in the meantime, that
// manual edit is left alone instead of being clobbered.
async function syncRosterForLeave(leave, markAsLeave) {
  for (const dateStr of eachDate(leave.startDate, leave.endDate)) {
    const weekStart = mondayOf(dateStr);
    const dayKey = DAY_KEYS[new Date(dateStr).getDay()];
    if (markAsLeave) {
      await Roster.findOneAndUpdate(
        { userId: leave.userId, weekStart },
        { $set: { [`days.${dayKey}`]: "leave" } },
        { upsert: true, setDefaultsOnInsert: true }
      );
    } else {
      await Roster.updateOne(
        { userId: leave.userId, weekStart, [`days.${dayKey}`]: "leave" },
        { $set: { [`days.${dayKey}`]: "wfh" } }
      );
    }
  }
}

// Used by the Chat page to dull a person's avatar + show a leave indicator.
// Open to any authenticated user (not just reviewers) since everyone using
// chat needs to see who's currently out.
router.get("/on-leave-today", async (req, res, next) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const leaves = await Leave.find({
      status: "approved",
      startDate: { $lte: today },
      endDate: { $gte: today },
    }).select("userId");
    res.json(leaves.map((l) => l.userId));
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const filter = ["hr", "lead", "teamlead", "superadmin"].includes(req.user.role) ? {} : { userId: req.user._id };
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

router.patch("/:id/decision", requireRole("hr", "lead", "teamlead", "superadmin"), async (req, res, next) => {
  try {
    const { status } = req.body; // approved | rejected
    const existing = await Leave.findById(req.params.id);
    if (!existing) return res.status(404).json({ error: "Leave request not found" });
    const wasApproved = existing.status === "approved";

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status, decidedBy: req.user._id },
      { new: true }
    ).populate("userId", "name avatarColor deptKey");

    if (status === "approved" && !wasApproved) {
      await syncRosterForLeave(leave, true);
    } else if (wasApproved && status !== "approved") {
      await syncRosterForLeave(leave, false);
    }

    res.json(leave);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ error: "Not found" });
    const isOwner = leave.userId.toString() === req.user._id.toString();
    if (!isOwner && !["hr", "lead", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ error: "Not allowed" });
    }
    if (leave.status === "approved") {
      await syncRosterForLeave(leave, false);
    }
    await leave.deleteOne();
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;