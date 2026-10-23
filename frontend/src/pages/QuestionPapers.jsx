import SkeletonLoader from "../components/SkeletonLoader";
import { useEffect, useState } from "react";
import PdfPreviewModal from "../components/PdfPreviewModal";

const PAPERS_API = "https://campushub-backend-6rtk.onrender.com/api/question-papers";

export default function QuestionPapers() {
  const [previewFile, setPreviewFile] = useState(null);
  const [papers, setPapers] = useState([]);
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
  const [year, setYear] = useState("2026");
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
    fetchPapers();
  }, [selectedSemester]);

  async function fetchPapers() {
    setLoading(true);
    setError("");

    try {
      let url = PAPERS_API;
      if (selectedSemester && selectedSemester !== "All") {
        url += `?semester=${encodeURIComponent(selectedSemester)}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load question papers.");
      }

      setPapers(data.questionPapers || []);
    } catch (err) {
      setError(err.message || "Unable to connect to backend server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e) {
    e.preventDefault();

    if (!file) {
      setUploadMessage("Please select a question paper file.");
      return;
    }

    setUploading(true);
    setUploadMessage("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("subject", subject);
    formData.append("semester", semester);
    formData.append("year", year);
    formData.append("pdfFile", file);
    if (currentUser?.id) {
      formData.append("userId", currentUser.id);
    }

    try {
      const response = await fetch(`${PAPERS_API}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Upload failed.");
      }

      setUploadMessage("Question Paper uploaded successfully!");
      setTitle("");
      setSubject("");
      setSemester("1st Semester");
      setYear("2026");
      setFile(null);

      fetchPapers();

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

  async function handleDeletePaper(id) {
    if (!window.confirm("Are you sure you want to delete this question paper?")) return;

    try {
      const res = await fetch(`${PAPERS_API}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete question paper.");
      }

      setPapers((prev) => prev.filter((paper) => paper.id !== id));
    } catch (err) {
      alert(err.message || "Could not delete question paper.");
    }
  }

  const filteredPapers = papers.filter((paper) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    const titleMatch = paper.title?.toLowerCase().includes(term);
    const subjectMatch = paper.subject?.toLowerCase().includes(term);
    const semMatch = paper.semester?.toLowerCase().includes(term);
    const yearMatch = String(paper.year || "").includes(term);
    return titleMatch || subjectMatch || semMatch || yearMatch;
  });

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
      backgroundColor: "#2563eb",
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
    }),
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
    cardBadge: {
      background: "#fef3c7",
      color: "#b45309",
      fontSize: "12px",
      fontWeight: "600",
      padding: "4px 8px",
      borderRadius: "6px",
    },
    cardActions: {
      display: "flex",
      gap: "8px",
      marginTop: "14px",
      alignItems: "center",
    },
    previewBtn: {
      flex: 1,
      textAlign: "center",
      background: "#3b82f6",
      color: "#ffffff",
      padding: "10px",
      borderRadius: "8px",
      fontSize: "13px",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
    },
    downloadBtn: {
      padding: "10px 14px",
      backgroundColor: "#f1f5f9",
      color: "#334155",
      borderRadius: "8px",
      textDecoration: "none",
      fontWeight: "600",
      fontSize: "13px",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid #cbd5e1",
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
    input: {
      padding: "10px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      fontSize: "14px",
      outline: "none",
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
      {previewFile && (
        <PdfPreviewModal
          fileUrl={previewFile.url}
          title={previewFile.title}
          onClose={() => setPreviewFile(null)}
        />
      )}

      <div style={styles.headerWrapper}>
        <div>
          <h1 style={styles.title}>Question Papers</h1>
          <p style={styles.subtitle}>
            Explore and download previous years' mid-term and end-term question papers.
          </p>
        </div>
        <button style={styles.uploadBtn} onClick={() => setShowModal(true)}>
          + Upload Paper
        </button>
      </div>

      {/* Search & Semester Tabs */}
      <div style={styles.searchSection}>
        <div style={styles.searchRow}>
          <input
            type="text"
            placeholder="Search papers by subject, year (e.g. 2024, 2025), or title..."
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
      </div>

      <div style={styles.resultsMeta}>
        <span>
          Showing <strong>{filteredPapers.length}</strong> of <strong>{papers.length}</strong> question papers
        </span>
        {searchTerm && (
          <span>
            Filtered by: <em>"{searchTerm}"</em>
          </span>
        )}
      </div>

      {/* Skeleton Loader during fetch */}
      {loading && <SkeletonLoader type="card" count={6} />}
      {error && <div style={{ color: "#ef4444", marginBottom: "16px" }}>{error}</div>}

      {!loading && (
        <div style={styles.grid}>
          {filteredPapers.length > 0 ? (
            filteredPapers.map((paper) => {
              const canDelete =
                Boolean(currentUser) &&
                (currentUser.id === paper.user_id || currentUser.role === "teacher" || !paper.user_id);

              return (
                <div key={paper.id} style={styles.card}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={styles.cardBadge}>{paper.semester}</span>
                      <span style={{ fontSize: "11px", fontWeight: "700", color: "#64748b" }}>
                        Year {paper.year || "2026"}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 6px 0", color: "#1e293b" }}>
                      {paper.title}
                    </h3>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: 0 }}>
                      Subject: {paper.subject}
                    </p>
                  </div>

                  <div style={styles.cardActions}>
                    <button
                      onClick={() => setPreviewFile({ url: paper.file_url, title: paper.title })}
                      style={styles.previewBtn}
                    >
                      👁️ Preview
                    </button>

                    <a
                      href={paper.file_url}
                      target="_blank"
                      rel="noreferrer"
                      download
                      style={styles.downloadBtn}
                      title="Download Paper"
                    >
                      ⬇️
                    </a>

                    {canDelete && (
                      <button
                        onClick={() => handleDeletePaper(paper.id)}
                        style={styles.deleteBtn}
                        title="Delete Paper"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
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
              No question papers match your filters.
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Upload Question Paper</h2>

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
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Paper Title</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. End Term Board Exam 2025"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={styles.formGroup}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Subject</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. Database Management Systems"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Semester</label>
                  <select
                    style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
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
                <div>
                  <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Year</label>
                  <input
                    style={{ ...styles.input, width: "100%", boxSizing: "border-box" }}
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>Select File (PDF or Image)</label>
                <input
                  style={styles.input}
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/jpg"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.submitBtn} disabled={uploading}>
                  {uploading ? "Uploading..." : "Upload Paper"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}