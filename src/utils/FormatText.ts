export function formatEnumText(value: string): string {
  if (!value) return "";
  return value
    .replace(/_/g, " ")           // Replace underscores with spaces
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalize first letter of each word
}
