const express = require("express");
const User = require("../models/User");

// Deliberately has NO requireAuth - this route powers a public "meet the
// team" showcase site with no login of its own. Only call toPublicJSON()
// here, never toSafeJSON() or the raw document - see the comment on
// toPublicJSON in models/User.js for why.
const router = express.Router();

router.get("/employees", async (req, res, next) => {
  try {
    const users = await User.find().sort({ name: 1 });
    res.json(users.map((u) => u.toPublicJSON()));
  } catch (err) {
    next(err);
  }
});

module.exports = router;
