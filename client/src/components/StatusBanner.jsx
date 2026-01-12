// Banner pentru mesaje de status (info, success, error)
// Se afiseaza deasupra paginii cu culori diferite in functie de tip
export default function StatusBanner({ type = "info", message, onClose }) {
  // Daca nu avem mesaj, nu afisam nimic
  if (!message) return null;

  const styles = {
    padding: 10,
    borderRadius: 8,
    border: "1px solid #ddd",
    marginBottom: 12,
    color: "#111"
  };

  // Culoare de fundal in functie de tip
  const bg =
    type === "error" ? "#ffecec" :
      type === "success" ? "#ecfff1" :
        "#eef6ff"; // info

  return (
    <div style={{ ...styles, background: bg }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div><strong>{type.toUpperCase()}:</strong> {message}</div>
        {onClose && (
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
