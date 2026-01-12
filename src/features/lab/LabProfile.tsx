
import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";

import UploadControl from "../../components/common/UploadControl";
import { Base64ToImage } from "../../utils/converter";
import { getSessionItem } from "../../context/sessions/userSession";
import LabScheduleDayWrapper from "./LabScheduleDayWrapper";
import { useLoader } from "../../context/LoaderContext";
import { fetchLabProfile, saveLabShift, uploadLabLogo } from "../../api/labApis/LabApi";


// ================= TYPES =================
interface OperationalDay {
  lab_id: number | string;
  lab_opt_id: number | string;
  start_time: string;
  end_time: string;
  day: string;
  is_active: number; // 0 | 1
}

interface ShiftPayload {
  lab_id: number | string;
  lab_opt_id: number | string;
  shift: number;
  shift_start: string;
  shift_end: string;
  is_active: number | boolean;
}


// ================= COMPONENT =================
const LabProfile: React.FC = () => {
  const labid = getSessionItem("user", "lab_id");
  // const labid = 2;

  const [labLogo, setlabLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [logoImg, setLogoImg] = useState<string | null>(null);

  const [operationalDays, setOperationalDays] = useState<OperationalDay[]>([]);
  const [shiftDetails, setShiftDetails] = useState<ShiftPayload[]>([]);
  const [initialAllShifts, setInitialAllShifts] = useState<ShiftPayload[]>([]); // future use
    const { loading, setLoading } = useLoader();
  // ================= LOAD PROFILE =================
  useEffect(() => {
    if (!labid) return;

    const loadProfile = async () => {
      try {
        const data = await fetchLabProfile(Number(labid));

        const mappedDays: OperationalDay[] = data.operational_days.map((d) => ({
          lab_id: Number(labid),
          lab_opt_id: Number(d.lab_opt_id),
          start_time: d.start_time,
          end_time: d.end_time,
          day: d.day,
          is_active: d.is_active ? 1 : 0,
        }));

        const mappedShifts: ShiftPayload[] = data.operational_days
          .filter((d) => d.start_time && d.end_time)
          .map((d) => ({
            lab_id: Number(labid),
            lab_opt_id: Number(d.lab_opt_id),
            shift: 1,
            shift_start: d.start_time,
            shift_end: d.end_time,
            is_active: d.is_active ? 1 : 0,
          }));

        setOperationalDays(mappedDays);
        setInitialAllShifts(mappedShifts);
        setShiftDetails(mappedShifts);

        if (data.lab?.logo) {
          setLogoImg(Base64ToImage(data.lab.logo));
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load lab profile");
      }
    };

    loadProfile();
  }, [labid]);

  // =======================save Logo ========================
  const uploadLogo = async (file: File | null, labid: number | string | null) => {
    if (!file) {
      // No file selected - do nothing if logoImg exists (already loaded logo)
      if (logoImg) {
        return;
      }
      toast.error("Please select a logo file before saving.");
      return;
    }
    if (!labid) {
      toast.error("Lab ID not found.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("lab_logo", file);
      formData.append("lab_id", labid.toString());
      const res = await uploadLabLogo(formData);
      toast.success("Logo uploaded successfully!");
      console.log("Upload response:", res.data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to upload logo.");
    }
  };

  // =========================shift Timing Save==================
const saveLabShifts = async (
  labid: number | string,
  shiftDetails: ShiftPayload[],
  operationalDays: OperationalDay[]
) => {
  if (!labid) {
    toast.error("Lab ID not found.");
    return;
  }

  if (!logoImg && !labLogo) {
    toast.error("Please upload lab logo before saving shifts.");
    return;
  }
  // At least one active shift must have time
const hasAtLeastOneValidShift = operationalDays.some((day) => {
  if (day.is_active === 0) return false;

  const shift = shiftDetails.find(
    (s) => s.lab_opt_id === day.lab_opt_id
  );

  return !!(shift?.shift_start && shift?.shift_end);
});

if (!hasAtLeastOneValidShift) {
  toast.error(
    "Please configure at least one shift timing before saving."
  );
  return;
}

  const normalizeTime = (time?: string | null) => {
    if (!time) return null;
    return time.slice(0, 5); // "HH:mm:ss" → "HH:mm"
  };

  // Map day info
  const dayMap = new Map<number | string,{ day: string; is_active: number }>();
  
  operationalDays.forEach((d) => {
    dayMap.set(d.lab_opt_id, {
      day: d.day,
      is_active: d.is_active,
    });
  });

  // Weekend validation ONLY if active
  const invalidWeekendShift = shiftDetails.some((s) => {
    const info = dayMap.get(s.lab_opt_id);
    if (!info || info.is_active === 0) return false;

    if (
      (info.day === "Saturday" || info.day === "Sunday") &&
      (!s.shift_start || !s.shift_end)
    ) {
      return true;
    }
    return false;
  });

  if (invalidWeekendShift) {
    toast.error(
      "Saturday and Sunday must have start and end time when active."
    );
    return;
  }

  // ✅ FINAL OPERATIONS PAYLOAD
  const operations = operationalDays.map((day) => {
    const shift = shiftDetails.find(
      (s) => s.lab_opt_id === day.lab_opt_id
    );

    if (day.is_active === 0) {
      return {
        lab_opt_id: day.lab_opt_id,
        start_time: null,
        end_time: null,
        is_active: "0",
      };
    }

    return {
      lab_opt_id: day.lab_opt_id,
      start_time: normalizeTime(shift?.shift_start),
      end_time: normalizeTime(shift?.shift_end),
      is_active: "1",
    };
  });

  console.log("FINAL PAYLOAD:", {
    lab_id: labid,
    operations,
  });

  try {
    const res = await saveLabShift(labid,operations)

    if (res.data.success) {
      toast.success(res.data.message || "Shifts saved successfully");
    } else {
      toast.error(res.data.message || "Failed to save shifts");
    }
  } catch (err: any) {
    console.error(err);
    toast.error(err.response?.data?.message || "Error saving shifts");
  }
};

  // ================= HANDLERS =================

  // 🔁 Toggle handler (NO API CALL HERE)
  const handleOperationDay = useCallback(
    (coId: number | string, labId: number | string, value: boolean) => {
      setOperationalDays((prev) =>
        prev.map((d) => (d.lab_opt_id === coId ? { ...d, is_active: value ? 1 : 0 } : d))
      );
    },
    []
  );

  // 🔁 Shift change collector (used later for SAVE API)
  const handleShiftChange = useCallback(
    (lab_opt_id: number | string, formattedShifts: ShiftPayload[]) => {
      setShiftDetails((prev) => {
        const others = prev.filter((s) => s.lab_opt_id !== lab_opt_id);
        return [...others, ...formattedShifts];
      });
    },
    []
  );

  const handleFileChange = (file: File | null) => {
    if (file) {
      setlabLogo(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setlabLogo(null);
      setPreview(null);
    }
  };

  // ================= Updated handleSave =================
  const handleSave = async () => {
    try {
      setLoading(true)
      if (labLogo) {
        await uploadLogo(labLogo, labid);
      }
      await saveLabShifts(labid, shiftDetails, operationalDays);
    } catch (error) {
      console.error("Error in saving:", error);
    } finally{
      setLoading(false)
    }
  };

  // ================= UI =================
  return (
    <div className="p-5 bg-white rounded-lg h-[82vh] overflow-y-scroll">
      {/* Branding */}
      <section className="mb-6">
        <h3 className="mb-3 font-semibold">Lab Branding</h3>

        <div className="flex gap-6">
          <div className="w-24 h-24 border flex items-center justify-center">
            {preview || logoImg ? (
              <img src={logoImg ?? preview!} className="w-full h-full object-cover" />
            ) : (
              "Logo"
            )}
          </div>

          {!logoImg && (
            <UploadControl
              controlName="labLogo"
              file={labLogo}
              onFileChange={handleFileChange}
              acceptedFileTypes=".jpg,.jpeg,.png,.svg"
              height="50px"
            />
          )}
        </div>
      </section>

      {/* Schedule */}
      <section>
        <h3 className="mb-3 font-semibold">Daily Schedule</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {operationalDays.map((day) => (
            <LabScheduleDayWrapper
              key={day.lab_opt_id}
              day={{ ...day, is_active: day.is_active === 1 }}
              initialAllShifts={initialAllShifts}
              handleOperationDay={handleOperationDay}
              onShiftChange={handleShiftChange}
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
