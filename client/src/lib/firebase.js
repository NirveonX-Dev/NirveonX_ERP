import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import api from "./api";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

function firebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && VAPID_KEY);
}

// Asks the browser for notification permission (if not already granted or
// denied), registers the service worker, gets this device's FCM token, and
// saves it against the logged-in user on the backend.
//
// Safe to call on every login/app-load: does nothing if Firebase env vars
// aren't set yet, if this browser doesn't support push (e.g. Safari on iOS
// unless the site is installed to the Home Screen), or if the user has
// already denied permission.
export async function setupPushNotifications() {
  try {
    if (!firebaseConfigured()) return;
    if (typeof window === "undefined" || !("Notification" in window)) return;

    const supported = await isSupported();
    if (!supported) return;

    if (Notification.permission === "denied") return;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    const messaging = getMessaging(app);

    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
    if (!token) return;

    localStorage.setItem("nx_push_token", token);
    await api.post("/notifications/register-device", { token });

    // Foreground messages (tab open + focused) don't trigger the service
    // worker, so show a lightweight in-app notification for those instead.
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      if (Notification.permission === "granted" && title) {
        new Notification(title, { body, icon: "/icon-192.png" });
      }
    });
  } catch (err) {
    // Never let push-notification setup break login or the rest of the app
    console.warn("Push notification setup skipped:", err.message);
  }
}

// Called on logout so this browser stops receiving push notifications meant
// for whoever logs in next on the same device (e.g. a shared office laptop).
export async function teardownPushNotifications() {
  try {
    const token = localStorage.getItem("nx_push_token");
    if (!token) return;
    await api.delete("/notifications/register-device", { data: { token } });
    localStorage.removeItem("nx_push_token");
  } catch (err) {
    console.warn("Push notification teardown skipped:", err.message);
  }
}
