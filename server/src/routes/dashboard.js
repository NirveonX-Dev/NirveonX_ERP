const express = require("express");
const User = require("../models/User");
const Task = require("../models/Task");
const Leave = require("../models/Leave");
const Asset = require("../models/Asset");
const ESupportTicket = require("../models/ESupportTicket");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/summary", async (req, res, next) => {
  try {
    const [totalEmployees, activeInterns, pendingLeaves, pendingAssets, openTickets, myTasks] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ employmentType: "intern" }),
      Leave.countDocuments({ status: "pending" }),
      Asset.countDocuments({ status: "requested" }),
      ESupportTicket.countDocuments({ status: { $ne: "resolved" } }),
      Task.countDocuments({ assigneeId: req.user._id, status: { $ne: "done" } }),
    ]);
    res.json({
      totalEmployees, activeInterns,
      pendingApprovals: pendingLeaves + pendingAssets,
      openTickets, myOpenTasks: myTasks,
    });
  } catch (err) { next(err); }
});

module.exports = router;
