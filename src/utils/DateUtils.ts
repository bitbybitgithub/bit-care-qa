export function formatDateDDMMYYYY(dateStr?: string): string {
  if (!dateStr) return "—";

  const date = new Date(dateStr);

  if (isNaN(date.getTime())) return "—";

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
}
