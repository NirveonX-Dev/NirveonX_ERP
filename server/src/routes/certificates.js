const express = require("express");
const Certificate = require("../models/Certificate");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const filter = ["hr", "lead", "teamlead", "superadmin"].includes(req.user.role) ? {} : { userId: req.user._id };
    const certs = await Certificate.find(filter).populate("userId", "name avatarColor").sort({ createdAt: -1 });
    res.json(certs);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const cert = await Certificate.create({ ...req.body, userId: req.user._id });
    await cert.populate("userId", "name avatarColor");
    res.status(201).json(cert);
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const cert = await Certificate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("userId", "name avatarColor");
    if (!cert) return res.status(404).json({ error: "Not found" });
    res.json(cert);
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await Certificate.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
