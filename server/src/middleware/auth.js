const { verifyToken } = require("../utils/jwt");
const User = require("../models/User");

// Verifies the JWT AND re-checks the user's current status in the database
// on every single request. This is what makes admin-blocking actually work:
// a blocked user's existing token stops granting access on their very next
// request, without needing to wait for the token to expire.
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    let payload;
    try {
      payload = verifyToken(token);
    } catch {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: "Your access has been blocked by an admin" });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not authenticated" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to do this" });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
