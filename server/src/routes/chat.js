const express = require("express");
const ChatMessage = require("../models/ChatMessage");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
router.use(requireAuth);

function dmChannelId(a, b) {
  const [x, y] = [a.toString(), b.toString()].sort();
  return `dm:${x}_${y}`;
}

router.get("/:channelId", async (req, res, next) => {
  try {
    const rows = await ChatMessage.find({ channelId: req.params.channelId })
      .populate("senderId", "name avatarColor")
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
      .populate("senderId", "name avatarColor")
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
    await msg.populate("senderId", "name avatarColor");
    res.status(201).json(msg);
  } catch (err) { next(err); }
});

module.exports = router;
