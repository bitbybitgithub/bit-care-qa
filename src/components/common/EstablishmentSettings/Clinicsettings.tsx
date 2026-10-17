import React, { useMemo, useRef } from "react";
import EstablishmentSettings from "./Establishmentsettings";
import type { SettingsAdapter, WeeklyDay } from "./Types";
import { toBool } from "./Utils";
import { getSessionItem } from "../../../context/sessions/userSession";
import { Base64ToImage } from "../../../utils/converter";
import {
  fetchClinicProfile,
  saveClinicShifts,
  updateClinicOperationStatus,
  updateClinicProfile,
  type ShiftPayload,
} from "../../../api/clinic/ClinicApi";

/** The UI manages ONE shift per day: the first active one (earliest start). */
const pickFirstShift = (shifts: ShiftPayload[], coId: number | string) => {
  const mine = shifts.filter((s) => String(s.co_id) === String(coId));
  const active = mine.filter((s) => toBool(s.is_active));
  return [...(active.length ? active : mine)].sort((a, b) =>
    a.shift_start.localeCompare(b.shift_start),
  )[0];
};

const ClinicSettings: React.FC = () => {
  const clinicId = getSessionItem("user", "clinic_id");

  // The old Step 2 values are no longer shown, but they are still stored on the
  // clinic. Send the loaded values back unchanged so saving never overwrites them.
  const extras = useRef<{ operational_hrs?: string; patient_demand?: string }>({});

  const adapter = useMemo<SettingsAdapter>(
    () => ({
      kind: "clinic",
      entityId: clinicId,
      establishmentLabel: "Clinic",
      hoursLabel: "Consultation hours",
      capabilities: { cod: true, reminders: true, slotDuration: true, weekly: true, specialDates: true },

      async load() {
        const data = await fetchClinicProfile(Number(clinicId));
        extras.current = {
          operational_hrs: data.operational_hrs || undefined,
          patient_demand: data.patient_demand || undefined,
        };

        const rawSlot = data.slot_duration ?? localStorage.getItem(`clinic_slot_duration_${clinicId}`);
        const slotDuration = rawSlot ? Number(rawSlot) : 15;

        const weekly: WeeklyDay[] = data.operational_days.map((d) => {
          const first = pickFirstShift(data.shifts ?? [], d.co_id);
          return {
            id: d.co_id,
            day: d.day,
            isOpen: toBool(d.is_active),
            start: first?.shift_start?.slice(0, 5) ?? "",
            end: first?.shift_end?.slice(0, 5) ?? "",
            meta: {
              clinicId: d.clinic_id,
              shiftNo: first?.shift ?? 1,
              hasShift: !!first,
            },
          };
        });

        return {
          logoSrc: data.logo ? Base64ToImage(data.logo) : null,
          weekly,
          cod: toBool(data.is_cod),
          reminders: Number(data.patient_reminder) === 1,
          slotDuration,
        };
      },

      async save(input) {
        const id = Number(clinicId);

        // profile (logo / COD / reminders / slotDuration)
        if (
          input.changed.logo ||
          input.changed.cod ||
          input.changed.reminders ||
          input.changed.slotDuration
        ) {
          const fd = new FormData();
          if (input.logoFile) fd.append("clinic_logo", input.logoFile);
          fd.append("clinic_id", String(id));
          if (extras.current.operational_hrs)
            fd.append("operational_hrs", extras.current.operational_hrs);
          if (extras.current.patient_demand)
            fd.append("patient_demand", extras.current.patient_demand);
          fd.append("is_cod", String(input.cod));
          fd.append("patient_reminder", input.reminders ? "1" : "0");
          if (input.slotDuration !== undefined) {
            fd.append("slot_duration", String(input.slotDuration));
            localStorage.setItem(`clinic_slot_duration_${clinicId}`, String(input.slotDuration));
          }
          await updateClinicProfile(fd);
        }

        // open/closed per changed day (one request each, in order)
        for (const c of input.weeklyChanges) {
          if (c.statusChanged) {
            await updateClinicOperationStatus(c.day.id, id, c.day.isOpen);
          }
        }

        // hours: one shift per day. Reuse the existing shift number so the
        // backend updates it instead of adding a second shift.
        const shifts: ShiftPayload[] = input.weeklyChanges
          .filter((c) => c.day.isOpen && (c.hoursChanged || !c.day.meta?.hasShift))
          .map((c) => {
            const n = Number(c.day.meta?.shiftNo);
            return {
              clinic_id: id,
              co_id: c.day.id,
              shift: Number.isFinite(n) && n > 0 ? n : 1,
              shift_start: c.day.start,
              shift_end: c.day.end,
              is_active: 1,
            };
          });
        if (shifts.length > 0) await saveClinicShifts(shifts);
      },
    }),
    [clinicId],
  );

  return <EstablishmentSettings adapter={adapter} />;
};

export default ClinicSettings;