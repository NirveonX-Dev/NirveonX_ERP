const express = require("express");
const ESupportTicket = require("../models/ESupportTicket");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const filter = ["hr", "lead", "teamlead", "superadmin"].includes(req.user.role) ? {} : { userId: req.user._id };
    const rows = await ESupportTicket.find(filter).populate("userId", "name avatarColor").sort({ createdAt: -1 });
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const row = await ESupportTicket.create({ ...req.body, userId: req.user._id });
    await row.populate("userId", "name avatarColor");
    res.status(201).json(row);
  } catch (err) { next(err); }
});

router.patch("/:id/status", requireRole("hr", "lead", "teamlead", "superadmin"), async (req, res, next) => {
  try {
    const row = await ESupportTicket.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
      .populate("userId", "name avatarColor");
    if (!row) return res.status(404).json({ error: "Not found" });
    res.json(row);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await ESupportTicket.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
