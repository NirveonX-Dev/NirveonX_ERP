const express = require("express");
const MasterTicket = require("../models/MasterTicket");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sendPushToUsers } = require("../utils/push");

const router = express.Router();
router.use(requireAuth);

const POP_ASSIGNEES = { path: "assignees", select: "name avatarColor title" };
const POP_DEPENDS = { path: "dependsOn", select: "key title status" };

// Next sequential key: MA-1, MA-2, ... Based on the highest existing numeric
// suffix so deletions don't cause collisions.
async function nextKey() {
  const last = await MasterTicket.findOne({ key: /^MA-\d+$/ })
    .sort({ createdAt: -1 })
    .select("key")
    .lean();
  // Scan is cheap at this scale; derive the max to be safe against out-of-order createdAt.
  const all = await MasterTicket.find({ key: /^MA-\d+$/ }).select("key").lean();
  const max = all.reduce((m, t) => {
    const n = parseInt((t.key || "").split("-")[1], 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `MA-${max + 1}`;
}

// ── READ: everyone logged in can view the board ──────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.stream) filter.stream = req.query.stream;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.mine === "true") filter.assignees = req.user._id;

    const tickets = await MasterTicket.find(filter)
      .populate(POP_ASSIGNEES)
      .populate(POP_DEPENDS)
      .sort({ order: 1, createdAt: 1 });
    res.json(tickets);
  } catch (err) { next(err); }
});

// Tickets assigned to the current user — used by the Dashboard home reminder.
router.get("/mine", async (req, res, next) => {
  try {
    const tickets = await MasterTicket.find({
      assignees: req.user._id,
      status: { $ne: "done" },
    })
      .populate(POP_DEPENDS)
      .sort({ priority: -1, dueDate: 1, order: 1 });
    res.json(tickets);
  } catch (err) { next(err); }
});

// ── WRITE: superadmin only (for now — it's a team ERP, easy to widen later) ──
router.post("/", requireRole("superadmin"), async (req, res, next) => {
  try {
    const key = await nextKey();
    const count = await MasterTicket.countDocuments({ status: req.body.status || "backlog" });
    const ticket = await MasterTicket.create({
      ...req.body,
      key,
      order: count, // append to bottom of its column
      createdBy: req.user._id,
    });
    await ticket.populate(POP_ASSIGNEES);
    await ticket.populate(POP_DEPENDS);

    if (ticket.assignees.length) {
      notifyAssignees(ticket, "You've been assigned a new ticket");
    }
    res.status(201).json(ticket);
  } catch (err) { next(err); }
});

router.put("/:id", requireRole("superadmin"), async (req, res, next) => {
  try {
    const before = await MasterTicket.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ error: "Ticket not found" });

    const ticket = await MasterTicket.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate(POP_ASSIGNEES)
      .populate(POP_DEPENDS);

    // Notify anyone who is newly on the assignee list after this edit.
    if (req.body.assignees) {
      const beforeIds = (before.assignees || []).map(String);
      const added = ticket.assignees.filter((a) => !beforeIds.includes(String(a._id)));
      if (added.length) {
        notifyUsers(added.map((a) => a._id), ticket, "You've been assigned a ticket");
      }
    }
    res.json(ticket);
  } catch (err) { next(err); }
});

// Status change — used by the kanban column dropdown. Superadmin drives the
// board; interns update progress from their own view too, so allow any auth'd
// assignee to move a ticket they're on, else superadmin.
router.patch("/:id/status", async (req, res, next) => {
  try {
    const ticket = await MasterTicket.findById(req.params.id);
    if (!ticket) return res.status(404).json({ error: "Ticket not found" });

    const isAssignee = ticket.assignees.map(String).includes(String(req.user._id));
    if (req.user.role !== "superadmin" && !isAssignee) {
      return res.status(403).json({ error: "You can only update tickets assigned to you" });
    }

    ticket.status = req.body.status;
    await ticket.save();
    await ticket.populate(POP_ASSIGNEES);
    await ticket.populate(POP_DEPENDS);
    res.json(ticket);
  } catch (err) { next(err); }
});

// ── Bulk multi-select + assign (the core "assign access" feature) ────────────
// body: { ticketIds: [...], assignees: [...userIds], mode: "set" | "add" }
router.post("/assign", requireRole("superadmin"), async (req, res, next) => {
  try {
    const { ticketIds = [], assignees = [], mode = "set" } = req.body;
    if (!ticketIds.length) return res.status(400).json({ error: "No tickets selected" });

    const tickets = await MasterTicket.find({ _id: { $in: ticketIds } });
    for (const ticket of tickets) {
      const before = ticket.assignees.map(String);
      if (mode === "add") {
        const merged = new Set([...before, ...assignees.map(String)]);
        ticket.assignees = [...merged];
      } else {
        ticket.assignees = assignees;
      }
      // Pull it out of backlog the moment it has an owner — it's now real work.
      if (ticket.assignees.length && ticket.status === "backlog") ticket.status = "todo";
      await ticket.save();

      const added = ticket.assignees.map(String).filter((id) => !before.includes(id));
      if (added.length) notifyUsers(added, ticket, "You've been assigned a ticket");
    }

    const updated = await MasterTicket.find({ _id: { $in: ticketIds } })
      .populate(POP_ASSIGNEES)
      .populate(POP_DEPENDS)
      .sort({ order: 1 });
    res.json(updated);
  } catch (err) { next(err); }
});

router.delete("/:id", requireRole("superadmin"), async (req, res, next) => {
  try {
    await MasterTicket.findByIdAndDelete(req.params.id);
    // Drop this ticket from any other ticket's dependsOn so no dangling refs.
    await MasterTicket.updateMany(
      { dependsOn: req.params.id },
      { $pull: { dependsOn: req.params.id } }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ── helpers ──────────────────────────────────────────────────────────────────
function notifyAssignees(ticket, title) {
  notifyUsers(ticket.assignees.map((a) => a._id || a), ticket, title);
}
function notifyUsers(userIds, ticket, title) {
  // Fire-and-forget push; sendPushToUsers never throws and no-ops if Firebase
  // isn't configured, so the request isn't blocked on it.
  sendPushToUsers(userIds, {
    title,
    body: `${ticket.key} — ${ticket.title}`,
    url: "/masterboard",
  });
}

module.exports = router;
