import { useEffect, useState } from "react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [statusMessage, setStatusMessage] = useState({ text: "", isError: false });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  async function handlePasswordChange(e) {
    e.preventDefault();
    setStatusMessage({ text: "", isError: false });

    if (newPassword !== confirmPassword) {
      setStatusMessage({ text: "New passwords do not match.", isError: true });
      return;
    }

    if (newPassword.length < 6) {
      setStatusMessage({ text: "Password must be at least 6 characters.", isError: true });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password update failed.");

      setStatusMessage({ text: data.message, isError: false });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setStatusMessage({ text: err.message, isError: true });
    } finally {
      setLoading(false);
    }
  }

  const styles = {
    container: {
      padding: "32px",
      maxWidth: "850px",
      margin: "0 auto",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#0f172a",
    },
    card: {
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      padding: "28px",
      border: "1px solid #e2e8f0",
      marginBottom: "24px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    },
    badge: (isTeacher) => ({
      display: "inline-block",
      backgroundColor: isTeacher ? "#fef3c7" : "#eff6ff",
      color: isTeacher ? "#b45309" : "#1d4ed8",
      padding: "4px 12px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "700",
      marginBottom: "12px",
      border: isTeacher ? "1px solid #fde68a" : "1px solid #bfdbfe",
    }),
    inputGroup: {
      marginBottom: "16px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    input: {
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      fontSize: "14px",
      outline: "none",
    },
    submitBtn: {
      backgroundColor: "#2563eb",
      color: "#fff",
      border: "none",
      padding: "10px 20px",
      borderRadius: "8px",
      fontWeight: "700",
      cursor: "pointer",
    },
  };

  if (!user) return <div style={styles.container}>Loading user details...</div>;

  const isTeacher = user.role === "teacher";

  return (
    <div style={styles.container}>
      <h1 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "6px" }}>Account Settings</h1>
      <p style={{ color: "#64748b", margin: "0 0 24px 0", fontSize: "14px" }}>
        CampusHub Polytechnic User Directory Profile & Credentials
      </p>

      {/* Profile Overview Card */}
      <div style={styles.card}>
        <span style={styles.badge(isTeacher)}>
          {isTeacher ? "👨‍🏫 Faculty Member / Teacher" : "🎓 Polytechnic Student"}
        </span>
        <h2 style={{ margin: "0 0 4px 0", fontSize: "20px" }}>{user.name}</h2>
        <p style={{ color: "#64748b", margin: "0 0 16px 0", fontSize: "14px" }}>{user.email}</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", backgroundColor: "#f8fafc", padding: "16px", borderRadius: "10px" }}>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Department / Course</span>
            <strong style={{ fontSize: "14px" }}>{user.course || "Computer Science"}</strong>
          </div>
          <div>
            <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Academic Year</span>
            <strong style={{ fontSize: "14px" }}>2026-27 (Kalaburagi)</strong>
          </div>
        </div>
      </div>

      {/* Security Card: Change Password */}
      <div style={styles.card}>
        <h3 style={{ fontSize: "17px", fontWeight: "700", margin: "0 0 16px 0" }}>Update Security Password</h3>

        {statusMessage.text && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "13px",
              fontWeight: "600",
              backgroundColor: statusMessage.isError ? "#fee2e2" : "#f0fdf4",
              color: statusMessage.isError ? "#dc2626" : "#16a34a",
              border: statusMessage.isError ? "1px solid #fca5a5" : "1px solid #86efac",
            }}
          >
            {statusMessage.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange}>
          <div style={styles.inputGroup}>
            <label style={{ fontSize: "13px", fontWeight: "600" }}>Current Password</label>
            <input
              type="password"
              required
              placeholder="Enter your existing password"
              style={styles.input}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={{ fontSize: "13px", fontWeight: "600" }}>New Password</label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              style={styles.input}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={{ fontSize: "13px", fontWeight: "600" }}>Confirm New Password</label>
            <input
              type="password"
              required
              placeholder="Confirm new password"
              style={styles.input}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" disabled={loading} style={styles.submitBtn}>
            {loading ? "Saving..." : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}