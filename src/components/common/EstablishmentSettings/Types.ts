/* ------------------------------------------------------------------ */
/*  Shared types for the clinic / lab / pharmacy settings page         */
/* ------------------------------------------------------------------ */

export type EstablishmentKind = "clinic" | "lab" | "pharmacy";

/** Same ids the registration flow uses (entity_type). */
export const ENTITY_TYPE_ID: Record<EstablishmentKind, 1 | 2 | 3> = {
  clinic: 1,
  lab: 2,
  pharmacy: 3,
};

/** One weekday of the regular schedule: one open/closed flag, ONE start/end. */
export interface WeeklyDay {
  /** co_id (clinic) / lab_opt_id (lab) / pharma_opt_id (pharmacy) */
  id: string | number;
  day: string; // "Monday"
  isOpen: boolean;
  start: string; // "HH:mm" or ""
  end: string; // "HH:mm" or ""
  /** adapter-private data (e.g. the clinic shift number to update) */
  meta?: Record<string, unknown>;
}

export interface SettingsData {
  logoSrc?: string | null;
  weekly: WeeklyDay[];
  cod?: boolean;
  reminders?: boolean;
  /** read-only rows shown under the logo (pharmacy name, email ...) */
  identity?: { label: string; value: string }[];
}

export interface WeeklyChange {
  day: WeeklyDay;
  statusChanged: boolean;
  hoursChanged: boolean;
}

export interface SaveInput {
  logoFile: File | null;
  cod: boolean;
  reminders: boolean;
  /** every day, current values */
  weekly: WeeklyDay[];
  /** only the days the user actually changed */
  weeklyChanges: WeeklyChange[];
  changed: { logo: boolean; cod: boolean; reminders: boolean };
}

/**
 * Everything that differs between clinic, lab and pharmacy lives in an adapter.
 * The page itself (layout, validation, save bar, special dates) is shared.
 */
export interface SettingsAdapter {
  kind: EstablishmentKind;
  entityId: number | string | null;
  establishmentLabel: string; // "Clinic" | "Lab" | "Pharmacy"
  hoursLabel: string; // "Consultation hours" | "Collection hours" | "Store hours"
  capabilities: {
    cod: boolean;
    reminders: boolean;
    weekly: boolean;
    specialDates: boolean;
  };
  /** lab keeps its rule: a logo must exist before saving */
  requireLogo?: boolean;
  load: () => Promise<SettingsData>;
  /** throw on failure; the page shows the message */
  save: (input: SaveInput) => Promise<void>;
}

/* ---------------- special dates (schedule exceptions) ---------------- */

export type ExceptionType =
  | "HOLIDAY"
  | "CLOSED"
  | "EMERGENCY"
  | "CUSTOM_HOURS"
  | "TEMP_CLOSURE";

export interface ScheduleException {
  exception_id: number;
  exception_type: ExceptionType;
  is_closed: boolean;
  open_start: string | null;
  open_end: string | null;
  break_start: string | null;
  break_end: string | null;
  reason: string | null;
  version: number;
  modified_by: string | null;
  modified_date: string | null;
}

export interface ScheduleDay {
  date: string; // YYYY-MM-DD (establishment time zone)
  weekday: string;
  is_today: boolean;
  regular: { is_open: boolean; start: string | null; end: string | null };
  exception: ScheduleException | null;
  effective: {
    is_open: boolean;
    start: string | null;
    end: string | null;
    break_start: string | null;
    break_end: string | null;
  };
}

export interface ScheduleWindow {
  timezone: string;
  today: string;
  days: ScheduleDay[];
}

export interface SaveExceptionInput {
  exception_date: string;
  exception_type: ExceptionType;
  open_start?: string | null;
  open_end?: string | null;
  break_start?: string | null;
  break_end?: string | null;
  reason?: string | null;
  expected_version?: number | null;
}