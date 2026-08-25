const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  email: { type: String, required: true },
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

module.exports = mongoose.model("User", UserSchema);