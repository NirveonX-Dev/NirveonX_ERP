import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useChatUnread } from "../context/ChatUnreadContext";

const NAV = [
  { to: "/", label: "Dashboard", roles: null },
  { to: "/tasks", label: "Tasks", roles: null },
  { to: "/leaves", label: "Leaves", roles: null },
  { to: "/certificates", label: "Certificates", roles: null },
  { to: "/appraisals", label: "Appraisals", roles: null },
  { to: "/assets", label: "Assets", roles: null },
  { to: "/approvals", label: "Approvals", roles: ["hr", "lead", "teamlead", "superadmin"] },
  { to: "/esupport", label: "eSupport", roles: null },
  { to: "/support247", label: "Support 24x7", roles: null },
  { to: "/leadershipline", label: "Leadership Line", roles: null },
  { to: "/roster", label: "Roster", roles: null },
  { to: "/reports", label: "Daily Reports", roles: null },
  { to: "/skillmatrix", label: "Skill Matrix", roles: null },
  { to: "/chat", label: "Team Chat", roles: null },
  { to: "/leaderboard", label: "Leaderboard", roles: null },
  { to: "/performance", label: "Team Performance", roles: ["hr", "lead", "teamlead", "superadmin"] },
  { to: "/users", label: "Employees", roles: ["hr", "lead", "superadmin"] },
];

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();
  const { total: unreadTotal } = useChatUnread();
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user?.role));

  return (
    <>
      {/* Backdrop - only rendered on mobile while the drawer is open */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-ink/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`w-60 shrink-0 bg-ink text-white flex flex-col
          fixed inset-y-0 left-0 z-40 h-screen transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:sticky lg:top-0`}
      >
        <div className="px-5 py-5 border-b border-white/10">
          <div className="text-lg font-bold tracking-tight">NirveonX</div>
          <div className="text-xs text-white/50">Internal ERP</div>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                  isActive ? "bg-brand-600 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <span>{item.label}</span>
              {item.to === "/chat" && unreadTotal > 0 && (
                <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full bg-accent text-white text-[11px] font-semibold px-1">
                  {unreadTotal > 99 ? "99+" : unreadTotal}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
