export default function PdfPreviewModal({ fileUrl, title, onClose }) {
  if (!fileUrl) return null;

  const BACKEND_BASE = "https://campushub-backend-6rtk.onrender.com";
  const fullUrl = fileUrl.startsWith("http")
    ? fileUrl
    : `${BACKEND_BASE}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;

  const isCsvOrExcel = fullUrl.match(/\.(csv|xlsx?|tsv)$/i);
  const isImage = fullUrl.match(/\.(jpe?g|png|gif|webp|svg)$/i);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "920px",
          height: "85vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 2px 0", fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
              {title || "Document Viewer"}
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>In-App Secure Reader</span>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: "600",
                color: "#334155",
                backgroundColor: "#f8fafc",
              }}
            >
              Open New Tab ↗
            </a>
            <a
              href={fullUrl}
              download
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: "600",
              }}
            >
              Download
            </a>
            <button
              onClick={onClose}
              style={{
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#fff",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div style={{ flex: 1, backgroundColor: "#0f172a", position: "relative" }}>
          {isCsvOrExcel ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                textAlign: "center",
                padding: "20px",
              }}
            >
              <span style={{ fontSize: "48px", marginBottom: "12px" }}>📊</span>
              <h4 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>Spreadsheet / CSV File</h4>
              <p style={{ margin: "0 0 20px 0", color: "#94a3b8", maxWidth: "420px", fontSize: "13px" }}>
                Direct browser inline preview is not supported for raw spreadsheet files. Click below to download and view in Excel or Google Sheets.
              </p>
              <a
                href={fullUrl}
                download
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  backgroundColor: "#16a34a",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: "700",
                  fontSize: "13px",
                }}
              >
                📥 Download {title || "File"}
              </a>
            </div>
          ) : isImage ? (
            <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", overflow: "auto" }}>
              <img src={fullUrl} alt={title} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
            </div>
          ) : (
            <iframe
              src={fullUrl}
              title={title}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}