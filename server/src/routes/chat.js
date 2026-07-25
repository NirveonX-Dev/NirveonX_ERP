const express = require("express");
const ChatMessage = require("../models/ChatMessage");
const ChatReadState = require("../models/ChatReadState");
const ChatGroup = require("../models/ChatGroup");
const User = require("../models/User");
const { sendPushToUsers } = require("../utils/push");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

// Same roles that get canReview on the client - teamlead and above can
// create/manage groups.
const LEADER_ROLES = ["teamlead", "hr", "lead", "superadmin"];

function groupChannelId(groupId) {
  return `group:${groupId}`;
}

// Keep this in sync with the fixed channel list in client/src/pages/Chat.jsx
const FIXED_CHANNELS = ["company", "appdev", "webdev", "devops", "growth", "research", "hr"];

function dmChannelId(a, b) {
  const [x, y] = [a.toString(), b.toString()].sort();
  return `dm:${x}_${y}`;
}

// Given a dm:x_y channelId and "my" user id, return the other participant's id
function otherDmUser(channelId, myId) {
  const [x, y] = channelId.replace("dm:", "").split("_");
  return x === myId.toString() ? y : x;
}

// IMPORTANT: this route must be declared before "/:channelId" below, otherwise
// Express would match the literal path "/unread" as channelId="unread".
router.get("/unread", async (req, res, next) => {
  try {
    const myId = req.user._id.toString();

    // Every DM channel this user has ever sent or received a message in
    const dmChannelIds = await ChatMessage.distinct("channelId", {
      channelId: { $regex: `^dm:` },
    });
    const myDmChannelIds = dmChannelIds.filter((cid) => cid.includes(myId));

    const myGroups = await ChatGroup.find({ members: req.user._id }).select("_id");
    const myGroupChannelIds = myGroups.map((g) => groupChannelId(g._id));

    const allChannelIds = [...FIXED_CHANNELS, ...myDmChannelIds, ...myGroupChannelIds];

    const readStates = await ChatReadState.find({ userId: req.user._id, channelId: { $in: allChannelIds } });
    const lastReadMap = Object.fromEntries(readStates.map((r) => [r.channelId, r.lastReadAt]));
    const epoch = new Date(0);

    const counts = await Promise.all(
      allChannelIds.map((cid) =>
        ChatMessage.countDocuments({
          channelId: cid,
          senderId: { $ne: req.user._id },
          createdAt: { $gt: lastReadMap[cid] || epoch },
        })
      )
    );

    const channels = {};
    const dms = {};
    let total = 0;

    allChannelIds.forEach((cid, i) => {
      const count = counts[i];
      total += count;
      if (cid.startsWith("dm:")) {
        dms[otherDmUser(cid, myId)] = count;
      } else {
        channels[cid] = count;
      }
    });

    res.json({ channels, dms, total });
  } catch (err) { next(err); }
});

// Mark a channel or DM as read "now" for the current user - resets its unread count to 0
router.post("/read", async (req, res, next) => {
  try {
    let { channelId, withUserId } = req.body;
    if (!channelId && withUserId) channelId = dmChannelId(req.user._id, withUserId);
    if (!channelId) return res.status(400).json({ error: "channelId or withUserId is required" });

    await ChatReadState.findOneAndUpdate(
      { userId: req.user._id, channelId },
      { lastReadAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// IMPORTANT: these /groups routes must be declared before "/:channelId"
// below, for the same reason /unread and /read are - otherwise Express would
// match "/groups" as channelId="groups".

// List the groups the current user belongs to
router.get("/groups", async (req, res, next) => {
  try {
    const groups = await ChatGroup.find({ members: req.user._id })
      .populate("members", "name avatarColor title")
      .populate("createdBy", "name")
      .sort({ createdAt: -1 });
    res.json(groups);
  } catch (err) { next(err); }
});

// Create a new group - teamlead and above only. Creator is always a member.
router.post("/groups", async (req, res, next) => {
  try {
    if (!LEADER_ROLES.includes(req.user.role)) {
      return res.status(403).json({ error: "Only team leads and above can create groups" });
    }
    const name = (req.body.name || "").trim();
    if (!name) return res.status(400).json({ error: "Group name is required" });

    const memberIds = Array.isArray(req.body.memberIds) ? req.body.memberIds : [];
    const members = Array.from(new Set([req.user._id.toString(), ...memberIds]));

    const group = await ChatGroup.create({ name, members, createdBy: req.user._id });
    await group.populate("members", "name avatarColor title");
    await group.populate("createdBy", "name");
    res.status(201).json(group);
  } catch (err) { next(err); }
});

// Add/remove members - creator only, editable anytime
router.patch("/groups/:id/members", async (req, res, next) => {
  try {
    const group = await ChatGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the group creator can manage members" });
    }

    const add = Array.isArray(req.body.add) ? req.body.add : [];
    const remove = Array.isArray(req.body.remove) ? req.body.remove.map(String) : [];

    const current = group.members.map((id) => id.toString());
    const next = Array.from(new Set([...current, ...add])).filter((id) => !remove.includes(id));
    // Creator can never be removed, otherwise the group has no owner
    if (!next.includes(req.user._id.toString())) next.push(req.user._id.toString());

    group.members = next;
    await group.save();
    await group.populate("members", "name avatarColor title");
    await group.populate("createdBy", "name");
    res.json(group);
  } catch (err) { next(err); }
});

// Delete a group - creator only. Wipes its messages and read-state too, so
// there's nothing orphaned left behind.
router.delete("/groups/:id", async (req, res, next) => {
  try {
    const group = await ChatGroup.findById(req.params.id);
    if (!group) return res.status(404).json({ error: "Group not found" });
    if (group.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Only the group creator can delete this group" });
    }

    const channelId = groupChannelId(group._id);
    await Promise.all([
      ChatMessage.deleteMany({ channelId }),
      ChatReadState.deleteMany({ channelId }),
      group.deleteOne(),
    ]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

router.get("/:channelId", async (req, res, next) => {
  try {
    if (req.params.channelId.startsWith("group:")) {
      const group = await ChatGroup.findOne({ _id: req.params.channelId.replace("group:", ""), members: req.user._id });
      if (!group) return res.status(403).json({ error: "Not a member of this group" });
    }
    const rows = await ChatMessage.find({ channelId: req.params.channelId })
      .populate("senderId", "name avatarColor title")
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(rows);
  } catch (err) { next(err); }
});

// For DMs, pass ?with=<otherUserId> instead of computing the channel id on the client
router.get("/", async (req, res, next) => {
  try {
    if (!req.query.with) return res.status(400).json({ error: "channelId or with is required" });
    const channelId = dmChannelId(req.user._id, req.query.with);
    const rows = await ChatMessage.find({ channelId })
      .populate("senderId", "name avatarColor title")
      .sort({ createdAt: 1 })
      .limit(200);
    res.json(rows);
  } catch (err) { next(err); }
});

router.post("/", async (req, res, next) => {
  try {
    let { channelId, withUserId, text, imageUrl, linkUrl } = req.body;
    if (!channelId && withUserId) channelId = dmChannelId(req.user._id, withUserId);
    if (!channelId) return res.status(400).json({ error: "channelId or withUserId is required" });
    if (!text && !imageUrl && !linkUrl) {
      return res.status(400).json({ error: "Message needs text, an image, or a link" });
    }
    if (channelId.startsWith("group:")) {
      const group = await ChatGroup.findOne({ _id: channelId.replace("group:", ""), members: req.user._id });
      if (!group) return res.status(403).json({ error: "Not a member of this group" });
    }
    const msg = await ChatMessage.create({
      channelId, senderId: req.user._id,
      text: text || "", imageUrl: imageUrl || null, linkUrl: linkUrl || null,
    });
    await msg.populate("senderId", "name avatarColor title");
    res.status(201).json(msg);

    // Push notification - fires after responding, and never blocks or breaks
    // sending the message if it fails (push not configured yet, no devices
    // registered, FCM error, etc.) since sendPushToUser/Users swallow errors.
    notifyRecipients(channelId, req.user, { text, imageUrl, linkUrl }).catch(() => {});
  } catch (err) { next(err); }
});

async function notifyRecipients(channelId, sender, { text, imageUrl, linkUrl }) {
  let recipientIds = [];

  if (channelId.startsWith("dm:")) {
    const [x, y] = channelId.replace("dm:", "").split("_");
    const otherId = x === sender._id.toString() ? y : x;
    recipientIds = [otherId];
  } else if (channelId.startsWith("group:")) {
    const group = await ChatGroup.findById(channelId.replace("group:", ""));
    if (group) recipientIds = group.members.map((id) => id.toString()).filter((id) => id !== sender._id.toString());
  } else if (channelId === "company") {
    const all = await User.find({ _id: { $ne: sender._id } }).select("_id");
    recipientIds = all.map((u) => u._id.toString());
  } else {
    // Department channel - notify everyone in that department except the sender
    const deptUsers = await User.find({ deptKey: channelId, _id: { $ne: sender._id } }).select("_id");
    recipientIds = deptUsers.map((u) => u._id.toString());
  }

  if (recipientIds.length === 0) return;

  const preview = text || (imageUrl ? "sent an image" : linkUrl ? "shared a link" : "sent a message");
  await sendPushToUsers(recipientIds, {
    title: `${sender.name} in Team Chat`,
    body: preview.length > 100 ? `${preview.slice(0, 97)}...` : preview,
    url: "/chat",
  });
}

module.exports = router;