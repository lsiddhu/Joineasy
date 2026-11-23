import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function WorkspaceLayout({ role }) {
  const { user } = useAuth(),
    [mobile, setMobile] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar
        role={role}
        mobile={mobile}
        onNavigate={() => setMobile(false)}
      />
      {mobile && (
        <button
          className="scrim"
          onClick={() => setMobile(false)}
          aria-label="Close menu"
        />
      )}
      <main className="main-area">
        <Navbar
          role={role}
          user={user}
          onMenuClick={() => setMobile(!mobile)}
        />
        <div className="content">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
