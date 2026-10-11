import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import {
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  IconButton,
  Dialog,
} from "@mui/material";
import { FaUser, FaLock, FaPhoneAlt } from "react-icons/fa";
import {
  Building2,
  FlaskConical,
  HeartPulse,
  Pill,
  Stethoscope,
} from "lucide-react";
import { loginSuccess } from "../../../redux/authSlice";
import type { AppDispatch } from "../../../redux/store";
import { toast } from "react-toastify";
import { TokenManager, loginApi, selectClinicApi } from "../../../api";
import { setSession } from "../../../context/sessions/userSession";
import ResetPasswordForm from "./ResetPasswordForm";
import { Visibility, VisibilityOff } from "@mui/icons-material";
// import Regex from "../../../context/constant/Regex"; // PATIENT LOGIN (disabled)
import MultiClinicCardView from "./MultiClinicCardView";
import platform from "platform";

// The animation classes (anim-float-a, anim-fade-up, dot-grid ...) come from
// the same global CSS the Registration page already uses.

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const APP_NAME = "BitCare";
const SUPPORT_PHONE = "9082331713";

/** Who can sign in: shown on the brand panel */
const AUDIENCE = [
  {
    icon: Building2,
    title: "Clinics",
    description: "Appointments, schedules and patient records.",
  },
  {
    icon: Stethoscope,
    title: "Doctors",
    description: "Consultations and availability in one place.",
  },
  {
    icon: FlaskConical,
    title: "Labs",
    description: "Test orders, samples and digital reports.",
  },
  {
    icon: Pill,
    title: "Pharmacies",
    description: "Prescriptions, stock and orders in sync.",
  },
];

/* ---- Visual tokens (same look as the registration form) ---- */
const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] " +
  "focus-visible:ring-offset-2";

const LABEL_CLASS =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-600";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#f8fafc",
    fontSize: 14,
    minHeight: 40,
    padding: "0 8px 0 14px",
    transition: "background-color .15s",
    "& fieldset": { borderColor: "#e2e8f0" },
    "&:hover fieldset": { borderColor: "#cbd5e1" },
    "&.Mui-focused": { backgroundColor: "#fff" },
    "&.Mui-focused fieldset": {
      borderColor: "var(--color-primary)",
      borderWidth: "1.5px",
    },
    "&.Mui-error fieldset": { borderColor: "#dc2626" },
  },
  "& .MuiInputBase-input": {
    padding: "9px 6px 9px 0",
    fontSize: 14,
    lineHeight: "22px",
    boxSizing: "border-box",
    height: "auto",
    "&::placeholder": { color: "#94a3b8", opacity: 1 },
  },
  "& .MuiInputAdornment-positionStart": { marginRight: "10px" },
  "& .MuiFormHelperText-root": {
    minHeight: 16,
    margin: "2px 2px 0",
    fontSize: 11.5,
    lineHeight: "16px",
  },
};

/* ------------------------------------------------------------------ */
/*  Small presentational helpers                                       */
/* ------------------------------------------------------------------ */
const Logo = ({ light = false }: { light?: boolean }) => (
  <div className="flex items-center gap-2.5">
    <span
      className={`grid h-9 w-9 place-items-center rounded-xl ${
        light
          ? "bg-white/15 text-white"
          : "bg-[var(--color-primary)] text-[var(--color-surface)]"
      }`}>
      <HeartPulse size={20} aria-hidden />
    </span>
    <span
      className={`text-xl font-bold tracking-tight ${
        light ? "text-white" : "text-[var(--color-text)]"
      }`}>
      {APP_NAME}
    </span>
  </div>
);

/* Small medical cross used as a floating decoration */
const Cross = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M9 2h6v7h7v6h-7v7H9v-7H2V9h7z" />
  </svg>
);

const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  // Patient login is disabled for now, so the page is always in "clinic" mode.
  // const [isClinic, setIsClinic] = useState(true);
  const isClinic = true;

  // PATIENT LOGIN (disabled)
  // const [patientNumber, setPatientNumber] = useState("");
  // const [patientPassword, setPatientPassword] = useState<string>("");

  const [clinicUserId, setClinicUserId] = useState("");
  const [clinicPassword, setClinicPassword] = useState<string>("");
  const [errors, setErrors] = useState({
    username: "",
    number: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [source, setSource] = useState<
    "resetPassword" | "forgottenPassword" | null
  >(null);

  //clinics list popup states
  const [openPopup, setOpenPopup] = useState(false);
  const [loginResponse, setLoginResponse] = useState<any>([]);
  const clinicSelectResolverRef = useRef<((clinic: any) => void) | null>(null);

  const DASHBOARD_ROUTES: Record<number, Record<string, string>> = {
    1: {
      Admin: "/clinic/dashboard",
      Staff: "/staff/dashboard",
      Doctor: "/doctor/dashboard",
    },
    2: {
      Admin: "/lab/dashboard",
      Staff: "/lab/dashboard",
      Doctor: "/lab/dashboard",
      Technician: "/lab/dashboard",
    },
    3: {
      Admin: "/pharmacy/dashboard",
      Staff: "/pharmacy/dashboard",
    },
    4: {
      Doctor: "/doctor/dashboard",
    },
    5: {
      support: "/support/dashboard",
    },
  };

  function getDashboardRoute(entityType: number, role: string): string | null {
    return DASHBOARD_ROUTES[entityType]?.[role] ?? null;
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setErrors((prev) => ({ ...prev, number: "" }));

    if (isClinic) {
      setClinicUserId(value);
    }
    // PATIENT LOGIN (disabled)
    // else {
    //   const numVal = value.replace(/\D/g, "");
    //   setPatientNumber(numVal);
    //
    //   if (numVal && !Regex.MOBILEREGEX.test(numVal)) {
    //     setErrors((prev) => ({
    //       ...prev,
    //       number: "Mobile Number must start from 6-9 and be 10 digits",
    //     }));
    //   }
    // }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setErrors((prev) => ({ ...prev, password: "" }));
    if (isClinic) {
      setClinicPassword(val);
    }
    // PATIENT LOGIN (disabled)
    // else {
    //   setPatientPassword(val.replace(/\D/g, ""));
    // }
  };

  const waitForClinicSelect = (): Promise<any> => {
    return new Promise((resolve) => {
      clinicSelectResolverRef.current = resolve;
      setOpenPopup(true);
    });
  };

  const handleClinicSelect = async (clinic: any) => {
    setOpenPopup(false);
    if (clinicSelectResolverRef.current) {
      const ip = await getIP();
      const requestBody = {
        doctorId: loginResponse?.user?.doctor_id,
        clinicId: clinic.clinic_id,
        userId: loginResponse?.user?.user_id,
        ip_address: ip,
        platform: "web",
      };
      clinicSelectResolverRef.current(clinic); // null if cancelled
      const selectApiResponse = await selectClinicApi(requestBody);
      TokenManager.setAccessToken(selectApiResponse.accessToken);
      clinicSelectResolverRef.current = null;
    }
  };

  const getDeviceInfo = () => {
    return `${platform.name} ${platform.version} | ${platform.os}`;
  };

  const getIP = async () => {
    const res = await fetch("https://api.ipify.org?format=json");
    const data = await res.json();
    return data.ip;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // const number = isClinic ? clinicUserId.trim() : patientNumber.trim();
    // const password = isClinic ? clinicPassword.trim() : patientPassword.trim();
    const number = clinicUserId.trim();
    const password = clinicPassword.trim();
    let newErrors: any = {};
    if (!number) {
      newErrors.number = isClinic
        ? "Username is required"
        : "Mobile number is required";
    }
    if (!password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // PATIENT LOGIN (disabled)
    // if (!isClinic && !Regex.MOBILEREGEX.test(number)) {
    //   setErrors((prev) => ({
    //     ...prev,
    //     number: "Mobile Number must start from 6-9 and be 10 digits",
    //   }));
    //   return;
    // }
    //
    // if (!isClinic && !Regex.MOBILEREGEX.test(number)) {
    //   toast.error("Invalid mobile number");
    //   return;
    // }

    if (errors.password) {
      toast.error("Invalid password");
      return;
    }
    const ip = await getIP();
    if (isClinic) {
      try {
        setLoading(true);
        const requestBody = {
          userId: number,
          password: password,
          ip_address: ip, // dynamic
          platform: "web", // dynamic
        };
        const data = await loginApi(requestBody);
        console.log(data);
        if (data.success) {
          setSession("user", data.user);
          TokenManager.setAccessToken(data.accessToken);
          //dont remove below code
          if (data.user.role === "Doctor" && data?.clinics?.length > 0) {
            setLoginResponse(data);
            const selectedClinic = await waitForClinicSelect();
            if (!selectedClinic) return; // user cancelled
            setSession("user", {
              ...data.user,
              clinic_id: selectedClinic.clinic_id,
            });
          }

          if (data.user.is_temp_password === "1") {
            setSource("resetPassword");
            setClinicUserId("");
            setClinicPassword("");
          } else {
            const route = getDashboardRoute(
              data.user.entity_type,
              data.user.role
            );
            if (!route) {
              toast.error("No dashboard configured for this user role");
              return;
            }
            // if (data.user.role === "Doctor") {
            //   toast.info("Use Mobile App for doctor Sign In");
            // }
            else {
              navigate(route);
              toast.success("Signed in successfully");
            }
          }
          dispatch(loginSuccess());
        } else {
          toast.error(data.message || "Failed to sign in");
        }
      } catch (error: any) {
        console.error("API Error:", error.message || error);
        toast.error(
          error.message || "Something went wrong. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    }
    // PATIENT LOGIN (disabled)
    // else {
    //   toast.success("Signed in successfully");
    //   dispatch(loginSuccess());
    //   navigate("/dashboard");
    // }
  };

  /* ------------------------------------------------------------------ */
  /*  Clinic sign-in form (single form for mobile + desktop)             */
  /* ------------------------------------------------------------------ */
  const signInForm = (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <div className="mb-5">
        <h2
          className="font-[var(--font-weight-bold)] text-[var(--color-text)]"
          style={{ fontSize: "var(--font-h3, 1.5rem)" }}>
          Welcome <span className="text-[var(--color-primary)]">back</span>
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Sign in to your account to continue.
        </p>
      </div>

      {/* Username */}
      <div className="mb-1">
        <label htmlFor="login-username" className={LABEL_CLASS}>
          Username
        </label>
        <TextField
          id="login-username"
          placeholder="Enter your username"
          value={clinicUserId}
          onChange={handleNumberChange}
          error={!!errors.number}
          helperText={errors.number || " "}
          fullWidth
          autoFocus
          autoComplete="username"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaUser size={14} className="text-slate-400" />
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />
      </div>

      {/* Password */}
      <div className="mb-1">
        <label htmlFor="login-password" className={LABEL_CLASS}>
          Password
        </label>
        <TextField
          id="login-password"
          placeholder="Enter your password"
          type={showPassword ? "text" : "password"}
          value={clinicPassword}
          onChange={handlePasswordChange}
          error={!!errors.password}
          helperText={errors.password || " "}
          fullWidth
          autoComplete="current-password"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaLock size={14} className="text-slate-400" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  size="small"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((p) => !p)}>
                  {showPassword ? (
                    <VisibilityOff fontSize="small" />
                  ) : (
                    <Visibility fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />
      </div>

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => setSource("forgottenPassword")}
          className={`rounded text-sm font-semibold text-[var(--color-primary)] hover:underline underline-offset-2 ${FOCUS_RING}`}>
          Forgot password?
        </button>
      </div>

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
        {loading ? <CircularProgress size={22} color="inherit" /> : "Sign in"}
      </Button>

      <p className="mt-4 text-center text-sm text-slate-500">
        Don't have an account?
        <Link
          to="/register"
          className="ml-1 font-semibold text-[var(--color-primary)] hover:underline underline-offset-2">
          Register your center
        </Link>
      </p>
    </form>
  );

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[var(--color-bg)] p-4 sm:p-7">
      {/* page background: soft floating shapes behind the card */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <span className="anim-float-a absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_9%,transparent)]" />
        <span className="anim-float-b absolute -bottom-32 -right-24 h-96 w-96 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_8%,transparent)]" />
        <span className="anim-spin-slow absolute bottom-16 left-[10%] hidden h-24 w-24 rounded-full border border-dashed border-[color-mix(in_srgb,var(--color-primary)_25%,transparent)] sm:block" />
        <span className="dot-grid anim-drift absolute right-[8%] top-[14%] hidden h-24 w-24 text-[color-mix(in_srgb,var(--color-primary)_22%,transparent)] sm:block" />
        <Cross className="anim-bob absolute left-[8%] top-[22%] hidden h-6 w-6 text-[color-mix(in_srgb,var(--color-primary)_30%,transparent)] sm:block" />
        <Cross className="anim-bob delay-n3s absolute bottom-[18%] right-[10%] hidden h-5 w-5 text-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] sm:block" />
      </div>

      <div className="anim-fade-up relative z-10 grid w-full max-w-4xl overflow-hidden rounded-[var(--radius-lg)] border border-slate-100 bg-[var(--color-surface)] shadow-[var(--shadow-lg)] md:grid-cols-[1fr_1.1fr]">
        {/* ---------------- Brand panel ---------------- */}
        <aside className="relative hidden flex-col justify-between gap-6 overflow-hidden bg-[var(--color-primary)] p-8 text-white md:flex">
          {/* decorative animated shapes */}
          <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
            <span className="anim-float-a absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10" />
            <span className="anim-float-b absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-white/5" />
            <span className="anim-pulse absolute right-6 top-6 h-32 w-32 rounded-full border border-white/15" />
            <span className="anim-spin-slow absolute right-16 top-[48%] h-20 w-20 rounded-full border border-dashed border-white/20" />
            <span className="dot-grid anim-drift absolute bottom-24 right-8 h-20 w-20 text-white/25" />
            <Cross className="anim-bob absolute left-[52%] top-20 h-4 w-4 text-white/25" />
          </div>

          <div className="relative">
            <Logo light />
          </div>

          <div className="relative">
            <h1 className="text-2xl font-bold leading-tight">
              One platform for{" "}
              <span className="text-white/70">every care provider</span>
            </h1>
            <p className="mt-2 max-w-xs text-sm text-white/80">
              Sign in to manage your clinic, practice, lab or pharmacy.
            </p>

            <ul className="mt-5 space-y-2.5">
              {AUDIENCE.map(({ icon: Icon, title, description }, i) => (
                <li
                  key={title}
                  style={{ animationDelay: `${i * 90 + 200}ms` }}
                  className="anim-fade-up flex items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-3 py-2 backdrop-blur-sm">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/15">
                    <Icon size={16} aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold leading-tight">
                      {title}
                    </span>
                    <span className="block text-[11px] leading-snug text-white/75">
                      {description}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <a
            href={`tel:${SUPPORT_PHONE}`}
            className="relative flex w-fit items-center gap-2.5 rounded-full bg-white/15 py-1.5 pl-1.5 pr-4 text-sm hover:bg-white/20">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white text-[var(--color-primary)]">
              <FaPhoneAlt size={12} aria-hidden />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] text-white/75">Need help?</span>
              <span className="block text-sm font-semibold">{SUPPORT_PHONE}</span>
            </span>
          </a>
        </aside>

        {/* ---------------- Form panel ---------------- */}
        <main className="relative flex flex-col justify-center overflow-hidden">
          {/* Compact brand header for mobile */}
          <div className="flex items-center justify-between bg-[var(--color-primary)] px-5 py-4 text-white md:hidden">
            <Logo light />
            <a
              href={`tel:${SUPPORT_PHONE}`}
              aria-label={`Call support at ${SUPPORT_PHONE}`}
              className="flex items-center gap-2 text-sm font-medium">
              <FaPhoneAlt size={13} aria-hidden />
              <span className="hidden min-[360px]:inline">{SUPPORT_PHONE}</span>
            </a>
          </div>

          {/* very subtle motion inside the form panel */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <span className="anim-float-b absolute -bottom-20 -right-16 h-56 w-56 rounded-full bg-[color-mix(in_srgb,var(--color-primary)_6%,transparent)]" />
            <span className="dot-grid anim-drift absolute right-6 top-6 hidden h-16 w-16 text-[color-mix(in_srgb,var(--color-primary)_18%,transparent)] md:block" />
          </div>

          <div className="relative mx-auto w-full max-w-sm px-6 py-7 md:px-4 md:py-8">
            {source ? (
              <ResetPasswordForm source={source} setSource={setSource} />
            ) : (
              signInForm
            )}
          </div>
        </main>
      </div>

      {/* Clinic selection popup (unchanged behaviour) */}
      <Dialog
        open={openPopup}
        disableEscapeKeyDown
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: "20px",
            overflow: "hidden",
            background: "transparent",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
        }}>
        <MultiClinicCardView
          clinicsList={loginResponse?.clinics || []}
          onClinicSelect={handleClinicSelect}
        />
      </Dialog>
    </div>
  );
};

export default Login;

/* ======================================================================
   PATIENT LOGIN (disabled) – original UI kept here for easy restore.
   To bring it back: restore the commented imports/state/handlers above,
   re-add the Patient/Clinic switch, and render this form when
   `!isClinic`.
   ======================================================================

   <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center h-full px-10 space-y-5 w-full">
     <h1 className="text-3xl font-extrabold text-[var(--color-primary)]">Patient Sign In</h1>

     <FormControl fullWidth>
       <TextField
         placeholder="Mobile Number"
         value={patientNumber}
         onChange={handleNumberChange}
         size="small"
         error={!!errors.number}
         fullWidth
         inputProps={{ maxLength: 10 }}
         InputProps={{
           startAdornment: (
             <InputAdornment position="start">
               <FaPhoneAlt className="text-[var(--color-text)]" />
             </InputAdornment>
           ),
         }}
         sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
       />
       <FormHelperText error={!!errors.number}>{errors.number}</FormHelperText>
     </FormControl>

     <FormControl>
       <TextField
         placeholder="Password"
         type="password"
         value={patientPassword}
         onChange={handlePasswordChange}
         size="small"
         fullWidth
         InputProps={{
           startAdornment: (
             <InputAdornment position="start">
               <FaLock className="text-[var(--color-text)]" />
             </InputAdornment>
           ),
         }}
       />
     </FormControl>

     <Button
       type="submit"
       variant="contained"
       color="primary"
       disabled={!patientNumber || !patientPassword || !!errors.number || !!errors.password}
       sx={{ width: "65%", borderRadius: "12px", py: 1, fontWeight: 600 }}
     >
       Sign In
     </Button>

     <p className="text-sm mt-2">
       Are you a{" "}
       <span className="text-[var(--color-info)] font-semibold cursor-pointer hover:underline" onClick={() => setIsClinic(true)}>
         Clinic?
       </span>
     </p>
   </form>
*/