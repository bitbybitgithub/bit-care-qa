import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  FormHelperText,
  FormControl,
} from "@mui/material";
import { FaPhoneAlt, FaUser, FaLock } from "react-icons/fa";
import { loginSuccess } from "../../../redux/authSlice";
import type { AppDispatch } from "../../../redux/store";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { loginApi } from "../../../api/clinic/loginApi";
import Regex from "../../../Helper/Regex";
import useClientIp from "../../../hooks/useClientIp";
import { setSession } from "../../../context/sessions/userSession";
import { TokenManager } from "../../../api/auth/tokenManager";

const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { ip } = useClientIp();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const number = isClinic ? clinicUserId.trim() : patientNumber.trim();
    const password = isClinic ? clinicPassword.trim() : patientPassword.trim();
    let newErrors: any = {};
    if (!number) {
      newErrors.number = isClinic
        ? "User Name is required"
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

    if (isClinic) {
      try {
        setLoading(true);
        const requestBody = {
          userId: number,
          password: password,
          ip_address: ip,
          platform: "web",
        };

        console.log("Before calling loginApi", requestBody);
        const data = await loginApi(requestBody);
        console.log("After calling loginApi, response:", data);
        if (data.success) {
          setSession("user", data.user);
          TokenManager.setAccessToken(data.accessToken);
          if (data.user.is_temp_password === "1") {
            console.log(data.user.user_id);
            setTimeout(() => {
              navigate("/ResetPassword");
              toast.success("Please reset your temporary password");
            }, 1000);
          } else {
            navigate("/dashboard");
            toast.success("Login successful");
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
    <div className="flex items-center justify-center min-h-screen bg-[var(--color-surface)] font-montserrat p-7">
      <div className="relative bg-[var(--color-bg)] rounded-3xl shadow-2xl overflow-hidden w-full max-w-2xl md:min-h-[450px]">
        {/* MOBILE TABS */}
        <div className="block md:hidden">
          <div className="flex justify-center bg-[var(--color-primary)] rounded-full p-1 mx-4 mt-4">
            <button
              className={`flex-1 py-2 rounded-full font-semibold transition-all duration-300 ${
                !isClinic
                  ? "bg-[var(--color-white)] text-[var(--color-primary)]  shadow-md"
                  : "bg-[var(--color-primary)]  text-[var(--color-white)] hover:opacity-90"
              }`}
              onClick={() => setIsClinic(false)}
            >
              Patient
            </button>
            <button
              className={`flex-1 py-2 rounded-full font-semibold transition-all duration-300 ${
                isClinic
                  ? "bg-[var(--color-white)] text-[var(--color-primary)]  shadow-md"
                  : "bg-[var(--color-primary)]  text-[var(--color-white)] hover:opacity-900"
              }`}
              onClick={() => setIsClinic(true)}
            >
              Clinic
            </button>
          </div>

          <div className="p-6 relative">
            <h2 className="text-2xl font-bold text-center text-[var(--color-primary)] mb-6">
              {isClinic ? "Clinic Login" : "Patient Login"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
              <TextField
                placeholder={isClinic ? "User Name" : "Mobile Number"}
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
                type="password"
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
                }}
                sx={{
                  "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                  mb: 2,
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ borderRadius: "12px", py: 1, fontWeight: 600 }}
              >
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
                      className="text-[var(--color-info)] hover:underline cursor-pointer font-semibold"
                    >
                      Register Clinic
                    </Link>
                  </p>
                </footer>
              )}
            </form>
          </div>
        </div>

        {/* DESKTOP TOGGLE */}
        <div className="hidden md:flex">
          {/* Patient Login Panel */}
          <div
            className={`absolute top-0 h-full w-1/2 transition-all duration-700 ease-in-out ${
              isClinic
                ? "left-0 translate-x-full opacity-0 z-10"
                : "left-0 opacity-100 z-50"
            }`}
          >
            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center justify-center h-full px-10 space-y-5 w-full"
            >
              <h1 className="text-3xl font-extrabold text-[var(--color-primary)]">
                Patient Login
              </h1>
              <FormControl>
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
                <FormHelperText
                  error={!!errors.number}
                  sx={{
                    minHeight: "20px",
                    visibility: errors.number ? "visible" : "hidden",
                  }}
                >
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
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
                <FormHelperText
                  error={!!errors.password}
                  sx={{
                    minHeight: "20px",
                    visibility: errors.password ? "visible" : "hidden",
                  }}
                >
                  {errors.password}
                </FormHelperText>
              </FormControl>

              <div className="text-right -mt-2 mb-3 w-full">
                <a
                  href="#"
                  className="text-sm text-[var(--color-info)] hover:underline font-medium"
                >
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
                }}
              >
                Login
              </Button>

              <p className="text-sm mt-2">
                Are you a{" "}
                <span
                  className="text-[var(--color-info)] font-semibold cursor-pointer hover:underline"
                  onClick={() => setIsClinic(true)}
                >
                  Clinic?
                </span>
              </p>
            </form>
          </div>

          {/* Clinic Login Panel */}
          <div
            className={`absolute top-0 h-full w-1/2 transition-all duration-700 ease-in-out ${
              isClinic
                ? "left-1/2 opacity-100 z-50"
                : "left-1/2 -translate-x-full opacity-0 z-10"
            }`}
          >
            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center justify-center h-full px-10 space-y-5"
            >
              <h1 className="text-3xl font-extrabold text-[var(--color-primary)]">
                Clinic Login
              </h1>
              <FormControl>
                <TextField
                  placeholder="User Name"
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
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
                <FormHelperText
                  error={!!errors.number}
                  sx={{
                    minHeight: "25px",
                    visibility: errors.number ? "visible" : "hidden",
                  }}
                >
                  {errors.number}
                </FormHelperText>
              </FormControl>
              <FormControl>
                <TextField
                  placeholder="Password"
                  type="password"
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
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
                <FormHelperText
                  error={!!errors.password}
                  sx={{
                    minHeight: "25px",
                    visibility: errors.password ? "visible" : "hidden",
                  }}
                >
                  {errors.password}
                </FormHelperText>
              </FormControl>
              <div className="text-left -mt-2 mb-3 w-full">
                <Link
                  to="/ResetPassword?from=forgottenPassword"
                  className="text-sm text-[var(--color-info)] hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{
                  width: "65%",
                  borderRadius: "12px",
                  py: 1,
                  fontWeight: 600,
                }}
              >
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
                  onClick={() => setIsClinic(false)}
                >
                  Patient?
                </span>
              </p>

              <footer>
                <p className="text-xs">
                  <span>
                    Don't have an Account?{" "}
                    <Link
                      to="/register"
                      className="text-[var(--color-info)] hover:underline cursor-pointer"
                    >
                      Register Clinic
                    </Link>
                  </span>
                </p>
              </footer>
            </form>
          </div>

          {/* Toggle Panel */}
          <div
            className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-all duration-700 ease-in-out rounded-l-[150px] ${
              isClinic
                ? "translate-x-[-100%] rounded-r-[150px] rounded-l-none"
                : ""
            }`}
          >
            <div className="flex h-full w-full bg-gradient-to-r from-indigo-500 to-purple-800 text-[var(--color-white)] items-center justify-center text-center px-8">
              {isClinic ? (
                <div className="space-y-2 animate-fadeIn">
                  <h1 className="text-2xl font-bold">Welcome, Clinic!</h1>
                  <p className="text-sm opacity-90">
                    Login to manage patients and records.
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
    </div>
  );
};

export default Login;
