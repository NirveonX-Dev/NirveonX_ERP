import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Avatar from "./Avatar";

export default function Topbar({ title, onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 shrink-0 border-b border-slate-200 bg-white flex items-center justify-between px-4 sm:px-6 gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          aria-label="Open menu"
          className="lg:hidden shrink-0 -ml-1 p-2 rounded-md text-slate-500 hover:bg-slate-100"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.5 5h15M2.5 10h15M2.5 15h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-ink truncate">{title}</h1>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-medium leading-tight">{user?.name}</div>
          <div className="text-xs text-slate-400 leading-tight">{user?.title}</div>
        </div>
        <Avatar user={user} />
        <button
          className="btn-secondary text-xs hidden sm:inline-flex"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Log out
        </button>
        <button
          className="sm:hidden p-2 rounded-md text-slate-500 hover:bg-slate-100"
          aria-label="Log out"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7.5 2.5H4.5C3.94772 2.5 3.5 2.94772 3.5 3.5V16.5C3.5 17.0523 3.94772 17.5 4.5 17.5H7.5M13 14L17 10M17 10L13 6M17 10H7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}