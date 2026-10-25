import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Ban,
  Calendar,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Hourglass,
  RotateCcw,
  Siren,
  type LucideIcon,
} from "lucide-react";
import { toast } from "react-toastify";
import {
  deleteScheduleException,
  getScheduleWindow,
  saveScheduleException,
} from "./Scheduleexceptionapi";
import type {
  EstablishmentKind,
  ExceptionType,
  SaveExceptionInput,
  ScheduleDay,
  ScheduleWindow,
} from "./Types";
import {
  FOCUS_RING,
  apiErrorMessage,
  fieldSx,
  formatRange,
  isVersionConflict,
  parseISODate,
  toMinutes,
} from "./Utils";

interface Props {
  kind: EstablishmentKind;
  entityId: number | string;
  refreshKey: number;
  weeklyDirty: boolean;
}

interface Form {
  openStart: string;
  openEnd: string;
  breakStart: string;
  breakEnd: string;
  reason: string;
}
const EMPTY_FORM: Form = { openStart: "", openEnd: "", breakStart: "", breakEnd: "", reason: "" };

const ACTIONS: { mode: ExceptionType; label: string; hint: string; icon: LucideIcon; danger?: boolean }[] = [
  { mode: "CLOSED", label: "Close for the day", hint: "Closed for this date only", icon: Ban },
  { mode: "HOLIDAY", label: "Mark as holiday", hint: "Closed for an observed holiday", icon: Flag },
  { mode: "EMERGENCY", label: "Emergency closure", hint: "Unexpected sudden closure", icon: Siren, danger: true },
  { mode: "CUSTOM_HOURS", label: "Change hours", hint: "Different open & close times", icon: Clock },
  { mode: "TEMP_CLOSURE", label: "Temporary closure", hint: "Mid-day break window", icon: Hourglass },
];

const TYPE_LABEL: Record<ExceptionType, string> = {
  CLOSED: "Closed for the day",
  HOLIDAY: "Holiday closure",
  EMERGENCY: "Emergency closure",
  CUSTOM_HOURS: "Custom operational hours",
  TEMP_CLOSURE: "Temporary break closure",
};

/* Tile status badge matching Image 2 */
const tileStatus = (d: ScheduleDay): { label: string; icon: LucideIcon; tone: string } => {
  const ex = d.exception;
  if (ex?.exception_type === "HOLIDAY")
    return { label: "Holiday", icon: Flag, tone: "bg-amber-50 text-amber-700 border-amber-200/80" };
  if (ex?.exception_type === "EMERGENCY")
    return { label: "Emergency", icon: Siren, tone: "bg-rose-50 text-rose-700 border-rose-200/80" };
  if (ex?.exception_type === "CLOSED")
    return { label: "Closed", icon: Ban, tone: "bg-rose-50 text-rose-700 border-rose-200/80" };
  if (ex)
    return { label: "Modified", icon: Clock, tone: "bg-[var(--color-surface)] text-[var(--color-primary)] border-[var(--color-primary)]/20" };
  return d.effective.is_open
    ? { label: "Open", icon: Check, tone: "bg-emerald-50 text-emerald-700 border-emerald-200/80" }
    : { label: "Closed", icon: Ban, tone: "bg-slate-100 text-slate-500 border-slate-200/60" };
};

const describeEffective = (d: ScheduleDay) => {
  if (!d.effective.is_open) return "Closed all day";
  const base = `Open ${formatRange(d.effective.start, d.effective.end)}`;
  return d.effective.break_start
    ? `${base}, closed ${formatRange(d.effective.break_start, d.effective.break_end)}`
    : base;
};

const longDate = (iso: string) =>
  parseISODate(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const SpecialDates: React.FC<Props> = ({ kind, entityId, refreshKey, weeklyDirty }) => {
  const [win, setWin] = useState<ScheduleWindow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [mode, setMode] = useState<ExceptionType | null>(null);
  const [form, setForm] = useState<Form>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<"EMERGENCY" | "RESTORE" | null>(null);

  const tileRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const w = await getScheduleWindow(kind, entityId);
      setWin(w);
      setError(null);
      setSelected((prev) => (prev && w.days.some((d) => d.date === prev) ? prev : w.today));
    } catch (e) {
      setError(apiErrorMessage(e, "Could not load special dates"));
    } finally {
      setLoading(false);
    }
  }, [kind, entityId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    const t = setInterval(load, 10 * 60 * 1000);
    return () => {
      window.removeEventListener("focus", onFocus);
      clearInterval(t);
    };
  }, [load]);

  useEffect(() => {
    setMode(null);
    setFormError(null);
    setShowActions(false);
  }, [selected]);

  const day = win?.days.find((d) => d.date === selected) ?? null;
  const ex = day?.exception ?? null;

  const scrollStrip = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const offset = direction === "left" ? -240 : 240;
    scrollContainerRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const openMode = (m: ExceptionType) => {
    if (!day) return;
    setMode(m);
    setFormError(null);
    setForm({
      openStart: m === "CUSTOM_HOURS" ? ex?.open_start ?? day.regular.start ?? "09:00" : "",
      openEnd: m === "CUSTOM_HOURS" ? ex?.open_end ?? day.regular.end ?? "17:00" : "",
      breakStart: m === "TEMP_CLOSURE" ? ex?.break_start ?? "13:00" : "",
      breakEnd: m === "TEMP_CLOSURE" ? ex?.break_end ?? "14:00" : "",
      reason: ex?.reason ?? "",
    });
  };

  const validate = (): string | null => {
    if (!day || !mode) return null;
    if (mode === "CUSTOM_HOURS") {
      if (!form.openStart || !form.openEnd) return "Add an opening and closing time";
      if (toMinutes(form.openEnd) <= toMinutes(form.openStart))
        return "Closing time must be after opening time";
    }
    if (mode === "TEMP_CLOSURE") {
      const { is_open, start, end } = day.regular;
      if (!is_open || !start || !end)
        return "A temporary closure needs the regular schedule to be open that day";
      if (!form.breakStart || !form.breakEnd) return "Add the closure start and end time";
      if (toMinutes(form.breakEnd) <= toMinutes(form.breakStart))
        return "Closure end must be after closure start";
      if (toMinutes(form.breakStart) < toMinutes(start) || toMinutes(form.breakEnd) > toMinutes(end))
        return `The closure must be inside the regular hours (${formatRange(start, end)})`;
    }
    return null;
  };

  const handleError = async (e: unknown) => {
    if (isVersionConflict(e)) {
      toast.error("This date was changed by someone else. It has been reloaded.");
      setMode(null);
      await load();
    } else {
      toast.error(apiErrorMessage(e));
    }
  };

  const doSave = async () => {
    if (!day || !mode) return;
    const payload: SaveExceptionInput = {
      exception_date: day.date,
      exception_type: mode,
      open_start: mode === "CUSTOM_HOURS" ? form.openStart : null,
      open_end: mode === "CUSTOM_HOURS" ? form.openEnd : null,
      break_start: mode === "TEMP_CLOSURE" ? form.breakStart : null,
      break_end: mode === "TEMP_CLOSURE" ? form.breakEnd : null,
      reason: form.reason.trim() || null,
      expected_version: ex?.version ?? null,
    };
    setSaving(true);
    try {
      setWin(await saveScheduleException(kind, entityId, payload));
      toast.success(
        `Saved for ${parseISODate(day.date).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        })}`,
      );
      setMode(null);
      setShowActions(false);
    } catch (e) {
      await handleError(e);
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const onSaveClick = () => {
    const err = validate();
    setFormError(err);
    if (err) return;
    if (mode === "EMERGENCY") setConfirm("EMERGENCY");
    else doSave();
  };

  const doRestore = async () => {
    if (!day || !ex) return;
    setSaving(true);
    try {
      setWin(await deleteScheduleException(kind, entityId, day.date, ex.version));
      toast.success("Regular schedule restored for this date");
      setMode(null);
      setShowActions(false);
    } catch (e) {
      await handleError(e);
    } finally {
      setSaving(false);
      setConfirm(null);
    }
  };

  const onTileKey = (e: React.KeyboardEvent, i: number) => {
    if (!win) return;
    const next = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
    if (next === null || next < 0 || next >= win.days.length) return;
    e.preventDefault();
    setSelected(win.days[next].date);
    tileRefs.current[next]?.focus();
  };

  /* ------------------------------ render ------------------------------ */
  if (loading) {
    return (
      <div className="flex gap-2.5 overflow-hidden py-3" aria-busy="true" aria-label="Loading special dates">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-24 min-w-[84px] animate-pulse rounded-2xl bg-slate-100" />
        ))}
      </div>
    );
  }

  if (error || !win) {
    return (
      <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-sm text-rose-700">
        <p className="font-semibold">{error ?? "Could not load special dates"}</p>
        <button
          type="button"
          onClick={() => {
            setLoading(true);
            load();
          }}
          className={`mt-2 font-semibold text-rose-800 underline hover:no-underline ${FOCUS_RING}`}>
          Retry loading
        </button>
      </div>
    );
  }

  const tz = win.timezone === "Asia/Kolkata" ? "IST (Asia/Kolkata)" : win.timezone;
  const needsReason = mode === "CLOSED" || mode === "HOLIDAY" || mode === "EMERGENCY";

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden">
      {/* 15-Day Rolling Calendar Header (Image 4 Green Circle) */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={18} className="text-[var(--color-primary)] shrink-0" />
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-slate-800 leading-tight">
              15-Day Rolling Calendar
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
              Select a date to configure closures, temporary breaks, or custom operating hours.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-2xs shrink-0">
          <Clock size={11} />
          <span>Dates in {tz}</span>
        </div>
      </div>

      {weeklyDirty && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3.5 py-2 text-xs font-semibold text-amber-800 border border-amber-200/80">
          <AlertTriangle size={14} className="shrink-0 text-amber-600" />
          <span>Special dates use your saved weekly hours. Save your weekly changes first.</span>
        </div>
      )}

      {/* 15-day rolling strip with smooth scroll arrows (Responsive on all devices) */}
      <div className="relative w-full max-w-full">
        {/* Navigation scroll controls for desktop & tablet */}
        <div className="hidden sm:flex items-center justify-between pointer-events-none absolute inset-y-0 -left-1 -right-1 z-10">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollStrip("left")}
            className="pointer-events-auto h-7 w-7 rounded-full bg-white/95 border border-slate-200/90 shadow-md text-slate-600 hover:text-slate-900 flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollStrip("right")}
            className="pointer-events-auto h-7 w-7 rounded-full bg-white/95 border border-slate-200/90 shadow-md text-slate-600 hover:text-slate-900 flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
            <ChevronRight size={16} />
          </button>
        </div>

        <div
          ref={scrollContainerRef}
          role="radiogroup"
          aria-label="Next 15 days"
          className="flex snap-x gap-2 overflow-x-auto overflow-y-hidden pb-2.5 pt-1 px-0.5 scrollbar-thin scroll-smooth"
          style={{ WebkitOverflowScrolling: "touch" }}>
          {win.days.map((d, i) => {
            const st = tileStatus(d);
            const Icon = st.icon;
            const dt = parseISODate(d.date);
            const active = d.date === selected;

            return (
              <button
                key={d.date}
                ref={(el) => {
                  tileRefs.current[i] = el;
                }}
                type="button"
                role="radio"
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => setSelected(d.date)}
                onKeyDown={(e) => onTileKey(e, i)}
                aria-label={`${longDate(d.date)}, ${st.label}${d.is_today ? ", today" : ""}`}
                className={`flex min-w-[82px] sm:min-w-[88px] shrink-0 snap-start flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 text-center transition-all duration-200 cursor-pointer ${FOCUS_RING} ${
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-surface)]/50 ring-2 ring-[var(--color-primary)]/20 shadow-xs"
                    : "border-slate-200/80 bg-white hover:border-[var(--color-primary)]/40 hover:bg-slate-50/50"
                }`}>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {dt.toLocaleDateString("en-IN", { weekday: "short" })}
                </span>
                <span className="text-lg font-extrabold leading-none text-slate-800">
                  {dt.getDate()}
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  {d.is_today ? (
                    <span className="rounded-md bg-[var(--color-surface)] px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-[var(--color-primary)]">
                      Today
                    </span>
                  ) : (
                    dt.toLocaleDateString("en-IN", { month: "short" })
                  )}
                </span>
                <span
                  className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-2xs ${st.tone}`}>
                  <Icon size={10} aria-hidden /> {st.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details & Action Panel (Exact UI from Image 2 & Previous Code) */}
      <AnimatePresence mode="wait" initial={false}>
        {day && (
          <motion.div
            key={day.date}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="mt-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xs">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Calendar size={15} className="text-[var(--color-primary)] shrink-0" />
                  <span>{longDate(day.date)}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Regular weekly schedule:{" "}
                  {day.regular.is_open ? (
                    <strong className="text-slate-700 font-semibold">
                      {formatRange(day.regular.start, day.regular.end)}
                    </strong>
                  ) : (
                    <span className="italic text-slate-400">Closed ({day.weekday} off)</span>
                  )}
                </p>
              </div>

              {ex && (
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 shadow-2xs">
                    Exception Active
                  </span>
                  <button
                    type="button"
                    onClick={() => setConfirm("RESTORE")}
                    className={`text-xs text-[var(--color-primary)] hover:underline flex items-center gap-1 font-semibold ${FOCUS_RING}`}>
                    <RotateCcw size={12} />
                    Restore regular
                  </button>
                </div>
              )}
            </div>

            {/* Prominent Important Notice Banner (Image 2) */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-amber-50/40 border border-amber-200/80 text-amber-900 text-xs shadow-2xs">
              <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-700 mt-0.5 shadow-2xs">
                <AlertTriangle size={14} />
              </div>
              <div className="leading-relaxed">
                <span className="font-bold text-amber-950">Important Notice: </span>
                Existing bookings are not cancelled automatically. Modifying or closing this date will
                block new patient bookings, but previously scheduled patients should be contacted if
                needed.
              </div>
            </div>

            {/* Summary description of current schedule */}
            {ex ? (
              <div className="rounded-xl border border-slate-200/80 bg-white p-3 text-xs text-slate-700 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <p className="font-bold text-slate-800">{TYPE_LABEL[ex.exception_type]}</p>
                  <span className="font-semibold text-[var(--color-primary)]">{describeEffective(day)}</span>
                </div>
                {ex.reason && (
                  <p className="mt-1 text-slate-500">
                    <span className="font-medium text-slate-600">Reason:</span> {ex.reason}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-500 font-medium">
                This date currently follows the regular weekly schedule ({describeEffective(day)}).
              </p>
            )}

            {/* Idle state button: "Customize this date" (Image 2) */}
            {!showActions && !ex && !mode && (
              <div>
                <Button
                  type="button"
                  onClick={() => setShowActions(true)}
                  sx={{
                    borderRadius: "12px",
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: 13,
                    backgroundColor: "var(--color-primary)",
                    color: "var(--color-white)",
                    px: 3,
                    py: 1,
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    "&:hover": { backgroundColor: "var(--color-primary-dark)" },
                  }}>
                  Customize this date
                </Button>
              </div>
            )}

            {/* Action buttons (Close for the day, Mark as holiday, Emergency closure, Change hours, Temporary closure) */}
            {(showActions || ex) && !mode && (
              <div className="flex flex-wrap gap-2 pt-1">
                {ACTIONS.map(({ mode: m, label, hint, icon: Icon, danger }) => (
                  <button
                    key={m}
                    type="button"
                    title={hint}
                    onClick={() => openMode(m)}
                    className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${FOCUS_RING} ${
                      ex?.exception_type === m
                        ? "border-[var(--color-primary)] bg-[var(--color-surface)]/80 text-[var(--color-primary)] shadow-2xs"
                        : danger
                        ? "border-rose-200 bg-white text-rose-700 hover:bg-rose-50/60"
                        : "border-slate-200/90 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50/60"
                    }`}>
                    <Icon size={13} aria-hidden />
                    <span>{label}</span>
                  </button>
                ))}
                {ex && (
                  <button
                    type="button"
                    onClick={() => setConfirm("RESTORE")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline ${FOCUS_RING}`}>
                    <RotateCcw size={13} aria-hidden /> Restore regular schedule
                  </button>
                )}
              </div>
            )}

            {/* Form editor when an action is clicked */}
            <AnimatePresence initial={false}>
              {mode && (
                <motion.div
                  key="editor"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  className="overflow-hidden pt-2">
                  <div className="rounded-xl border border-slate-200/90 bg-white p-4 space-y-3 shadow-xs">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      {ACTIONS.find((a) => a.mode === mode)?.label}
                    </p>

                    {mode === "CUSTOM_HOURS" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                        <label className="text-xs font-semibold text-slate-700">
                          Opens at
                          <TextField
                            type="time"
                            size="small"
                            fullWidth
                            sx={{ ...fieldSx, mt: 0.5 }}
                            value={form.openStart}
                            onChange={(e) => setForm((f) => ({ ...f, openStart: e.target.value }))}
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-700">
                          Closes at
                          <TextField
                            type="time"
                            size="small"
                            fullWidth
                            sx={{ ...fieldSx, mt: 0.5 }}
                            value={form.openEnd}
                            onChange={(e) => setForm((f) => ({ ...f, openEnd: e.target.value }))}
                          />
                        </label>
                      </div>
                    )}

                    {mode === "TEMP_CLOSURE" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
                        <label className="text-xs font-semibold text-slate-700">
                          Closed from
                          <TextField
                            type="time"
                            size="small"
                            fullWidth
                            sx={{ ...fieldSx, mt: 0.5 }}
                            value={form.breakStart}
                            onChange={(e) => setForm((f) => ({ ...f, breakStart: e.target.value }))}
                          />
                        </label>
                        <label className="text-xs font-semibold text-slate-700">
                          Reopens at
                          <TextField
                            type="time"
                            size="small"
                            fullWidth
                            sx={{ ...fieldSx, mt: 0.5 }}
                            value={form.breakEnd}
                            onChange={(e) => setForm((f) => ({ ...f, breakEnd: e.target.value }))}
                          />
                        </label>
                      </div>
                    )}

                    <label className="block text-xs font-semibold text-slate-700">
                      Reason (optional)
                      <TextField
                        size="small"
                        fullWidth
                        sx={{ ...fieldSx, mt: 0.5 }}
                        placeholder={
                          mode === "HOLIDAY"
                            ? "e.g. Diwali Festival"
                            : mode === "EMERGENCY"
                            ? "e.g. Sudden staff emergency"
                            : "Visible to your team"
                        }
                        value={form.reason}
                        inputProps={{ maxLength: 300 }}
                        onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                      />
                    </label>

                    {needsReason && (
                      <p className="text-[11px] text-slate-500">
                        New patient bookings will be blocked for this date.
                      </p>
                    )}

                    {formError && (
                      <p role="alert" className="text-xs font-medium text-rose-600">
                        {formError}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2.5 pt-2">
                      <Button
                        type="button"
                        disabled={saving}
                        onClick={onSaveClick}
                        sx={{
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 600,
                          fontSize: 13,
                          minWidth: 140,
                          height: 38,
                          backgroundColor: mode === "EMERGENCY" ? "var(--color-error)" : "var(--color-primary)",
                          color: "var(--color-white)",
                          "&:hover": {
                            backgroundColor: mode === "EMERGENCY" ? "var(--color-error)" : "var(--color-primary-dark)",
                          },
                          "&.Mui-disabled": {
                            backgroundColor: mode === "EMERGENCY" ? "var(--color-error)" : "var(--color-primary)",
                            color: "var(--color-white)",
                            opacity: 0.45,
                          },
                        }}>
                        {saving ? <CircularProgress size={18} color="inherit" /> : "Save for this date"}
                      </Button>
                      <Button
                        type="button"
                        disabled={saving}
                        onClick={() => setMode(null)}
                        sx={{
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 500,
                          color: "var(--color-text-secondary)",
                          "&:hover": { backgroundColor: "var(--color-surface)" },
                        }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialogs with responsive styling */}
      <Dialog
        open={confirm === "EMERGENCY"}
        onClose={() => !saving && setConfirm(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1, m: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, color: "var(--color-text)" }}>
          Confirm emergency closure
        </DialogTitle>
        <DialogContent>
          <p className="text-xs text-slate-600 leading-relaxed">
            Close on <strong className="text-slate-800">{day && longDate(day.date)}</strong>? New
            bookings will be blocked immediately. Existing bookings are not cancelled automatically.
          </p>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setConfirm(null)}
            disabled={saving}
            sx={{ textTransform: "none", borderRadius: "10px", color: "var(--color-text-secondary)" }}>
            Cancel
          </Button>
          <Button
            onClick={doSave}
            disabled={saving}
            variant="contained"
            color="error"
            sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 600 }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : "Confirm closure"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirm === "RESTORE"}
        onClose={() => !saving && setConfirm(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: "16px", p: 1, m: 2 } }}>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 17, color: "var(--color-text)" }}>
          Restore regular schedule?
        </DialogTitle>
        <DialogContent>
          <p className="text-xs text-slate-600 leading-relaxed">
            This removes the special exception for{" "}
            <strong className="text-slate-800">{day && longDate(day.date)}</strong>. Your baseline
            weekly schedule will apply for this date.
          </p>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setConfirm(null)}
            disabled={saving}
            sx={{ textTransform: "none", borderRadius: "10px", color: "var(--color-text-secondary)" }}>
            Cancel
          </Button>
          <Button
            onClick={doRestore}
            disabled={saving}
            variant="contained"
            sx={{
              textTransform: "none",
              borderRadius: "10px",
              fontWeight: 600,
              backgroundColor: "var(--color-primary)",
              color: "var(--color-white)",
              "&:hover": { backgroundColor: "var(--color-primary-dark)" },
            }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : "Restore"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default SpecialDates;