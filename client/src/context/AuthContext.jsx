import { createContext, useContext, useEffect, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("nx_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("nx_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get("/auth/me")
      .then((res) => {
        setUser(res.data);
        localStorage.setItem("nx_user", JSON.stringify(res.data));
      })
      .catch(() => {
        localStorage.removeItem("nx_token");
        localStorage.removeItem("nx_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const res = await api.post("/auth/login", { username, password });
    localStorage.setItem("nx_token", res.data.token);
    localStorage.setItem("nx_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }

  function logout() {
    localStorage.removeItem("nx_token");
    localStorage.removeItem("nx_user");
    setUser(null);
  }

  const canManage = user && ["hr", "lead"].includes(user.role);
  const canReview = user && ["hr", "lead", "teamlead"].includes(user.role);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout, canManage, canReview }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
