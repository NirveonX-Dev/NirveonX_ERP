import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 bg-white flex items-center justify-between px-6">
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium leading-tight">{user?.name}</div>
          <div className="text-xs text-slate-400 leading-tight">{user?.title}</div>
        </div>
        <Avatar user={user} />
        <button
          className="btn-secondary text-xs"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Log out
        </button>
      </div>
    </header>
  );
}
