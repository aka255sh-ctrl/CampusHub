import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FileDropzone from "../components/FileDropzone";
import PdfPreviewModal from "../components/PdfPreviewModal";

export default function Dashboard() {
  const [doubts, setDoubts] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [doubtSubject, setDoubtSubject] = useState("Full Stack Development");
  const [replyTextMap, setReplyTextMap] = useState({});
  const [liveClass, setLiveClass] = useState(null);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [liveForm, setLiveForm] = useState({ subject: "", meetUrl: "", topic: "" });

  // Remote Learning Attendance States
  const [attendanceStatus, setAttendanceStatus] = useState({ isOpen: false });
  const [markedAttendance, setMarkedAttendance] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);

  const [student, setStudent] = useState(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [isRealTeacher, setIsRealTeacher] = useState(false);
  const [stats, setStats] = useState({ notesCount: 0, papersCount: 0 });
  const [recentUploads, setRecentUploads] = useState([]);
  const [notices, setNotices] = useState([]);
  const [registeredStudents, setRegisteredStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [gradingSub, setGradingSub] = useState(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [gradeFeedback, setGradeFeedback] = useState("");
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeForm, setNoticeForm] = useState({
    title: "",
    sender: "Prof. Faculty Coordinator",
    tag: "Academic",
    description: "",
  });
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
      const doubtsRes = await fetch("https://campushub-backend-6rtk.onrender.com/api/doubts");
      const doubtsData = await doubtsRes.json();
      setDoubts(doubtsData.doubts || []);
    } catch (e) {
      console.error("Doubts load error:", e);
    }

    try {
      const liveRes = await fetch("https://campushub-backend-6rtk.onrender.com/api/live-class");
      const liveData = await liveRes.json();
      setLiveClass(liveData.liveClass || null);
    } catch (e) {
      console.error("Live class fetch error:", e);
    }

    try {
      const attRes = await fetch("https://campushub-backend-6rtk.onrender.com/api/attendance/status");
      const attData = await attRes.json();
      setAttendanceStatus(attData.attendanceWindow || { isOpen: false });
      setAttendanceRecords(attData.records || []);
    } catch (e) {
      console.error("Attendance status load error:", e);
    }

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

  function getNoticeBadge(tag, title = "") {
    const text = (tag + " " + title).toLowerCase();
    if (text.includes("deadline") || text.includes("due") || text.includes("urgent")) {
      return { label: "⚠️ Urgent Deadline", bg: "#fef2f2", color: "#dc2626", border: "#fecaca" };
    }
    if (text.includes("exam") || text.includes("test") || text.includes("mid")) {
      return { label: "🔥 Exam Cell", bg: "#fffbeb", color: "#d97706", border: "#fde68a" };
    }
    if (text.includes("lab")) {
      return { label: "🔬 Lab Review", bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" };
    }
    return { label: tag || "Academic", bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
  }

  async function handleStartLiveClass(e) {
    e.preventDefault();
    if (!liveForm.meetUrl.trim()) return alert("Please enter Google Meet / Zoom link!");

    try {
      const res = await fetch("https://campushub-backend-6rtk.onrender.com/api/live-class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...liveForm,
          teacherName: displayName,
        }),
      });
      if (res.ok) {
        setShowLiveModal(false);
        setLiveForm({ subject: "", meetUrl: "", topic: "" });
        fetchDashboardData();
      }
    } catch (err) {
      alert("Failed to start live class.");
    }
  }

  async function handleEndLiveClass() {
    if (!window.confirm("Do you want to end this live session for all students?")) return;
    try {
      const res = await fetch("https://campushub-backend-6rtk.onrender.com/api/live-class", {
        method: "DELETE",
      });
      if (res.ok) fetchDashboardData();
    } catch (err) {
      alert("Failed to end session.");
    }
  }

  async function handleOpenAttendance() {
    const subject = prompt("Enter Subject for Attendance session:", liveClass?.subject || "Computer Science");
    if (!subject) return;

    try {
      const res = await fetch("https://campushub-backend-6rtk.onrender.com/api/attendance/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, durationMinutes: 5 }),
      });
      if (res.ok) {
        alert("Attendance session opened for 5 minutes! 🟢");
        fetchDashboardData();
      }
    } catch (err) {
      alert("Failed to open attendance window.");
    }
  }

  async function handleMarkAttendance() {
    try {
      const res = await fetch("https://campushub-backend-6rtk.onrender.com/api/attendance/mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student?.id || 1,
          studentName: displayName,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to mark attendance");
      setMarkedAttendance(true);
      alert(data.message);
      fetchDashboardData();
    } catch (err) {
      alert(err.message || "Failed to mark attendance.");
    }
  }

  function exportAttendanceCSV() {
    if (!attendanceRecords.length) return alert("No attendance records to export.");
    const headers = ["Student ID", "Student Name", "Subject", "Date", "Timestamp", "Status"];
    const rows = attendanceRecords.map((r) => [r.studentId, `"${r.studentName}"`, `"${r.subject}"`, r.date, r.timestamp, "Present"]);
    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Attendance_${attendanceStatus.subject || "Session"}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handlePostDoubt(e) {
    e.preventDefault();
    if (!newQuestion.trim()) return;

    try {
      const res = await fetch("https://campushub-backend-6rtk.onrender.com/api/doubts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentName: displayName,
          subject: doubtSubject,
          question: newQuestion,
        }),
      });
      if (res.ok) {
        setNewQuestion("");
        fetchDashboardData();
      }
    } catch (err) {
      alert("Failed to submit question.");
    }
  }

  async function handleReplyDoubt(doubtId) {
    const reply = replyTextMap[doubtId];
    if (!reply || !reply.trim()) return alert("Please type an answer first.");

    try {
      const res = await fetch(`https://campushub-backend-6rtk.onrender.com/api/doubts/${doubtId}/reply`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reply,
          repliedBy: displayName,
        }),
      });
      if (res.ok) {
        setReplyTextMap({ ...replyTextMap, [doubtId]: "" });
        fetchDashboardData();
      }
    } catch (err) {
      alert("Failed to submit reply.");
    }
  }

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
        `"${sub?.marks ? sub.marks : "-"}"`,
        `"${sub?.feedback ? sub.feedback : "-"}"`,
      ];
    });

    const csvContent =
      "\uFEFF" +
      headers.join(",") +
      "\n" +
      rows.map((e) => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `CampusHub_Academic_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

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
      marginBottom: "20px",
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
      cursor: "pointer",
      textDecoration: "none",
      color: "inherit",
      boxSizing: "border-box",
      width: "100%",
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
  const studentMySubmissions = submissions.filter((s) => s.student_id === student?.id);
  const latestNotice = notices[0];

  // Marks and Progress calculation
  const gradedSubs = studentMySubmissions.filter((s) => s.status === "Verified & Approved");
  const completionPercentage = studentMySubmissions.length > 0
    ? Math.round((gradedSubs.length / studentMySubmissions.length) * 100)
    : 0;

  let marksSum = 0;
  let marksMax = 0;
  gradedSubs.forEach((s) => {
    if (s.marks && s.marks.includes("/")) {
      const parts = s.marks.split("/");
      const ob = parseFloat(parts[0]);
      const tot = parseFloat(parts[1]);
      if (!isNaN(ob) && !isNaN(tot) && tot > 0) {
        marksSum += ob;
        marksMax += tot;
      }
    }
  });

  // Weekly Online Class Schedule (Monday to Saturday)
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const currentDayName = daysOfWeek[new Date().getDay()];

  const weeklySchedule = {
    Monday: [
      { time: "09:30 AM - 10:30 AM", subject: "Full Stack Development", faculty: "Prof. Akash Kumar", room: "Virtual Room A" },
      { time: "11:00 AM - 12:00 PM", subject: "Computer Networks & Security", faculty: "Prof. Coordinator", room: "Virtual Room B" },
      { time: "01:30 PM - 03:30 PM", subject: "FSD Practical Lab & Review", faculty: "Prof. Akash Kumar", room: "Lab Stream 1" },
    ],
    Tuesday: [
      { time: "09:30 AM - 10:30 AM", subject: "Database Management Systems", faculty: "Prof. Faculty Coordinator", room: "Virtual Room A" },
      { time: "11:00 AM - 12:00 PM", subject: "Software Engineering Principles", faculty: "Prof. Coordinator", room: "Virtual Room B" },
      { time: "01:30 PM - 03:30 PM", subject: "DBMS SQL Practical Lab", faculty: "Prof. Faculty Coordinator", room: "Lab Stream 2" },
    ],
    Wednesday: [
      { time: "09:30 AM - 10:30 AM", subject: "Full Stack Development", faculty: "Prof. Akash Kumar", room: "Virtual Room A" },
      { time: "11:00 AM - 12:00 PM", subject: "Operating Systems Architecture", faculty: "Prof. Coordinator", room: "Virtual Room B" },
      { time: "02:00 PM - 03:00 PM", subject: "Weekly Doubt Clearing Forum", faculty: "All Faculty Members", room: "General Room" },
    ],
    Thursday: [
      { time: "09:30 AM - 10:30 AM", subject: "Microcontrollers & Embedded Systems", faculty: "Prof. Coordinator", room: "Virtual Room A" },
      { time: "11:00 AM - 12:00 PM", subject: "Computer Networks & Security", faculty: "Prof. Coordinator", room: "Virtual Room B" },
      { time: "01:30 PM - 03:30 PM", subject: "Network Packet Tracing Lab", faculty: "Prof. Coordinator", room: "Lab Stream 1" },
    ],
    Friday: [
      { time: "09:30 AM - 10:30 AM", subject: "Software Engineering & Testing", faculty: "Prof. Coordinator", room: "Virtual Room A" },
      { time: "11:00 AM - 12:00 PM", subject: "Database Management Systems", faculty: "Prof. Faculty Coordinator", room: "Virtual Room B" },
      { time: "02:00 PM - 04:00 PM", subject: "Assignment Submission & Evaluation Window", faculty: "Prof. Akash Kumar", room: "Portal Audit" },
    ],
    Saturday: [
      { time: "10:00 AM - 11:30 AM", subject: "Special Technical Seminar & Viva Prep", faculty: "Department HOD", room: "Main Hall" },
      { time: "12:00 PM - 01:00 PM", subject: "Student Self-Study & Notes Review", faculty: "Self-Paced", room: "Digital Library" },
    ],
    Sunday: [
      { time: "All Day", subject: "Academic Recess / Weekend Revision", faculty: "Self-Paced", room: "Off-Campus" },
    ],
  };

  const todayClasses = weeklySchedule[currentDayName] || weeklySchedule["Monday"];
  const avgScore = marksMax > 0 ? Math.round((marksSum / marksMax) * 100) : null;

  return (
    <div style={styles.container}>
      {previewFile && (
        <PdfPreviewModal
          fileUrl={previewFile.url}
          title={previewFile.title}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* 🔴 Remote Learning: Live Lecture Alert Banner */}
      {liveClass && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "2px solid #f87171",
            borderRadius: "14px",
            padding: "16px 22px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                backgroundColor: "#ef4444",
                boxShadow: "0 0 0 4px rgba(239, 68, 68, 0.25)",
              }}
            />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: "800", backgroundColor: "#dc2626", color: "#fff", padding: "2px 8px", borderRadius: "4px", textTransform: "uppercase" }}>
                  LIVE CLASS NOW
                </span>
                <span style={{ fontSize: "12px", color: "#7f1d1d", fontWeight: "600" }}>
                  Active Remote Session
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#991b1b" }}>
                {liveClass.subject}: <span style={{ fontWeight: "600" }}>{liveClass.topic}</span>
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#b91c1c" }}>
                Conducted by <strong>{liveClass.teacherName}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <a
              href={liveClass.meetUrl.startsWith("http") ? liveClass.meetUrl : `https://${liveClass.meetUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                backgroundColor: "#dc2626",
                color: "#ffffff",
                textDecoration: "none",
                padding: "10px 18px",
                borderRadius: "8px",
                fontWeight: "800",
                fontSize: "13px",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              Join Lecture Now ↗
            </a>
            {isRealTeacher && isTeacher && (
              <button
                onClick={handleEndLiveClass}
                style={{
                  backgroundColor: "#fff",
                  color: "#dc2626",
                  border: "1px solid #fca5a5",
                  padding: "9px 14px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                End Class ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* 🟢 Remote Learning: Digital Attendance Active Banner */}
      {attendanceStatus.isOpen && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "2px solid #86efac",
            borderRadius: "14px",
            padding: "16px 22px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "14px",
            boxShadow: "0 4px 12px rgba(22, 163, 74, 0.12)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontSize: "28px" }}>🟢</span>
            <div>
              <h4 style={{ margin: "0 0 2px 0", color: "#166534", fontSize: "15px", fontWeight: "800" }}>
                Live Attendance Window Active: {attendanceStatus.subject}
              </h4>
              <p style={{ margin: 0, fontSize: "12px", color: "#15803d" }}>
                Session open for 5 minutes. Total Recorded: <strong>{attendanceRecords.length} Students</strong>
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {!isTeacher ? (
              <button
                onClick={handleMarkAttendance}
                disabled={markedAttendance}
                style={{
                  backgroundColor: markedAttendance ? "#94a3b8" : "#16a34a",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "800",
                  fontSize: "13px",
                  cursor: markedAttendance ? "not-allowed" : "pointer",
                }}
              >
                {markedAttendance ? "✓ Attendance Recorded" : "✋ Mark My Attendance"}
              </button>
            ) : (
              <button
                onClick={exportAttendanceCSV}
                style={{
                  backgroundColor: "#0284c7",
                  color: "#fff",
                  border: "none",
                  padding: "8px 14px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "12px",
                  cursor: "pointer",
                }}
              >
                📥 Download Attendance Sheet
              </button>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Urgent Announcement / Exam Marquee Ticker */}
      <div
        style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          borderRadius: "12px",
          padding: "10px 18px",
          marginBottom: "18px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          boxShadow: "0 2px 4px rgba(37, 99, 235, 0.05)",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontSize: "11px",
            fontWeight: "800",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            padding: "4px 8px",
            borderRadius: "6px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              backgroundColor: "#ffffff",
              display: "inline-block",
            }}
          />
          Live Notice
        </span>

        <div
          style={{
            flex: 1,
            overflow: "hidden",
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            fontSize: "13px",
            color: "#1e40af",
            fontWeight: "500",
            minWidth: "200px",
          }}
        >
          {latestNotice ? (
            <>
              📢 <strong>{latestNotice.title}:</strong> {latestNotice.description}
            </>
          ) : (
            <>
              📢 <strong>Exam Cell Alert:</strong> Mid-Term & End-Term previous question papers are now available in the repository!
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <Link
            to="/papers"
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: "#2563eb",
              textDecoration: "none",
              padding: "4px 10px",
              borderRadius: "6px",
              backgroundColor: "#dbeafe",
            }}
          >
            Question Papers →
          </Link>
        </div>
      </div>

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
              ? `Faculty Administration Control — ${displayName.startsWith("Prof.") ? displayName : `Prof. ${displayName}`}`
              : "Student Academic Portal 2026-27 — Kalaburagi, Karnataka"}
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8" }}>
            {isRealTeacher && isTeacher
              ? "Access Level: Chief Faculty Controller • Kalaburagi Polytechnic • Full Role Delegation Authority"
              : `Student: ${displayName} • Academic Year 2026-27 • Kalaburagi District`}
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {isRealTeacher && isTeacher ? (
            <>
              {/* 🔴 Start Live Class Button */}
              <button
                onClick={() => setShowLiveModal(true)}
                style={{
                  backgroundColor: liveClass ? "#dc2626" : "#ef4444",
                  color: "#fff",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "13px",
                }}
              >
                <span>🔴</span> {liveClass ? "Manage Live Class" : "+ Start Live Class"}
              </button>

              {/* 📋 Open Attendance Button */}
              <button
                onClick={handleOpenAttendance}
                style={{
                  backgroundColor: attendanceStatus.isOpen ? "#15803d" : "#16a34a",
                  color: "#fff",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>📋</span> {attendanceStatus.isOpen ? `Attendance (${attendanceRecords.length})` : "Take Attendance"}
              </button>

              <button
                onClick={() => setShowNoticeModal(true)}
                style={{ backgroundColor: "#0284c7", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
              >
                + Post Notice
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowSubmitModal(true)}
              style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
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

      {/* Smart Urgent Alert Banner */}
      {notices.some((n) => (n.tag + " " + n.title).toLowerCase().match(/(deadline|due|urgent|exam)/)) && (
        <div
          style={{
            backgroundColor: "#fff1f2",
            border: "1px solid #fecdd3",
            borderRadius: "12px",
            padding: "12px 18px",
            marginBottom: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>🚨</span>
            <div>
              <strong style={{ fontSize: "13px", color: "#9f1239" }}>Important Academic Alert:</strong>
              <span style={{ fontSize: "13px", color: "#be123c", marginLeft: "6px" }}>
                Active assignment submission or exam deadlines are running. Please check bulletins below!
              </span>
            </div>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById("student-submissions-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              else setShowSubmitModal(true);
            }}
            style={{
              padding: "6px 14px",
              backgroundColor: "#e11d48",
              color: "#fff",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            Submit Now →
          </button>
        </div>
      )}

      {/* Student Academic Progress Bar Widget */}
      {!isTeacher && studentMySubmissions.length > 0 && (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            padding: "18px 24px",
            marginBottom: "24px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "18px",
          }}
        >
          <div style={{ flex: "1 1 300px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                🎯 Lab & Assignment Completion Rate
              </span>
              <span style={{ fontSize: "13px", fontWeight: "800", color: "#2563eb" }}>
                {completionPercentage}% ({gradedSubs.length}/{studentMySubmissions.length} Graded)
              </span>
            </div>
            <div
              style={{
                width: "100%",
                height: "10px",
                backgroundColor: "#e2e8f0",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${completionPercentage}%`,
                  height: "100%",
                  backgroundColor: completionPercentage === 100 ? "#16a34a" : "#2563eb",
                  borderRadius: "999px",
                  transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
              />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
              borderLeft: "2px solid #f1f5f9",
              paddingLeft: "20px",
            }}
          >
            <div>
              <p style={{ margin: "0 0 2px 0", fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>
                Evaluated Performance
              </p>
              <h4 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: avgScore ? (avgScore >= 75 ? "#16a34a" : "#2563eb") : "#64748b" }}>
                {avgScore !== null ? `${avgScore}% (Grade A)` : "Evaluating..."}
              </h4>
            </div>
            <span style={{ fontSize: "28px" }}>🎖️</span>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div style={styles.metricGrid}>
        <Link to="/notes" style={styles.metricCard} title="Click to view published notes">
          <div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px 0", fontWeight: "600" }}>Published Notes</p>
            <h3 style={{ fontSize: "28px", fontWeight: "800", margin: 0, color: "#1e293b" }}>{stats.notesCount}</h3>
            <p style={{ fontSize: "12px", color: "#16a34a", margin: "4px 0 0 0", fontWeight: "600" }}>Explore Repository →</p>
          </div>
          <span style={{ fontSize: "28px" }}>📚</span>
        </Link>

        <Link to="/papers" style={styles.metricCard} title="Click to view question papers">
          <div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px 0", fontWeight: "600" }}>Previous Papers</p>
            <h3 style={{ fontSize: "28px", fontWeight: "800", margin: 0, color: "#1e293b" }}>{stats.papersCount}</h3>
            <p style={{ fontSize: "12px", color: "#d97706", margin: "4px 0 0 0", fontWeight: "600" }}>Mid & End Terms →</p>
          </div>
          <span style={{ fontSize: "28px" }}>📜</span>
        </Link>

        <button
          type="button"
          onClick={() => {
            if (isRealTeacher && isTeacher) {
              const el = document.getElementById("users-delegation-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            } else {
              setShowStudentsModal(true);
            }
          }}
          style={{ ...styles.metricCard, textAlign: "left", background: "#fff", border: "1px solid #e2e8f0" }}
          title={isTeacher ? "Jump to Management table" : "View batchmates list"}
        >
          <div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px 0", fontWeight: "600" }}>Registered Users</p>
            <h3 style={{ fontSize: "28px", fontWeight: "800", margin: 0, color: "#1e293b" }}>{registeredStudents.length}</h3>
            <p style={{ fontSize: "12px", color: "#2563eb", margin: "4px 0 0 0", fontWeight: "600" }}>
              {isTeacher ? "Manage Users ↓" : "View Batch List →"}
            </p>
          </div>
          <span style={{ fontSize: "28px" }}>👥</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if (isRealTeacher && isTeacher) {
              const el = document.getElementById("users-delegation-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            } else {
              const el = document.getElementById("student-submissions-section");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }
          }}
          style={{ ...styles.metricCard, textAlign: "left", background: "#fff", border: "1px solid #e2e8f0" }}
          title="Click to view submissions & evaluation"
        >
          <div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 4px 0", fontWeight: "600" }}>Live Submissions</p>
            <h3 style={{ fontSize: "28px", fontWeight: "800", margin: 0, color: "#1e293b" }}>{submissions.length}</h3>
            <p style={{ fontSize: "12px", color: "#16a34a", margin: "4px 0 0 0", fontWeight: "600" }}>Check Evaluation ↓</p>
          </div>
          <span style={{ fontSize: "28px" }}>📋</span>
        </button>
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

          {notices.map((n) => {
            const badge = getNoticeBadge(n.tag, n.title);
            return (
              <div
                key={n.id}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #edf2f7",
                  marginBottom: "12px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                      border: `1px solid ${badge.border}`,
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    {badge.label}
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
            );
          })}
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

      {/* 📅 Remote Learning: Weekly Online Timetable & Today's Schedule */}
      <div style={{ ...styles.cardSection, marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "18px" }}>📅</span>
              <h2 style={{ fontSize: "17px", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                Virtual Class Timetable — {currentDayName}'s Schedule
              </h2>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Live periods for remote study, digital lab hours, and faculty consultation.
            </p>
          </div>

          <span
            style={{
              fontSize: "12px",
              fontWeight: "700",
              color: "#2563eb",
              backgroundColor: "#eff6ff",
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #bfdbfe",
            }}
          >
            ● Today: {currentDayName} ({todayClasses.length} Sessions)
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {todayClasses.map((item, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "800",
                      color: "#1e40af",
                      backgroundColor: "#dbeafe",
                      padding: "3px 8px",
                      borderRadius: "6px",
                    }}
                  >
                    ⏰ {item.time}
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>{item.room}</span>
                </div>
                <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>
                  {item.subject}
                </h4>
              </div>

              <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#64748b" }}>
                  Faculty: <strong style={{ color: "#334155" }}>{item.faculty}</strong>
                </span>

                {liveClass && liveClass.subject.toLowerCase().includes(item.subject.toLowerCase().slice(0, 5)) ? (
                  <span style={{ fontSize: "11px", color: "#dc2626", fontWeight: "800" }}>🔴 LIVE NOW</span>
                ) : (
                  <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: "700" }}>Scheduled</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 💬 Remote Learning: Doubt Clearing & Faculty Discussion Forum */}
      <div style={{ ...styles.cardSection, marginBottom: "28px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "18px" }}>💬</span>
              <h2 style={{ fontSize: "17px", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                Live Academic Doubt Clearing & Discussion Forum
              </h2>
            </div>
            <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
              Ask syllabus queries remotely and get verified explanations from subject faculty.
            </p>
          </div>
          <span style={{ fontSize: "12px", fontWeight: "700", color: "#16a34a", backgroundColor: "#f0fdf4", padding: "6px 12px", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
            Total Discussions: {doubts.length}
          </span>
        </div>

        {/* Ask Question Bar */}
        <form onSubmit={handlePostDoubt} style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
          <select
            value={doubtSubject}
            onChange={(e) => setDoubtSubject(e.target.value)}
            style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff", fontSize: "13px", fontWeight: "600" }}
          >
            <option value="Full Stack Development">Full Stack Development</option>
            <option value="Computer Networks">Computer Networks</option>
            <option value="Database Systems">Database Systems</option>
            <option value="Operating Systems">Operating Systems</option>
          </select>
          <input
            type="text"
            required
            placeholder="Type your syllabus question or lab doubt here..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            style={{ flex: 1, minWidth: "240px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          />
          <button
            type="submit"
            style={{ backgroundColor: "#2563eb", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}
          >
            Ask Query 🚀
          </button>
        </form>

        {/* Doubts List */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "380px", overflowY: "auto" }}>
          {doubts.map((d) => (
            <div key={d.id} style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#2563eb", backgroundColor: "#eff6ff", padding: "2px 8px", borderRadius: "4px" }}>
                  {d.subject}
                </span>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>{d.createdAt} • by {d.studentName}</span>
              </div>
              <p style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                ❓ {d.question}
              </p>

              {d.reply ? (
                <div style={{ backgroundColor: "#ffffff", borderLeft: "3px solid #16a34a", padding: "8px 12px", borderRadius: "6px", marginTop: "8px" }}>
                  <p style={{ margin: "0 0 2px 0", fontSize: "13px", color: "#166534", fontWeight: "600" }}>
                    ✓ Answer: {d.reply}
                  </p>
                  <span style={{ fontSize: "11px", color: "#64748b" }}>Answered by: <strong>{d.repliedBy}</strong></span>
                </div>
              ) : (
                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <input
                    type="text"
                    placeholder="Type faculty explanation..."
                    value={replyTextMap[d.id] || ""}
                    onChange={(e) => setReplyTextMap({ ...replyTextMap, [d.id]: e.target.value })}
                    style={{ flex: 1, padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
                  />
                  <button
                    onClick={() => handleReplyDoubt(d.id)}
                    style={{ backgroundColor: "#16a34a", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}
                  >
                    Reply
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Student View: My Submissions & Grades */}
      {!isTeacher && (
        <div id="student-submissions-section" style={{ ...styles.cardSection, marginTop: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: "800", margin: "0 0 4px 0", color: "#0f172a" }}>
                📊 My Assignment Submissions & Faculty Evaluation
              </h2>
              <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                Track your graded assignments, verified marks, and direct faculty feedback.
              </p>
            </div>
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#2563eb", backgroundColor: "#eff6ff", padding: "6px 12px", borderRadius: "8px" }}>
              Total: {studentMySubmissions.length} Submitted
            </span>
          </div>

          {studentMySubmissions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "28px", color: "#64748b", backgroundColor: "#f8fafc", borderRadius: "12px" }}>
              You haven't submitted any assignments yet. Click <strong>"Submit Assignment"</strong> to upload your work.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "12px" }}>Assignment Title</th>
                    <th style={{ padding: "12px" }}>Work File</th>
                    <th style={{ padding: "12px" }}>Status</th>
                    <th style={{ padding: "12px" }}>Marks Obtained</th>
                    <th style={{ padding: "12px" }}>Teacher Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {studentMySubmissions.map((sub) => (
                    <tr key={sub.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px", fontWeight: "700", color: "#1e293b" }}>{sub.assignment_title}</td>
                      <td style={{ padding: "12px" }}>
                        <button
                          onClick={() => setPreviewFile({ url: sub.file_url, title: sub.assignment_title })}
                          style={{
                            padding: "4px 8px",
                            fontSize: "11px",
                            backgroundColor: "#f1f5f9",
                            color: "#2563eb",
                            border: "1px solid #cbd5e1",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "700",
                          }}
                        >
                          👁️ View Work
                        </button>
                      </td>
                      <td style={{ padding: "12px" }}>
                        <span
                          style={{
                            backgroundColor: sub.status === "Verified & Approved" ? "#ecfdf5" : "#eff6ff",
                            color: sub.status === "Verified & Approved" ? "#059669" : "#2563eb",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            fontWeight: "700",
                          }}
                        >
                          {sub.status === "Verified & Approved" ? "Verified & Graded" : "Submitted"}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontWeight: "800", color: sub.marks ? "#059669" : "#64748b" }}>
                        {sub.marks ? sub.marks : "Pending"}
                      </td>
                      <td style={{ padding: "12px", color: "#475569" }}>
                        {sub.feedback ? sub.feedback : "Faculty evaluation in progress..."}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Teacher View: User Registry + Submissions Evaluation */}
      {isRealTeacher && isTeacher && (
        <div id="users-delegation-section" style={{ ...styles.cardSection, marginTop: "24px" }}>
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

      {/* Student View Modal: Registered Students Directory */}
      {showStudentsModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "16px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "16px", maxWidth: "520px", width: "100%", padding: "24px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: "800", margin: 0, color: "#0f172a" }}>
                👥 Department Registered Batch
              </h2>
              <button
                onClick={() => setShowStudentsModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#64748b", cursor: "pointer", fontWeight: "700" }}
              >
                ✕
              </button>
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {registeredStudents.map((st) => (
                <div key={st.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <p style={{ margin: "0 0 2px 0", fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>{st.name}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>{st.email}</p>
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "999px", backgroundColor: st.role === "teacher" ? "#fef3c7" : "#eff6ff", color: st.role === "teacher" ? "#b45309" : "#2563eb" }}>
                    {st.role === "teacher" ? "Faculty" : "Student"}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowStudentsModal(false)}
                style={{ padding: "8px 18px", backgroundColor: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "13px", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
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
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Marks / Grade</label>
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
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>Faculty Feedback</label>
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
                  placeholder="e.g. Microcontroller Unit 2 Program"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", outline: "none", fontSize: "14px", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "6px" }}>
                  Attach Assignment File
                </label>
                <FileDropzone
                  currentFile={submissionFile}
                  onFileSelected={(file) => setSubmissionFile(file)}
                  onClear={() => setSubmissionFile(null)}
                  accept="image/*,video/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
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

      {/* 🔴 Start Live Class Modal (Teacher Only) */}
      {showLiveModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "16px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "14px", maxWidth: "440px", width: "100%", padding: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: "800", margin: "0 0 14px 0", color: "#0f172a" }}>
              🔴 Broadcast Live Online Class
            </h2>
            <form onSubmit={handleStartLiveClass}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Subject Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Full Stack Development"
                  value={liveForm.subject}
                  onChange={(e) => setLiveForm({ ...liveForm, subject: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Lecture Topic</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unit 4: Node.js Express Middleware"
                  value={liveForm.topic}
                  onChange={(e) => setLiveForm({ ...liveForm, topic: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "18px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600", display: "block", marginBottom: "4px" }}>Google Meet / Zoom URL</label>
                <input
                  type="text"
                  required
                  placeholder="https://meet.google.com/xyz-abcd-efg"
                  value={liveForm.meetUrl}
                  onChange={(e) => setLiveForm({ ...liveForm, meetUrl: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowLiveModal(false)} style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#dc2626", color: "#fff", fontWeight: "700", cursor: "pointer" }}>
                  Go Live 🔴
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}