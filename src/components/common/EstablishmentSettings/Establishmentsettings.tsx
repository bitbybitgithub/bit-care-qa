import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Building2,
  Calendar,
  Check,
  Clock,
  Save,
  Timer,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import { BrandingCard, Card, CodCard, RemindersCard, SlotDurationCard } from "./Settingscards";
import WeeklyHours from "./WeeklyHours";
import SpecialDates from "./Specialdates";
import type { SettingsAdapter, WeeklyChange, WeeklyDay } from "./Types";
import { FOCUS_RING, apiErrorMessage, sortWeekly, validateDay } from "./Utils";

type Tab = "weekly" | "special";

interface Props {
  adapter: SettingsAdapter;
}

/**
 * Modern, unified settings page for Clinic, Lab and Pharmacy.
 * Fully responsive across mobile, tablet, and desktop viewports.
 */
const EstablishmentSettings: React.FC<Props> = ({ adapter }) => {
  const cap = adapter.capabilities;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [attempted, setAttempted] = useState(false);

  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [identity, setIdentity] = useState<{ label: string; value: string }[] | undefined>();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [cod, setCod] = useState(false);
  const [reminders, setReminders] = useState(false);
  const [slotDuration, setSlotDuration] = useState<number>(15);
  const [weekly, setWeekly] = useState<WeeklyDay[]>([]);
  const [base, setBase] = useState<{
    cod: boolean;
    reminders: boolean;
    slotDuration: number;
    weekly: WeeklyDay[];
  }>({
    cod: false,
    reminders: false,
    slotDuration: 15,
    weekly: [],
  });

  const [tab, setTab] = useState<Tab>(cap.weekly ? "weekly" : "special");
  const [refreshKey, setRefreshKey] = useState(0);

  /* ---------------------------- load ---------------------------- */
  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const data = await adapter.load();
        const days = sortWeekly(data.weekly);
        const slot = data.slotDuration ?? 15;
        setLogoSrc(data.logoSrc ?? null);
        setIdentity(data.identity);
        setCod(!!data.cod);
        setReminders(!!data.reminders);
        setSlotDuration(slot);
        setWeekly(days);
        setBase({
          cod: !!data.cod,
          reminders: !!data.reminders,
          slotDuration: slot,
          weekly: days,
        });
        setLogoFile(null);
        setLoadError(null);
      } catch (e) {
        setLoadError(apiErrorMessage(e, `Failed to load ${adapter.establishmentLabel.toLowerCase()} settings`));
      } finally {
        setLoading(false);
      }
    },
    [adapter],
  );

  useEffect(() => {
    if (adapter.entityId) load();
  }, [adapter, load]);

  /* ------------------------ change tracking ------------------------ */
  const weeklyChanges = useMemo<WeeklyChange[]>(
    () =>
      weekly.flatMap((d) => {
        const b = base.weekly.find((x) => x.id === d.id);
        if (!b) return [];
        const statusChanged = b.isOpen !== d.isOpen;
        const hoursChanged = d.isOpen && (b.start !== d.start || b.end !== d.end);
        return statusChanged || hoursChanged ? [{ day: d, statusChanged, hoursChanged }] : [];
      }),
    [weekly, base.weekly],
  );

  const changed = {
    logo: !!logoFile,
    cod: cap.cod && cod !== base.cod,
    reminders: cap.reminders && reminders !== base.reminders,
    slotDuration: !!cap.slotDuration && slotDuration !== base.slotDuration,
  };
  const dirty =
    changed.logo ||
    changed.cod ||
    changed.reminders ||
    changed.slotDuration ||
    weeklyChanges.length > 0;

  const errors = useMemo(() => {
    const touched = new Set(weeklyChanges.map((c) => c.day.id));
    return Object.fromEntries(
      weekly.map((d) => [d.id, touched.has(d.id) ? validateDay(d, attempted) : null]),
    ) as Record<string | number, string | null>;
  }, [weekly, weeklyChanges, attempted]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  /* ----------------------------- actions ----------------------------- */
  const updateDay = useCallback((id: string | number, patch: Partial<WeeklyDay>) => {
    setWeekly((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  const discard = () => {
    setWeekly(base.weekly);
    setCod(base.cod);
    setReminders(base.reminders);
    setSlotDuration(base.slotDuration);
    setLogoFile(null);
    setAttempted(false);
  };

  const save = async () => {
    setAttempted(true);

    if (weeklyChanges.some((c) => validateDay(c.day, true))) {
      toast.error("Fix highlighted hours before saving");
      return;
    }
    if (adapter.requireLogo && !logoFile && !logoSrc) {
      toast.error(`Upload ${adapter.establishmentLabel.toLowerCase()} logo before saving`);
      return;
    }

    setSaving(true);
    try {
      await adapter.save({
        logoFile,
        cod,
        reminders,
        slotDuration,
        weekly,
        weeklyChanges,
        changed,
      });
      toast.success("Settings saved successfully");
      setAttempted(false);
      await load(true);
      setRefreshKey((k) => k + 1);
    } catch (e) {
      toast.error(apiErrorMessage(e, "Failed to save settings"));
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------------ render ------------------------------ */
  if (!adapter.entityId) {
    return (
      <div role="alert" className="m-4 sm:m-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-5 sm:p-6 text-sm text-rose-700">
        Your {adapter.establishmentLabel.toLowerCase()} could not be identified. Please sign in again.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-12 w-full" aria-busy="true">
        <div className="lg:col-span-4 h-64 animate-pulse rounded-2xl bg-slate-200/70" />
        <div className="lg:col-span-8 h-96 animate-pulse rounded-2xl bg-slate-200/70" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div role="alert" className="m-4 sm:m-6 rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-sm text-rose-700">
        {loadError}
        <button
          type="button"
          onClick={() => load()}
          className={`ml-3 rounded font-semibold underline hover:no-underline ${FOCUS_RING}`}>
          Retry
        </button>
      </div>
    );
  }

  const showAvailability = cap.weekly || cap.specialDates;
  const bothTabs = cap.weekly && cap.specialDates;
  const openCount = weekly.filter((d) => d.isOpen).length;

  return (
    <MotionConfig reducedMotion="user">
      <div className="w-full max-w-full min-w-0 rounded-2xl bg-slate-50/60 p-2 sm:p-2.5 space-y-2.5 overflow-hidden">
        {/* Top Header Section (Prominent & Clear Hierarchy) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200/80 pb-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)] text-white shadow-xs">
              <Building2 size={19} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 tracking-tight truncate">
                  {adapter.establishmentLabel} Profile & Availability
                </h1>
                <span className="hidden sm:inline-flex items-center rounded-md bg-[var(--color-surface)] px-2 py-0.5 text-xs font-bold text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                  #{adapter.establishmentLabel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate font-normal">
                Configure your {adapter.establishmentLabel.toLowerCase()} branding, payments, reminders & schedule
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200 shadow-2xs">
              <Clock size={12} className="text-[var(--color-primary)]" />
              Open: {openCount}/{weekly.length}
            </span>
            {cap.slotDuration && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200/80 shadow-2xs">
                <Timer size={12} />
                Slot: {slotDuration}m
              </span>
            )}
            {cap.cod && (
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border shadow-2xs ${
                  cod
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                    : "bg-slate-100 text-slate-500 border-slate-200/80"
                }`}>
                <Wallet size={12} />
                {cod ? "COD Active" : "No COD"}
              </span>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid gap-2.5 lg:grid-cols-12 items-start w-full min-w-0">
          {/* Left Column: Branding, COD, Reminders, Slot Duration */}
          <div className="w-full min-w-0 lg:col-span-4 space-y-2">
            <BrandingCard
              establishmentLabel={adapter.establishmentLabel}
              logoSrc={logoSrc}
              logoFile={logoFile}
              onFileChange={setLogoFile}
              identity={identity}
            />

            {cap.cod && (
              <CodCard
                establishmentLabel={adapter.establishmentLabel}
                checked={cod}
                onChange={setCod}
              />
            )}

            {cap.reminders && (
              <RemindersCard
                checked={reminders}
                onChange={setReminders}
              />
            )}

            {cap.slotDuration && (
              <SlotDurationCard
                value={slotDuration}
                onChange={setSlotDuration}
              />
            )}
          </div>

          {/* Right Column: Availability */}
          {showAvailability && (
            <div className="w-full min-w-0 lg:col-span-8">
              <Card
                icon={<Clock size={16} />}
                title={`${adapter.establishmentLabel} Availability`}
                subtitle="Manage weekly operating hours and special date exceptions."
                rightAction={
                  bothTabs && (
                    <div
                      role="tablist"
                      aria-label="Availability tabs"
                      className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200/70">
                      <button
                        type="button"
                        role="tab"
                        id="tab-weekly"
                        aria-selected={tab === "weekly"}
                        aria-controls="panel-weekly"
                        onClick={() => setTab("weekly")}
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer ${FOCUS_RING} ${
                          tab === "weekly"
                            ? "bg-white text-[var(--color-primary)] shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}>
                        <Clock size={12} />
                        <span>Weekly Hours</span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        id="tab-special"
                        aria-selected={tab === "special"}
                        aria-controls="panel-special"
                        onClick={() => setTab("special")}
                        className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-all duration-200 cursor-pointer ${FOCUS_RING} ${
                          tab === "special"
                            ? "bg-white text-[var(--color-primary)] shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}>
                        <Calendar size={12} />
                        <span>Special Dates</span>
                      </button>
                    </div>
                  )
                }>
                <AnimatePresence mode="wait" initial={false}>
                  {cap.weekly && (!bothTabs || tab === "weekly") && (
                    <motion.div
                      key="weekly"
                      role="tabpanel"
                      id="panel-weekly"
                      aria-labelledby={bothTabs ? "tab-weekly" : undefined}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.16 }}>
                      <WeeklyHours
                        days={weekly}
                        errors={errors}
                        hoursLabel={adapter.hoursLabel}
                        onChange={updateDay}
                      />
                    </motion.div>
                  )}

                  {cap.specialDates && (!bothTabs || tab === "special") && (
                    <motion.div
                      key="special"
                      role="tabpanel"
                      id="panel-special"
                      aria-labelledby={bothTabs ? "tab-special" : undefined}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.16 }}>
                      <SpecialDates
                        kind={adapter.kind}
                        entityId={adapter.entityId}
                        refreshKey={refreshKey}
                        weeklyDirty={weeklyChanges.length > 0}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </div>
          )}
        </div>

        {/* Sticky Save & Discard Footer Bar (Compact & Responsive) */}
        <div className="sticky bottom-1 z-40 mt-2 sm:mt-2.5 rounded-xl border border-slate-200/90 bg-white/95 px-3 sm:px-4 py-1.5 sm:py-2 shadow-md backdrop-blur-md flex flex-row items-center justify-between gap-2 w-full max-w-full">
          <div className="flex items-center gap-2 text-xs font-medium min-w-0" role="status" aria-live="polite">
            {dirty ? (
              <>
                <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse shrink-0" aria-hidden />
                <span className="font-semibold text-amber-900 truncate text-[11px] sm:text-xs">
                  Unsaved changes in settings or schedule.
                </span>
              </>
            ) : (
              <>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-2xs shrink-0">
                  <Check size={10} strokeWidth={2.5} aria-hidden />
                </span>
                <span className="font-medium text-slate-500 truncate text-[11px] sm:text-xs">
                  All changes saved in your settings and schedule.
                </span>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
            <Button
              type="button"
              disabled={!dirty || saving}
              onClick={discard}
              size="small"
              sx={{
                textTransform: "none",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-text-secondary)",
                borderRadius: "8px",
                height: 30,
                px: 1.5,
                "&:hover": { backgroundColor: "var(--color-surface)", color: "var(--color-text)" },
              }}>
              Discard
            </Button>
            <Button
              type="button"
              disabled={!dirty || saving}
              onClick={save}
              aria-busy={saving}
              size="small"
              sx={{
                minWidth: { xs: 100, sm: 120 },
                height: 30,
                borderRadius: "8px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: 12,
                backgroundColor: "var(--color-primary)",
                color: "var(--color-white)",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                display: "flex",
                alignItems: "center",
                gap: 0.75,
                px: 2,
                "&:hover": { backgroundColor: "var(--color-primary-dark)" },
                "&.Mui-disabled": { backgroundColor: "var(--color-primary)", color: "var(--color-white)", opacity: 0.45 },
              }}>
              {saving ? (
                <CircularProgress size={14} color="inherit" />
              ) : (
                <>
                  <Save size={13} />
                  <span>Save Settings</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
};

export default EstablishmentSettings;