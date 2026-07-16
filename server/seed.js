  // One-time (or re-run anytime) seed script for demo/starter data.
  // Usage: npm run seed   (make sure .env is set up first)

  require("dotenv").config();
  const bcrypt = require("bcryptjs");
  const mongoose = require("mongoose");

  const { connectDB } = require("./src/db");

  const User = require("./src/models/User");
  const Task = require("./src/models/Task");
  const Asset = require("./src/models/Asset");

  function nextDays(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  const SEED_USERS = [
    {
      name: "Rahul Sharma",
      username: "rahul",
      email: "rahul@nirveonx.com",
      password: "admin123",
      role: "lead",
      deptKey: "leadership",
      title: "CEO",
      employmentType: "fulltime",
      avatarColor: "#7C3AED",
    },
    {
      name: "Priya Menon",
      username: "priya",
      email: "priya@nirveonx.com",
      password: "hr123",
      role: "hr",
      deptKey: "hr",
      title: "HR Manager",
      employmentType: "fulltime",
      avatarColor: "#DB2777",
    },
    {
      name: "Arjun Rao",
      username: "arjun",
      email: "arjun@nirveonx.com",
      password: "lead123",
      role: "teamlead",
      deptKey: "appdev",
      title: "Team Lead, App Dev",
      employmentType: "fulltime",
      avatarColor: "#0EA5E9",
    },
    {
      name: "Kiran Patel",
      username: "kiran",
      email: "kiran@nirveonx.com",
      password: "pass123",
      role: "staff",
      deptKey: "appdev",
      title: "Intern, App Dev",
      employmentType: "intern",
      internshipEndDate: nextDays(2),
      avatarColor: "#F59E0B",
    },
    {
      name: "Ananya Iyer",
      username: "ananya",
      email: "ananya@nirveonx.com",
      password: "pass123",
      role: "staff",
      deptKey: "research",
      title: "Research Intern",
      employmentType: "intern",
      internshipEndDate: nextDays(1),
      avatarColor: "#10B981",
    },
    {
      name: "Vikram Singh",
      username: "vikram",
      email: "vikram@nirveonx.com",
      password: "pass123",
      role: "staff",
      deptKey: "devops",
      title: "DevOps Engineer",
      employmentType: "fulltime",
      avatarColor: "#6366F1",
    },
    {
      name: "Meera Nair",
      username: "meera",
      email: "meera@nirveonx.com",
      password: "pass123",
      role: "staff",
      deptKey: "research",
      title: "Research Intern",
      employmentType: "intern",
      internshipEndDate: nextDays(20),
      avatarColor: "#14B8A6",
    },
    {
      name: "Deepak Verma",
      username: "deepak",
      email: "deepak@nirveonx.com",
      password: "pass123",
      role: "staff",
      deptKey: "growth",
      title: "Growth Associate",
      employmentType: "fulltime",
      avatarColor: "#EF4444",
    },
    {
      name: "Sneha Kulkarni",
      username: "sneha",
      email: "sneha@nirveonx.com",
      password: "pass123",
      role: "staff",
      deptKey: "webdev",
      title: "Web Developer",
      employmentType: "fulltime",
      avatarColor: "#8B5CF6",
    },
    {
      name: "Rohan Gupta",
      username: "rohan",
      email: "rohan@nirveonx.com",
      password: "pass123",
      role: "staff",
      deptKey: "appdev",
      title: "App Developer",
      employmentType: "fulltime",
      avatarColor: "#F97316",
    },
  ];

  async function run() {
    try {
      await connectDB();

      console.log("Connected to MongoDB.");

      console.log("Clearing existing data...");
      await User.deleteMany({});
      await Task.deleteMany({});
      await Asset.deleteMany({});

      console.log("Creating users...");

      const created = {};

      for (const u of SEED_USERS) {
        const passwordHash = await bcrypt.hash(u.password, 10);

        const { password, ...rest } = u;

        const user = await User.create({
          ...rest,
          email: rest.email || `${rest.username}@nirveonx.com`,
          passwordHash,
        });

        created[u.username] = user;

        console.log(
          `✔ ${u.username} | ${u.email} | ${u.password} | ${u.role}`
        );
      }

      console.log("Creating sample tasks...");

      await Task.create([
        {
          title: "Set up CI pipeline",
          deptKey: "devops",
          assigneeId: created.vikram._id,
          status: "inprogress",
          priority: "high",
          createdBy: created.arjun._id,
        },
        {
          title: "Fix login page bug",
          deptKey: "appdev",
          assigneeId: created.kiran._id,
          status: "todo",
          priority: "medium",
          createdBy: created.arjun._id,
        },
        {
          title: "Draft Q3 growth report",
          deptKey: "growth",
          assigneeId: created.deepak._id,
          status: "backlog",
          priority: "low",
          createdBy: created.priya._id,
        },
        {
          title: "Landing page redesign",
          deptKey: "webdev",
          assigneeId: created.sneha._id,
          status: "done",
          priority: "medium",
          createdBy: created.arjun._id,
        },
      ]);

      console.log("Creating sample assets...");

      await Asset.create([
        {
          name: 'MacBook Pro 14"',
          type: "hardware",
          assignedTo: created.vikram._id,
          status: "assigned",
        },
        {
          name: "Figma Seat",
          type: "license",
          assignedTo: created.sneha._id,
          status: "assigned",
          accessLink: "https://figma.com",
        },
        {
          name: "AWS Console Access",
          type: "access",
          assignedTo: created.vikram._id,
          status: "assigned",
          accessLink: "https://console.aws.amazon.com",
        },
      ]);

      console.log("\n==================================");
      console.log("✅ Database seeded successfully!");
      console.log("==================================");

      console.log("\nLogin Credentials:\n");

      SEED_USERS.forEach((u) => {
        console.log(
          `${u.role.padEnd(10)} | ${u.username.padEnd(10)} | ${u.password}`
        );
      });

      await mongoose.disconnect();
      console.log("\nDisconnected from MongoDB.");
      process.exit(0);
    } catch (err) {
      console.error("\nSeed failed:\n");
      console.error(err);
      await mongoose.disconnect();
      process.exit(1);
    }
  }

  run();