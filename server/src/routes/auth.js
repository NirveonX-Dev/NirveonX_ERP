const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signToken } = require("../utils/jwt");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required" });
    }
    const user = await User.findOne({ username: username.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: "Your access has been blocked by an admin. Contact HR." });
    }
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    const token = signToken(user);
    res.json({ token, user: user.toSafeJSON() });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, (req, res) => {
  res.json(req.user.toSafeJSON());
});

router.post("/change-password", requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }
    const ok = await bcrypt.compare(currentPassword || "", req.user.passwordHash);
    if (!ok) return res.status(401).json({ error: "Current password is incorrect" });
    req.user.passwordHash = await bcrypt.hash(newPassword, 10);
    await req.user.save();
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
