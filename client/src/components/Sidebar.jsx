import { Link, NavLink, useLocation } from "react-router-dom";
import {
  Activity,
  BookOpen,
  ClipboardList,
  Gauge,
  Layers3,
  LogOut,
  Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { routes } from "./Common";

export default function Sidebar({ role, mobile, onNavigate }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const student = role === "STUDENT";
  const nav = student
    ? [
        ["/student/dashboard", "Overview", Gauge],
        ["/student/group", "My group", Users],
        ["/student/assignments", "Assignments", ClipboardList],
      ]
    : [
        ["/professor/dashboard", "Overview", Gauge],
        ["/professor/assignments", "Assignments", ClipboardList],
        ["/professor/analytics", "Analytics", Activity],
      ];
  return (
    <aside className={`sidebar ${mobile ? "open" : ""}`}>
      <Link className="brand" to={routes[role]}>
        <span className="brand-mark">
          <Layers3 size={20} />
        </span>{" "}
        joineazy
      </Link>
      <div className="workspace-label">WORKSPACE</div>
      <nav>
        {nav.map(([path, label, Icon]) => (
          <NavLink
            key={path}
            to={path}
            onClick={onNavigate}
            className={location.pathname === path ? "selected" : ""}
          >
            <Icon size={18} />
            <span>{label}</span>
            {label === "Assignments" && <span className="nav-dot" />}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-icon">
            <BookOpen size={16} />
          </div>
          <b>Need a hand?</b>
          <p>
            {student
              ? "Your team is one message away."
              : "Your class workspace is up to date."}
          </p>
        </div>
        <button className="profile-row" onClick={logout} title="Sign out">
          <span className="profile-avatar">
            {(user?.name || "U")
              .split(" ")
              .map((x) => x[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <span className="profile-info">
            <b>{user?.name || "User"}</b>
            <small>{student ? "Student account" : "Professor account"}</small>
          </span>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}
