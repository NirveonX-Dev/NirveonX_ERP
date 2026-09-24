const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true },
  // Entered manually by HR when creating/editing a user, same as title, deptKey,
  // etc. Never auto-generated - sparse+unique just stops two people from
  // accidentally being given the same ID, without forcing every user to have one.
  employeeId: { type: String, trim: true, unique: true, sparse: true },
  contactEmail: { type: String, default: "" }, // secondary/personal email, distinct from login email
  whatsappNumber: { type: String, default: "" },
  dob: { type: String, default: null }, // "YYYY-MM-DD"
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["staff", "teamlead", "hr", "lead", "superadmin"], default: "staff" },
  deptKey: { type: String, required: true }, // appdev | webdev | devops | growth | research | hr | leadership
  title: { type: String, default: "" },
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

UserSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

// Used only by the unauthenticated public employee-directory endpoint.
// Deliberately whitelists just these three fields - never widen this without
// checking routes/public.js, since anything added here becomes visible to
// anyone on the internet, logged in or not.
UserSchema.methods.toPublicJSON = function () {
  return {
    employeeId: this.employeeId || "",
    name: this.name,
    designation: this.title || "",
  };
};

module.exports = mongoose.model("User", UserSchema);