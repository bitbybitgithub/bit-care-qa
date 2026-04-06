export function formatDateDDMMYYYY(dateStr?: string): string {
  if (!dateStr) return "—";

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "—";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}