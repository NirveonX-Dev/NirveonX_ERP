const express = require("express");
const Appraisal = require("../models/Appraisal");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const filter = ["hr", "lead", "teamlead"].includes(req.user.role) ? {} : { userId: req.user._id };
    const rows = await Appraisal.find(filter).populate("userId", "name avatarColor deptKey").sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/", requireRole("hr", "lead", "teamlead"), async (req, res, next) => {
  try {
    const row = await Appraisal.create({ ...req.body, reviewedBy: req.user._id });
    await row.populate("userId", "name avatarColor deptKey");
    res.status(201).json(row);
  } catch (err) { next(err); }
});

router.put("/:id", requireRole("hr", "lead", "teamlead"), async (req, res, next) => {
  try {
    const row = await Appraisal.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("userId", "name avatarColor deptKey");
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { next(err); }
});

router.delete("/:id", requireRole("hr", "lead"), async (req, res, next) => {
  try {
    await Appraisal.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
