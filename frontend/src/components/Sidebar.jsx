import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  const navItems = [
    { name: "Dashboard", path: "/", icon: "📊" },
    { name: "Study Notes", path: "/notes", icon: "📁" },
    { name: "Question Papers", path: "/papers", icon: "📝" },
    { name: "My Profile", path: "/profile", icon: "👤" },
  ];

  function handleLogout() {
    if (window.confirm("Are you sure you want to log out of CampusHub?")) {
      localStorage.removeItem("user");
      navigate("/login");
    }
  }

  const styles = {
    sidebar: {
      width: "250px",
      minHeight: "100vh",
      backgroundColor: "#0f172a",
      color: "#ffffff",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "24px 16px",
      boxSizing: "border-box",
      fontFamily: "'Inter', system-ui, sans-serif",
    },
    logoSection: {
      display: "flex",
      alignItems: "center",
      gap: "10px",
      padding: "0 10px 24px 10px",
      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
      marginBottom: "20px",
    },
    logoText: {
      fontSize: "20px",
      fontWeight: "800",
      letterSpacing: "-0.02em",
      color: "#ffffff",
      margin: 0,
    },
    navGroup: {
      display: "flex",
      flexDirection: "column",
      gap: "8px",
    },
    navLink: (active) => ({
      display: "flex",
      alignItems: "center",
      gap: "12px",
      padding: "12px 14px",
      borderRadius: "10px",
      fontSize: "14px",
      fontWeight: active ? "700" : "500",
      textDecoration: "none",
      color: active ? "#ffffff" : "#94a3b8",
      backgroundColor: active ? "#2563eb" : "transparent",
      boxShadow: active ? "0 4px 12px rgba(37, 99, 235, 0.3)" : "none",
      transition: "all 0.15s ease-in-out",
    }),
    footerSection: {
      paddingTop: "16px",
      borderTop: "1px solid rgba(255, 255, 255, 0.1)",
      display: "flex",
      flexDirection: "column",
      gap: "10px",
    },
    themeToggleBtn: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "10px 14px",
      borderRadius: "10px",
      backgroundColor: "rgba(255, 255, 255, 0.08)",
      color: "#ffffff",
      border: "1px solid rgba(255, 255, 255, 0.15)",
      fontSize: "13px",
      fontWeight: "600",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
    logoutBtn: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      padding: "12px 14px",
      borderRadius: "10px",
      backgroundColor: "rgba(239, 68, 68, 0.12)",
      color: "#f87171",
      border: "1px solid rgba(239, 68, 68, 0.2)",
      fontSize: "14px",
      fontWeight: "700",
      cursor: "pointer",
      transition: "all 0.2s ease",
    },
  };

  return (
    <aside style={styles.sidebar}>
      <div>
        {/* Brand Header */}
        <div style={styles.logoSection}>
          <span style={{ fontSize: "24px" }}>🎓</span>
          <h2 style={styles.logoText}>CampusHub</h2>
        </div>

        {/* Navigation Items */}
        <nav style={styles.navGroup}>
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={styles.navLink(isActive)}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
                    e.currentTarget.style.color = "#ffffff";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#94a3b8";
                  }
                }}
              >
                <span style={{ fontSize: "16px" }}>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Actions */}
      <div style={styles.footerSection}>
        {/* Dark/Light Switch */}
        <button
          type="button"
          style={styles.themeToggleBtn}
          onClick={() => setDarkMode(!darkMode)}
        >
          <span>{darkMode ? "☀️" : "🌙"}</span>
          <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
        </button>

        {/* Logout */}
        <button
          type="button"
          style={styles.logoutBtn}
          onClick={handleLogout}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#ef4444";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.12)";
            e.currentTarget.style.color = "#f87171";
          }}
        >
          <span>🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}