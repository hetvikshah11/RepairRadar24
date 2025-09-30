import React from "react";
import { useNavigate } from "react-router-dom";
import SettingsIcon from "@mui/icons-material/Settings";
import "./navbar.css"; // separate css for navbar

export default function Navbar({ onLogout }) {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="logo">RepairRadar Dashboard</div>
      <div className="nav-links">
        <button onClick={() => navigate("/dashboard")} className="nav-btn">
          Home
        </button>
        <button onClick={onLogout} className="nav-btn">
          Logout
        </button>
        <button
          onClick={() => navigate("/settings")}
          className="nav-btn settings-btn"
          title="Settings"
        >
          <SettingsIcon />
        </button>
      </div>
    </nav>
  );
}
