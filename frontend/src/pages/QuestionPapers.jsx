import { useEffect, useState } from "react";

const PAPERS_API = "https://campushub-backend-6rtk.onrender.com/api/question-papers";

export default function QuestionPapers() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // Upload modal state
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("5th Semester");
  const [year, setYear] = useState("2024");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    fetchPapers();
  }, [selectedSemester, selectedYear]);

  async function fetchPapers() {
    setLoading(true);
    setError("");

    try {
      let queryParams = [];
      if (selectedSemester) queryParams.push(`semester=${encodeURIComponent(selectedSemester)}`);
      if (selectedYear) queryParams.push(`year=${encodeURIComponent(selectedYear)}`);

      const queryString = queryParams.length ? `?${queryParams.join("&")}` : "";
      const response = await fetch(`${PAPERS_API}${queryString}`);
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
      setUploadMessage("Please select a file.");
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
      setSemester("5th Semester");
      setYear("2024");
      setFile(null);

      fetchPapers();

      setTimeout(() => {
        setShowModal(false);
        setUploadMessage("");
      }, 1200);
    } catch (err) {
      setUploadMessage(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const filteredPapers = papers.filter((paper) => {
    const term = searchTerm.toLowerCase();
    const titleMatch = paper.title?.toLowerCase().includes(term);
    const subjectMatch = paper.subject?.toLowerCase().includes(term);
    return titleMatch || subjectMatch;
  });

  const styles = {
    container: {
      padding: "28px 36px",
      maxWidth: "1280px",
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
    filterBar: {
      display: "flex",
      gap: "12px",
      marginBottom: "24px",
      flexWrap: "wrap",
    },
    searchInput: {
      flex: "1",
      minWidth: "220px",
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      fontSize: "14px",
      outline: "none",
      backgroundColor: "#fff",
    },
    select: {
      padding: "10px 14px",
      borderRadius: "8px",
      border: "1px solid #cbd5e1",
      fontSize: "14px",
      background: "#fff",
      cursor: "pointer",
      outline: "none",
    },
    grid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(290px, 1fr))",
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
    badgeRow: {
      display: "flex",
      gap: "8px",
      marginBottom: "12px",
    },
    cardBadge: {
      background: "#eff6ff",
      color: "#2563eb",
      fontSize: "12px",
      fontWeight: "600",
      padding: "4px 8px",
      borderRadius: "6px",
    },
    yearBadge: {
      background: "#fef3c7",
      color: "#d97706",
      fontSize: "12px",
      fontWeight: "600",
      padding: "4px 8px",
      borderRadius: "6px",
    },
    cardTitle: {
      fontSize: "17px",
      fontWeight: "700",
      margin: "0 0 6px 0",
      color: "#1e293b",
    },
    cardSubject: {
      fontSize: "13px",
      color: "#64748b",
      margin: "0 0 18px 0",
    },
    downloadBtn: {
      display: "inline-block",
      textAlign: "center",
      textDecoration: "none",
      background: "#0f172a",
      color: "#ffffff",
      padding: "10px",
      borderRadius: "8px",
      fontSize: "13px",
      fontWeight: "600",
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
      <div style={styles.headerWrapper}>
        <div>
          <h1 style={styles.title}>Question Papers</h1>
          <p style={styles.subtitle}>
            Access and download previous years' university and mid-term exam papers.
          </p>
        </div>
        <button style={styles.uploadBtn} onClick={() => setShowModal(true)}>
          + Upload Paper
        </button>
      </div>

      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by subject or paper title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          style={styles.select}
        >
          <option value="">All Semesters</option>
          <option value="1st Semester">1st Semester</option>
          <option value="2nd Semester">2nd Semester</option>
          <option value="3rd Semester">3rd Semester</option>
          <option value="4th Semester">4th Semester</option>
          <option value="5th Semester">5th Semester</option>
          <option value="6th Semester">6th Semester</option>
        </select>

        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          style={styles.select}
        >
          <option value="">All Years</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
          <option value="2022">2022</option>
        </select>
      </div>

      {loading && <div>Loading question papers...</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: "16px" }}>{error}</div>}

      <div style={styles.grid}>
        {filteredPapers.map((paper) => (
          <div key={paper.id} style={styles.card}>
            <div>
              <div style={styles.badgeRow}>
                <span style={styles.cardBadge}>{paper.semester}</span>
                <span style={styles.yearBadge}>{paper.year}</span>
              </div>
              <h3 style={styles.cardTitle}>{paper.title}</h3>
              <p style={styles.cardSubject}>Subject: {paper.subject}</p>
            </div>
            <a
              href={paper.file_url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              style={styles.downloadBtn}
            >
              View / Download Paper
            </a>
          </div>
        ))}
      </div>

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
                <label style={styles.label}>Paper Title</label>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. End Semester Exam 2024"
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
                  placeholder="e.g. Operating Systems"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Semester</label>
                  <select
                    style={styles.select}
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

                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>Year</label>
                  <input
                    style={styles.input}
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    placeholder="2024"
                    required
                  />
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Select File (PDF, Image, etc.)</label>
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