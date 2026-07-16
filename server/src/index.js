require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { connectDB } = require("./db");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const taskRoutes = require("./routes/tasks");
const leaveRoutes = require("./routes/leaves");
const certificateRoutes = require("./routes/certificates");
const appraisalRoutes = require("./routes/appraisals");
const assetRoutes = require("./routes/assets");
const approvalRoutes = require("./routes/approvals");
const esupportRoutes = require("./routes/esupport");
const incidentRoutes = require("./routes/incidents");
const leadershipLineRoutes = require("./routes/leadershipline");
const rosterRoutes = require("./routes/roster");
const reportRoutes = require("./routes/reports");
const skillMatrixRoutes = require("./routes/skillmatrix");
const chatRoutes = require("./routes/chat");
const performanceRoutes = require("./routes/performance");
const departmentRoutes = require("./routes/departments");
const notificationRoutes = require("./routes/notifications");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

const allowedOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((s) => s.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/appraisals", appraisalRoutes);
app.use("/api/assets", assetRoutes);
app.use("/api/approvals", approvalRoutes);
app.use("/api/esupport", esupportRoutes);
app.use("/api/support247", incidentRoutes);
app.use("/api/leadershipline", leadershipLineRoutes);
app.use("/api/roster", rosterRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/skillmatrix", skillMatrixRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

// 404 for unknown API routes
app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

const PORT = process.env.PORT || 8080;

connectDB()
  .then(() => {
    app.listen(PORT, () => console.log(`API server listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
