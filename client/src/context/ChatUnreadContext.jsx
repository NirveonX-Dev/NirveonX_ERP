import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "../lib/api";
import { useAuth } from "./AuthContext";

const ChatUnreadContext = createContext(null);

// Shared across the whole app so the Sidebar badge and the Team Chat page's
// per-channel/per-DM badges always agree, without each one polling separately
// out of sync with the other.
export function ChatUnreadProvider({ children }) {
  const { user } = useAuth();
  const [data, setData] = useState({ channels: {}, dms: {}, total: 0 });

  const refresh = useCallback(() => {
    if (!user) return;
    api.get("/chat/unread").then((res) => setData(res.data)).catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [user, refresh]);

  // Call when the user opens a channel or DM - zeroes it out immediately in the
  // UI, then confirms with the server so it stays cleared on the next poll.
  const markRead = useCallback(
    async (target) => {
      setData((prev) => {
        const next = { channels: { ...prev.channels }, dms: { ...prev.dms }, total: prev.total };
        if (target.type === "channel") {
          next.total -= prev.channels[target.id] || 0;
          next.channels[target.id] = 0;
        } else {
          next.total -= prev.dms[target.id] || 0;
          next.dms[target.id] = 0;
        }
        return next;
      });
      const body = target.type === "channel" ? { channelId: target.id } : { withUserId: target.id };
      try {
        await api.post("/chat/read", body);
      } finally {
        refresh();
      }
    },
    [refresh]
  );

  return (
    <ChatUnreadContext.Provider value={{ ...data, refresh, markRead }}>
      {children}
    </ChatUnreadContext.Provider>
  );
}

export function useChatUnread() {
  return useContext(ChatUnreadContext);
}