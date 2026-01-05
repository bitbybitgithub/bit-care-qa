"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";

import UploadControl from "../../components/common/UploadControl";
import { Base64ToImage } from "../../utils/converter";
import { getSessionItem } from "../../context/sessions/userSession";
import LabScheduleDayWrapper from "./LabScheduleDayWrapper";

// ================= TYPES =================
interface OperationalDay {
  lab_id: number | string;
  lab_opt_id: number | string;
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

interface LabProfileData {
  logo?: string;
  operational_days: any[];
}

// ================= API =================
const fetchLabProfile = async (labid: number): Promise<LabProfileData> => {
  const res = await axios.post(
    "http://localhost:8989/api/lab/get-lab-profile",
    { lab_id: labid }
  );
  return res.data;
};

// ================= COMPONENT =================
const LabProfile: React.FC = () => {
  const labid = getSessionItem("user", "lab_id");

  const [labLogo, setlabLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [logoImg, setLogoImg] = useState<string | null>(null);

  const [operationalDays, setOperationalDays] = useState<OperationalDay[]>([]);
  const [shiftDetails, setShiftDetails] = useState<ShiftPayload[]>([]);
  const [initialAllShifts] = useState<ShiftPayload[]>([]); // future use

  // ================= LOAD PROFILE =================
  useEffect(() => {
    if (!labid) return;

    const loadProfile = async () => {
      try {
        const data = await fetchLabProfile(Number(labid));
        console.log(data)
        // ✅ MAP API → UI STATE
        const mappedDays: OperationalDay[] = data.operational_days.map(
          (d: any) => ({
            lab_id: labid,
            lab_opt_id: d.lab_opt_id,
            day: d.day,
            is_active: d.is_active ? 1 : 0,
          })
        );
        setOperationalDays(mappedDays);

        if (data.logo) {
          setLogoImg(Base64ToImage(data.logo));
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load lab profile");
      }
    };
    loadProfile();
    console.log(operationalDays)
  }, [labid]);
// =======================save Logo ========================
const uploadLogo = async (file: File | null, labid: number | string | null) => {
  if (!file) {
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

    const res = await axios.post(
      "http://localhost:8989/api/lab/upload-logo",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

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

  if (!shiftDetails || shiftDetails.length === 0) {
    toast.error("Please configure shifts before saving.");
    return;
  }

  // Map lab_opt_id -> day name
  const dayMap = new Map<number | string, string>();
  operationalDays.forEach((d) => {
    dayMap.set(d.lab_opt_id, d.day);
  });

  // ❌ Validate weekend rule
  const invalidWeekendShift = shiftDetails.some((s) => {
    const dayName = dayMap.get(s.lab_opt_id);

    if (dayName === "Saturday" || dayName === "Sunday") {
      return !s.shift_start || !s.shift_end;
    }
    return false; // weekday allowed to be empty
  });

  if (invalidWeekendShift) {
    toast.error(
      "Saturday and Sunday shifts must have start and end time."
    );
    return;
  }

  // ✅ Transform payload
  const operations = shiftDetails.map((s) => ({
    lab_opt_id: s.lab_opt_id,
    start_time: s.shift_start || null,
    end_time: s.shift_end || null,
    is_active: String(s.is_active ? 1 : 0),
  }));
  
  try {
    console.log({lab_id: labid,
        operations})
    const res = await axios.post(
      "http://localhost:8989/api/lab/save-lab-shifts",
      {
        lab_id: labid,
        operations,
      }
    );

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
        prev.map((d) =>
          d.lab_opt_id === coId
            ? { ...d, is_active: value ? 1 : 0 }
            : d
        )
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

  const handleSave = async () => {
    uploadLogo(labLogo, labid);
    saveLabShifts(labid, shiftDetails, operationalDays);
    console.log("Logo:", labLogo);
    console.log("Operational Days:", operationalDays);
    console.log("Shift Payload:", shiftDetails);
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
              <img
                src={logoImg ?? preview!}
                className="w-full h-full object-cover"
              />
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
              day={{...day,is_active: day.is_active === 1}}
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
