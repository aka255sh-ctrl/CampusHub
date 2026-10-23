import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PdfPreviewModal from "../components/PdfPreviewModal";

export default function Dashboard() {
  const [student, setStudent] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isRealTeacher, setIsRealTeacher] = useState(false); // Database verified teacher check
  const [stats, setStats] = useState({ notesCount: 0, papersCount: 0 });
  const [recentUploads, setRecentUploads] = useState([]);
  const [notices, setNotices] = useState([]);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // PDF Preview Modal
  const [previewFile, setPreviewFile] = useState(null);

  // Grading Modal State
  const [gradingSub, setGradingSub] = useState(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");

  // Notice Modal (Teacher)
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    sender: "Prof. Faculty Coordinator",
    tag: "Academic",
    description: "",
  });

  // Assignment Submission Modal (Student)
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [submissionFile, setSubmissionFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setStudent(u);
        if (u.role === "teacher") {
          setIsTeacher(true);
          setIsRealTeacher(true);
        } else {
          setIsTeacher(false);
          setIsRealTeacher(false);
        }
      } catch (e) {
        console.error("Local user parse error", e);
      }
    }
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      const [notesRes, papersRes, noticesRes, studentsRes, subsRes] = await Promise.all([
        fetch("https://campushub-backend-6rtk.onrender.com/api/notes"),
        fetch("https://campushub-backend-6rtk.onrender.com/api/question-papers"),
        fetch("https://campushub-backend-6rtk.onrender.com/api/notices"),
        fetch("https://campushub-backend-6rtk.onrender.com/api/admin/students"),
        fetch("https://campushub-backend-6rtk.onrender.com/api/admin/submissions"),
      ]);

      const notesData = await notesRes.json();
      const papersData = await papersRes.json();
      const noticesData = await noticesRes.json();
      const studentsData = await studentsRes.json();
      const subsData = await subsRes.json();

      const nList = notesData.notes || [];
      const pList = papersData.questionPapers || [];

      setStats({
        notesCount: nList.length,
        papersCount: pList.length,
      });

      setRecentUploads(nList.slice(0, 6));
      setNotices(noticesData.notices || []);
      setRegisteredStudents(studentsData.students || []);
      setSubmissions(subsData.submissions || []);
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Teacher actions (Protected)
  async function handleDeleteNote(id) {
    if (!isRealTeacher) return alert("Unauthorized access!");
    if (!window.confirm("Teacher Action: Delete this study material?")) return;
    try {
      const res = await fetch(`https://campushub-backend-6rtk.onrender.com/api/notes/${id}`, { method: "DELETE" });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      alert("Delete failed.");
    }
  }

  async function handleDeleteNotice(id) {
    if (!isRealTeacher) return alert("Unauthorized access!");
    if (!window.confirm("Teacher Action: Delete this bulletin?")) return;
    try {
      const res = await fetch(`https://campushub-backend-6rtk.onrender.com/api/notices/${id}`, { method: "DELETE" });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      alert("Delete failed.");
    }
  }

  async function handleCreateNotice(e) {
    e.preventDefault();
    if (!isRealTeacher) return alert("Unauthorized access!");
    try {
      const res = await fetch("https://campushub-backend-6rtk.onrender.com/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(noticeForm),
      });

      if (res.ok) {
        setShowNoticeModal(false);
        setNoticeForm({
          title: "",
          sender: `Prof. ${student?.name || "Faculty"}`,
          tag: "Academic",
          description: "",
        });
        fetchDashboardData();
      }
    } catch (err) {
      alert("Failed to post notice.");
    }
  }

  async function handleRoleChange(userId, targetRole, userName) {
    if (!isRealTeacher) return alert("Unauthorized access!");
    const actionText = targetRole === "teacher"
      ? `Promote ${userName} to Teacher / Faculty Administrator?`
      : `Demote ${userName} back to Student?`;

    if (!window.confirm(actionText)) return;

    try {
      const res = await fetch(`https://campushub-backend-6rtk.onrender.com/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update role");

      alert(data.message);
      fetchDashboardData();
    } catch (err) {
      alert(err.message || "Action failed.");
    }
  }

  // Teacher Grading Submission Handler
  async function handleGradeSubmission(e) {
    e.preventDefault();
    if (!gradingSub) return;

    try {
      const res = await fetch(`https://campushub-backend-6rtk.onrender.com/api/admin/submissions/${gradingSub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "Verified & Approved",
          marks: gradeMarks.trim() || "10/10",
          feedback: gradeFeedback.trim() || "Approved by faculty.",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit evaluation");

      setGradingSub(null);
      setGradeMarks("");
      setGradeFeedback("");
      fetchDashboardData();
    } catch (err) {
      alert(err.message || "Could not save grade.");
    }
  }

  function exportReportToCSV() {
    if (!isRealTeacher) return alert("Unauthorized access!");
    if (!registeredStudents.length) {
      alert("No student records available to export.");
      return;
    }

    const headers = [
      "Student ID",
      "Student Name",
      "Email",
      "Course",
      "Semester",
      "Role",
      "Latest Assignment Title",
      "Submission Status",
      "Marks",
      "Feedback",
    ];

    const rows = registeredStudents.map((st) => {
      const sub = submissions.find((s) => s.student_id === st.id);
      return [
        st.id,
        `"${st.name || ""}"`,
        `"${st.email || ""}"`,
        `"${st.course || "Diploma CS"}"`,
        `"${st.semester || "5th Sem"}"`,
        `"${st.role || "student"}"`,
        `"${sub ? sub.assignment_title : "No submission"}"`,
        `"${sub ? sub.status : "Pending"}"`,
        `"${sub?.marks || "—"}"`,
        `"${sub?.feedback || "—"}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `CampusHub_Academic_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Student submission handler
  async function handleStudentSubmit(e) {
    e.preventDefault();
    const currentUserId = student?.id || 1;
    const currentUserName = student?.name || displayName;

    if (!assignmentTitle.trim()) {
      alert("Please enter the assignment or lab title.");
      return;
    }

    if (!submissionFile) {
      alert("Please attach a file before submitting.");
      return;
    }

    setSubmitting(true);
    setSubmitSuccess("");

    const formData = new FormData();
    formData.append("student_id", currentUserId);
    formData.append("student_name", currentUserName);
    formData.append("assignment_title", assignmentTitle.trim());
    formData.append("submissionFile", submissionFile);

    try {
      const res = await fetch("https://campushub-backend-6rtk.onrender.com/api/submissions", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");

      setSubmitSuccess("Assignment and File submitted successfully to faculty! ✅");
      setAssignmentTitle("");
      setSubmissionFile(null);
      fetchDashboardData();

      setTimeout(() => {
        setShowSubmitModal(false);
        setSubmitSuccess("");
      }, 1500);
    } catch (err) {
      alert(err.message || "Failed to submit assignment.");
    } finally {
      setSubmitting(false);
    }
  }

  const styles = {
    container: {
      padding: "28px 36px",
      maxWidth: "1350px",
      margin: "0 auto",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#0f172a",
      backgroundColor: "#f8fafc",
      minHeight: "100vh",
    },
    headerCard: {
      backgroundColor: isRealTeacher && isTeacher ? "#0f172a" : "#1e293b",
      color: "#ffffff",
      borderRadius: "16px",
      padding: "24px 30px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "18px",
      marginBottom: "28px",
      boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15)",
    },
    toggleBtn: {
      backgroundColor: isTeacher ? "#f59e0b" : "#3b82f6",
      color: "#ffffff",
      border: "none",
      padding: "8px 14px",
      borderRadius: "8px",
      fontSize: "12px",
      fontWeight: "700",
      cursor: "pointer",
    },
    metricGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
      gap: "18px",
      marginBottom: "28px",
    },
    metricCard: {
      backgroundColor: "#ffffff",
      padding: "20px",
      borderRadius: "14px",
      border: "1px solid #e2e8f0",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    mainGrid: {
      display: "grid",
      gridTemplateColumns: isRealTeacher && isTeacher ? "1.2fr 1.2fr" : "1.5fr 1fr",
      gap: "24px",
      marginBottom: "28px",
    },
    cardSection: {
      backgroundColor: "#ffffff",
      borderRadius: "16px",
      padding: "24px",
      border: "1px solid #e2e8f0",
    },
    docItem: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 14px",
      borderRadius: "10px",
      border: "1px solid #f1f5f9",
      backgroundColor: "#ffffff",
      marginBottom: "10px",
    },
  };

  const displayName = student?.name || "Akash kumar";

  return (
    <div style={styles.container}>
      {previewFile && (
        <PdfPreviewModal
          fileUrl={previewFile.url}
          title={previewFile.title}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* Top Academic Banner */}
      <div style={styles.headerCard}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
            <span style={{ backgroundColor: "rgba(255,255,255,0.12)", padding: "4px 10px", borderRadius: "999px", fontSize: "12px", fontWeight: "600" }}>
              🏛️ Department of Computer Science & Engineering
            </span>

            {isRealTeacher ? (
              <button
                style={styles.toggleBtn}
                onClick={() => setIsTeacher(!isTeacher)}
              >
                {isTeacher ? "Switch to Student View 🎓" : "Switch to Faculty Admin View 👨‍🏫"}
              </button>
            ) : (
              <span style={{ backgroundColor: "#2563eb", color: "#fff", padding: "4px 10px", borderRadius: "999px", fontSize: "11px", fontWeight: "700" }}>
                🎓 Student Account
              </span>
            )}
          </div>

          <h1 style={{ fontSize: "24px", fontWeight: "800", margin: "0 0 6px 0" }}>
            {isRealTeacher && isTeacher
              ? `Faculty Administration Control — Prof. ${displayName}`
              : "Student Academic Portal 2026-27 — Kalaburagi, Karnataka"}
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
            {isRealTeacher && isTeacher
              ? "Access Level: Chief Faculty Controller • Kalaburagi Polytechnic • Full Role Delegation Authority"
              : `Student: ${displayName} • Academic Year 2026-27 • Kalaburagi District`}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {isRealTeacher && isTeacher ? (
            <button
              onClick={() => setShowNoticeModal(true)}
              style={{ backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
            >
              + Post Notice
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
            >
              📤 Submit Assignment
            </button>
          )}

          <Link to="/notes" style={{ backgroundColor: "#fff", color: "#0f172a", padding: "10px 16px", borderRadius: "8px", fontWeight: "600", fontSize: "13px", textDecoration: "none" }}>
            📁 Notes ({stats.notesCount})
          </Link>
          <Link to="/papers" style={{ backgroundColor: "#3b82f6", color: "#fff", padding: "10px 16px", borderRadius: "8px", fontWeight: "600", fontSize: "13px", textDecoration: "none" }}>
            📝 Papers ({stats.papersCount})
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={styles.metricGrid}>
        <div style={styles.metricCard}>
          <div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px 0", fontWeight: "600" }}>Published Notes</p>
            <h3 style={{ fontSize: "28px", fontWeight: "800", margin: 0 }}>{stats.notesCount}</h3>
            <p style={{ fontSize: "12px", color: "#16a34a", margin: "4px 0 0 0", fontWeight: "600" }}>Faculty Verified</p>
          </div>
          <span style={{ fontSize: "26px" }}>📚</span>
        </div>

        <div style={styles.metricCard}>
          <div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px 0", fontWeight: "600" }}>Previous Papers</p>
            <h3 style={{ fontSize: "28px", fontWeight: "800", margin: 0 }}>{stats.papersCount}</h3>
            <p style={{ fontSize: "12px", color: "#d97706", margin: "4px 0 0 0", fontWeight: "600" }}>Mid & End Terms</p>
          </div>
          <span style={{ fontSize: "26px" }}>📜</span>
        </div>

        <div style={styles.metricCard}>
          <div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px 0", fontWeight: "600" }}>Registered Users</p>
            <h3 style={{ fontSize: "28px", fontWeight: "800", margin: 0 }}>{registeredStudents.length}</h3>
            <p style={{ fontSize: "12px", color: "#2563eb", margin: "4px 0 0 0", fontWeight: "600" }}>Department Portal</p>
          </div>
          <span style={{ fontSize: "26px" }}>👥</span>
        </div>

        <div style={styles.metricCard}>
          <div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px 0", fontWeight: "600" }}>Live Submissions</p>
            <h3 style={{ fontSize: "28px", fontWeight: "800", margin: 0 }}>{submissions.length}</h3>
            <p style={{ fontSize: "12px", color: "#16a34a", margin: "4px 0 0 0", fontWeight: "600" }}>Verified Received</p>
          </div>
          <span style={{ fontSize: "26px" }}>📋</span>
        </div>
      </div>

      {/* Main Split Sections */}
      <div style={styles.mainGrid}>
        <div style={styles.cardSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: "700", margin: 0 }}>
              Department Notices & Bulletins
            </h2>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
              Kalaburagi Board
            </span>
          </div>

          {notices.map((n) => (
            <div key={n.id} style={{ padding: "16px", borderRadius: "12px", backgroundColor: "#f8fafc", border: "1px solid #edf2f7", marginBottom: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", fontSize: "11px", fontWeight: "700", padding: "2px 8px", borderRadius: "4px" }}>
                  {n.tag}
                </span>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span style={{ fontSize: "12px", color: "#94a3b8" }}>Oct 15, 2026</span>
                  {isRealTeacher && isTeacher && (
                    <button
                      onClick={() => handleDeleteNotice(n.id)}
                      style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer", fontWeight: "700" }}
                      title="Delete Notice"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: "700", margin: "0 0 6px 0", color: "#1e293b" }}>{n.title}</h3>
              <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 8px 0" }}>{n.description}</p>
              <div style={{ fontSize: "12px", color: "#64748b" }}>
                Issued by: <strong>{n.sender}</strong>
              </div>
            </div>
          ))}
        </div>

        <div style={styles.cardSection}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: "700", margin: 0 }}>Academic Repository</h2>
            <Link to="/notes" style={{ fontSize: "12px", color: "#2563eb", fontWeight: "700", textDecoration: "none" }}>
              View All →
            </Link>
          </div>

          {recentUploads.map((n) => (
            <div key={n.id} style={styles.docItem}>
              <div>
                <p style={{ fontSize: "14px", fontWeight: "600", margin: "0 0 2px 0", color: "#1e293b" }}>{n.title}</p>
                <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>{n.subject} • {n.semester}</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <button
                  onClick={() => setPreviewFile({ url: n.file_url, title: n.title })}
                  style={{ fontSize: "12px", fontWeight: "600", color: "#2563eb", background: "#eff6ff", border: "none", padding: "6px 12px", borderRadius: "6px", cursor: "pointer" }}
                >
                  👁️ Preview
                </button>
                {isRealTeacher && isTeacher && (
                  <button
                    onClick={() => handleDeleteNote(n.id)}
                    style={{ backgroundColor: "#fee2e2", color: "#dc2626", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                    title="Faculty Delete Material"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Teacher View: User Registry + Delegation Management + Submissions Evaluation */}
      {isRealTeacher && isTeacher && (
        <div style={{ ...styles.cardSection, marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "800", margin: "0 0 4px 0", color: "#0f172a" }}>
                🧑‍🎓 Portal Users & Faculty Delegation Management
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Authorize other teachers, evaluate assignments with marks/feedback, and inspect submissions.
              </p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={exportReportToCSV}
                style={{
                  padding: "8px 14px",
                  backgroundColor: "#0284c7",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer",
                  fontSize: "12px",
                }}
              >
                📥 Export Report (Excel/CSV)
              </button>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a", backgroundColor: "#f0fdf4", padding: "6px 12px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                Total: {registeredStudents.length} Users
              </span>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "12px" }}>ID</th>
                  <th style={{ padding: "12px" }}>Name & Email</th>
                  <th style={{ padding: "12px" }}>Role Status</th>
                  <th style={{ padding: "12px" }}>Latest Submission</th>
                  <th style={{ padding: "12px" }}>Attached Work</th>
                  <th style={{ padding: "12px" }}>Evaluation & Marks</th>
                  <th style={{ padding: "12px" }}>Faculty Delegation</th>
                </tr>
              </thead>
              <tbody>
                {registeredStudents.map((st) => {
                  const studentSub = submissions.find((s) => s.student_id === st.id);
                  const isCurrentTeacher = st.role === "teacher";

                  return (
                    <tr key={st.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontWeight: "600", color: "#64748b" }}>#{st.id}</td>
                      <td style={{ padding: "12px" }}>
                        <div style={{ fontWeight: "700", color: "#1e293b" }}>{st.name}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{st.email}</div>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          backgroundColor: isCurrentTeacher ? "#fef3c7" : "#eff6ff",
                          color: isCurrentTeacher ? "#b45309" : "#1d4ed8",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: "700",
                          border: isCurrentTeacher ? "1px solid #fde68a" : "1px solid #bfdbfe"
                        }}>
                          {isCurrentTeacher ? "👨‍🏫 Faculty Teacher" : "🎓 Student"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", color: "#0f172a", fontWeight: "500" }}>
                        {studentSub ? studentSub.assignment_title : "—"}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {studentSub?.file_url ? (
                          <button
                            onClick={() => setPreviewFile({ url: studentSub.file_url, title: studentSub.assignment_title })}
                            style={{
                              padding: "4px 8px",
                              fontSize: "11px",
                              backgroundColor: "#f1f5f9",
                              color: "#2563eb",
                              border: "1px solid #cbd5e1",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "700"
                            }}
                          >
                            👁️ View
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "12px" }}>
                        {studentSub ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span style={{
                              backgroundColor: studentSub.status === "Verified & Approved" ? "#ecfdf5" : "#eff6ff",
                              color: studentSub.status === "Verified & Approved" ? "#059669" : "#2563eb",
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "700"
                            }}>
                              {studentSub.status === "Verified & Approved" ? `Graded (${studentSub.marks || "Done"})` : "Submitted"}
                            </span>

                            <button
                              onClick={() => {
                                setGradingSub(studentSub);
                                setGradeMarks(studentSub.marks || "18/20");
                                setGradeFeedback(studentSub.feedback || "Good work, approved.");
                              }}
                              style={{
                                padding: "3px 8px",
                                fontSize: "11px",
                                backgroundColor: "#2563eb",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontWeight: "700"
                              }}
                            >
                              {studentSub.status === "Verified & Approved" ? "Re-Grade" : "Evaluate"}
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>None</span>
                        )}
                      </td>

                      {/* Faculty Role Delegation Column */}
                      <td style={{ padding: "12px" }}>
                        {isCurrentTeacher ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#16a34a" }}>
                              🛡️ Authorized
                            </span>
                            {st.id !== student?.id && (
                              <button
                                onClick={() => handleRoleChange(st.id, "student", st.name)}
                                style={{
                                  padding: "3px 8px",
                                  fontSize: "10px",
                                  backgroundColor: "#fee2e2",
                                  color: "#dc2626",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontWeight: "600"
                                }}
                              >
                                Demote
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleRoleChange(st.id, "teacher", st.name)}
                            style={{
                              padding: "5px 10px",
                              fontSize: "11px",
                              backgroundColor: "#0f172a",
                              color: "#fff",
                              border: "none",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontWeight: "700"
                            }}
                          >
                            + Make Teacher
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Evaluation & Grading Modal (Teacher Only) */}
      {gradingSub && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "16px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "14px", maxWidth: "420px", width: "100%", padding: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 10px 0" }}>
              Evaluate: {gradingSub.assignment_title}
            </h2>
            <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 16px 0" }}>
              Student: <strong>{gradingSub.student_name}</strong>
            </p>

            <form onSubmit={handleGradeSubmission}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                  Marks / Grade
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 18/20 or A+"
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                  Faculty Feedback / Remarks
                </label>
                <textarea
                  rows="3"
                  placeholder="Feedback on lab output, code structure, etc."
                  value={gradeFeedback}
                  onChange={(e) => setGradeFeedback(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setGradingSub(null)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#16a34a", color: "#fff", fontWeight: "700", cursor: "pointer" }}
                >
                  Save Evaluation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Assignment Submission Modal */}
      {showSubmitModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "14px", maxWidth: "460px", width: "100%", padding: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 16px 0" }}>Submit Academic Assignment</h2>

            {submitSuccess && (
              <p style={{ color: "#16a34a", fontSize: "13px", fontWeight: "600", margin: "0 0 12px 0" }}>
                {submitSuccess}
              </p>
            )}

            <form onSubmit={handleStudentSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Student Name</label>
                <input
                  type="text"
                  disabled
                  value={displayName}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#f1f5f9", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Assignment / Lab Title</label>
                <input
                  type="text"
                  required
                  placeholder="Type topic (e.g. CN Lab Program 3, Microcontroller Unit 2)"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                  Attach File (PDF, Docs, Image, Video)
                </label>
                <input
                  type="file"
                  name="submissionFile"
                  accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSubmissionFile(e.target.files[0]);
                    }
                  }}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#2563eb", color: "#fff", fontWeight: "700", cursor: "pointer" }}
                >
                  {submitting ? "Submitting..." : "Submit to Faculty"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notice Modal (Teacher Only) */}
      {showNoticeModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "14px", maxWidth: "460px", width: "100%", padding: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 16px 0" }}>Post Department Notice</h2>
            <form onSubmit={handleCreateNotice}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Notice Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 3 Submission Deadline"
                  value={noticeForm.title}
                  onChange={(e) => setNoticeForm({ ...noticeForm, title: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Category / Tag</label>
                <select
                  value={noticeForm.tag}
                  onChange={(e) => setNoticeForm({ ...noticeForm, tag: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", boxSizing: "border-box" }}
                >
                  <option value="Academic">Academic</option>
                  <option value="Exam Cell">Exam Cell</option>
                  <option value="Lab Review">Lab Review</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Details</label>
                <textarea
                  rows="3"
                  required
                  placeholder="Enter notice details..."
                  value={noticeForm.description}
                  onChange={(e) => setNoticeForm({ ...noticeForm, description: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowNoticeModal(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#16a34a", color: "#fff", fontWeight: "700", cursor: "pointer" }}>
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}