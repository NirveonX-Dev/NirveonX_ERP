const express = require("express");
const User = require("../models/User");
const Task = require("../models/Task");
const Leave = require("../models/Leave");
const Asset = require("../models/Asset");
const ESupportTicket = require("../models/ESupportTicket");
const PerformanceLog = require("../models/PerformanceLog");
const LeadershipMessage = require("../models/LeadershipMessage");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Keep in sync with the department list in routes/departments.js
const DEPARTMENTS_FOR_LOAD = ["appdev", "webdev", "devops", "growth", "research", "hr"];

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

// Two tiers here: "This week's leader" and Leadership Line are safe/relevant
// for everyone, so all logged-in users get those. Pending approvals and
// department load stay privileged-only (HR/Leadership/Team Lead/Super Admin)
// since they expose other people's leave/asset requests.
router.get("/overview", async (req, res, next) => {
  try {
    const isPrivileged = ["hr", "lead", "teamlead", "superadmin"].includes(req.user.role);

    const leadershipLineFilter = isPrivileged ? {} : { userId: req.user._id };

    const [leaderAgg, latestMessages] = await Promise.all([
      PerformanceLog.aggregate([
        { $group: { _id: "$toUserId", totalPoints: { $sum: "$points" } } },
        { $sort: { totalPoints: -1 } },
        { $limit: 1 },
      ]),
      LeadershipMessage.find(leadershipLineFilter).populate("userId", "name avatarColor title").sort({ createdAt: -1 }).limit(3),
    ]);

    let topLeader = null;
    if (leaderAgg.length) {
      const user = await User.findById(leaderAgg[0]._id);
      if (user) topLeader = { user: user.toSafeJSON(), totalPoints: leaderAgg[0].totalPoints };
    }

    const result = {
      topLeader,
      latestLeadershipLine: latestMessages,
      pendingApprovalsPreview: [],
      departmentLoad: [],
    };

    if (isPrivileged) {
      const [pendingLeaves, pendingAssets] = await Promise.all([
        Leave.find({ status: "pending" }).populate("userId", "name avatarColor deptKey").sort({ createdAt: -1 }),
        Asset.find({ status: "requested" }).populate("assignedTo", "name avatarColor deptKey").sort({ createdAt: -1 }),
      ]);

      result.pendingApprovalsPreview = [
        ...pendingLeaves.map((l) => ({
          kind: "leave", id: l._id, requestedBy: l.userId,
          summary: `${l.type} leave: ${l.startDate} to ${l.endDate}`, createdAt: l.createdAt,
        })),
        ...pendingAssets.map((a) => ({
          kind: "asset", id: a._id, requestedBy: a.assignedTo,
          summary: `${a.type}: ${a.name}`, createdAt: a.createdAt,
        })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

      result.departmentLoad = await Promise.all(
        DEPARTMENTS_FOR_LOAD.map(async (deptKey) => {
          const [total, done] = await Promise.all([
            Task.countDocuments({ deptKey }),
            Task.countDocuments({ deptKey, status: "done" }),
          ]);
          return { deptKey, total, done };
        })
      );
    }

    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;