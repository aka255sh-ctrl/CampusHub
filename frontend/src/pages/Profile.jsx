import { useEffect, useState } from "react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [submissionsCount, setSubmissionsCount] = useState(0);

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loadingPass, setLoadingPass] = useState(false);
  const [passMsg, setPassMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const u = JSON.parse(saved);
        setUser(u);
        fetchUserSubmissions(u.id);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  async function fetchUserSubmissions(userId) {
    try {
      const res = await fetch("https://campushub-backend-6rtk.onrender.com/api/admin/submissions");
      const data = await res.json();
      if (data.submissions) {
        const mySubs = data.submissions.filter((s) => s.student_id === userId);
        setSubmissionsCount(mySubs.length);
      }
    } catch (err) {
      console.error("Submissions load error", err);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPassMsg({ text: "", type: "" });

    if (newPassword.length < 6) {
      setPassMsg({ text: "New password must be at least 6 characters.", type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassMsg({ text: "Passwords do not match.", type: "error" });
      return;
    }

    setLoadingPass(true);

    try {
      const res = await fetch("https://campushub-backend-6rtk.onrender.com/api/auth/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user?.id,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Password update failed.");

      setPassMsg({ text: data.message || "Password changed successfully! 🔒", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPassMsg({ text: err.message, type: "error" });
    } finally {
      setLoadingPass(false);
    }
  }

  const styles = {
    container: {
      padding: "28px 36px",
      maxWidth: "960px",
      margin: "0 auto",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#0f172a",
    },
    headerCard: {
      backgroundColor: "#1e293b",
      color: "#ffffff",
      borderRadius: "16px",
      padding: "24px 30px",
      display: "flex",
      alignItems: "center",
      gap: "20px",
      marginBottom: "24px",
      boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15)",
    },
    avatar: {
      width: "72px",
      height: "72px",
      borderRadius: "50%",
      backgroundColor: "#3b82f6",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "28px",
      fontWeight: "800",
    },
    cardSection: {
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      padding: "24px",
      border: "1px solid #e2e8f0",
      marginBottom: "24px",
    },
    metaRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
      gap: "16px",
      marginTop: "16px",
    },
    metaBox: {
      backgroundColor: "#f8fafc",
      padding: "12px 16px",
      borderRadius: "10px",
      border: "1px solid #e2e8f0",
    },
    label: {
      fontSize: "12px",
      color: "#64748b",
      fontWeight: "600",
      marginBottom: "4px",
    },
    value: {
      fontSize: "14px",
      fontWeight: "700",
      color: "#0f172a",
    },
    input: {
      width: "100%",
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      fontSize: "14px",
      outline: "none",
      boxSizing: "border-box",
    },
    btn: {
      padding: "10px 20px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#2563eb",
      color: "#fff",
      fontWeight: "700",
      cursor: "pointer",
      fontSize: "14px",
    },
  };

  const isTeacher = user?.role === "teacher";

  return (
    <div style={styles.container}>
      {/* Top Banner */}
      <div style={styles.headerCard}>
        <div style={styles.avatar}>
          {user?.name ? user.name[0].toUpperCase() : "U"}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: "800", margin: 0 }}>
              {user?.name || "Campus User"}
            </h1>
            <span
              style={{
                backgroundColor: isTeacher ? "#f59e0b" : "#2563eb",
                color: "#ffffff",
                fontSize: "11px",
                fontWeight: "700",
                padding: "3px 8px",
                borderRadius: "999px",
              }}
            >
              {isTeacher ? "👨‍🏫 Faculty Administrator" : "🎓 Student"}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
            {user?.email || "user@campushub.edu"}
          </p>
        </div>
      </div>

      {/* Academic Identity Details */}
      <div style={styles.cardSection}>
        <h2 style={{ fontSize: "17px", fontWeight: "700", margin: "0 0 4px 0" }}>
          Academic Profile
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
          Department of Computer Science & Engineering • Kalaburagi Polytechnic
        </p>

        <div style={styles.metaRow}>
          <div style={styles.metaBox}>
            <div style={styles.label}>Enrollment Course</div>
            <div style={styles.value}>{user?.course || "Diploma CS"}</div>
          </div>
          <div style={styles.metaBox}>
            <div style={styles.label}>Academic Semester</div>
            <div style={styles.value}>{user?.semester || "5th Sem"}</div>
          </div>
          <div style={styles.metaBox}>
            <div style={styles.label}>Campus ID</div>
            <div style={styles.value}>#{user?.id || 1}</div>
          </div>
          <div style={styles.metaBox}>
            <div style={styles.label}>My Lab Submissions</div>
            <div style={{ ...styles.value, color: "#16a34a" }}>{submissionsCount} Work Files</div>
          </div>
        </div>
      </div>

      {/* Change Password / Security Box */}
      <div style={styles.cardSection}>
        <h2 style={{ fontSize: "17px", fontWeight: "700", margin: "0 0 4px 0" }}>
          Security & Password Update
        </h2>
        <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0" }}>
          Keep your CampusHub account secure with a strong password.
        </p>

        {passMsg.text && (
          <p
            style={{
              padding: "10px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "600",
              margin: "0 0 14px 0",
              backgroundColor: passMsg.type === "success" ? "#ecfdf5" : "#fee2e2",
              color: passMsg.type === "success" ? "#059669" : "#dc2626",
            }}
          >
            {passMsg.text}
          </p>
        )}

        <form onSubmit={handleChangePassword} style={{ maxWidth: "420px" }}>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Current Password
            </label>
            <input
              type="password"
              required
              placeholder="Enter your current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              New Password
            </label>
            <input
              type="password"
              required
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
              Confirm New Password
            </label>
            <input
              type="password"
              required
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={loadingPass} style={styles.btn}>
            {loadingPass ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}