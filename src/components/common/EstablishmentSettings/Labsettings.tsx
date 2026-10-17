import React, { useMemo } from "react";
import EstablishmentSettings from "./Establishmentsettings";
import type { SettingsAdapter, WeeklyDay } from "./Types";
import { toBool } from "./Utils";
import { getSessionItem } from "../../../context/sessions/userSession";
import { Base64ToImage } from "../../../utils/converter";
import {
  fetchLabProfile,
  saveLabShift,
  uploadLabLogo,
} from "../../../api/labApis/LabApi";

const LabSettings: React.FC = () => {
  const labId = getSessionItem("user", "lab_id");

  const adapter = useMemo<SettingsAdapter>(
    () => ({
      kind: "lab",
      entityId: labId,
      establishmentLabel: "Lab",
      hoursLabel: "Collection hours",
      capabilities: { cod: true, reminders: false, weekly: true, specialDates: true },
      requireLogo: true, // existing lab rule: a logo is needed before saving

      async load() {
        const data: any = await fetchLabProfile(Number(labId));
        const weekly: WeeklyDay[] = (data.operational_days ?? []).map((d: any) => ({
          id: d.lab_opt_id,
          day: d.day,
          isOpen: toBool(d.is_active),
          start: d.start_time ? String(d.start_time).slice(0, 5) : "",
          end: d.end_time ? String(d.end_time).slice(0, 5) : "",
        }));
        return {
          logoSrc: data.lab?.logo ? Base64ToImage(data.lab.logo) : null,
          weekly,
          cod: toBool(data.lab?.is_cod),
        };
      },

      async save(input) {
        if (input.logoFile) {
          const fd = new FormData();
          fd.append("lab_logo", input.logoFile);
          fd.append("lab_id", String(labId));
          await uploadLabLogo(fd);
        }

        // The lab endpoint saves every day plus the COD flag in one call.
        const operations = input.weekly.map((d) =>
          d.isOpen && d.start && d.end
            ? { lab_opt_id: d.id, start_time: d.start, end_time: d.end, is_active: "1" }
            : { lab_opt_id: d.id, start_time: null, end_time: null, is_active: "0" },
        );
        const res: any = await saveLabShift(labId as string, operations as any, input.cod);
        if (!res?.success) throw new Error("Failed to save settings");
      },
    }),
    [labId],
  );

  return <EstablishmentSettings adapter={adapter} />;
};

export default LabSettings;