export function getErrorMessage(err, fallback = "A apărut o eroare.") {
  return (
    err?.response?.data?.error ||
    err?.response?.data?.message ||
    err?.message ||
    fallback
  );
}
