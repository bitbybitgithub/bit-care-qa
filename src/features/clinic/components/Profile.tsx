import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Button,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Switch,
} from "@mui/material";
import UploadControl from "../../../components/common/UploadControl";
import axios from "axios";
import { toast } from "react-toastify";
import { Base64ToImage } from "../../../utils/converter";
import ScheduleDayWrapper from "./ScheduleDayWrapper";
import { getSessionItem } from "../../../context/sessions/userSession";

interface ShiftPayload {
  clinic_id: number | string;
  co_id: number | string;
  shift: number;
  shift_start: string;
  shift_end: string;
  is_active: number;
}
interface OperationalDay {
  co_id: number | string;
  clinic_id: number | string;
  day: string;
  is_active: number;
}
interface ClinicProfileData {
  operational_hrs: string;
  patient_demand: string;
  patient_reminder: number;
  logo?: string;
  operational_days: OperationalDay[];
  shifts: ShiftPayload[];
}

const fetchClinicProfile = async (
  clinicId: number
): Promise<ClinicProfileData> => {
  const req = { clinic_id: clinicId };
  const res = await axios.post(
    "http://localhost:8989/api/clinics/get-clinic-profile",
    req
  );
  return res.data;
};

const Profile: React.FC = () => {
  const [clinicType, setClinicType] = useState("Full-time");
  const [patientDemand, setPatientDemand] = useState("Heavy");
  const [sendReminders, setSendReminders] = useState(true);
  const [clinicLogo, setClinicLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [logoImg, setLogoImg] = useState<string | null>(null);

  const [operationalDays, setOperationalDays] = useState<OperationalDay[]>([]);
  const [shiftDetails, setShiftDetails] = useState<ShiftPayload[]>([]);
  const [updatedShiftDetails, setUpdatedShiftDetails] = useState<
    ShiftPayload[]
  >([]);
  const [fileerror, setFileError] = useState<string | null>(null);

  const [initialAllShifts, setInitialAllShifts] = useState<ShiftPayload[]>([]);

  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const clinicId = getSessionItem("user", "clinic_id");

  const { data, isFetched } = useQuery<ClinicProfileData>({
    queryKey: ["clinicProfile", clinicId],
    queryFn: () => fetchClinicProfile(clinicId),
    enabled: !!clinicId, 
    staleTime: Infinity,
  });

  useEffect(() => {
    if (data && isFetched) {
      setClinicType(data.operational_hrs);
      setPatientDemand(data.patient_demand);
      setSendReminders(data.patient_reminder === 1);
      data.logo && setLogoImg(Base64ToImage(data.logo));
      setOperationalDays(data.operational_days);
      setShiftDetails(data.shifts);
      setInitialAllShifts(data.shifts);
    }
  }, [data, isFetched]);

  const handleShiftChange = useCallback(
    (coId: number | string, formattedShifts: ShiftPayload[]) => {
      setShiftDetails((prev) => {
        const others = prev.filter((p) => p.co_id !== coId);
        return [...others, ...formattedShifts];
      });

      const originalDayShifts = initialAllShifts.filter(
        (s) => s.co_id === coId
      );

      const newlyAddedShifts = formattedShifts.filter((newShift) => {
        const isOriginal = originalDayShifts.some(
          (originalShift) =>
            originalShift.shift_start === newShift.shift_start &&
            originalShift.shift_end === newShift.shift_end
        );
        return !isOriginal;
      });

      setUpdatedShiftDetails((prev) => {
        const others = prev.filter((p) => p.co_id !== coId);
        return [...others, ...newlyAddedShifts];
      });
    },
    [initialAllShifts]
  );

  const debouncedUpdateClinicOperationStatus = useCallback(
    (coId: number | string, clinicId: number | string, value: boolean) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          const req = {
            co_id: coId,
            clinic_id: clinicId,
            is_active: value ? "1" : "0",
            modified_by: "Internal Admin",
          };
          await axios.post(
            "http://localhost:8989/api/clinics/update-clinic-operation-status",
            req
          );
        } catch (err: any) {
          toast.error(err.message || "Failed to update status");
        }
      }, 2500);
    },
    [] 
  );

  const handleOperationDay = useCallback(
    (coId: number | string, clinicId: number | string, value: boolean) => {
      setOperationalDays((prevData) =>
        prevData.map(
          (dayItem: OperationalDay) =>
            dayItem.co_id === coId
              ? { ...dayItem, is_active: value ? 1 : 0 }
              : dayItem
        )
      );
      debouncedUpdateClinicOperationStatus(coId, clinicId, value);
    },
    [debouncedUpdateClinicOperationStatus]
  );

  const handleFileChange = (file: File | null) => {
    if (file) {
      setClinicLogo(file);
      setPreview(URL.createObjectURL(file));
    } else {
      setClinicLogo(null);
      setPreview(null);
    }
  };

  const handleSave = async () => {
    const formData = new FormData();
    clinicLogo && formData.append("clinic_logo", clinicLogo);
    formData.append("clinic_id", clinicId.toString());
    clinicType && formData.append("operational_hrs", clinicType);
    patientDemand && formData.append("patient_demand", patientDemand);
    sendReminders &&
      formData.append("patient_reminder", sendReminders ? "1" : "0");

    await saveProfileSettingDetails(formData);
    if (updatedShiftDetails.length > 0) {
      await saveCilnicShifts();
    }
  };

  const saveProfileSettingDetails = (formData: FormData) => {
    axios
      .post(
        "http://localhost:8989/api/clinics/update-clinic-profile",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      .then((res) => toast.success(res.data.message))
      .catch((err) => toast.error(err.message));
  };

  const saveCilnicShifts = () => {
    axios
      .post(
        "http://localhost:8989/api/clinics/save-clinic-shifts",
        updatedShiftDetails
      )
      .then((res) => {
        toast.success(res.data.message);
      });
  };

  return (
    <div className="p-5 bg-[var(--color-surface-alt)] shadow-[var(--shadow-md)] rounded-[var(--radius-lg)]  transition-all overflow-y-scroll h-[82vh]">
      <section className="mb-6">
        <h3
          className="font-[var(--font-weight-semibold)] text-[var(--color-primary)] mb-3 "
          style={{ fontSize: "var(--font-h3)" }}
        >
          Clinic Branding
        </h3>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div
            className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] overflow-hidden"
            aria-hidden={!!(preview || logoImg) ? "false" : "true"}
          >
            {preview || logoImg ? (
              <img
                src={logoImg ?? preview}
                alt="Clinic Logo"
                className="w-full h-full object-cover rounded-[var(--radius-lg)]"
              />
            ) : (
              <span className="font-medium text-[var(--color-text-secondary)]">
                Logo
              </span>
            )}
          </div>

          {!logoImg && (
            <div className="flex flex-col  w-full">
              <label className="block font-medium text-[var(--color-text-secondary)] mb-2">
                Upload Clinic Logo
              </label>
              <UploadControl
                controlName="clinicLogo"
                file={clinicLogo}
                onFileChange={handleFileChange}
                onError={setFileError}
                acceptedFileTypes=".jpg,.jpeg,.png,.svg"
                maxSizeMB={5}
                height="50px"
              />
              {fileerror && <p className="text-red-500 text-sm">{fileerror}</p>}
            </div>
          )}
        </div>
      </section>

      <section className="mb-6">
        <h3 className="font-semibold text-[var(--color-text)] mb-3">
          Operational Hours & Patient Demand
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-0">
          <FormControl>
            <FormLabel className="!text-[var(--color-text)] font-medium mb-1">
              Is this a full-time or part-time clinic?
            </FormLabel>
            <RadioGroup
              value={clinicType}
              onChange={(e) => setClinicType(e.target.value)}
              row
            >
              <FormControlLabel
                value="Full-time"
                control={<Radio />}
                label="Full-time"
              />
              <FormControlLabel
                value="Part-time"
                control={<Radio />}
                label="Part-time"
              />
            </RadioGroup>
          </FormControl>

          <FormControl>
            <FormLabel className="!text-[var(--color-text)] font-medium mb-1">
              Patient demand profile
            </FormLabel>
            <RadioGroup
              value={patientDemand}
              onChange={(e) => setPatientDemand(e.target.value)}
              row
            >
              <FormControlLabel
                value="Heavy"
                control={<Radio />}
                label="Heavy"
              />
              <FormControlLabel
                value="Medium to Light"
                control={<Radio />}
                label="Medium to Light"
              />
            </RadioGroup>
          </FormControl>
        </div>
      </section>

      <section className="mb-6">
        <div className="flex items-center justify-between bg-[var(--color-surface)] hover:bg-[var(--color-surface)] transition rounded-[var(--radius-lg)] px-4 py-3 border border-[var(--color-border)] shadow-[var(--shadow-md)]">
          <span className="font-medium text-[var(--color-text)]">
            Send follow-ups and reminders?
          </span>
          <Switch
            checked={sendReminders}
            onChange={(e) => setSendReminders(e.target.checked)}
          />
        </div>
      </section>

      <section className="mb-6">
        <h3 className="font-semibold text-[var(--color-text)] mb-3">
          Daily Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {operationalDays?.map((day) => (
            <ScheduleDayWrapper
              key={day.co_id}
              day={{ ...day, is_active: day.is_active === 1 }}
              initialAllShifts={initialAllShifts}
              handleOperationDay={handleOperationDay}
              onShiftChange={handleShiftChange}
            />
          ))}
        </div>
      </section>

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleSave}
        className="rounded-[var(--radius-xl)] py-3 text-[var(--font-body)] font-semibold shadow-[var(--shadow-lg)] hover:shadow-[var(--shadow-xl)] transition-all"
      >
        Save & Complete
      </Button>
    </div>
  );
};

export default Profile;
