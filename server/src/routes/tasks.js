const express = require("express");
const Task = require("../models/Task");
const ChatMessage = require("../models/ChatMessage");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sendPushToUser, sendPushToUsers } = require("../utils/push");

const router = express.Router();
router.use(requireAuth);

const POP_ASSIGNEES = { path: "assignees", select: "name avatarColor title" };
const POP_ASSIGNEE = { path: "assigneeId", select: "name avatarColor title" }; // legacy
const POP_DEPENDS = { path: "dependsOn", select: "ticketKey title status" };

// Keep the legacy single-assignee field in sync with the array (first assignee).
function syncLegacyAssignee(doc) {
  doc.assigneeId = doc.assignees && doc.assignees.length ? doc.assignees[0] : null;
}

function dmChannelId(a, b) {
  const [x, y] = [a.toString(), b.toString()].sort();
  return `dm:${x}_${y}`;
}

// Next sequential ticket key, scoped per project: Master App -> MA-1, MA-2, ...
// Derive the max numeric suffix for that prefix so deletions never collide.
async function nextTicketKey(project) {
  const prefix = Task.PROJECT_PREFIX[project] || "V";
  const re = new RegExp(`^${prefix}-\\d+$`);
  const rows = await Task.find({ ticketKey: re }).select("ticketKey").lean();
  const max = rows.reduce((m, t) => {
    const n = parseInt((t.ticketKey || "").split("-")[1], 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${max + 1}`;
}

// The hardcoded project list (mirror of the enum on the model), for the filter UI.
router.get("/projects", (req, res) => res.json(Task.PROJECTS));

// Tickets assigned to the current user (for the Dashboard reminder).
// Matches whether the user is in the assignees array OR the legacy single field.
router.get("/mine", async (req, res, next) => {
  try {
    const tasks = await Task.find({
      status: { $ne: "done" },
      $or: [{ assignees: req.user._id }, { assigneeId: req.user._id }],
    })
      .populate(POP_DEPENDS)
      .sort({ priority: -1, dueDate: 1, createdAt: 1 });
    res.json(tasks);
  } catch (err) { next(err); }
});

router.get("/", async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.deptKey) filter.deptKey = req.query.deptKey;
    if (req.query.project) filter.project = req.query.project;
    if (req.query.assigneeId) filter.assignees = req.query.assigneeId;
    // Ascending by creation = tickets read top-to-bottom in the order they were
    // made (MA-1, MA-2, ... MA-28). Sorting by the string ticketKey would give
    // MA-1, MA-10, MA-11, ... MA-2, so createdAt is the correct key here.
    const tasks = await Task.find(filter)
      .populate(POP_ASSIGNEES)
      .populate(POP_ASSIGNEE)
      .populate(POP_DEPENDS)
      .sort({ createdAt: 1 });
    res.json(tasks);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    const ticketKey = await nextTicketKey(req.body.project);
    const task = new Task({ ...req.body, ticketKey, createdBy: req.user._id });
    syncLegacyAssignee(task);
    await task.save();
    await task.populate(POP_ASSIGNEES);
    await task.populate(POP_DEPENDS);
    notifyAssignees(task.assignees.map((a) => a._id));
    res.status(201).json(task);
  } catch (err) { next(err); }
});

router.put("/:id", async (req, res, next) => {
  try {
    const before = await Task.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ error: "Task not found" });

    const task = await Task.findById(req.params.id);
    Object.assign(task, req.body);
    if (req.body.assignees) syncLegacyAssignee(task);
    await task.save();
    await task.populate(POP_ASSIGNEES);
    await task.populate(POP_DEPENDS);

    // Notify anyone newly added to the assignees list.
    if (req.body.assignees) {
      const beforeIds = (before.assignees || []).map(String);
      const added = task.assignees.map((a) => a._id).filter((id) => !beforeIds.includes(String(id)));
      notifyAssignees(added);
    }
    res.json(task);
  } catch (err) { next(err); }
});

router.patch("/:id/status", async (req, res, next) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
      .populate(POP_ASSIGNEES)
      .populate(POP_DEPENDS);
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (err) { next(err); }
});

// Bulk multi-select assign from the Master Board — team leads and above
// (teamlead / lead / hr / superadmin).
// body: { taskIds: [...], assigneeIds: [...], mode: "set" | "add" }
// mode "set" replaces the assignees; "add" merges into the existing ones.
// (assigneeId singular still accepted for back-compat.)
router.post("/assign", requireRole("teamlead", "lead", "hr", "superadmin"), async (req, res, next) => {
  try {
    let { taskIds = [], assigneeIds, assigneeId, mode = "set" } = req.body;
    if (!assigneeIds) assigneeIds = assigneeId ? [assigneeId] : [];
    assigneeIds = [...new Set((assigneeIds || []).map(String))].filter(Boolean);
    if (!taskIds.length) return res.status(400).json({ error: "No tickets selected" });

    const tasks = await Task.find({ _id: { $in: taskIds } });
    // userId -> list of ticketKeys they were newly added to (for one push each).
    const newlyAddedByUser = {};

    for (const task of tasks) {
      const beforeIds = task.assignees.map(String);
      let nextIds;
      if (mode === "add") nextIds = [...new Set([...beforeIds, ...assigneeIds])];
      else nextIds = assigneeIds;

      task.assignees = nextIds;
      syncLegacyAssignee(task);
      // Pull out of backlog once it has an owner — it's now real, scheduled work.
      if (nextIds.length && task.status === "backlog") task.status = "todo";
      await task.save();

      nextIds.filter((id) => !beforeIds.includes(id)).forEach((id) => {
        (newlyAddedByUser[id] ||= []).push(task.ticketKey);
      });
    }

    // One push per newly-assigned user, listing the tickets they got.
    Object.entries(newlyAddedByUser).forEach(([uid, keys]) => {
      sendPushToUser(uid, {
        title: `${keys.length} ticket${keys.length > 1 ? "s" : ""} assigned to you`,
        body: keys.filter(Boolean).join(", "),
        url: "/tasks",
      });
    });

    const updated = await Task.find({ _id: { $in: taskIds } })
      .populate(POP_ASSIGNEES)
      .populate(POP_DEPENDS)
      .sort({ createdAt: 1 });
    res.json(updated);
  } catch (err) { next(err); }
});

// Tag one or more teammates about a ticket — DMs each of them the message
// (which itself contains the @mentions) prefixed with the ticket reference, so
// a ticket can be raised in conversation. body: { userIds: [...], message }
// (userId singular still accepted for back-compat).
router.post("/:id/tag", async (req, res, next) => {
  try {
    let { userIds, userId, message = "" } = req.body;
    if (!userIds) userIds = userId ? [userId] : [];
    userIds = [...new Set(userIds.map(String))].filter(Boolean);
    if (!userIds.length) return res.status(400).json({ error: "Tag at least one teammate" });

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    const ref = `[${task.ticketKey || "ticket"}] ${task.title}`;
    const text = message.trim() ? `${ref}\n${message.trim()}` : ref;

    // One DM per tagged teammate (reuses the existing dm:x_y chat channel).
    await Promise.all(userIds.map(async (uid) => {
      const channelId = dmChannelId(req.user._id, uid);
      await ChatMessage.create({ channelId, senderId: req.user._id, text });
    }));

    sendPushToUsers(userIds, {
      title: `${req.user.name} tagged you on a ticket`,
      body: ref.length > 100 ? `${ref.slice(0, 97)}...` : ref,
      url: "/chat",
    });

    res.status(201).json({ success: true, taggedCount: userIds.length });
  } catch (err) { next(err); }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    await Task.updateMany({ dependsOn: req.params.id }, { $pull: { dependsOn: req.params.id } });
    res.json({ success: true });
  } catch (err) { next(err); }
});

// Push "a ticket was assigned to you" to each given user id (fire-and-forget;
// sendPushToUsers no-ops safely if push isn't configured).
function notifyAssignees(userIds = []) {
  const ids = userIds.map((u) => (u && u._id ? u._id : u)).filter(Boolean);
  if (!ids.length) return;
  sendPushToUsers(ids, {
    title: "New ticket assigned to you",
    body: "You've been assigned a ticket on the Master Board.",
    url: "/tasks",
  });
}

module.exports = router;
