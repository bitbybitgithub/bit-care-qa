import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Building2,
  Calendar,
  Check,
  Clock,
  Save,
  Wallet,
} from "lucide-react";
import { toast } from "react-toastify";
import { BrandingCard, Card, CodCard, RemindersCard } from "./Settingscards";
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
  const [weekly, setWeekly] = useState<WeeklyDay[]>([]);
  const [base, setBase] = useState<{ cod: boolean; reminders: boolean; weekly: WeeklyDay[] }>({
    cod: false,
    reminders: false,
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
        setLogoSrc(data.logoSrc ?? null);
        setIdentity(data.identity);
        setCod(!!data.cod);
        setReminders(!!data.reminders);
        setWeekly(days);
        setBase({ cod: !!data.cod, reminders: !!data.reminders, weekly: days });
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
  };
  const dirty = changed.logo || changed.cod || changed.reminders || weeklyChanges.length > 0;

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
      await adapter.save({ logoFile, cod, reminders, weekly, weeklyChanges, changed });
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
      <div className="w-full max-w-full min-w-0 rounded-2xl bg-slate-50/60 p-3 sm:p-3 lg:p-3 space-y-4 sm:space-y-6 overflow-hidden">
        {/* Top Header Section (Responsive for all screen sizes) */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200/80 pb-2">
          <div className="min-w-0">
            <span className="mb-1.5 inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-[#0070ba] border border-blue-100 shadow-2xs">
              # {adapter.establishmentLabel} Management
            </span>
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0070ba] text-white shadow-xs">
                <Building2 size={18} />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 tracking-tight truncate">
                {adapter.establishmentLabel} Profile & Availability
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Configure your {adapter.establishmentLabel.toLowerCase()} branding, accepted payment methods,
              automated reminders, and operating schedules.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0 self-start md:self-center">
            <span className="flex items-center gap-1.5 rounded-full bg-white px-2.5 sm:px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200/90 shadow-2xs">
              <Clock size={13} className="text-[#0070ba]" />
              Open Days: {openCount}/{weekly.length}
            </span>
            {cap.cod && (
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1 text-xs font-semibold border shadow-2xs ${
                  cod
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                    : "bg-slate-100 text-slate-500 border-slate-200/80"
                }`}>
                <Wallet size={13} />
                {cod ? "COD Active" : "COD Disabled"}
              </span>
            )}
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid gap-3 lg:grid-cols-12 items-start w-full min-w-0">
          {/* Left Column: Branding, COD, Reminders */}
          <div className="w-full min-w-0 lg:col-span-4 space-y-3">
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
          </div>

          {/* Right Column: Availability */}
          {showAvailability && (
            <div className="w-full min-w-0 lg:col-span-8">
              <Card
                icon={<Clock size={18} />}
                title={`${adapter.establishmentLabel} Availability`}
                subtitle="Manage your weekly operating hours and special calendar date exceptions."
                rightAction={
                  bothTabs && (
                    <div
                      role="tablist"
                      aria-label="Availability tabs"
                      className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200/70">
                      <button
                        type="button"
                        role="tab"
                        id="tab-weekly"
                        aria-selected={tab === "weekly"}
                        aria-controls="panel-weekly"
                        onClick={() => setTab("weekly")}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${FOCUS_RING} ${
                          tab === "weekly"
                            ? "bg-white text-[#0070ba] shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}>
                        <Clock size={13} />
                        <span>Weekly Hours</span>
                      </button>
                      <button
                        type="button"
                        role="tab"
                        id="tab-special"
                        aria-selected={tab === "special"}
                        aria-controls="panel-special"
                        onClick={() => setTab("special")}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${FOCUS_RING} ${
                          tab === "special"
                            ? "bg-white text-[#0070ba] shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}>
                        <Calendar size={13} />
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

        {/* Sticky Save & Discard Footer Bar (Responsive) */}
        <div className="sticky bottom-3 sm:bottom-4 z-40 mt-5 sm:mt-6 rounded-2xl border border-slate-200/90 bg-white/95 px-4 sm:px-5 py-3 sm:py-3.5 shadow-lg backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full max-w-full">
          <div className="flex items-center gap-2 sm:gap-2.5 text-xs sm:text-sm font-medium" role="status" aria-live="polite">
            {dirty ? (
              <>
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse shrink-0" aria-hidden />
                <span className="font-semibold text-amber-900 leading-tight">
                  You have unsaved changes in your settings or schedule.
                </span>
              </>
            ) : (
              <>
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-2xs shrink-0">
                  <Check size={12} strokeWidth={2.5} aria-hidden />
                </span>
                <span className="font-medium text-slate-500 leading-tight">
                  All changes saved in your settings and schedule.
                </span>
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 sm:gap-2.5 w-full sm:w-auto shrink-0">
            <Button
              type="button"
              disabled={!dirty || saving}
              onClick={discard}
              sx={{
                textTransform: "none",
                fontSize: 13,
                fontWeight: 600,
                color: "#64748b",
                borderRadius: "10px",
                "&:hover": { backgroundColor: "#f1f5f9", color: "#1e293b" },
              }}>
              Discard
            </Button>
            <Button
              type="button"
              disabled={!dirty || saving}
              onClick={save}
              aria-busy={saving}
              sx={{
                minWidth: { xs: 120, sm: 140 },
                height: 38,
                borderRadius: "12px",
                textTransform: "none",
                fontWeight: 600,
                fontSize: 13,
                backgroundColor: "#0070ba",
                color: "#fff",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                display: "flex",
                alignItems: "center",
                gap: 1,
                "&:hover": { backgroundColor: "#005a96" },
                "&.Mui-disabled": { backgroundColor: "#0070ba", color: "#fff", opacity: 0.45 },
              }}>
              {saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <>
                  <Save size={15} />
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