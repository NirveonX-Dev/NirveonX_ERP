const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Anyone logged in can see the directory (names/roles), used for assignees, chat, etc.
router.get("/", async (req, res, next) => {
  try {
    const users = await User.find().sort({ name: 1 });
    res.json(users.map((u) => u.toSafeJSON()));
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.toSafeJSON());
  } catch (err) {
    next(err);
  }
});

// Only HR/leadership can create, edit, delete, or block users
router.post("/", requireRole("hr", "lead"), async (req, res, next) => {
  try {
    const { name, username, email, password, role, deptKey, title, employmentType, internshipEndDate, avatarColor } = req.body;
    if (!name || !username || !email || !password || !deptKey) {
      return res.status(400).json({ error: "name, username, email, password, deptKey are required" });
    }
    const exists = await User.findOne({ username: username.toLowerCase().trim() });
    if (exists) return res.status(409).json({ error: "Username already taken" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name, email, passwordHash, deptKey, title: title || "",
      username: username.toLowerCase().trim(),
      role: role || "staff",
      employmentType: employmentType || "fulltime",
      internshipEndDate: internshipEndDate || null,
      avatarColor: avatarColor || "#4338CA",
    });
    res.status(201).json(user.toSafeJSON());
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireRole("hr", "lead"), async (req, res, next) => {
  try {
    const updates = { ...req.body };
    delete updates.passwordHash;
    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }
    if (updates.username) updates.username = updates.username.toLowerCase().trim();
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.toSafeJSON());
  } catch (err) {
    next(err);
  }
});

// Dedicated block/unblock endpoint - the admin-blocking feature
router.patch("/:id/block", requireRole("hr", "lead"), async (req, res, next) => {
  try {
    const { isBlocked } = req.body;
    if (req.params.id === req.user._id.toString() && isBlocked) {
      return res.status(400).json({ error: "You can't block your own account" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: !!isBlocked }, { new: true });
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.toSafeJSON());
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireRole("hr", "lead"), async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: "You can't delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Update own or (if HR/lead) any intern profile extension fields
router.put("/:id/intern-profile", async (req, res, next) => {
  try {
    const isSelf = req.params.id === req.user._id.toString();
    const isPrivileged = ["hr", "lead"].includes(req.user.role);
    if (!isSelf && !isPrivileged) return res.status(403).json({ error: "Not allowed" });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { internProfile: req.body },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user.toSafeJSON());
  } catch (err) {
    next(err);
  }
});

module.exports = router;
