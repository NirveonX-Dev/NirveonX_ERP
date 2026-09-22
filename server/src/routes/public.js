const express = require("express");
const User = require("../models/User");

const router = express.Router();

const PUBLIC_DEPARTMENT_MAP = {
  appdev: "Engineering",
  webdev: "Web Development",
  devops: "DevOps",
  growth: "Growth",
  research: "Research",
  hr: "Human Resources",
  leadership: "Leadership",
};

router.get("/employees", async (req, res) => {
  try {
    const employees = await User.find({})
      .sort({ name: 1 })
      .lean();

    const publicEmployees = employees.map((employee) => {
      const department = PUBLIC_DEPARTMENT_MAP[employee.deptKey] || employee.deptKey || "General";

      return {
        employeeId: employee.employeeId || "",
        name: employee.name || "",
        designation: employee.title || employee.role || "",
        department,
        profileImage: employee.profileImage || "",
        bio: employee.bio || "",
        email: employee.email || "",
        location: employee.location || "",
      };
    });

    res.status(200).json(publicEmployees);
  } catch (error) {
    console.error("Public employee fetch failed:", error.message);
    res.status(500).json({ error: "Unable to load our team right now. Please try again later." });
  }
});

module.exports = router;
