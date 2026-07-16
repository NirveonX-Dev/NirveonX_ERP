const express = require("express");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Computed on the fly (no cron, no stored notifications table): interns whose
// internshipEndDate falls within the next 3 days. Visible to HR/leadership only.
router.get("/internships-ending", requireRole("hr", "lead"), async (req, res, next) => {
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

module.exports = router;
