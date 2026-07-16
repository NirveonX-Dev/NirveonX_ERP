const express = require("express");
const DailyReport = require("../models/DailyReport");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const filter = ["hr", "lead", "teamlead"].includes(req.user.role) ? {} : { userId: req.user._id };
    if (req.query.date) filter.date = req.query.date;
    const rows = await DailyReport.find(filter).populate("userId", "name avatarColor deptKey").sort({ date: -1 });
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const row = await DailyReport.create({ ...req.body, userId: req.user._id });
    await row.populate("userId", "name avatarColor deptKey");
    res.status(201).json(row);
  } catch (err) { next(err); }
});

module.exports = router;
