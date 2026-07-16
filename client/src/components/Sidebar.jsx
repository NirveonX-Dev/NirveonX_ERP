import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV = [
  { to: "/", label: "Dashboard", roles: null },
  { to: "/tasks", label: "Tasks", roles: null },
  { to: "/leaves", label: "Leaves", roles: null },
  { to: "/certificates", label: "Certificates", roles: null },
  { to: "/appraisals", label: "Appraisals", roles: null },
  { to: "/assets", label: "Assets", roles: null },
  { to: "/approvals", label: "Approvals", roles: ["hr", "lead", "teamlead"] },
  { to: "/esupport", label: "eSupport", roles: null },
  { to: "/support247", label: "Support 24x7", roles: null },
  { to: "/leadershipline", label: "Leadership Line", roles: null },
  { to: "/roster", label: "Roster", roles: null },
  { to: "/reports", label: "Daily Reports", roles: null },
  { to: "/skillmatrix", label: "Skill Matrix", roles: null },
  { to: "/chat", label: "Team Chat", roles: null },
  { to: "/leaderboard", label: "Leaderboard", roles: null },
  { to: "/performance", label: "Team Performance", roles: ["hr", "lead", "teamlead"] },
  { to: "/users", label: "Users", roles: ["hr", "lead"] },
];

export default function Sidebar() {
  const { user } = useAuth();
  const items = NAV.filter((n) => !n.roles || n.roles.includes(user?.role));

  return (
    <aside className="w-60 shrink-0 bg-ink text-white h-screen sticky top-0 flex flex-col">
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
              `block rounded-md px-3 py-2 text-sm transition-colors ${
                isActive ? "bg-brand-600 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
