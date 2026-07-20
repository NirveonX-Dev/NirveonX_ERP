const { initializeApp, cert } = require("firebase-admin/app");
const { getMessaging } = require("firebase-admin/messaging");
const DeviceToken = require("../models/DeviceToken");

let app = null;

// Lazily initialize firebase-admin. If FIREBASE_SERVICE_ACCOUNT_JSON isn't set
// (e.g. local dev before you've set up Firebase), push sending is silently
// skipped instead of crashing the server - everything else keeps working.
//
// NOTE: firebase-admin v12+ removed the old namespaced API
// (admin.credential.cert(...), admin.messaging()) from the default
// require("firebase-admin") export. It's modular now - you import
// initializeApp/cert from "firebase-admin/app" and getMessaging from
// "firebase-admin/messaging" instead.
function getApp() {
  if (app) return app;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const serviceAccount = JSON.parse(raw);
    app = initializeApp({ credential: cert(serviceAccount) });
    return app;
  } catch (err) {
    console.error("Failed to initialize firebase-admin - check FIREBASE_SERVICE_ACCOUNT_JSON:", err.message);
    return null;
  }
}

// Sends a push notification to every device a user has registered.
// Silently does nothing if Firebase isn't configured yet, or the user has no
// registered devices - callers don't need to check either condition first.
async function sendPushToUser(userId, { title, body, url = "/" }) {
  const firebaseApp = getApp();
  if (!firebaseApp) return;

  const tokens = await DeviceToken.find({ userId }).distinct("token");
  if (tokens.length === 0) return;

  try {
    const response = await getMessaging(firebaseApp).sendEachForMulticast({
      tokens,
      notification: { title, body },
      webpush: {
        fcmOptions: { link: url },
        notification: { icon: "/icon-192.png" },
      },
    });

    // Clean up tokens that are no longer valid (user revoked permission,
    // uninstalled the PWA, browser data cleared, etc.)
    const deadTokens = [];
    response.responses.forEach((r, i) => {
      if (!r.success && ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(r.error?.code)) {
        deadTokens.push(tokens[i]);
      }
    });
    if (deadTokens.length > 0) {
      await DeviceToken.deleteMany({ token: { $in: deadTokens } });
    }
  } catch (err) {
    console.error("Push notification send failed:", err.message);
  }
}

// Same as above, but for several recipients at once (e.g. everyone in a
// channel). Runs the sends in parallel and never throws.
async function sendPushToUsers(userIds, payload) {
  await Promise.all(userIds.map((id) => sendPushToUser(id, payload)));
}

module.exports = { sendPushToUser, sendPushToUsers };