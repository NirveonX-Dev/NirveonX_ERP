const express = require("express");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

const DEPARTMENTS = [
  { key: "appdev", name: "App Development" },
  { key: "webdev", name: "Web Development" },
  { key: "devops", name: "DevOps" },
  { key: "growth", name: "Growth" },
  { key: "research", name: "Research" },
  { key: "hr", name: "HR" },
  { key: "leadership", name: "Leadership" },
];

router.get("/", (req, res) => res.json(DEPARTMENTS));

module.exports = router;
