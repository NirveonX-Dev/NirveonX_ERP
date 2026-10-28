const express = require("express");
const AppAlert = require("../models/AppAlert");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sendPushToUsers } = require("../utils/push");

const router = express.Router();

// Roles that can see + manage app alerts (infra/ops concern, not for all staff).
const ALERT_ROLES = ["teamlead", "lead", "hr", "superadmin"];

// ── INGEST (machine-to-machine) ──────────────────────────────────────────────
// Called by our apps' backends (Medzzapp, etc.) when something breaks. Authed by
// a shared secret header, NOT a user JWT. Mounted in index.js BEFORE the
// app-wide CORS, with its own permissive cors(), like /api/public.
//
// body: { app, source?, severity?, title, message?, dedupeKey?, meta? }
// Re-firing the same dedupeKey within the active window bumps count instead of
// creating a new alert, and only notifies on the FIRST occurrence.
async function ingest(req, res) {
  try {
    const secret = process.env.APP_ALERTS_INGEST_SECRET;
    if (!secret) return res.status(503).json({ error: "Alert ingest not configured" });
    if (req.get("x-alert-secret") !== secret) return res.status(401).json({ error: "Unauthorized" });

    const { app, source, severity, title, message, dedupeKey, meta } = req.body || {};
    if (!app || !title) return res.status(400).json({ error: "app and title are required" });

    const key = String(dedupeKey || `${app}:${source || ""}:${title}`).slice(0, 200);

    const existing = await AppAlert.findOne({ dedupeKey: key, status: "active" });
    if (existing) {
      existing.count += 1;
      existing.lastSeen = new Date();
      if (message) existing.message = message;
      if (meta) existing.meta = meta;
      await existing.save();
      return res.json({ ok: true, deduped: true, id: existing._id, count: existing.count });
    }

    const alert = await AppAlert.create({
      app: String(app).slice(0, 40),
      source: String(source || "").slice(0, 60),
      severity: ["info", "warning", "critical"].includes(severity) ? severity : "warning",
      title: String(title).slice(0, 200),
      message: String(message || "").slice(0, 2000),
      dedupeKey: key,
      meta: meta || {},
    });

    // Notify admins/leads on the FIRST occurrence (push; no-ops if FCM unset).
    const recipients = await User.find({ role: { $in: ALERT_ROLES } }).select("_id").lean();
    sendPushToUsers(recipients.map((u) => u._id), {
      title: `⚠️ ${alert.app}: ${alert.title}`,
      body: alert.message || "Open the ERP → App Alerts for details.",
      url: "/alerts",
    }).catch(() => {});

    return res.status(201).json({ ok: true, id: alert._id });
  } catch (err) {
    console.error("[alerts/ingest]", err.message);
    return res.status(500).json({ error: "Could not record alert" });
  }
}

// ── Team-facing (JWT) ────────────────────────────────────────────────────────
router.use(requireAuth, requireRole(...ALERT_ROLES));

// GET /api/alerts?status=active|resolved|all
router.get("/", async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = status && status !== "all" ? { status } : {};
    const alerts = await AppAlert.find(filter).sort({ lastSeen: -1 }).limit(200).lean();
    const activeCount = await AppAlert.countDocuments({ status: "active" });
    res.json({ alerts, activeCount });
  } catch (err) { next(err); }
});

// POST /api/alerts/:id/resolve
router.post("/:id/resolve", async (req, res, next) => {
  try {
    const alert = await AppAlert.findByIdAndUpdate(
      req.params.id,
      { status: "resolved", resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    );
    if (!alert) return res.status(404).json({ error: "Alert not found" });
    res.json({ ok: true, alert });
  } catch (err) { next(err); }
});

// POST /api/alerts/resolve-all — clear everything active at once
router.post("/resolve-all", async (req, res, next) => {
  try {
    await AppAlert.updateMany(
      { status: "active" },
      { status: "resolved", resolvedBy: req.user._id, resolvedAt: new Date() }
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = { router, ingest };
