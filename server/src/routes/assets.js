const express = require("express");
const Asset = require("../models/Asset");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const assets = await Asset.find().populate("assignedTo", "name avatarColor").sort({ createdAt: -1 });
    res.json(assets);
  } catch (err) { next(err); }
});

router.post("/", requireRole("hr", "lead", "teamlead"), async (req, res, next) => {
  try {
    const asset = await Asset.create(req.body);
    await asset.populate("assignedTo", "name avatarColor");
    res.status(201).json(asset);
  } catch (err) { next(err); }
});

// Staff can request an asset for themselves
router.post("/request", async (req, res, next) => {
  try {
    const asset = await Asset.create({ ...req.body, assignedTo: req.user._id, status: "requested" });
    await asset.populate("assignedTo", "name avatarColor");
    res.status(201).json(asset);
  } catch (err) { next(err); }
});

router.put("/:id", requireRole("hr", "lead", "teamlead"), async (req, res, next) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("assignedTo", "name avatarColor");
    if (!asset) return res.status(404).json({ error: "Not found" });
    res.json(asset);
  } catch (err) { next(err); }
});

router.delete("/:id", requireRole("hr", "lead"), async (req, res, next) => {
  try {
    await Asset.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
