import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  const navLinks = [
    { name: "Dashboard", path: "/", icon: "📊" },
    { name: "Notes", path: "/notes", icon: "📚" },
    { name: "Question Papers", path: "/papers", icon: "📝" },
    { name: "Profile", path: "/profile", icon: "👤" },
  ];

  return (
    <>
      {/* Mobile Top Bar (Only visible on small screens) */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 18px",
          backgroundColor: "#0f172a",
          color: "#ffffff",
        }}
        className="mobile-top-bar"
      >
        <span style={{ fontWeight: "800", fontSize: "18px" }}>CampusHub</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            fontSize: "22px",
            cursor: "pointer",
          }}
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Main Sidebar */}
      <aside
        style={{
          width: "250px",
          backgroundColor: "#0f172a",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "24px 16px",
          minHeight: "100vh",
          transition: "transform 0.3s ease",
        }}
        className={`main-sidebar ${isOpen ? "open" : ""}`}
      >
        <div>
          <div style={{ padding: "0 12px 28px 12px" }}>
            <h2 style={{ margin: 0, fontSize: "22px", fontWeight: "800", color: "#38bdf8" }}>
              CampusHub
            </h2>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>Polytechnic Portal 2026</span>
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {navLinks.map((link) => {
              const active = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    fontSize: "14px",
                    fontWeight: active ? "700" : "500",
                    color: active ? "#ffffff" : "#94a3b8",
                    backgroundColor: active ? "#1e293b" : "transparent",
                    textDecoration: "none",
                  }}
                >
                  <span>{link.icon}</span>
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "10px",
              backgroundColor: "#ef4444",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              fontWeight: "700",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Logout 🚪
          </button>
        </div>
      </aside>

      {/* Responsive Inline CSS */}
      <style>{`
        @media (min-width: 769px) {
          .mobile-top-bar { display: none !important; }
        }
        @media (max-width: 768px) {
          .main-sidebar {
            position: fixed;
            top: 52px;
            left: 0;
            bottom: 0;
            z-index: 999;
            transform: translateX(-100%);
          }
          .main-sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}