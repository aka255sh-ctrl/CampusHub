export default function SkeletonLoader({ type = "card", count = 3 }) {
  const items = Array.from({ length: count });

  if (type === "card") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {items.map((_, i) => (
          <div
            key={i}
            style={{
              backgroundColor: "#fff",
              borderRadius: "14px",
              padding: "20px",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div className="skeleton" style={{ width: "80px", height: "20px" }} />
              <div className="skeleton" style={{ width: "60px", height: "20px" }} />
            </div>
            <div className="skeleton" style={{ width: "70%", height: "24px" }} />
            <div className="skeleton" style={{ width: "40%", height: "16px" }} />
            <div className="skeleton" style={{ width: "100%", height: "36px", marginTop: "10px" }} />
          </div>
        ))}
      </div>
    );
  }

  // Row skeleton for tables
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "16px 0" }}>
      {items.map((_, i) => (
        <div key={i} className="skeleton" style={{ width: "100%", height: "42px" }} />
      ))}
    </div>
  );
}