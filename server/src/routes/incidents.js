const express = require("express");
const Incident = require("../models/Incident");
const SupportShift = require("../models/SupportShift");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/incidents", async (req, res, next) => {
  try {
    const rows = await Incident.find().populate("reportedBy", "name avatarColor").sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/incidents", async (req, res, next) => {
  try {
    const row = await Incident.create({ ...req.body, reportedBy: req.user._id });
    await row.populate("reportedBy", "name avatarColor");
    res.status(201).json(row);
  } catch (err) { next(err); }
});

router.patch("/incidents/:id/status", requireRole("hr", "lead", "teamlead", "superadmin"), async (req, res, next) => {
  try {
    const row = await Incident.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
      .populate("reportedBy", "name avatarColor");
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { next(err); }
});

router.get("/shifts", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.from && req.query.to) filter.date = { $gte: req.query.from, $lte: req.query.to };
    const rows = await SupportShift.find(filter).populate("userId", "name avatarColor").sort({ date: 1 });
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/shifts", requireRole("hr", "lead", "teamlead", "superadmin"), async (req, res, next) => {
  try {
    const row = await SupportShift.create(req.body);
    await row.populate("userId", "name avatarColor");
    res.status(201).json(row);
  } catch (err) { next(err); }
});

router.delete("/shifts/:id", requireRole("hr", "lead", "teamlead", "superadmin"), async (req, res, next) => {
  try {
    await SupportShift.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
