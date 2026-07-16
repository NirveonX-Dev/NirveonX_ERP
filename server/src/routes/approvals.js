const express = require("express");
const Leave = require("../models/Leave");
const Asset = require("../models/Asset");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth, requireRole("hr", "lead", "teamlead"));

// Unified pending-approvals queue, aggregated from leaves + asset requests
router.get("/", async (req, res, next) => {
  try {
    const [leaves, assets] = await Promise.all([
      Leave.find({ status: "pending" }).populate("userId", "name avatarColor deptKey"),
      Asset.find({ status: "requested" }).populate("assignedTo", "name avatarColor deptKey"),
    ]);
    const rows = [
      ...leaves.map((l) => ({
        kind: "leave", id: l._id, requestedBy: l.userId, summary: `${l.type} leave: ${l.startDate} to ${l.endDate}`,
        createdAt: l.createdAt,
      })),
      ...assets.map((a) => ({
        kind: "asset", id: a._id, requestedBy: a.assignedTo, summary: `${a.type}: ${a.name}`,
        createdAt: a.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(rows);
  } catch (err) { next(err); }
});

module.exports = router;
