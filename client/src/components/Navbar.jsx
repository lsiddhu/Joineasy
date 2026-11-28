import { Bell, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function Navbar({ role, user, onMenuClick }) {
  const location = useLocation();
  const links =
    role === "STUDENT"
      ? [
          ["/student/dashboard", "Overview"],
          ["/student/group", "My group"],
          ["/student/assignments", "Assignments"],
        ]
      : [
          ["/professor/dashboard", "Overview"],
          ["/professor/courses", "Courses"],
          ["/professor/assignments", "Assignments"],
          ["/professor/analytics", "Analytics"],
        ];
  const label =
    links.find(([path]) => path === location.pathname)?.[1] || "Overview";
  return (
    <header className="topbar">
      <button
        className="mobile-menu"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <Menu />
      </button>
      <div className="crumb">
        {role === "STUDENT" ? "Student workspace" : "Professor workspace"}{" "}
        <span>/</span> <b>{label}</b>
      </div>
      <div className="top-right">
        <span className="today">
          {new Date().toLocaleDateString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
          })}
        </span>
        <button className="icon-button" title="Notifications">
          <Bell size={18} />
          <i />
        </button>
        <div className="top-avatar">{(user?.name || "U")[0].toUpperCase()}</div>
      </div>
    </header>
  );
}
