// This file MUST live at the site root (client/public/ -> served as
// /firebase-messaging-sw.js) - Firebase requires that exact path so it can
// control push notifications for the whole origin.
//
// It handles notifications that arrive while the tab is closed or in the
// background. Foreground notifications (tab open and focused) are handled
// separately in src/lib/firebase.js instead.
//
// IMPORTANT: Service workers can't read Vite's import.meta.env, so the
// Firebase config below has to be pasted in directly. These values are all
// public/client-side identifiers (not secrets) - the same six values you put
// in client/.env as VITE_FIREBASE_*. Copy them here too after you create
// your Firebase project. See PUSH_NOTIFICATIONS_SETUP.md.

importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyArEee3DSdfSKCVBbuQHgMX8YQj_t5Phao",
  authDomain: "nirveonx-erp.firebaseapp.com",
  projectId: "nirveonx-erp",
  storageBucket: "nirveonx-erp.firebasestorage.app",
  messagingSenderId: "277960287672",
  appId: "1:277960287672:web:008ba573c1b8cc4a2c1b4d"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  const link = payload.fcmOptions?.link || payload.data?.link || "/";

  self.registration.showNotification(title || "NirveonX", {
    body: body || "You have a new notification",
    icon: "/icon-192.png",
    data: { url: link },
  });
});

// Clicking the notification focuses an existing tab if one is open, or opens a new one
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
