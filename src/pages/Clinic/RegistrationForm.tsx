import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Autocomplete,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormHelperText,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  Building2,
  CheckCircle2,
  Clock,
  FlaskConical,
  Mail,
  Map,
  MapPin,
  Pencil,
  Smartphone,
  Stethoscope,
  Timer,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";
import {
  getEntityTypes,
  getPincodeDetails,
  registerApi,
  type Entity,
} from "../../api";
import type {
  FormDataBase,
  LocationItem,
  ValidationErrors,
} from "../../types/types";
import OtpVerification from "../../components/common/OtpVerification";
import WelcomePage from "../../components/common/WelcomePage";
import { validateRegistration } from "../../context/constant/ErrorHandler";
import Regex from "../../context/constant/Regex";
import { useDeviceDetails } from "../../hooks/useDeviceDetails";

/* ================================================================== */
/*  Types & constants                                                  */
/* ================================================================== */

/** entity_id values that unlock extra fields */
const ENTITY_CLINIC = 1; // shows "Slot duration" in the timings dialog
const ENTITY_LAB = 2; // shows "Lab category" in the form
const ENTITY_DOCTOR = 4; // no working hours / slots at registration

type Timings = {
  startTime: string;
  endTime: string;
  activeDays: boolean[];
  /** minutes per appointment slot (only used when entityType === 1) */
  slotDuration?: number;
};

/** FormDataBase + the lab-only field */
type FormState = FormDataBase & { labCategory: string };

type FormErrors = ValidationErrors & { timings?: string; labCategory?: string };

const DAYS_SHORT = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DEFAULT_SLOT_DURATION = 15;
const SLOT_OPTIONS = [5, 10, 15, 20, 30, 45, 60];

const LAB_CATEGORIES = ["Pathology", "Radiology"];

const DEFAULT_TIMINGS: Timings = {
  startTime: "09:00",
  endTime: "17:00",
  activeDays: [false, true, true, true, true, true, false],
  slotDuration: DEFAULT_SLOT_DURATION,
};

const TIMING_PRESETS = [
  { label: "Weekdays", days: [false, true, true, true, true, true, false] },
  { label: "Mon – Sat", days: [false, true, true, true, true, true, true] },
  { label: "Every day", days: [true, true, true, true, true, true, true] },
];

/** Order used to focus the first invalid field after a failed submit. */
const FIELD_ORDER = [
  "entityType",
  "name",
  "phone",
  "email",
  "PINCode",
  "area",
  "address",
  "labCategory",
  "timings",
] as const;

/* ---- Visual tokens (built on your existing CSS variables) ---- */
const SOFT_BG = "bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]";
const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] " +
  "focus-visible:ring-offset-2";

const LABEL_CLASS =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-600";

/**
 * Input look: labels live ABOVE the field (see <Field/>), the control has a
 * soft grey fill, a thin border and placeholder text.
 */
const rootBase = {
  borderRadius: "10px",
  backgroundColor: "var(--color-bg)",
  fontSize: 14,
  minHeight: 40,
  padding: "0 8px 0 14px",
  transition: "background-color .15s",
  "& fieldset": { borderColor: "var(--color-border)" },
  "&:hover fieldset": { borderColor: "var(--color-primary-light)" },
  "&.Mui-focused": { backgroundColor: "var(--color-surface-alt)" },
  "&.Mui-focused fieldset": {
    borderColor: "var(--color-primary)",
    borderWidth: "1.5px",
  },
  "&.Mui-error fieldset": { borderColor: "var(--color-error)" },
  "&.Mui-disabled": { backgroundColor: "var(--color-surface)" },
  "&.MuiInputBase-multiline": { padding: "9px 14px" },
};

const inputBase = {
  padding: "9px 6px 9px 0",
  fontSize: 14,
  lineHeight: "22px",
  boxSizing: "border-box",
  height: "auto",
  "&::placeholder": { color: "var(--color-text-secondary)", opacity: 1 },
  "&.Mui-disabled": { WebkitTextFillColor: "var(--color-disabled)" },
};

const fieldSx = {
  "& .MuiOutlinedInput-root": rootBase,
  "& .MuiInputBase-input": inputBase,
  "& .MuiInputBase-multiline .MuiInputBase-input": { padding: 0 },
  "& .MuiInputAdornment-positionStart": { marginRight: "10px" },
};

/** Same look, but for a MUI <TextField select /> (needs room for the arrow). */
const selectSx = {
  ...fieldSx,
  "& .MuiSelect-select": { paddingRight: "36px !important" },
  "& .MuiSelect-icon": { right: 10 },
};

/** Autocomplete needs a few overrides because MUI pads it differently. */
const autoSx = {
  ...fieldSx,
  "& .MuiOutlinedInput-root": {
    ...rootBase,
    padding: "0 39px 0 14px !important",
  },
  "& .MuiOutlinedInput-root .MuiAutocomplete-input": {
    padding: "9px 6px 9px 0 !important",
  },
};

/* ================================================================== */
/*  Pure helpers                                                       */
/* ================================================================== */

const cloneTimings = (t: Timings): Timings => ({
  ...t,
  activeDays: [...t.activeDays],
});

const formatTime12h = (time24: string) => {
  if (!time24) return "";
  const [h, m] = time24.split(":");
  const hours = parseInt(h, 10);
  const suffix = hours >= 12 ? "PM" : "AM";
  const hours12 = ((hours + 11) % 12) + 1;
  return `${hours12}:${m} ${suffix}`;
};

const summarizeDays = (activeDays: boolean[]) => {
  const count = activeDays.filter(Boolean).length;
  if (count === 7) return "Every day";
  if (count === 0) return "No days selected";
  if (!activeDays[0] && !activeDays[6] && count === 5) return "Weekdays";
  if (activeDays[0] && activeDays[6] && count === 2) return "Weekends";
  return activeDays
    .map((on, i) => (on ? DAY_NAMES[i] : null))
    .filter(Boolean)
    .join(", ");
};

const validateName = (value: string) => {
  const v = value.trim();
  if (!v) return "Name is required";
  if (v.length < 5) return "Name must be at least 5 characters long";
  if (v.length > 50) return "Name cannot exceed 50 characters";
  if (!Regex.name.test(v)) return "Only alphabets and spaces are allowed";
  return "";
};

const formatEntities = (entities: Entity[]): Entity[] =>
  entities
    .filter((e) => e.is_active === "1")
    .map((e) => ({
      ...e,
      entity_name:
        e.entity_name === "lab"
          ? "Diagnostic Lab"
          : e.entity_name.charAt(0).toUpperCase() + e.entity_name.slice(1),
    }));

const getSubmitErrorMessage = (res: any): string =>
  res?.message ||
  res?.data?.message ||
  res?.error ||
  (res?.errors && Object.values(res.errors).join("\n")) ||
  "Something went wrong.";

const startIcon = (icon: ReactNode) => ({
  startAdornment: (
    <InputAdornment position="start">
      <span className="flex text-slate-400">{icon}</span>
    </InputAdornment>
  ),
});

const VerifiedBadge = () => (
  <InputAdornment position="end">
    <span className="flex items-center gap-1 text-xs font-semibold text-green-700">
      <CheckCircle2 size={16} aria-hidden />
      <span className="hidden min-[400px]:inline">Verified</span>
    </span>
  </InputAdornment>
);

const VerifyButton = ({ onClick }: { onClick: (el: HTMLElement) => void }) => (
  <InputAdornment position="end">
    <Button
      size="small"
      onClick={(e) => onClick(e.currentTarget)}
      sx={{
        borderRadius: 999,
        px: 1.5,
        py: 0.25,
        minWidth: 0,
        fontSize: 12,
        textTransform: "none",
        fontWeight: 600,
        color: "var(--color-primary)",
        backgroundColor:
          "color-mix(in srgb, var(--color-primary) 10%, transparent)",
        "&:hover": {
          backgroundColor:
            "color-mix(in srgb, var(--color-primary) 18%, transparent)",
        },
      }}>
      Verify
    </Button>
  </InputAdornment>
);

/* ================================================================== */
/*  Presentational components (module scope: never re-mounted)         */
/* ================================================================== */

const FieldHint = memo(function FieldHint({
  id,
  error,
  hint,
}: {
  id: string;
  error?: string;
  hint?: string;
}) {
  return (
    <FormHelperText
      id={id}
      error={!!error}
      role={error ? "alert" : undefined}
      sx={{ minHeight: 16, mx: 0.25, mt: 0.25, fontSize: 11.5, lineHeight: "16px" }}>
      {error || hint || ""}
    </FormHelperText>
  );
});

/** Label above the control + a reserved helper line below (no layout jump). */
const Field = ({
  id,
  label,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) => (
  <div className={`min-w-0 ${className ?? ""}`}>
    <label htmlFor={id} className={LABEL_CLASS}>
      {label}
    </label>
    {children}
    <FieldHint id={`${id}-hint`} error={error} hint={hint} />
  </div>
);

/** Groups fields in the two-column grid used by the whole form. */
const FieldGrid = ({
  label,
  compactMobile = false,
  children,
}: {
  label: string;
  /** keep two columns even on phones (short fields only) */
  compactMobile?: boolean;
  children: ReactNode;
}) => (
  <div
    role="group"
    aria-label={label}
    className={`grid items-start gap-x-3 gap-y-0 sm:gap-x-4 ${
      compactMobile ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2"
    }`}>
    {children}
  </div>
);

/* ---------------- Timings: week strip + trigger ---------------- */

const WeekStrip = ({ activeDays }: { activeDays: boolean[] }) => (
  <span className="flex gap-1" aria-hidden>
    {DAYS_SHORT.map((d, i) => (
      <span
        key={i}
        className={`grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
          activeDays[i]
            ? "bg-[var(--color-primary)] text-[var(--color-surface)]"
            : `${SOFT_BG} text-gray-500`
        }`}>
        {d}
      </span>
    ))}
  </span>
);

const TimingsTrigger = memo(function TimingsTrigger({
  timings,
  showSlot,
  error,
  onOpen,
}: {
  timings: Timings | null;
  showSlot: boolean;
  error?: string;
  onOpen: () => void;
}) {
  const base = `flex min-h-[56px] w-full items-center gap-3 rounded-xl p-3 text-left transition-colors motion-reduce:transition-none ${FOCUS_RING}`;

  return (
    <button
      id="reg-timings"
      type="button"
      onClick={onOpen}
      aria-describedby="reg-timings-hint"
      aria-invalid={!!error}
      className={
        timings
          ? `${base} border bg-[var(--color-surface)] hover:border-[var(--color-primary)] ${
              error ? "border-red-500" : "border-slate-200"
            }`
          : `${base} border border-dashed bg-[color-mix(in_srgb,var(--color-primary)_5%,white)] hover:border-solid ${
              error ? "border-red-500" : "border-[var(--color-primary)]/40"
            }`
      }>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-primary)] text-[var(--color-surface)]">
        <Clock size={18} aria-hidden />
      </span>

      {timings ? (
        <>
          <span className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-sm font-semibold text-[var(--color-text)]">
                {formatTime12h(timings.startTime)} –{" "}
                {formatTime12h(timings.endTime)}
              </span>
              <span className="text-xs text-slate-500">
                {summarizeDays(timings.activeDays)}
                {showSlot && timings.slotDuration
                  ? ` · ${timings.slotDuration} min slots`
                  : ""}
              </span>
            </span>
            <WeekStrip activeDays={timings.activeDays} />
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[var(--color-primary)]">
            <Pencil size={14} aria-hidden />
            <span className="hidden min-[400px]:inline">Edit</span>
          </span>
        </>
      ) : (
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold text-[var(--color-primary)]">
            Add your working hours
          </span>
          <span className="text-xs text-slate-500">
            Choose the days and hours patients can reach you
          </span>
        </span>
      )}
    </button>
  );
});

/* ---------------- Timings dialog (own draft state) ---------------- */

const TimingsDialog = memo(function TimingsDialog({
  open,
  initial,
  onClose,
  onSave,
  entityType,
}: {
  open: boolean;
  initial: Timings | null;
  onClose: () => void;
  onSave: (t: Timings) => void;
  entityType: number;
}) {
  const [draft, setDraft] = useState<Timings>(() =>
    cloneTimings(initial ?? DEFAULT_TIMINGS),
  );

  const showSlot = entityType === ENTITY_CLINIC;

  // Reset the draft every time the dialog opens
  useEffect(() => {
    if (open) setDraft(cloneTimings(initial ?? DEFAULT_TIMINGS));
  }, [open, initial]);

  const toggleDay = (index: number) =>
    setDraft((d) => {
      const activeDays = [...d.activeDays];
      activeDays[index] = !activeDays[index];
      return { ...d, activeDays };
    });

  const hasDay = draft.activeDays.some(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!hasDay) return;

    // only keep slotDuration for the entity type that uses it
    const { slotDuration, ...rest } = draft;
    onSave(
      showSlot
        ? { ...rest, slotDuration: slotDuration ?? DEFAULT_SLOT_DURATION }
        : rest,
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      aria-labelledby="timings-title"
      slotProps={{
        paper: {
          component: "form",
          onSubmit: handleSubmit,
          sx: { borderRadius: "20px", m: 2, width: "calc(100% - 32px)" },
        } as any,
      }}>
      <DialogTitle
        id="timings-title"
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1.75,
        }}>
        <span className="flex items-center gap-2.5 text-base font-bold text-[var(--color-text)]">
          <span
            className={`grid h-9 w-9 place-items-center rounded-xl text-[var(--color-primary)] ${SOFT_BG}`}>
            <Clock size={18} aria-hidden />
          </span>
          Working hours
        </span>
        <IconButton aria-label="Close" onClick={onClose} size="small">
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ pt: 3 }}>
        {/* stacks on very narrow screens, side-by-side otherwise */}
        <div className="mb-6 grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
          <div>
            <label htmlFor="timings-start" className={LABEL_CLASS}>
              Opens at
            </label>
            <TextField
              id="timings-start"
              type="time"
              required
              fullWidth
              sx={fieldSx}
              value={draft.startTime}
              onChange={(e) =>
                setDraft((d) => ({ ...d, startTime: e.target.value }))
              }
            />
          </div>
          <div>
            <label htmlFor="timings-end" className={LABEL_CLASS}>
              Closes at
            </label>
            <TextField
              id="timings-end"
              type="time"
              required
              fullWidth
              sx={fieldSx}
              value={draft.endTime}
              onChange={(e) =>
                setDraft((d) => ({ ...d, endTime: e.target.value }))
              }
            />
          </div>
        </div>

        <div role="group" aria-labelledby="repeat-label">
          <p id="repeat-label" className={`${LABEL_CLASS} text-center`}>
            Repeat on
          </p>

          {/* buttons scale with the dialog, so 7 always fit at 320px */}
          <div className="flex items-center justify-between gap-1.5">
            {DAYS_SHORT.map((label, index) => {
              const active = draft.activeDays[index];
              return (
                <button
                  key={index}
                  type="button"
                  aria-pressed={active}
                  aria-label={DAY_FULL[index]}
                  onClick={() => toggleDay(index)}
                  className={`grid aspect-square max-w-[44px] flex-1 place-items-center rounded-full text-xs font-bold transition-colors motion-reduce:transition-none ${FOCUS_RING} ${
                    active
                      ? "bg-[var(--color-primary)] text-[var(--color-surface)] shadow-md"
                      : `${SOFT_BG} text-gray-600 hover:text-[var(--color-primary)]`
                  }`}>
                  {label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {TIMING_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() =>
                  setDraft((d) => ({ ...d, activeDays: [...p.days] }))
                }
                className={`rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-medium text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] ${FOCUS_RING}`}>
                {p.label}
              </button>
            ))}
          </div>

          <p
            className={`mt-3 min-h-[16px] text-center text-xs ${
              hasDay ? "text-gray-500" : "text-red-600"
            }`}
            aria-live="polite">
            {hasDay
              ? summarizeDays(draft.activeDays)
              : "Select at least one day"}
          </p>
        </div>

        {/* ---------- Slot duration (only when entityType === 1) ---------- */}
        {showSlot && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <label htmlFor="timings-slot" className={LABEL_CLASS}>
              Slot duration
            </label>
            <TextField
              id="timings-slot"
              select
              fullWidth
              sx={selectSx}
              value={draft.slotDuration ?? DEFAULT_SLOT_DURATION}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  slotDuration: Number(e.target.value),
                }))
              }
              slotProps={{ input: startIcon(<Timer size={18} />) }}>
              {SLOT_OPTIONS.map((min) => (
                <MenuItem key={min} value={min} sx={{ fontSize: 14 }}>
                  {min} min
                </MenuItem>
              ))}
            </TextField>
            <FormHelperText
              sx={{ mx: 0.25, mt: 0.25, fontSize: 11.5, lineHeight: "16px" }}>
              Time reserved for each patient appointment
            </FormHelperText>
          </div>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          type="button"
          onClick={onClose}
          fullWidth
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: "10px", textTransform: "none", py: 1.1 }}>
          Cancel
        </Button>
        <Button
          type="submit"
          fullWidth
          disabled={!hasDay}
          sx={{
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 600,
            py: 1.1,
            backgroundColor: "var(--color-primary)",
            color: "var(--color-surface)",
            "&:hover": { backgroundColor: "var(--color-primary)", opacity: 0.9 },
            "&.Mui-disabled": { opacity: 0.5, color: "var(--color-surface)" },
          }}>
          Save hours
        </Button>
      </DialogActions>
    </Dialog>
  );
});

/* ================================================================== */
/*  Main component                                                     */
/* ================================================================== */

const INITIAL_FORM: FormState = {
  entityType: 0,
  userId: 0,
  otp: 0,
  name: "",
  email: "",
  phone: "",
  address: "",
  PINCode: "",
  area: "",
  district: "",
  state: "",
  latitude: "",
  longitude: "",
  labCategory: "",
};

const RegistrationForm = () => {
  const navigate = useNavigate();
  const { deviceDetails } = useDeviceDetails();

  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState({ mobile: false, email: false });
  const [openPopup, setOpenPopup] = useState(false);

  // Lookup data
  const [entityList, setEntityList] = useState<Entity[]>([]);
  const [entityLoading, setEntityLoading] = useState(false);
  const [areaList, setAreaList] = useState<string[]>([]);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // OTP popovers
  const [mobileAnchor, setMobileAnchor] = useState<HTMLElement | null>(null);
  const [emailAnchor, setEmailAnchor] = useState<HTMLElement | null>(null);
  const [showMobileOtp, setShowMobileOtp] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);

  // Timings
  const [timingsData, setTimingsData] = useState<Timings | null>(null);
  const [isTimingsModalOpen, setIsTimingsModalOpen] = useState(false);

  // Guards against out-of-order pincode responses
  const pincodeRequestId = useRef(0);
  // Avoid re-opening the email OTP every blur for an address already prompted
  const lastPromptedEmail = useRef("");

  const clearError = useCallback((field: keyof FormErrors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: "" } : prev));
  }, []);

  /* ---------------- Data loading ---------------- */

  // Entity types: load ONCE
  useEffect(() => {
    let active = true;
    (async () => {
      setEntityLoading(true);
      try {
        const res = await getEntityTypes();
        if (!active) return;
        if (res.success) setEntityList(formatEntities(res.data));
        else toast.error(res.error || "Failed to load Center types");
      } catch {
        if (active) toast.error("Unable to load Center types");
      } finally {
        if (active) setEntityLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // Device location: functional update (no stale formData) and null-safe
  const lat = deviceDetails?.location?.latitude;
  const lng = deviceDetails?.location?.longitude;
  useEffect(() => {
    if (lat == null || lng == null) return;
    setFormData((p) => ({
      ...p,
      latitude: String(lat),
      longitude: String(lng),
    }));
  }, [lat, lng]);

  /* ---------------- Derived values ---------------- */

  const selectedEntity = useMemo(
    () => entityList.find((e) => e.entity_id === formData.entityType) ?? null,
    [entityList, formData.entityType],
  );

  const isDoctor = selectedEntity?.entity_name?.toLowerCase() === "doctor";
  const isLab = formData.entityType === ENTITY_LAB;
  // Doctors don't set working hours / slots at registration
  const hasTimings = formData.entityType !== ENTITY_DOCTOR;
  const nameLabel = isDoctor ? "Doctor name" : "Center name";

  const emailIsValid = Regex.email.test(formData.email);

  const progress = useMemo(() => {
    const steps = [
      !!formData.entityType,
      !!formData.name.trim() && !errors.name,
      verified.mobile,
      verified.email,
      formData.PINCode.length === 6 && !!formData.area,
      !!formData.address && !errors.address,
      ...(isLab ? [!!formData.labCategory] : []),
      ...(hasTimings ? [!!timingsData] : []),
    ];
    return { done: steps.filter(Boolean).length, total: steps.length };
  }, [
    formData,
    errors.name,
    errors.address,
    verified,
    timingsData,
    isLab,
    hasTimings,
  ]);

  /* ---------------- Field handlers ---------------- */

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setErrors((p) => ({ ...p, name: validateName(value) }));
    setFormData((p) => ({ ...p, name: value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits.length === 1 && /^[0-5]/.test(digits)) return;
    if (digits.length > 10) return;

    setFormData((p) => ({ ...p, phone: digits }));
    clearError("phone");

    if (digits.length === 10) {
      setMobileAnchor(e.target);
      setShowMobileOtp(true);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\s/g, "").toLowerCase();
    setFormData((p) => ({ ...p, email: cleaned }));
    clearError("email");
  };

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.trim().replace(/\s/g, "");
    setFormData((p) => ({ ...p, email: cleaned }));

    if (!cleaned) {
      setErrors((p) => ({ ...p, email: "Email is required" }));
      return;
    }
    if (!Regex.email.test(cleaned)) {
      setErrors((p) => ({ ...p, email: "Please enter a valid email address" }));
      return;
    }
    if (!verified.email && lastPromptedEmail.current !== cleaned) {
      lastPromptedEmail.current = cleaned;
      setEmailAnchor(e.currentTarget);
      setShowEmailOtp(true);
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setErrors((p) => ({
      ...p,
      address: Regex.address.test(value)
        ? ""
        : "Address must be at least 10 characters",
    }));
    setFormData((p) => ({ ...p, address: value }));
  };

  const resetLocation = () => {
    setAreaList([]);
    setFormData((p) => ({ ...p, state: "", district: "", area: "" }));
  };

  const handlePincodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length > 6) return;

    const requestId = ++pincodeRequestId.current; // invalidates in-flight calls
    setFormData((p) => ({ ...p, PINCode: value }));

    if (value.length < 6) {
      setPincodeLoading(false);
      setErrors((p) => ({ ...p, PINCode: "Pincode must be 6 digits" }));
      resetLocation();
      return;
    }

    if (!Regex.pincode.test(value)) {
      setErrors((p) => ({ ...p, PINCode: "Invalid pincode" }));
      return;
    }

    try {
      setPincodeLoading(true);
      setErrors((p) => ({ ...p, PINCode: "" }));

      const result: LocationItem[] = await getPincodeDetails(value);
      if (requestId !== pincodeRequestId.current) return; // stale response

      if (!Array.isArray(result) || result.length === 0) {
        setErrors((p) => ({
          ...p,
          PINCode: "No records found for this pincode",
        }));
        resetLocation();
        return;
      }

      const first = result[0];
      setFormData((p) => ({
        ...p,
        state: first.State || "",
        district: first.District || "",
        area: first.Name || "",
      }));
      // These fields are auto-filled (state/district are disabled), so the
      // user can't type in them to clear a leftover "required" error.
      setErrors((p) => ({
        ...p,
        PINCode: "",
        area: "",
        state: "",
        district: "",
      }));
      setAreaList(
        Array.from(new Set(result.map((i) => i?.Name).filter(Boolean))),
      );
    } catch {
      if (requestId !== pincodeRequestId.current) return;
      setErrors((p) => ({ ...p, PINCode: "Failed to fetch pincode details" }));
      resetLocation();
    } finally {
      if (requestId === pincodeRequestId.current) setPincodeLoading(false);
    }
  };

  /* ---------------- Timings handlers ---------------- */

  const openTimings = useCallback(() => setIsTimingsModalOpen(true), []);
  const closeTimings = useCallback(() => setIsTimingsModalOpen(false), []);
  const saveTimings = useCallback(
    (t: Timings) => {
      setTimingsData(t);
      setIsTimingsModalOpen(false);
      clearError("timings");
    },
    [clearError],
  );

  /* ---------------- Submit ---------------- */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { labCategory, ...baseData } = formData;

    const nextErrors: FormErrors = { ...validateRegistration(baseData) };
    const timingMissing = hasTimings && !timingsData;
    if (timingMissing) nextErrors.timings = "Please set your timings";
    if (isLab && !labCategory)
      nextErrors.labCategory = "Please select a lab category";

    setErrors(nextErrors);

    const firstInvalid = FIELD_ORDER.find(
      (k) => nextErrors[k as keyof FormErrors],
    );
    const hasErrors = Object.values(nextErrors).some(Boolean);

    if (hasErrors) {
      if (timingMissing)
        toast.error("Please add your timings before submitting");
      if (firstInvalid) document.getElementById(`reg-${firstInvalid}`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...baseData,
        // only for labs (entityType 2)
        ...(isLab ? { labCategory } : {}),
        // Working hours -> saved on t_registration, copied to the
        // clinic / lab / pharmacy tables on approval.
        // Not sent at all for doctors (entityType 4).
        ...(hasTimings && timingsData
          ? {
              workingStart: timingsData.startTime, // "09:00"
              workingEnd: timingsData.endTime, // "17:00"
              // activeDays is [Sun..Sat] booleans. We send the INDEXES of the
              // true entries (0 = Sunday ... 6 = Saturday), e.g.
              // [false,true,true,true,true,true,true] -> [1,2,3,4,5,6] = Mon-Sat
              workingDays: timingsData.activeDays
                .map((on, i) => (on ? i : -1))
                .filter((i) => i >= 0),
              // only for clinics (entityType 1)
              ...(formData.entityType === ENTITY_CLINIC
                ? {
                    slotDuration:
                      timingsData.slotDuration ?? DEFAULT_SLOT_DURATION,
                  }
                : {}),
            }
          : {}),
      };
      const res = await registerApi(payload);
      if (res?.success) {
        setOpenPopup(true);
        return;
      }
      toast.error(getSubmitErrorMessage(res));
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Registration failed.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePopupClose = () => {
    setOpenPopup(false);
    navigate("/login");
  };

  /* ---------------- Render ---------------- */

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-100 bg-[var(--color-surface)] p-4 shadow-sm sm:p-5">
      {/* ---------- Progress ---------- */}
      <div className="mb-3">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-sm font-semibold text-[var(--color-text)]">
            Your progress
          </span>
          <span
            className="text-xs font-medium text-slate-500"
            aria-live="polite">
            {progress.done} of {progress.total} done
          </span>
        </div>
        <LinearProgress
          variant="determinate"
          value={(progress.done / progress.total) * 100}
          aria-label="Registration progress"
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "var(--color-surface)",
            "& .MuiLinearProgress-bar": {
              backgroundColor: "var(--color-primary)",
              borderRadius: 3,
            },
          }}
        />
      </div>

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-1">
        {/* ---------- About your center ---------- */}
        <FieldGrid label="About your center">
          <Field id="reg-entityType" label="Center type" error={errors.entityType}>
            <Autocomplete
              id="reg-entityType"
              fullWidth
              options={entityList}
              loading={entityLoading}
              autoHighlight
              sx={autoSx}
              getOptionLabel={(o) => o.entity_name}
              isOptionEqualToValue={(o, v) => o.entity_id === v.entity_id}
              value={selectedEntity}
              onChange={(_, v) => {
                setFormData((p) => ({
                  ...p,
                  entityType: v ? v.entity_id : 0,
                  // lab category only applies to labs: reset when type changes
                  labCategory: "",
                }));
                clearError("entityType");
                clearError("labCategory");
                // doctors have no timings, so drop any pending timings error
                if (v?.entity_id === ENTITY_DOCTOR) clearError("timings");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select type"
                  error={!!errors.entityType}
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <span className="flex text-slate-400">
                              <Building2 size={18} />
                            </span>
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                      endAdornment: (
                        <>
                          {entityLoading && <CircularProgress size={18} />}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
          </Field>

          <Field id="reg-name" label={nameLabel} error={errors.name}>
            <TextField
              id="reg-name"
              name="name"
              placeholder={isDoctor ? "e.g. Dr. Anita Sharma" : "e.g. City Care"}
              fullWidth
              autoComplete="organization"
              sx={fieldSx}
              value={formData.name}
              onChange={handleNameChange}
              error={!!errors.name}
              slotProps={{ input: startIcon(<Stethoscope size={18} />) }}
            />
          </Field>
        </FieldGrid>

        {/* ---------- Contact ---------- */}
        <FieldGrid label="Contact details">
          <Field id="reg-phone" label="Mobile number" error={errors.phone}>
            <TextField
              id="reg-phone"
              type="tel"
              placeholder="10 digits"
              fullWidth
              autoComplete="tel-national"
              sx={fieldSx}
              value={formData.phone}
              disabled={verified.mobile}
              onChange={handlePhoneChange}
              error={!!errors.phone}
              slotProps={{
                input: {
                  ...startIcon(<Smartphone size={18} />),
                  endAdornment: verified.mobile ? (
                    <VerifiedBadge />
                  ) : formData.phone.length === 10 ? (
                    <VerifyButton
                      onClick={(el) => {
                        setMobileAnchor(el);
                        setShowMobileOtp(true);
                      }}
                    />
                  ) : null,
                },
                htmlInput: { maxLength: 10, inputMode: "numeric" },
              }}
            />
          </Field>

          <Field id="reg-email" label="Email address" error={errors.email}>
            <TextField
              id="reg-email"
              type="email"
              placeholder="name@company.com"
              fullWidth
              autoComplete="email"
              sx={fieldSx}
              value={formData.email}
              disabled={verified.email}
              onBlur={handleEmailBlur}
              onChange={handleEmailChange}
              error={!!errors.email}
              slotProps={{
                input: {
                  ...startIcon(<Mail size={18} />),
                  endAdornment: verified.email ? (
                    <VerifiedBadge />
                  ) : emailIsValid ? (
                    <VerifyButton
                      onClick={(el) => {
                        setEmailAnchor(el);
                        setShowEmailOtp(true);
                      }}
                    />
                  ) : null,
                },
              }}
            />
          </Field>
        </FieldGrid>

        {/* ---------- Location ---------- */}
        <FieldGrid label="Location" compactMobile>
          <Field id="reg-PINCode" label="Pincode" error={errors.PINCode}>
            <TextField
              id="reg-PINCode"
              name="PINCode"
              placeholder="6 digits"
              fullWidth
              autoComplete="postal-code"
              sx={fieldSx}
              value={formData.PINCode}
              onChange={handlePincodeChange}
              error={!!errors.PINCode}
              slotProps={{
                input: {
                  ...startIcon(<MapPin size={18} />),
                  endAdornment: pincodeLoading ? (
                    <CircularProgress size={18} />
                  ) : null,
                },
                htmlInput: { maxLength: 6, inputMode: "numeric" },
              }}
            />
          </Field>

          <Field id="reg-area" label="Area" error={errors.area}>
            <Autocomplete
              id="reg-area"
              fullWidth
              readOnly={areaList.length === 0}
              options={areaList}
              value={formData.area || null}
              sx={autoSx}
              onChange={(_, v) => {
                setFormData((p) => ({ ...p, area: v || "" }));
                clearError("area");
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Select area"
                  error={!!errors.area}
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <span className="flex text-slate-400">
                              <Map size={18} />
                            </span>
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />
          </Field>

          <Field id="reg-state" label="State" error={errors.state}>
            <TextField
              id="reg-state"
              placeholder="Auto-filled"
              fullWidth
              disabled
              sx={fieldSx}
              value={pincodeLoading ? "Fetching…" : formData.state}
              error={!!errors.state}
            />
          </Field>

          <Field id="reg-district" label="District" error={errors.district}>
            <TextField
              id="reg-district"
              placeholder="Auto-filled"
              fullWidth
              disabled
              sx={fieldSx}
              value={pincodeLoading ? "Fetching…" : formData.district}
              error={!!errors.district}
            />
          </Field>

          <Field
            id="reg-address"
            label="Full address"
            className="col-span-full"
            error={errors.address}
            hint={
              formData.address ? `${formData.address.length}/70 characters` : ""
            }>
            <TextField
              id="reg-address"
              name="address"
              placeholder="House / building, street, landmark"
              fullWidth
              multiline
              rows={2}
              autoComplete="street-address"
              sx={fieldSx}
              value={formData.address}
              onChange={handleAddressChange}
              error={!!errors.address}
              slotProps={{ htmlInput: { maxLength: 70 } }}
            />
          </Field>

          {/* ---------- Lab category (only when entityType === 2) ---------- */}
          {isLab && (
            <Field
              id="reg-labCategory"
              label="Lab category"
              className="anim-fade-up col-span-full"
              error={errors.labCategory}>
              <Autocomplete
                id="reg-labCategory"
                fullWidth
                autoHighlight
                options={LAB_CATEGORIES}
                value={formData.labCategory || null}
                sx={autoSx}
                onChange={(_, v) => {
                  setFormData((p) => ({ ...p, labCategory: v || "" }));
                  clearError("labCategory");
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Select lab category"
                    error={!!errors.labCategory}
                    slotProps={{
                      input: {
                        ...params.InputProps,
                        startAdornment: (
                          <>
                            <InputAdornment position="start">
                              <span className="flex text-slate-400">
                                <FlaskConical size={18} />
                              </span>
                            </InputAdornment>
                            {params.InputProps.startAdornment}
                          </>
                        ),
                      },
                    }}
                  />
                )}
              />
            </Field>
          )}
        </FieldGrid>

        {/* ---------- Availability ---------- */}
        {hasTimings && (
          <div role="group" aria-label="Availability">
            <TimingsTrigger
              timings={timingsData}
              showSlot={formData.entityType === ENTITY_CLINIC}
              error={errors.timings}
              onOpen={openTimings}
            />
            <FieldHint id="reg-timings-hint" error={errors.timings} />
          </div>
        )}

        {/* ---------- Submit ---------- */}
        <div className="mt-1">
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            aria-busy={loading}
            sx={{
              minHeight: 44,
              borderRadius: "10px",
              textTransform: "none",
              fontSize: "0.95rem",
              fontWeight: 600,
              boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
              backgroundColor: "var(--color-primary)",
              color: "var(--color-surface)",
              "&:hover": {
                backgroundColor: "var(--color-primary)",
                opacity: 0.92,
                boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
              },
              "&.Mui-disabled": {
                backgroundColor: "var(--color-primary)",
                color: "var(--color-surface)",
                opacity: 0.7,
              },
            }}>
            {loading ? (
              <CircularProgress size={22} color="inherit" />
            ) : (
              "Create account"
            )}
          </Button>

          <p className="mt-3 text-center text-sm text-slate-500">
            Already have an account?
            <Link
              to="/login"
              className="ml-1 font-semibold text-[var(--color-primary)] hover:underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </form>

      {openPopup && (
        <WelcomePage
          name={formData.name}
          email={formData.email}
          phone={formData.phone}
          entity={selectedEntity?.entity_name}
          onClose={handlePopupClose}
        />
      )}

      {/* OTP popovers */}
      <OtpVerification
        anchorEl={mobileAnchor}
        open={showMobileOtp && !verified.mobile}
        onClose={() => setShowMobileOtp(false)}
        contact={formData.phone}
        otpType={2} // mobile
        userId={formData.userId}
        onUserId={(id) => setFormData((p) => ({ ...p, userId: id }))}
        onVerified={() => setVerified((p) => ({ ...p, mobile: true }))}
      />

      <OtpVerification
        anchorEl={emailAnchor}
        open={showEmailOtp && !verified.email}
        onClose={() => setShowEmailOtp(false)}
        contact={formData.email}
        otpType={1} // email
        userId={formData.userId}
        onUserId={(id) => setFormData((p) => ({ ...p, userId: id }))}
        onVerified={() => setVerified((p) => ({ ...p, email: true }))}
      />

      {/* Working-hours dialog (kept outside the main <form>) */}
      <TimingsDialog
        open={isTimingsModalOpen}
        initial={timingsData}
        onClose={closeTimings}
        onSave={saveTimings}
        entityType={formData.entityType}
      />
    </div>
  );
};

export default RegistrationForm;