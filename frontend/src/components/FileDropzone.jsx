import { useState, useRef } from "react";

export default function FileDropzone({ onFileSelected, accept = "*/*", currentFile = null, onClear }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  }

  function formatBytes(bytes) {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  return (
    <div style={{ marginTop: "6px" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            onFileSelected(e.target.files[0]);
          }
        }}
      />

      {!currentFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragOver ? "2px dashed #2563eb" : "2px dashed #cbd5e1",
            backgroundColor: isDragOver ? "#eff6ff" : "#f8fafc",
            borderRadius: "12px",
            padding: "24px 16px",
            textAlign: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>📁</div>
          <p style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
            Drag and drop your file here, or <span style={{ color: "#2563eb" }}>browse</span>
          </p>
          <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
            Supports PDF, Word Documents, PPT, Images & Code Files
          </p>
        </div>
      ) : (
        <div
          style={{
            border: "1px solid #bfdbfe",
            backgroundColor: "#eff6ff",
            borderRadius: "12px",
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
            <span style={{ fontSize: "24px" }}>📄</span>
            <div style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
              <p style={{ margin: "0 0 2px 0", fontSize: "13px", fontWeight: "700", color: "#1e293b" }}>
                {currentFile.name}
              </p>
              <p style={{ margin: 0, fontSize: "11px", color: "#64748b" }}>
                {formatBytes(currentFile.size)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            style={{
              background: "#fee2e2",
              border: "none",
              color: "#dc2626",
              borderRadius: "6px",
              padding: "4px 8px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            ✕ Remove
          </button>
        </div>
      )}
    </div>
  );
}