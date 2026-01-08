export default function StatusBanner({ type = "info", message, onClose }) {
  if (!message) return null;

  const styles = {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    marginBottom: 12,
    color: "#111"
  };

  const bg =
    type === "error" ? "#ffecec" :
    type === "success" ? "#ecfff1" :
    "#eef6ff";

  return (
    <div style={{ ...styles, background: bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div><strong>{type.toUpperCase()}:</strong> {message}</div>
        {onClose && (
          // <button type="button" onClick={onClose}>
          <button
           type="button"
           onClick={onClose}
           style={{ background: "transparent", color: "#111", border: "1px solid #ccc" }}
         >
            X
          </button>
        )}
      </div>
    </div>
  );
}
