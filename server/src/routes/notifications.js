const express = require("express");
const User = require("../models/User");
const DeviceToken = require("../models/DeviceToken");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Computed on the fly (no cron, no stored notifications table): interns whose
// internshipEndDate falls within the next 3 days. Visible to HR/leadership only.
router.get("/internships-ending", requireRole("hr", "lead", "superadmin"), async (req, res, next) => {
  try {
    const today = new Date();
    const cutoff = new Date();
    cutoff.setDate(today.getDate() + 3);
    const toStr = (d) => d.toISOString().slice(0, 10);

    const interns = await User.find({
      employmentType: "intern",
      internshipEndDate: { $gte: toStr(today), $lte: toStr(cutoff) },
    });
    res.json(interns.map((u) => u.toSafeJSON()));
  } catch (err) { next(err); }
});

// Called by the frontend right after the browser grants notification
// permission and Firebase hands back a registration token for this device.
router.post("/register-device", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "token is required" });

    // A token could already belong to this same user (re-registering) or,
    // rarely, a previous user on a shared device - either way, re-point it
    // at whoever is logged in now.
    await DeviceToken.findOneAndUpdate(
      { token },
      { token, userId: req.user._id, userAgent: req.headers["user-agent"] || "" },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Called on logout (or when the user disables notifications) so a stale
// browser doesn't keep receiving pushes meant for whoever logs in next.
router.delete("/register-device", async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "token is required" });
    await DeviceToken.deleteOne({ token, userId: req.user._id });
    res.json({ success: true });
  } catch (err) { next(err); }
});

module.exports = router;
