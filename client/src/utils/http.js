// Helper pentru extragerea mesajelor de eroare din raspunsuri HTTP
// Incearca mai multe locatii posibile pentru mesajul de eroare
export function getErrorMessage(err, fallback = "A apărut o eroare.") {
  return (
    err?.response?.data?.error ||  // eroare de la backend
    err?.response?.data?.message ||
    err?.message ||                // eroare axios/javascript
    fallback
  );
}
