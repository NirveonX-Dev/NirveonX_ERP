const mongoose = require("mongoose");
const { Schema } = mongoose;

const DEPARTMENT_LABELS = {
  appdev: "Engineering",
  webdev: "Web Development",
  devops: "DevOps",
  growth: "Growth",
  research: "Research",
  hr: "Human Resources",
  leadership: "Leadership",
};

const UserSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true },
  employeeId: { type: String, unique: true, sparse: true, trim: true },
  contactEmail: { type: String, default: "" }, // secondary/personal email, distinct from login email
  whatsappNumber: { type: String, default: "" },
  dob: { type: String, default: null }, // "YYYY-MM-DD"
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["staff", "teamlead", "hr", "lead", "superadmin"], default: "staff" },
  deptKey: { type: String, required: true }, // appdev | webdev | devops | growth | research | hr | leadership
  title: { type: String, default: "" },
  bio: { type: String, default: "" },
  location: { type: String, default: "" },
  profileImage: { type: String, default: "" },
  avatarColor: { type: String, default: "#4338CA" },
  employmentType: { type: String, enum: ["fulltime", "intern", "contractor"], default: "fulltime" },
  joinedDate: { type: String, default: () => new Date().toISOString().slice(0, 10) },
  internshipEndDate: { type: String, default: null },
  isBlocked: { type: Boolean, default: false },
  // Intern profile extension fields
  internProfile: {
    phone: String,
    homeAddress: String,
    education: String,
    college: String,
    stipend: String,
    mentor: String,
    managerFeedback: String,
    peerFeedback: String,
    specialAchievements: String,
    offboardingNotes: String,
  },
}, { timestamps: true });

UserSchema.statics.generateNextEmployeeId = async function () {
  const users = await this.find({ employeeId: /^EMP\d+$/ }, { employeeId: 1 }).lean();
  let maxNumber = 0;

  users.forEach(({ employeeId }) => {
    const match = /^EMP(\d+)$/.exec(employeeId || "");
    if (!match) return;
    const current = parseInt(match[1], 10);
    if (!Number.isNaN(current) && current > maxNumber) maxNumber = current;
  });

  return `EMP${String(maxNumber + 1).padStart(3, "0")}`;
};

UserSchema.pre("save", async function nextEmployeeId() {
  if (!this.employeeId) {
    this.employeeId = await this.constructor.generateNextEmployeeId();
  }
});

UserSchema.pre("findOneAndUpdate", async function nextEmployeeId() {
  const update = this.getUpdate();
  if (!update || update.employeeId) {
    return;
  }

  const nextEmployeeId = await this.model.findOne({ employeeId: { $exists: true, $ne: null, $ne: "" } }).sort({ employeeId: -1 }).lean();
  const lastNumber = nextEmployeeId ? parseInt((nextEmployeeId.employeeId || '').replace(/^EMP/, ''), 10) || 0 : 0;
  update.employeeId = `EMP${String(lastNumber + 1).padStart(3, '0')}`;
});

UserSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

UserSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  const department = DEPARTMENT_LABELS[obj.deptKey] || obj.deptKey || "General";

  return {
    employeeId: obj.employeeId || "",
    name: obj.name || "",
    designation: obj.title || obj.role || "",
    department,
    role: obj.role || "",
    profileImage: obj.profileImage || "",
    bio: obj.bio || "",
    email: obj.email || "",
    location: obj.location || "",
  };
};

module.exports = mongoose.model("User", UserSchema);