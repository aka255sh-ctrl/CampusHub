import { useEffect, useState } from "react";
import PdfPreviewModal from "../components/PdfPreviewModal";

const NOTES_API = "http://localhost:5000/api/notes";

export default function Notes() {
  const [previewFile, setPreviewFile] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // Upload modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("1st Semester");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const semesterTabs = [
    "All",
    "1st Semester",
    "2nd Semester",
    "3rd Semester",
    "4th Semester",
    "5th Semester",
    "6th Semester",
  ];

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (err) {}
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [selectedSemester]);

  async function fetchNotes() {
    setLoading(true);
    setError("");

    try {
      let url = NOTES_API;
      if (selectedSemester && selectedSemester !== "All") {
        url += `?semester=${encodeURIComponent(selectedSemester)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load notes.");
      }

      setNotes(data.notes || []);
    } catch (err) {
      setError(err.message || "Unable to connect to backend server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();

    if (!file) {
      setUploadMessage("Please select a file.");
      return;
    }

    setUploading(true);
    setUploadMessage("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subject", subject);
    formData.append("semester", semester);
    formData.append("pdfFile", file);
    if (currentUser?.id) {
      formData.append("userId", currentUser.id);
    }

    try {
      const response = await fetch(`${NOTES_API}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed.");
      }

      setUploadMessage("File uploaded successfully!");
      setTitle("");
      setSubject("");
      setSemester("1st Semester");
      setFile(null);

      fetchNotes();

      setTimeout(() => {
        setShowModal(false);
        setUploadMessage("");
      }, 1200);
    } catch (err) {
      setUploadMessage(err.message || "Something went wrong.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteNote(id) {
    if (!window.confirm("Are you sure you want to delete this study note?")) return;

    try {
      const res = await fetch(`${NOTES_API}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete note.");
      }

      setNotes((prevNotes) => prevNotes.filter((note) => note.id !== id));
    } catch (err) {
      alert(err.message || "Could not delete note.");
    }
  }

  // Filter notes based on live search
  const filteredNotes = notes.filter((note) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const titleMatch = note.title?.toLowerCase().includes(term);
    const subjectMatch = note.subject?.toLowerCase().includes(term);
    const semesterMatch = note.semester?.toLowerCase().includes(term);
    return titleMatch || subjectMatch || semesterMatch;
  });

  // Extract distinct subject tags for quick filter clicks
  const popularSubjects = Array.from(
    new Set(notes.map((n) => n.subject).filter(Boolean))
  ).slice(0, 5);

  const styles = {
    container: {
      padding: "24px 32px",
      maxWidth: "1200px",
      margin: "0 auto",
      fontFamily: "'Inter', system-ui, sans-serif",
      color: "#0f172a",
    },
    headerWrapper: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "24px",
      flexWrap: "wrap",
      gap: "12px",
    },
    title: {
      fontSize: "26px",
      fontWeight: "800",
      letterSpacing: "-0.02em",
      margin: "0 0 6px 0",
    },
    subtitle: {
      color: "#64748b",
      margin: 0,
      fontSize: "14px",
    },
    uploadBtn: {
      backgroundColor: "#16a34a",
      color: "#fff",
      border: "none",
      padding: "10px 18px",
      borderRadius: "8px",
      fontWeight: "600",
      cursor: "pointer",
      fontSize: "14px",
    },
    searchSection: {
      backgroundColor: "#ffffff",
      borderRadius: "14px",
      padding: "18px 20px",
      border: "1px solid #e2e8f0",
      marginBottom: "24px",
      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
    },
    searchRow: {
      display: "flex",
      gap: "12px",
      alignItems: "center",
      position: "relative",
    },
    searchInput: {
      flex: 1,
      padding: "12px 16px",
      borderRadius: "10px",
      border: "1px solid #cbd5e1",
      fontSize: "14px",
      outline: "none",
      backgroundColor: "#f8fafc",
    },
    clearBtn: {
      position: "absolute",
      right: "12px",
      background: "none",
      border: "none",
      color: "#94a3b8",
      fontSize: "16px",
      cursor: "pointer",
    },
    pillsRow: {
      display: "flex",
      gap: "8px",
      marginTop: "14px",
      flexWrap: "wrap",
      alignItems: "center",
    },
    tabPill: (active) => ({
      padding: "6px 14px",
      borderRadius: "999px",
      fontSize: "12px",
      fontWeight: "600",
      border: active ? "1px solid #2563eb" : "1px solid #e2e8f0",
      backgroundColor: active ? "#eff6ff" : "#ffffff",
      color: active ? "#2563eb" : "#475569",
      cursor: "pointer",
      transition: "all 0.15s ease",
    }),
    subjectChip: {
      padding: "4px 10px",
      borderRadius: "6px",
      fontSize: "11px",
      fontWeight: "600",
      backgroundColor: "#f1f5f9",
      color: "#334155",
      cursor: "pointer",
      border: "1px solid #e2e8f0",
    },
    resultsMeta: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
      fontSize: "13px",
      color: "#64748b",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      gap: "20px",
    },
    card: {
      background: "#ffffff",
      borderRadius: "14px",
      padding: "20px",
      border: "1px solid #e2e8f0",
      boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    cardHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px",
    },
    cardBadge: {
      background: "#eff6ff",
      color: "#2563eb",
      fontSize: "12px",
      fontWeight: "600",
      padding: "4px 8px",
      borderRadius: "6px",
    },
    uploaderBadge: {
      fontSize: "11px",
      color: "#64748b",
      backgroundColor: "#f8fafc",
      padding: "3px 6px",
      borderRadius: "4px",
      border: "1px solid #e2e8f0",
    },
    cardTitle: {
      fontSize: "18px",
      fontWeight: "700",
      margin: "0 0 6px 0",
      color: "#1e293b",
    },
    cardSubject: {
      fontSize: "13px",
      color: "#64748b",
      margin: "0 0 16px 0",
    },
    cardActions: {
      display: "flex",
      gap: "8px",
      marginTop: "10px",
    },
    previewBtn: {
      flex: 1,
      textAlign: "center",
      background: "#2563eb",
      color: "#ffffff",
      padding: "10px",
      borderRadius: "8px",
      fontSize: "13px",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
    },
    deleteBtn: {
      background: "#fee2e2",
      color: "#dc2626",
      border: "none",
      padding: "10px 14px",
      borderRadius: "8px",
      fontSize: "13px",
      fontWeight: "700",
      cursor: "pointer",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: "rgba(15, 23, 42, 0.5)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: "16px",
    },
    modalContent: {
      backgroundColor: "#fff",
      borderRadius: "14px",
      width: "100%",
      maxWidth: "460px",
      padding: "24px",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
    },
    formGroup: {
      marginBottom: "14px",
      display: "flex",
      flexDirection: "column",
      gap: "6px",
    },
    label: {
      fontSize: "13px",
      fontWeight: "600",
      color: "#334155",
    },
    input: {
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      fontSize: "14px",
      outline: "none",
    },
    modalActions: {
      display: "flex",
      justifyContent: "flex-end",
      gap: "10px",
      marginTop: "20px",
    },
    cancelBtn: {
      padding: "8px 16px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      backgroundColor: "#fff",
      cursor: "pointer",
      fontWeight: "600",
    },
    submitBtn: {
      padding: "8px 16px",
      borderRadius: "8px",
      border: "none",
      backgroundColor: "#2563eb",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "600",
    },
  };

  return (
    <div style={styles.container}>
      {/* 1. In-App Preview Modal */}
      {previewFile && (
        <PdfPreviewModal
          fileUrl={previewFile.url}
          title={previewFile.title}
          onClose={() => setPreviewFile(null)}
        />
      )}

      <div style={styles.headerWrapper}>
        <div>
          <h1 style={styles.title}>Study Notes</h1>
          <p style={styles.subtitle}>
            Browse, search, and manage department study materials.
          </p>
        </div>
        <button style={styles.uploadBtn} onClick={() => setShowModal(true)}>
          + Upload File
        </button>
      </div>

      {/* Enhanced Search & Filter Bar */}
      <div style={styles.searchSection}>
        <div style={styles.searchRow}>
          <input
            type="text"
            placeholder="Search by topic, unit name, or subject (e.g. Operating Systems)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          {searchTerm && (
            <button
              style={styles.clearBtn}
              onClick={() => setSearchTerm("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Semester Filter Tabs */}
        <div style={styles.pillsRow}>
          <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
            Semesters:
          </span>
          {semesterTabs.map((sem) => {
            const isSelected =
              selectedSemester === sem || (!selectedSemester && sem === "All");
            return (
              <button
                key={sem}
                onClick={() => setSelectedSemester(sem === "All" ? "" : sem)}
                style={styles.tabPill(isSelected)}
              >
                {sem}
              </button>
            );
          })}
        </div>

        {/* Quick Subject Chips */}
        {popularSubjects.length > 0 && (
          <div style={{ ...styles.pillsRow, marginTop: "10px" }}>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600" }}>
              Suggested Subjects:
            </span>
            {popularSubjects.map((sub) => (
              <span
                key={sub}
                style={styles.subjectChip}
                onClick={() => setSearchTerm(sub)}
              >
                {sub}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Result Meta count */}
      <div style={styles.resultsMeta}>
        <span>
          Showing <strong>{filteredNotes.length}</strong> of <strong>{notes.length}</strong> study notes
        </span>
        {searchTerm && (
          <span>
            Filtered by keyword: <em>"{searchTerm}"</em>
          </span>
        )}
      </div>

      {loading && <div>Loading notes...</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: "16px" }}>{error}</div>}

      <div style={styles.grid}>
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => {
            const canDelete =
              Boolean(currentUser) &&
              (currentUser.id === note.user_id || currentUser.role === "teacher" || !note.user_id);

            return (
              <div key={note.id} style={styles.card}>
                <div>
                  <div style={styles.cardHeader}>
                    <span style={styles.cardBadge}>{note.semester}</span>
                    <span style={styles.uploaderBadge}>
                      By: {note.uploader_name || "Campus Community"}
                    </span>
                  </div>
                  <h3 style={styles.cardTitle}>{note.title}</h3>
                  <p style={styles.cardSubject}>Subject: {note.subject}</p>
                </div>

                <div style={styles.cardActions}>
                  {/* In-App Preview Button */}
                  <button
                    onClick={() => setPreviewFile({ url: note.file_url, title: note.title })}
                    style={styles.previewBtn}
                  >
                    👁️ Preview Note
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      style={styles.deleteBtn}
                      title="Delete Note"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          !loading && (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "40px",
                backgroundColor: "#fff",
                borderRadius: "12px",
                border: "1px dashed #cbd5e1",
                color: "#64748b",
              }}
            >
              No study notes matched your search criteria.
            </div>
          )
        )}
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Upload Note / Document</h2>

            {uploadMessage && (
              <p
                style={{
                  color: uploadMessage.includes("success") ? "#16a34a" : "#ef4444",
                  fontSize: "13px",
                  margin: "0 0 12px 0",
                }}
              >
                {uploadMessage}
              </p>
            )}

            <form onSubmit={handleUpload}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Note Title</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. Operating Systems Unit 2"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Subject</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. Computer Science / OS"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Semester</label>
                <select
                  style={styles.input}
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                >
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="3rd Semester">3rd Semester</option>
                  <option value="4th Semester">4th Semester</option>
                  <option value="5th Semester">5th Semester</option>
                  <option value="6th Semester">6th Semester</option>
                </select>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Select File</label>
                <input
                  style={styles.input}
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload File"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}