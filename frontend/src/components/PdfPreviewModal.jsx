export default function PdfPreviewModal({ fileUrl, title, onClose }) {
  if (!fileUrl) return null;

  // File type detection
  const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)($|\?)/i);
  const isDoc = fileUrl.match(/\.(doc|docx|ppt|pptx|xls|xlsx)($|\?)/i);

  // Office documents ke liye Google viewer fallback, warna direct fileUrl (PDFs/Images direct load hoti hain)
  const viewerUrl = isDoc
    ? `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`
    : fileUrl;

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
        padding: "10px",
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          width: "100%",
          maxWidth: "1000px",
          height: "92vh",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
            backgroundColor: "#f8fafc",
          }}
        >
          <div style={{ minWidth: "160px", flex: "1 1 auto" }}>
            <h3
              style={{
                margin: 0,
                fontSize: "15px",
                fontWeight: "700",
                color: "#0f172a",
                wordBreak: "break-word",
              }}
            >
              {title || "Document Preview"}
            </h3>
            <span style={{ fontSize: "11px", color: "#64748b" }}>
              In-App Secure Reader
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
            {/* Direct Open / Pop-out button */}
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "6px 12px",
                backgroundColor: "#f1f5f9",
                border: "1px solid #cbd5e1",
                color: "#334155",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Open New Tab ↗
            </a>
            <a
              href={fileUrl}
              download
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "6px 12px",
                backgroundColor: "#2563eb",
                color: "#fff",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "600",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              Download
            </a>
            <button
              onClick={onClose}
              style={{
                padding: "6px 12px",
                backgroundColor: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Universal Viewer Canvas */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#1e293b",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            position: "relative",
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {isImage ? (
            <img
              src={fileUrl}
              alt={title}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                padding: "8px",
              }}
            />
          ) : (
            <object
              data={viewerUrl}
              type="application/pdf"
              style={{
                width: "100%",
                height: "100%",
                border: "none",
                display: "block",
              }}
            >
              {/* Fallback agar browser object tag support na kare */}
              <iframe
                src={viewerUrl}
                title={title}
                style={{
                  width: "100%",
                  height: "100%",
                  border: "none",
                  display: "block",
                }}
              />
            </object>
          )}
        </div>
      </div>
    </div>
  );
}