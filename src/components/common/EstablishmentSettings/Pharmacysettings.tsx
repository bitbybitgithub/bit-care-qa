import React, { useMemo } from "react";
import EstablishmentSettings from "./Establishmentsettings";
import type { SettingsAdapter, WeeklyDay } from "./Types";
import { toBool } from "./Utils";
import { getSessionItem } from "../../../context/sessions/userSession";
import {
  getpharmaprofileinfo,
  savePharmaProfileInfo,
  getPharmaScheduleApi,
  savePharmaScheduleApi,
} from "../../../api/pharmacyApi/PharmacyApi";

const DEFAULT_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const toLogoSrc = (logo?: string | null) => {
  if (!logo) return null;
  if (
    logo.startsWith("data:image") ||
    logo.startsWith("http") ||
    logo.startsWith("/") ||
    logo.startsWith("blob:")
  ) {
    return logo;
  }
  return `data:image/jpeg;base64,${logo}`;
};

/**
 * Pharmacy Settings page matching Lab and Clinic settings.
 * Features: BrandingCard (logo), COD payment toggle, Weekly operating hours, and Special dates schedule exceptions.
 */
const PharmacySettings: React.FC = () => {
  const rawPharmaId =
    getSessionItem("user", "pharmacy_id") ??
    getSessionItem("user", "pharma_id");
  const pharmaId = rawPharmaId ? Number(rawPharmaId) : null;

  const rawLoginId =
    getSessionItem("user", "user_id") ??
    getSessionItem("user", "login_id");
  const loginId = rawLoginId ? Number(rawLoginId) : 0;

  const adapter = useMemo<SettingsAdapter>(
    () => ({
      kind: "pharmacy",
      entityId: pharmaId,
      establishmentLabel: "Pharmacy",
      hoursLabel: "Store hours",
      capabilities: {
        cod: true,
        reminders: false,
        weekly: true,
        specialDates: true,
      },

      async load() {
        if (!pharmaId) {
          throw new Error("Pharmacy ID not found in session");
        }

        // 1. Fetch pharmacy profile info
        let profile: any = null;
        try {
          profile = await getpharmaprofileinfo(pharmaId, loginId);
        } catch (err) {
          console.warn("Could not load pharmacy profile info:", err);
        }

        // 2. Fetch pharmacy schedule (with fallback to cached or default 7 days)
        let rawSchedule: any[] = [];
        try {
          rawSchedule = await getPharmaScheduleApi(pharmaId);
        } catch (err) {
          console.warn("Could not load pharmacy schedule from API:", err);
        }

        if ((!rawSchedule || rawSchedule.length === 0) && pharmaId) {
          try {
            const cached = localStorage.getItem(`pharma_schedule_${pharmaId}`);
            if (cached) {
              rawSchedule = JSON.parse(cached);
            }
          } catch (err) {
            console.warn("Could not load cached pharmacy schedule:", err);
          }
        }

        let weekly: WeeklyDay[] = [];
        if (Array.isArray(rawSchedule) && rawSchedule.length > 0) {
          weekly = rawSchedule.map((d: any, idx: number) => ({
            id: d.pharma_opt_id ?? d.id ?? idx + 1,
            day: d.day,
            isOpen: toBool(d.is_active ?? d.isOpen),
            start: d.start_time
              ? String(d.start_time).slice(0, 5)
              : d.start ?? "09:00",
            end: d.end_time
              ? String(d.end_time).slice(0, 5)
              : d.end ?? "21:00",
          }));
        } else {
          weekly = DEFAULT_DAYS.map((day, idx) => ({
            id: idx + 1,
            day,
            isOpen: true,
            start: "09:00",
            end: "21:00",
          }));
        }

        // 3. Resolve COD status (backend field or cached preference)
        let isCod = false;
        if (
          profile &&
          (profile.is_cod !== undefined || profile.cod !== undefined)
        ) {
          isCod = toBool(profile.is_cod ?? profile.cod);
        } else if (pharmaId) {
          const cachedCod = localStorage.getItem(`pharma_cod_${pharmaId}`);
          if (cachedCod !== null) {
            isCod = cachedCod === "true";
          }
        }

        return {
          logoSrc: toLogoSrc(profile?.pharma_logo),
          weekly,
          cod: isCod,
        };
      },

      async save(input) {
        if (!pharmaId) {
          throw new Error("Pharmacy ID missing");
        }

        // Save logo and/or COD if modified
        if (input.changed.logo || input.changed.cod) {
          const r = await savePharmaProfileInfo(
            pharmaId,
            input.logoFile ?? undefined,
            input.cod,
          );
          if (!r.success) {
            throw new Error(r.message || "Failed to save pharmacy profile details");
          }
          localStorage.setItem(`pharma_cod_${pharmaId}`, String(input.cod));
        }

        // Save weekly operating schedule if modified
        if (input.weeklyChanges.length > 0) {
          const operations = input.weekly.map((d) => ({
            pharma_opt_id: d.id,
            day: d.day,
            is_active: d.isOpen ? 1 : 0,
            start_time: d.isOpen && d.start && d.end ? d.start : null,
            end_time: d.isOpen && d.start && d.end ? d.end : null,
          }));

          await savePharmaScheduleApi(pharmaId, operations);
          localStorage.setItem(
            `pharma_schedule_${pharmaId}`,
            JSON.stringify(input.weekly),
          );
        }
      },
    }),
    [pharmaId, loginId],
  );

  return <EstablishmentSettings adapter={adapter} />;
};

export default PharmacySettings;