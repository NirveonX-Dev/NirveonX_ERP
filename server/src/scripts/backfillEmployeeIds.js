require("dotenv").config();

const { connectDB } = require("../db");
const User = require("../models/User");

async function backfillEmployeeIds() {
  try {
    await connectDB();

    const users = await User.find({
      $or: [
        { employeeId: { $exists: false } },
        { employeeId: null },
        { employeeId: "" },
      ],
    }).sort({ createdAt: 1 });

    for (const user of users) {
      let nextEmployeeId = user.employeeId;
      if (!nextEmployeeId || !/^EMP\d+$/.test(nextEmployeeId)) {
        nextEmployeeId = await User.generateNextEmployeeId();
      }

      user.employeeId = nextEmployeeId;
      await user.save();
      console.log(`Assigned ${user.employeeId} to ${user.name}`);
    }

    const count = await User.countDocuments({ employeeId: { $exists: true, $ne: null, $ne: "" } });
    console.log(`Backfill complete. ${count} users have employeeId values.`);
  } catch (error) {
    console.error("Employee ID backfill failed:", error.message);
    process.exitCode = 1;
  } finally {
    const mongoose = require("mongoose");
    await mongoose.disconnect();
  }
}

backfillEmployeeIds();
