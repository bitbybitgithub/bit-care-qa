import React, { useCallback, useEffect, useState } from "react";
import { Button } from "@mui/material";
import { toast } from "react-toastify";

import UploadControl from "../../components/common/UploadControl";
import { Base64ToImage } from "../../utils/converter";
import { getSessionItem } from "../../context/sessions/userSession";
import LabScheduleDayWrapper from "./LabScheduleDayWrapper";
import { useLoader } from "../../context/LoaderContext";
import {
  fetchLabProfile,
  saveLabShift,
  uploadLabLogo,
} from "../../api/labApis/LabApi";

export interface OperationalDay {
  lab_id: number | string;
  lab_opt_id: number | string;
  day: string;
  is_active: number;
}

export interface ShiftSlot {
  start: string;
  end: string;
  error?: string | null;
}

export interface ShiftDayMap {
  [lab_opt_id: string]: ShiftSlot[];
}

const LabProfile: React.FC = () => {
  const labid = getSessionItem("user", "lab_id");
  const { setLoading } = useLoader();
  const [operationalDays, setOperationalDays] = useState<OperationalDay[]>([]);
  const [shiftMap, setShiftMap] = useState<ShiftDayMap>({});
  const [labLogo, setLabLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [logoImg, setLogoImg] = useState<string | null>(null);
  const [fileerror, setFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!labid) return;

    const loadProfile = async () => {
      try {
        const data = await fetchLabProfile(Number(labid));

        const days: OperationalDay[] = data.operational_days.map((d: any) => ({
          lab_id: labid,
          lab_opt_id: d.lab_opt_id,
          day: d.day,
          is_active: d.is_active ? 1 : 0,
        }));

        const initialShiftMap: ShiftDayMap = {};

        data.operational_days.forEach((d: any) => {
          if (d.start_time && d.end_time) {
            initialShiftMap[d.lab_opt_id] = [
              { start: d.start_time.slice(0, 5), end: d.end_time.slice(0, 5) },
            ];
          }
        });

        setOperationalDays(days);
        setShiftMap(initialShiftMap);

        if (data.lab?.logo) {
          setLogoImg(Base64ToImage(data.lab.logo));
        }
      } catch {
        toast.error("Failed to load lab profile");
      }
    };

    loadProfile();
  }, [labid]);

  const handleOperationDay = useCallback(
    (lab_opt_id: number | string, labId: number | string, active: boolean) => {
      setOperationalDays((prev) =>
        prev.map((d) =>
          d.lab_opt_id === lab_opt_id ? { ...d, is_active: active ? 1 : 0 } : d
        )
      );

      if (!active) {
        setShiftMap((prev) => {
          const copy = { ...prev };
          delete copy[lab_opt_id];
          return copy;
        });
      }
    },
    []
  );

  const updateDayShifts = useCallback(
    (lab_opt_id: number | string, shifts: ShiftSlot[]) => {
      setShiftMap((prev) => ({
        ...prev,
        [lab_opt_id]: shifts,
      }));
    },
    []
  );

  const handleFileChange = (file: File | null) => {
    setLabLogo(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      if (!logoImg && !labLogo) {
        toast.error("Upload lab logo before saving");
        return;
      }

      if (labLogo) {
        const fd = new FormData();
        fd.append("lab_logo", labLogo);
        fd.append("lab_id", String(labid));
        await uploadLabLogo(fd);
      }

      const operations = operationalDays.map((d) => {
        const shifts = shiftMap[d.lab_opt_id];

        if (!d.is_active || !shifts?.length) {
          return {
            lab_opt_id: d.lab_opt_id,
            start_time: null,
            end_time: null,
            is_active: "0",
          };
        }

        return {
          lab_opt_id: d.lab_opt_id,
          start_time: shifts[0].start,
          end_time: shifts[0].end,
          is_active: "1",
        };
      });

      const res = await saveLabShift(labid, operations);
      res.success
        ? toast.success("Shifts saved successfully")
        : toast.error("Failed to save shifts");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 bg-white rounded-lg h-[82vh] overflow-y-scroll">
      <section className="mb-6">
        <h3 className="mb-3 font-semibold">Lab Branding</h3>

        <div className="flex gap-6">
          <div
            className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] overflow-hidden"
            aria-hidden={!!(preview || logoImg) ? "false" : "true"}
          >
            {preview || logoImg ? (
              <img
                src={logoImg ?? preview!}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-medium text-[var(--color-text-secondary)]">
                Logo
              </span>
            )}
          </div>

          {!logoImg && (
            <div className="flex flex-col w-full">
              <label className="block font-medium text-[var(--color-text-secondary)] mb-2">
                Upload Lab Logo
              </label>
              <UploadControl
                controlName="labLogo"
                file={labLogo}
                onFileChange={handleFileChange}
                onError={setFileError}
                acceptedFileTypes=".jpg,.png,.svg"
                maxSizeMB={5}
                height="50px"
              />
              {fileerror && <p className="text-red-500 text-sm">{fileerror}</p>}
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 font-semibold">Daily Schedule</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {operationalDays.map((day) => (
            <LabScheduleDayWrapper
              key={day.lab_opt_id}
              day={{ ...day, is_active: day.is_active === 1 }}
              shifts={shiftMap[day.lab_opt_id] || []}
              handleOperationDay={handleOperationDay}
              onShiftChange={updateDayShifts}
            />
          ))}
        </div>
      </section>

      <Button fullWidth variant="contained" onClick={handleSave}>
        Save & Complete
      </Button>
    </div>
  );
};

export default LabProfile;
