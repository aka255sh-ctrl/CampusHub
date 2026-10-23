export default function PdfPreviewModal({ fileUrl, title, onClose }) {
  if (!fileUrl) return null;

  const BACKEND_BASE = "https://campushub-backend-6rtk.onrender.com";
  let fullUrl = fileUrl.startsWith("http")
    ? fileUrl
    : `${BACKEND_BASE}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`;

  // Cloudinary PDF ke inline view ke liye /fl_attachment/ remove ya replace karna zaroori hai
  if (fullUrl.includes("cloudinary.com") && fullUrl.includes("/fl_attachment")) {
    fullUrl = fullUrl.replace("/fl_attachment", "");
  }

  const isCsvOrExcel = fullUrl.match(/\.(csv|xlsx?|tsv)$/i);
  const isImage = fullUrl.match(/\.(jpe?g|png|gif|webp|svg)$/i);

  // Sabhi devices ke liye Google Viewer use karenge taaki browser auto-download na kare
  const viewerUrl = !isImage && !isCsvOrExcel
    ? `https://docs.google.com/viewer?url=${encodeURIComponent(fullUrl)}&embedded=true`
    : fullUrl;

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
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "16px",
          width: "100%",
          maxWidth: "960px",
          height: "88vh",
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
            padding: "14px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div style={{ maxWidth: "60%" }}>
            <h3
              style={{
                margin: "0 0 2px 0",
                fontSize: "15px",
                fontWeight: "700",
                color: "#0f172a",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {title || "Document Viewer"}
            </h3>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              In-App Online Reader
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <a
              href={fullUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                textDecoration: "none",
                fontSize: "12px",
                fontWeight: "600",
                color: "#334155",
                backgroundColor: "#f8fafc",
              }}
            >
              Open Tab ↗
            </a>
            <a
              href={fullUrl}
              download
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "6px 12px",
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
                padding: "6px 12px",
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
              <span style={{ fontSize: "42px", marginBottom: "10px" }}>📊</span>
              <h4 style={{ margin: "0 0 6px 0", fontSize: "16px" }}>Spreadsheet / CSV File</h4>
              <p style={{ margin: "0 0 16px 0", color: "#94a3b8", maxWidth: "400px", fontSize: "12px" }}>
                Direct browser preview is not supported for raw spreadsheet files. Click below to download.
              </p>
              <a
                href={fullUrl}
                download
                target="_blank"
                rel="noreferrer"
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  backgroundColor: "#16a34a",
                  color: "#ffffff",
                  textDecoration: "none",
                  fontWeight: "700",
                  fontSize: "12px",
                }}
              >
                📥 Download {title || "File"}
              </a>
            </div>
          ) : isImage ? (
            <div
              style={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "auto",
                padding: "10px",
              }}
            >
              <img
                src={fullUrl}
                alt={title}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>
          ) : (
            <iframe
              src={viewerUrl}
              title={title}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}