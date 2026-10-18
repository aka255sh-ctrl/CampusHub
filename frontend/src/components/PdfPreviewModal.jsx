export default function PdfPreviewModal({ fileUrl, title, onClose }) {
  if (!fileUrl) return null;

  const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png)$/i);

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
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          width: "90%",
          maxWidth: "1000px",
          height: "85vh",
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f8fafc",
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#0f172a" }}>
              {title || "Document Preview"}
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>In-App Secure Reader</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <a
              href={fileUrl}
              download
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "8px 14px",
                backgroundColor: "#2563eb",
                color: "#fff",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "600",
                textDecoration: "none",
              }}
            >
              Direct Download
            </a>
            <button
              onClick={onClose}
              style={{
                padding: "8px 14px",
                backgroundColor: "#f1f5f9",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer",
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Viewer Canvas */}
        <div style={{ flex: 1, backgroundColor: "#334155", display: "flex", justifyContent: "center", alignItems: "center" }}>
          {isImage ? (
            <img
              src={fileUrl}
              alt={title}
              style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
            />
          ) : (
            <iframe
              src={fileUrl}
              title={title}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}