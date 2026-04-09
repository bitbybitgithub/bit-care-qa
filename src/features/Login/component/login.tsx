import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  FormHelperText,
  FormControl,
  IconButton,
  Dialog,
} from "@mui/material";
import { FaPhoneAlt, FaUser, FaLock } from "react-icons/fa";
import { loginSuccess } from "../../../redux/authSlice";
import type { AppDispatch } from "../../../redux/store";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { TokenManager, loginApi, selectClinicApi } from "../../../api";
import { setSession } from "../../../context/sessions/userSession";
import ResetPasswordForm from "./ResetPasswordForm";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Regex from "../../../context/constant/Regex";
import MultiClinicCardView from "./MultiClinicCardView";
import platform from "platform";

const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isClinic, setIsClinic] = useState(true);
  const [patientNumber, setPatientNumber] = useState("");
  const [patientPassword, setPatientPassword] = useState<string>("");
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
  const [loginResponse, setLoginResponse] = useState<any[]>([]);
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
      Doctor: "/doctor/dashboard"
    }
  };

  function getDashboardRoute(
    entityType: number,
    role: string
  ): string | null {
    return DASHBOARD_ROUTES[entityType]?.[role] ?? null;
  }


  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setErrors((prev) => ({ ...prev, number: "" }));

    if (isClinic) {
      setClinicUserId(value);
    } else {
      const numVal = value.replace(/\D/g, "");
      setPatientNumber(numVal);

      if (numVal && !Regex.MOBILEREGEX.test(numVal)) {
        setErrors((prev) => ({
          ...prev,
          number: "Mobile Number must start from 6-9 and be 10 digits",
        }));
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setErrors((prev) => ({ ...prev, password: "" }));
    if (isClinic) {
      setClinicPassword(val);
    } else {
      setPatientPassword(val.replace(/\D/g, ""));
    }
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
        userId : loginResponse?.user?.user_id,
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
    const number = isClinic ? clinicUserId.trim() : patientNumber.trim();
    const password = isClinic ? clinicPassword.trim() : patientPassword.trim();
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

    if (!isClinic && !Regex.MOBILEREGEX.test(number)) {
      setErrors((prev) => ({
        ...prev,
        number: "Mobile Number must start from 6-9 and be 10 digits",
      }));
      return;
    }

    if (!isClinic && !Regex.MOBILEREGEX.test(number)) {
      toast.error("Invalid mobile number");
      return;
    }

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
          ip_address: ip,
          platform: "web"
        };
        const data = await loginApi(requestBody);
        console.log(data)
        if (data.success) {
          setSession("user", data.user);
          TokenManager.setAccessToken(data.accessToken);
          //dont remove below code
          // if (data.user.role === "Doctor" && data?.clinics?.length > 0) {
          //   setLoginResponse(data);
          //   const selectedClinic = await waitForClinicSelect();
          //   if (!selectedClinic) return; // user cancelled
          //   setSession("user", {
          //     ...data.user,
          //     clinic_id: selectedClinic.clinic_id,
          //   });
          // }

          if (data.user.is_temp_password === "1") {
            setSource("resetPassword");
            setClinicUserId("");
            setClinicPassword("");
          } else {
            const route = getDashboardRoute(data.user.entity_type, data.user.role);
            if (!route) {
              toast.error("No dashboard configured for this user role");
              return;
            }
            if (data.user.role === "Doctor") {
              toast.info("Use Mobile App for doctor login");
            }
            else {
              navigate(route);
              toast.success("Login successfull");
            }
          }
          dispatch(loginSuccess());
        } else {
          toast.error(data.message || "Login failed");
        }
      } catch (error: any) {
        console.error("API Error:", error.message || error);
        toast.error(
          error.message || "Something went wrong. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    } else {
      toast.success("Patient login successful");
      dispatch(loginSuccess());
      navigate("/dashboard");
    }
  };




  return (
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-bg)] p-7">
      <div className="relative bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden w-full max-w-3xl md:min-h-[450px]">
        <div className="block md:hidden">
          <div className="flex justify-center bg-[var(--color-primary)] rounded-full p-1 mx-4 mt-4">
            <button
              className={`flex-1 py-2 rounded-full font-semibold transition-all duration-300 ${!isClinic
                ? "bg-[var(--color-surface-alt)] text-[var(--color-primary)]  shadow-md"
                : "bg-[var(--color-primary)]  text-[var(--color-surface-alt)] hover:opacity-90"
                }`}
              onClick={() => setIsClinic(false)}>
              Patient
            </button>
            <button
              className={`flex-1 py-2 rounded-full font-semibold transition-all duration-300 ${isClinic
                ? "bg-[var(--color-surface-alt)] text-[var(--color-primary)]  shadow-md"
                : "bg-[var(--color-primary)]  text-[var(--color-surface-alt)] hover:opacity-900"
                }`}
              onClick={() => setIsClinic(true)}>
              Clinic
            </button>
          </div>

          <div className="p-6 relative">
            <h2 className="text-2xl font-bold text-center text-[var(--color-primary)] mb-6">
              {isClinic ? "Clinic Login" : "Patient Login"}
            </h2>
            {source ? (
              <ResetPasswordForm source={source} setSource={setSource} />
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
                <TextField
                  placeholder={isClinic ? "Username" : "Mobile Number"}
                  value={isClinic ? clinicUserId : patientNumber}
                  size="small"
                  onChange={handleNumberChange}
                  error={!!errors.number}
                  helperText={errors.number}
                  fullWidth
                  inputProps={!isClinic ? { maxLength: 10 } : {}}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {isClinic ? (
                          <FaUser className="text-[var(--color-text)]" />
                        ) : (
                          <FaPhoneAlt className="text-[var(--color-text)]" />
                        )}
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                    mb: 2,
                  }}
                />

                <TextField
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={isClinic ? clinicPassword : patientPassword}
                  size="small"
                  onChange={handlePasswordChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FaLock className="text-[var(--color-text)]]" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword((p) => !p)}>
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                    mb: 2,
                  }}
                />
                <div className="text-left -mt-2 mb-3 w-full">
                  <button
                    type="button"
                    onClick={() => setSource("forgottenPassword")}
                    className="text-sm text-[var(--color-info)] hover:underline font-medium">
                    Forgot Password?
                  </button>
                </div>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{ borderRadius: "12px", py: 1, fontWeight: 600 }}>
                  {loading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    "Login"
                  )}
                </Button>
                {isClinic && (
                  <footer className="text-center">
                    <p className="text-xs mt-2">
                      Don't have an account?{" "}
                      <Link
                        to="/register"
                        className="text-[var(--color-info)] hover:underline cursor-pointer font-semibold">
                        Register Center
                      </Link>
                    </p>
                  </footer>
                )}
              </form>
            )}
          </div>
        </div>

        <div className="hidden md:flex">
          <div
            className={`absolute top-0 h-full w-1/2 transition-all duration-700 ease-in-out ${isClinic
              ? "left-0 translate-x-full opacity-0 z-10"
              : "left-0 opacity-100 z-50"
              }`}>
            {source ? (
              <ResetPasswordForm source={source} setSource={setSource} />
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col items-center justify-center h-full px-10 space-y-5 w-full">
                <h1 className="text-3xl font-extrabold text-[var(--color-primary)]">
                  Patient Login
                </h1>
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
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "12px",
                      },
                    }}
                  />
                  <FormHelperText
                    error={!!errors.number}
                    sx={{
                      minHeight: "20px",
                      visibility: errors.number ? "visible" : "hidden",
                    }}>
                    {errors.number}
                  </FormHelperText>
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
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((p) => !p)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                    }}
                  />
                  <FormHelperText
                    error={!!errors.password}
                    sx={{
                      minHeight: "20px",
                      visibility: errors.password ? "visible" : "hidden",
                    }}>
                    {errors.password}
                  </FormHelperText>
                </FormControl>

                <div className="text-right -mt-2 mb-3 w-full">
                  <a
                    href="#"
                    className="text-sm text-[var(--color-info)] hover:underline font-medium">
                    Forgot Password?
                  </a>
                </div>

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={
                    !patientNumber ||
                    !patientPassword ||
                    !!errors.number ||
                    !!errors.password
                  }
                  sx={{
                    width: "65%",
                    borderRadius: "12px",
                    py: 1,
                    fontWeight: 600,
                  }}>
                  Login
                </Button>

                <p className="text-sm mt-2">
                  Are you a{" "}
                  <span
                    className="text-[var(--color-info)] font-semibold cursor-pointer hover:underline"
                    onClick={() => setIsClinic(true)}>
                    Clinic?
                  </span>
                </p>
              </form>
            )}
          </div>

          <div
            className={`absolute top-0 h-full transition-all duration-700 ease-in-out ${isClinic
              ? "left-1/2 opacity-100 z-50"
              : "left-1/2 -translate-x-full opacity-0 z-10"
              }`}>
            {source ? (
              <ResetPasswordForm source={source} setSource={setSource} />
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col items-center justify-center h-full px-10 space-y-5">
                <h1 className="text-3xl font-extrabold text-[var(--color-primary)]">
                  Center Login
                </h1>
                <FormControl fullWidth>
                  <TextField
                    placeholder="Username"
                    value={clinicUserId}
                    onChange={handleNumberChange}
                    error={!!errors.number}
                    size="small"
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaUser className="text-[var(--color-text)]" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                    }}
                  />
                  <FormHelperText
                    error={!!errors.number}
                    sx={{
                      minHeight: "25px",
                      visibility: errors.number ? "visible" : "hidden",
                    }}>
                    {errors.number}
                  </FormHelperText>
                </FormControl>
                <FormControl>
                  <TextField
                    placeholder="Password"
                    type={showPassword ? "text" : "password"}
                    value={clinicPassword}
                    onChange={handlePasswordChange}
                    size="small"
                    error={!!errors.password}
                    fullWidth
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaLock className="text-[var(--color-text)]" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowPassword((p) => !p)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                    }}
                  />
                  <FormHelperText
                    error={!!errors.password}
                    sx={{
                      minHeight: "25px",
                      visibility: errors.password ? "visible" : "hidden",
                    }}>
                    {errors.password}
                  </FormHelperText>
                </FormControl>
                <div className="text-left -mt-2 mb-3 w-full">
                  <button
                    type="button"
                    onClick={() => setSource("forgottenPassword")}
                    className="text-sm text-[var(--color-info)] hover:underline font-medium">
                    Forgot Password?
                  </button>
                </div>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{
                    width: "65%",
                    py: 1,
                    fontWeight: 600,
                  }}>
                  {loading ? (
                    <CircularProgress size={22} color="inherit" />
                  ) : (
                    "Login"
                  )}
                </Button>

                <p className="text-sm mt-2">
                  Are you a{" "}
                  <span
                    className="text-[var(--color-info)] font-semibold cursor-pointer hover:underline"
                    onClick={() => setIsClinic(false)}>
                    Patient?
                  </span>
                </p>

                <footer>
                  <p className="text-xs">
                    <span>
                      Don't have an Account?{" "}
                      <Link
                        to="/register"
                        className="text-[var(--color-info)] hover:underline cursor-pointer">
                        Register Center
                      </Link>
                    </span>
                  </p>
                </footer>
              </form>
            )}
          </div>

          <div
            className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-all duration-700 ease-in-out rounded-l-[150px] ${isClinic
              ? "translate-x-[-100%] rounded-r-[150px] rounded-l-none"
              : ""
              }`}>
            <div className="flex h-full w-full bg-gradient-to-r from-indigo-500 to-purple-800 text-[var(--color-white)] items-center justify-center text-center px-8">
              {isClinic ? (
                <div className="space-y-2 animate-fadeIn">
                  <h1 className="text-2xl font-bold">Welcome to BITCARE!</h1>
                  <p className="text-sm opacity-90">
                    Login to securely access and manage your healthcare
                    services.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 animate-fadeIn">
                  <h1 className="text-2xl font-bold">Welcome Back, Patient!</h1>
                  <p className="text-sm opacity-90">
                    Access your health records and appointments.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
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
        }}
      >
        <MultiClinicCardView
          clinicsList={loginResponse?.clinics || []}
          onClinicSelect={handleClinicSelect}
        />
      </Dialog>
    </div>
  );
};

export default Login;
