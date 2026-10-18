import { useEffect, useState } from "react";
import PdfPreviewModal from "../components/PdfPreviewModal";

const PAPERS_API = "https://campushub-backend-6rtk.onrender.com/api/question-papers";

export default function Papers() {
  const [papers, setPapers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // In-App PDF Preview
  const [previewFile, setPreviewFile] = useState(null);

  // Upload modal states
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [semester, setSemester] = useState("5th Semester");
  const [year, setYear] = useState("2026");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

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
      setSemester("5th Semester");
      setYear("2026");
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

  async function handleDeletePaper(id) {
    if (!window.confirm("Teacher Action: Are you sure you want to delete this Question Paper?")) return;

    try {
      const res = await fetch(`${PAPERS_API}/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete paper.");
      }

      setPapers((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err.message || "Delete failed.");
    }
  }

  const isTeacher = currentUser?.role === "teacher" || true; // Full faculty control

  const filteredPapers = papers.filter((paper) => {
    const term = searchTerm.toLowerCase();
    const titleMatch = paper.title?.toLowerCase().includes(term);
    const subjectMatch = paper.subject?.toLowerCase().includes(term);
    return titleMatch || subjectMatch;
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
    deleteBtn: {
      backgroundColor: "#fee2e2",
      color: "#dc2626",
      border: "none",
      padding: "10px 14px",
      borderRadius: "8px",
      fontSize: "13px",
      fontWeight: "700",
      cursor: "pointer",
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
          <h1 style={{ fontSize: "26px", fontWeight: "800", margin: "0 0 6px 0" }}>Question Papers</h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "14px" }}>
            Faculty Repository • Previous Examination Papers (Kalaburagi Polytechnic)
          </p>
        </div>

        {/* Only Faculty can upload */}
        {isTeacher && (
          <button style={styles.uploadBtn} onClick={() => setShowModal(true)}>
            + Upload Paper
          </button>
        )}
      </div>

      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="Search by subject or paper title..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1, minWidth: "220px", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
        />

        <select
          value={selectedSemester}
          onChange={(e) => setSelectedSemester(e.target.value)}
          style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#fff" }}
        >
          <option value="">All Semesters</option>
          <option value="1st Semester">1st Semester</option>
          <option value="2nd Semester">2nd Semester</option>
          <option value="3rd Semester">3rd Semester</option>
          <option value="4th Semester">4th Semester</option>
          <option value="5th Semester">5th Semester</option>
          <option value="6th Semester">6th Semester</option>
        </select>
      </div>

      {loading && <div>Loading question papers...</div>}
      {error && <div style={{ color: "#ef4444", marginBottom: "16px" }}>{error}</div>}

      <div style={styles.grid}>
        {filteredPapers.map((paper) => (
          <div key={paper.id} style={styles.card}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <span style={{ background: "#eff6ff", color: "#2563eb", fontSize: "12px", fontWeight: "600", padding: "4px 8px", borderRadius: "6px" }}>
                  {paper.semester}
                </span>
                <span style={{ background: "#fef3c7", color: "#d97706", fontSize: "12px", fontWeight: "600", padding: "4px 8px", borderRadius: "6px" }}>
                  {paper.year}
                </span>
              </div>
              <h3 style={{ fontSize: "17px", fontWeight: "700", margin: "0 0 6px 0", color: "#1e293b" }}>{paper.title}</h3>
              <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 18px 0" }}>Subject: {paper.subject}</p>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setPreviewFile({ url: paper.file_url, title: paper.title })}
                style={{ flex: 1, padding: "10px", backgroundColor: "#0f172a", color: "#fff", border: "none", borderRadius: "8px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
              >
                👁️ Preview Paper
              </button>

              {isTeacher && (
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
        ))}
      </div>

      {/* Upload Modal (Teacher Only) */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15, 23, 42, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}>
          <div style={{ backgroundColor: "#fff", borderRadius: "14px", width: "100%", maxWidth: "460px", padding: "24px" }}>
            <h2 style={{ margin: "0 0 16px 0", fontSize: "18px" }}>Upload Question Paper (Faculty)</h2>

            {uploadMessage && (
              <p style={{ color: uploadMessage.includes("success") ? "#16a34a" : "#ef4444", fontSize: "13px" }}>
                {uploadMessage}
              </p>
            )}

            <form onSubmit={handleUpload}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Paper Title</label>
                <input
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  type="text"
                  placeholder="e.g. End Semester Exam 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Subject</label>
                <input
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  type="text"
                  placeholder="e.g. Operating Systems"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginBottom: "14px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "13px", fontWeight: "600" }}>Semester</label>
                  <select
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
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

                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: "13px", fontWeight: "600" }}>Year</label>
                  <input
                    style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                    type="text"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ fontSize: "13px", fontWeight: "600" }}>Select PDF / File</label>
                <input
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                  type="file"
                  onChange={(e) => setFile(e.target.files[0])}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #cbd5e1", background: "#fff", cursor: "pointer" }}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "none", backgroundColor: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: "600" }}
                  disabled={uploading}
                >
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