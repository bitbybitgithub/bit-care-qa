import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Switch,
  Tooltip,
} from "@mui/material";
import UploadControl from "../../../components/common/UploadControl";
import { toast } from "react-toastify";
import { Base64ToImage } from "../../../utils/converter";
import ScheduleDayWrapper from "./ScheduleDayWrapper";
import { getSessionItem } from "../../../context/sessions/userSession";
import {
  fetchClinicProfile,
  saveClinicShifts,
  updateClinicOperationStatus,
  updateClinicProfile,
  type ClinicProfileData,
  type OperationalDay,
  type ShiftPayload,
} from "../../../api/clinic/ClinicApi";

/* small eyebrow + title pair */
const SectionLabel: React.FC<{ step: string; title: string }> = ({
  step,
  title,
}) => (
  <div className="mb-4">
    <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-0.5">
      {step}
    </p>
    <h3
      className="font-[var(--font-weight-semibold)] text-[var(--color-text)] leading-snug"
      style={{ fontSize: "var(--font-h3)" }}
    >
      {title}
    </h3>
  </div>
);

/* thin vertical divider rendered via border-r */
const VDivider = () => (
  <div className="hidden lg:block w-px bg-[var(--color-border)] self-stretch" />
);

/* full-width horizontal rule */
const HDivider = () => (
  <div className="border-t border-[var(--color-border)] my-0" />
);

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
  const [codEnabled, setCodEnabled] = useState(false);

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
      setSendReminders(data.patient_reminder == 1);
      setCodEnabled(
        data.is_cod === true || data.is_cod === 1 || data.is_cod === "1",
      );
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
        (s) => s.co_id === coId,
      );
      const newlyAddedShifts = formattedShifts.filter((newShift) => {
        const isOriginal = originalDayShifts.some(
          (o) =>
            o.shift_start === newShift.shift_start &&
            o.shift_end === newShift.shift_end,
        );
        return !isOriginal;
      });
      setUpdatedShiftDetails((prev) => {
        const others = prev.filter((p) => p.co_id !== coId);
        return [...others, ...newlyAddedShifts];
      });
    },
    [initialAllShifts],
  );

  const debouncedUpdateClinicOperationStatus = useCallback(
    (coId: number | string, clinicId: number | string, value: boolean) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        try {
          await updateClinicOperationStatus(coId, clinicId, value);
        } catch (err: any) {
          toast.error(err.message || "Failed to update status");
        }
      }, 2500);
    },
    [],
  );

  const handleOperationDay = useCallback(
    (coId: number | string, clinicId: number | string, value: boolean) => {
      setOperationalDays((prevData) =>
        prevData.map((dayItem: OperationalDay) =>
          dayItem.co_id === coId
            ? { ...dayItem, is_active: value ? 1 : 0 }
            : dayItem,
        ),
      );
      debouncedUpdateClinicOperationStatus(coId, clinicId, value);
    },
    [debouncedUpdateClinicOperationStatus],
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
    try {
      if (!clinicId) return toast.error("Clinic is required");
      if (!clinicType) return toast.error("Operational hours is required");
      if (!patientDemand) return toast.error("Patient demand is required");
      const formData = new FormData();
      if (clinicLogo) formData.append("clinic_logo", clinicLogo);
      formData.append("clinic_id", String(clinicId));
      formData.append("operational_hrs", clinicType);
      formData.append("patient_demand", patientDemand);
      formData.append("is_cod", String(codEnabled));
      formData.append("patient_reminder", sendReminders ? "1" : "0");
      const profileResponse = await updateClinicProfile(formData);
      toast.success(profileResponse.message);

      if (updatedShiftDetails.length > 0) {
        const shiftsResponse = await saveClinicShifts(updatedShiftDetails);
        toast.success(shiftsResponse.message);
      }
    } catch (err: any) {
      const apiErrors = err?.response?.data?.errors;
      if (apiErrors && Array.isArray(apiErrors)) {
        apiErrors.forEach((e: any) => toast.error(e.message.replace(/"/g, "")));
      } else {
        toast.error(err.message || "Something went wrong");
      }
    }
  };

  const activeDays = operationalDays.filter((d) => d.is_active).length;

  return (
    <div className="bg-[var(--color-surface-alt)] shadow-[var(--shadow-md)] rounded-[var(--radius-lg)] ">
      {/* ══════════════════════════════════════
          ROW 1:  Clinic Branding | Op Hours
      ══════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row">
        {/* Branding */}
        <div className="flex-1 p-6">
          <SectionLabel step="Step 1" title="Clinic Branding" />

          <div className="flex flex-wrap items-start gap-4">
            <div className="shrink-0 w-[72px] h-[72px] rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-center overflow-hidden">
              {preview || logoImg ? (
                <img
                  src={logoImg ?? preview}
                  alt="Clinic Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                  Logo
                </span>
              )}
            </div>

            {!logoImg && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                  Upload Clinic Logo
                </p>
                <UploadControl
                  controlName="clinicLogo"
                  file={clinicLogo}
                  onFileChange={handleFileChange}
                  onError={setFileError}
                  acceptedFileTypes=".jpg,.jpeg,.png,.svg"
                  maxSizeMB={5}
                  height="44px"
                />
                {fileerror && (
                  <p className="mt-1 text-xs text-red-500">{fileerror}</p>
                )}
                <p className="mt-1 text-[11px] text-[var(--color-text-secondary)] opacity-50">
                  JPG, PNG or SVG · max 5 MB
                </p>
              </div>
            )}

            <div className="flex min-h-[72px] items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3">
              <Tooltip title="Enable COD to accept Cash on Delivery payments.">
                <FormControlLabel
                  control={
                    <Switch
                      checked={codEnabled}
                      onChange={(event) => setCodEnabled(event.target.checked)}
                      inputProps={{ "aria-label": "Enable cash on delivery" }}
                    />
                  }
                  label="COD"
                />
              </Tooltip>
            </div>
          </div>
        </div>

        <VDivider />

        {/* Operational Hours */}
        <div className="flex-1 p-6 border-t border-[var(--color-border)] lg:border-t-0">
          <SectionLabel
            step="Step 2"
            title="Operational Hours &amp; Patient Demand"
          />

          <p className="text-xs text-[var(--color-text-secondary)] mb-1.5 font-medium">
            Is this a full-time or part-time clinic?
          </p>
          <FormControl>
            <RadioGroup
              value={clinicType}
              onChange={(e) => setClinicType(e.target.value)}
              row
            >
              <FormControlLabel
                value="Full-time"
                control={<Radio size="small" />}
                label={
                  <span className="text-sm text-[var(--color-text)]">
                    Full-time
                  </span>
                }
              />
              <FormControlLabel
                value="Part-time"
                control={<Radio size="small" />}
                label={
                  <span className="text-sm text-[var(--color-text)]">
                    Part-time
                  </span>
                }
              />
            </RadioGroup>
          </FormControl>
        </div>
      </div>

      <HDivider />

      {/* ══════════════════════════════════════
          ROW 2:  Reminders | Patient Demand
      ══════════════════════════════════════ */}
      <div className="flex flex-col lg:flex-row">
        {/* Reminders */}
        <div className="flex-1 p-6">
          <SectionLabel step="Step 3" title="Follow-ups &amp; Reminders" />

          <div className="flex items-center justify-between bg-[var(--color-bg)] border border-[var(--color-border)] rounded-[var(--radius-lg)] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--color-text)]">
                Send follow-ups and reminders?
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                {sendReminders
                  ? "Patients will receive automated reminders"
                  : "Reminders are currently disabled"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 ml-4">
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  sendReminders
                    ? "bg-green-50 text-green-600"
                    : "bg-red-50 text-red-400"
                }`}
              >
                {sendReminders ? "On" : "Off"}
              </span>
              <Switch
                checked={sendReminders}
                onChange={(e) => setSendReminders(e.target.checked)}
              />
            </div>
          </div>
        </div>

        <VDivider />

        {/* Patient Demand */}
        <div className="flex-1 p-6 border-t border-[var(--color-border)] lg:border-t-0">
          {/* No step eyebrow here — aligns visually with row above on the right */}
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--color-primary)] mb-0.5 invisible select-none">
              Step 2
            </p>
            <h3
              className="font-[var(--font-weight-semibold)] text-[var(--color-text)] leading-snug"
              style={{ fontSize: "var(--font-h3)" }}
            >
              Patient Demand Profile
            </h3>
          </div>

          <p className="text-xs text-[var(--color-text-secondary)] mb-1.5 font-medium">
            How busy is the clinic day-to-day?
          </p>
          <FormControl>
            <RadioGroup
              value={patientDemand}
              onChange={(e) => setPatientDemand(e.target.value)}
              row
            >
              <FormControlLabel
                value="Heavy"
                control={<Radio size="small" />}
                label={
                  <span className="text-sm text-[var(--color-text)]">
                    Heavy
                  </span>
                }
              />
              <FormControlLabel
                value="Medium to Light"
                control={<Radio size="small" />}
                label={
                  <span className="text-sm text-[var(--color-text)]">
                    Medium to Light
                  </span>
                }
              />
            </RadioGroup>
          </FormControl>
        </div>
      </div>

      <HDivider />

      {/* ══════════════════════════════════════
          ROW 3:  Daily Schedule (full width)
      ══════════════════════════════════════ */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
          <SectionLabel step="Step 4" title="Daily Schedule" />
          <span className="text-xs text-[var(--color-text-secondary)] mt-1">
            {activeDays} of {operationalDays.length} days open
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {operationalDays?.map((day) => (
            <ScheduleDayWrapper
              key={day.co_id}
              day={{ ...day, is_active: day.is_active }}
              initialAllShifts={initialAllShifts}
              handleOperationDay={handleOperationDay}
              onShiftChange={handleShiftChange}
            />
          ))}
        </div>
      </div>

      <HDivider />

      {/* ══════════════════════════════════════
          SAVE
      ══════════════════════════════════════ */}
      <div className="p-6 pt-5">
        <button
          onClick={handleSave}
          className="w-full py-3 rounded-[var(--radius-xl)] bg-[var(--color-primary)] text-white text-sm font-semibold shadow-[var(--shadow-lg)] hover:opacity-90 active:scale-[0.99] transition-all"
        >
          Save &amp; Complete
        </button>
      </div>
    </div>
  );
};

export default Profile;
