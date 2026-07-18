const express = require("express");
const ChatMessage = require("../models/ChatMessage");
const ChatReadState = require("../models/ChatReadState");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

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

    const allChannelIds = [...FIXED_CHANNELS, ...myDmChannelIds];

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

router.get("/:channelId", async (req, res, next) => {
  try {
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
    const msg = await ChatMessage.create({
      channelId, senderId: req.user._id,
      text: text || "", imageUrl: imageUrl || null, linkUrl: linkUrl || null,
    });
    await msg.populate("senderId", "name avatarColor title");
    res.status(201).json(msg);
  } catch (err) { next(err); }
});

module.exports = router;