import type { WeeklyDay } from "./Types";

export const DAY_ORDER = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const sortWeekly = (days: WeeklyDay[]) =>
  [...days].sort((a, b) => DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day));

/** APIs return flags as boolean, 0/1 or "0"/"1"; "0" must not be truthy. */
export const toBool = (v: unknown) =>
  v === true || v === 1 || v === "1" || v === "true";

export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export const formatTime12h = (t?: string | null) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hours = parseInt(h, 10);
  return `${((hours + 11) % 12) + 1}:${m} ${hours >= 12 ? "PM" : "AM"}`;
};

export const formatRange = (s?: string | null, e?: string | null) =>
  s && e ? `${formatTime12h(s)} – ${formatTime12h(e)}` : "";

/** "YYYY-MM-DD" -> local Date (no time zone shifting) */
export const parseISODate = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Weekly day validation.
 * - end must be after start (always checked once both are set)
 * - missing times are only reported when `strict` (after a save attempt)
 */
export const validateDay = (d: WeeklyDay, strict: boolean): string | null => {
  if (!d.isOpen) return null;
  if (!d.start || !d.end) {
    return strict ? "Add an opening and closing time" : null;
  }
  if (toMinutes(d.end) <= toMinutes(d.start)) {
    return "Closing time must be after opening time";
  }
  return null;
};

const rawMessage = (e: any) =>
  String(e?.response?.data?.message ?? e?.message ?? "");

export const isVersionConflict = (e: any) => {
  const m = rawMessage(e).toLowerCase();
  return (
    m.includes("version_conflict") ||
    m.includes("conflict") ||
    m.includes("409")
  );
};

export const apiErrorMessage = (e: any, fallback = "Something went wrong") =>
  rawMessage(e).replace(/^(VERSION_CONFLICT|SCHEDULE_VALIDATION):\s*/, "") ||
  fallback;

/* Shared MUI input look (approachable slate & teal palette) */
export const fieldSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "12px",
    backgroundColor: "#ffffff",
    fontSize: 13,
    minHeight: 38,
    transition: "all 0.2s ease",
    "& fieldset": { borderColor: "#e2e8f0" },
    "&:hover fieldset": { borderColor: "#0d9488" },
    "&.Mui-focused fieldset": {
      borderColor: "#0d9488",
      borderWidth: "1.5px",
    },
    "&.Mui-error fieldset": { borderColor: "#f43f5e" },
  },
  "& .MuiInputBase-input": { padding: "7px 12px", fontSize: 13, color: "#1e293b" },
};

export const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2";