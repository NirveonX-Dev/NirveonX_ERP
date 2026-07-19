const express = require("express");
const SkillMatrix = require("../models/SkillMatrix");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.deptKey) filter.deptKey = req.query.deptKey;
    const rows = await SkillMatrix.find(filter).populate("userId", "name avatarColor");
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/", requireRole("hr", "lead", "teamlead", "superadmin"), async (req, res, next) => {
  try {
    const row = await SkillMatrix.create(req.body);
    await row.populate("userId", "name avatarColor");
    res.status(201).json(row);
  } catch (err) { next(err); }
});

router.put("/:id", requireRole("hr", "lead", "teamlead", "superadmin"), async (req, res, next) => {
  try {
    const row = await SkillMatrix.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("userId", "name avatarColor");
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { next(err); }
});

router.delete("/:id", requireRole("hr", "lead", "teamlead", "superadmin"), async (req, res, next) => {
  try {
    await SkillMatrix.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
