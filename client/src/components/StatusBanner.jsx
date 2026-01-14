// Banner pentru mesaje de status (info, success, error)
// Se afiseaza deasupra paginii cu culori diferite in functie de tip
export default function StatusBanner({ type = "info", message, onClose }) {
  // Daca nu avem mesaj, nu afisam nimic
  if (!message) return null;

  // Mapare tip -> clasa CSS
  const typeClass = {
    error: "alert-error",
    success: "alert-success",
    warning: "alert-warning",
    info: "alert-info"
  }[type] || "alert-info";



  return (
    <div className={`alert ${typeClass}`}>
      <div className="alert-content">
        <strong style={{ textTransform: "capitalize" }}>{type}:</strong> {message}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="alert-close"
          aria-label="Close"
        >
          ✕
        </button>
      )}
    </div>
  );
}
