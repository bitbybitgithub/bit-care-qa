import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { TextField, Button, InputAdornment, CircularProgress } from "@mui/material";
import { FaPhoneAlt, FaLock } from "react-icons/fa";
import { loginSuccess } from "../../redux/authSlice";
import type { AppDispatch } from "../../redux/store";
import Regex from "../../helper/Regex";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import { loginApi } from "../../api/loginApi"; 

const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [isClinic, setIsClinic] = useState(true); // false = Patient, true = Clinic
  const [patientNumber, setPatientNumber] = useState("");
  const [patientPassword, setPatientPassword] = useState<string>("");
  const [clinicUserId, setClinicUserId] = useState("");
  const [clinicPassword, setClinicPassword] = useState<string>("");
  const [errors, setErrors] = useState({ number: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    if (isClinic) {
      setClinicUserId(value);
      setErrors((prev) => ({ ...prev, number: "" }));
    } else {
      const numVal = value.replace(/\D/g, "");
      setPatientNumber(numVal);

      if (numVal.length === 0) {
        setErrors((prev) => ({ ...prev, number: "" }));
      } else if (Regex.MOBILEREGEX.test(numVal)) {
        setErrors((prev) => ({ ...prev, number: "" }));
      } else {
        setErrors((prev) => ({
          ...prev,
          number: "Mobile Number must start from 6-9 and be 10 digits",
        }));
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;

    if (isClinic) {
      setClinicPassword(val);
    } else {
      val = val.replace(/\D/g, "");
      setPatientPassword(val);
    }

    if (val.length === 0) {
      setErrors((prev) => ({ ...prev, password: "" }));
    } else {
      setErrors((prev) => ({ ...prev, password: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const number = isClinic ? clinicUserId : patientNumber;
  const password = isClinic ? clinicPassword : patientPassword;

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
        ip_address: "192.168.2.44",
        platform: "web",
      };

      console.log("Before calling loginApi", requestBody);

      const data = await loginApi(requestBody); // call the API

      console.log("After calling loginApi, response:", data);

      if (data.success) {
        toast.success("Login successful");

        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("user", JSON.stringify(data.user));

        dispatch(loginSuccess());
        navigate("/dashboard");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (error: any) {
      console.error("API Error:", error.message || error);
      toast.error(error.message || "Something went wrong. Please try again later.");
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-gray-300 to-blue-200 font-montserrat p-7">
      <div className="relative bg-white rounded-3xl shadow-lg overflow-hidden w-full max-w-2xl min-h-[450px]">
        {/* MOBILE TABS */}
        <div className="block md:hidden">
          <div className="flex justify-center bg-indigo-500 rounded-full p-1 mx-4 mt-4">
            <button
              className={`flex-1 py-2 rounded-full font-semibold transition-all duration-300 ${
                !isClinic
                  ? "bg-white text-indigo-600 shadow-md"
                  : "bg-indigo-500 text-white hover:bg-indigo-400/70"
              }`}
              onClick={() => setIsClinic(false)}
            >
              Patient
            </button>
            <button
              className={`flex-1 py-2 rounded-full font-semibold transition-all duration-300 ${
                isClinic
                  ? "bg-white text-indigo-600 shadow-md"
                  : "bg-indigo-500 text-white hover:bg-indigo-400/70"
              }`}
              onClick={() => setIsClinic(true)}
            >
              Clinic
            </button>
          </div>

          <div className="p-6 relative">
            <h2 className="text-2xl font-bold text-center text-blue-900 mb-6">
              {isClinic ? "Clinic Login" : "Patient Login"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
              <TextField
                label={isClinic ? "User Id" : "Mobile Number"}
                value={isClinic ? clinicUserId : patientNumber}
                size="small"
                onChange={handleNumberChange}
                error={!isClinic && !!errors.number}
                helperText={!isClinic ? errors.number : ""}
                fullWidth
                inputProps={!isClinic ? { maxLength: 10 } : {}}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaPhoneAlt className="text-indigo-500" />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" }, mb: 2 }}
              />

              <TextField
                label="Password"
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
                      <FaLock className="text-indigo-500" />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" }, mb: 2 }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={
                  loading ||
                  !!errors.number ||
                  !!errors.password ||
                  !(isClinic ? clinicUserId : patientNumber) ||
                  !(isClinic ? clinicPassword : patientPassword)
                }
                sx={{ borderRadius: "12px", py: 1, fontWeight: 600 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Login"}
              </Button>
            </form>
          </div>
        </div>

        {/* DESKTOP TOGGLE */}
        <div className="hidden md:flex">
          {/* Patient Login Panel */}
          <div
            className={`absolute top-0 h-full w-1/2 transition-all duration-700 ease-in-out ${
              isClinic ? "left-0 translate-x-full opacity-0 z-10" : "left-0 opacity-100 z-50"
            }`}
          >
            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center justify-center h-full px-10 space-y-5 w-full"
            >
              <h1 className="text-3xl font-extrabold bg-blue-900 bg-clip-text text-transparent">
                Patient Login
              </h1>

              <TextField
                label="Mobile Number"
                value={patientNumber}
                onChange={handleNumberChange}
                size="small"
                error={!!errors.number}
                helperText={errors.number}
                fullWidth
                inputProps={{ maxLength: 10 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaPhoneAlt className="text-indigo-500" />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" }, mb: 2 }}
              />

              <TextField
                label="Password"
                type="password"
                value={patientPassword}
                onChange={handlePasswordChange}
                size="small"
                error={!!errors.password}
                helperText={errors.password}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaLock className="text-indigo-500" />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" }, mb: 2 }}
              />

              <div className="text-right -mt-2 mb-3 w-full">
                <a href="#" className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                  Forgot Password?
                </a>
              </div>

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!patientNumber || !patientPassword || !!errors.number || !!errors.password}
                sx={{
                  width: "65%",
                  borderRadius: "12px",
                  py: 1,
                  fontWeight: 600,
                  "&:hover": { backgroundColor: "#4338ca" },
                }}
              >
                Login
              </Button>

              <p className="text-sm mt-2">
                Are you a{" "}
                <span
                  className="text-indigo-600 font-semibold cursor-pointer hover:underline"
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
              isClinic ? "left-1/2 opacity-100 z-50" : "left-1/2 -translate-x-full opacity-0 z-10"
            }`}
          >
            <form
              onSubmit={handleSubmit}
              className="flex flex-col items-center justify-center h-full px-10 space-y-5"
            >
              <h1 className="text-3xl font-extrabold bg-blue-900 bg-clip-text text-transparent">
                Clinic Login
              </h1>

              <TextField
                label="User Id"
                value={clinicUserId}
                onChange={handleNumberChange}
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaPhoneAlt className="text-indigo-500" />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" }, mb: 2 }}
              />

              <TextField
                label="Password"
                type="password"
                value={clinicPassword}
                onChange={handlePasswordChange}
                size="small"
                error={!!errors.password}
                helperText={errors.password}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaLock className="text-indigo-500" />
                    </InputAdornment>
                  ),
                }}
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" }, mb: 2 }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!clinicUserId || !clinicPassword || !!errors.password || loading}
                sx={{
                  width: "65%",
                  borderRadius: "12px",
                  py: 1,
                  fontWeight: 600,
                  "&:hover": { backgroundColor: "#4338ca" },
                }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : "Login"}
              </Button>

              <p className="text-sm mt-2">
                Are you a{" "}
                <span
                  className="text-indigo-600 font-semibold cursor-pointer hover:underline"
                  onClick={() => setIsClinic(false)}
                >
                  Patient?
                </span>
              </p>
              <footer>
                <p className="text-xs">
                  <span>
                    Don't have an Account?{" "}
                    <Link to="/register" className="text-indigo-600 hover:underline cursor-pointer">
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
              isClinic ? "translate-x-[-100%] rounded-r-[150px] rounded-l-none" : ""
            }`}
          >
            <div className="flex h-full w-full bg-gradient-to-r from-indigo-500 to-purple-800 text-white items-center justify-center text-center px-8">
              {isClinic ? (
                <div className="space-y-2 animate-fadeIn">
                  <h1 className="text-2xl font-bold">Welcome, Clinic!</h1>
                  <p className="text-sm opacity-90">Login to manage patients and records.</p>
                </div>
              ) : (
                <div className="space-y-2 animate-fadeIn">
                  <h1 className="text-2xl font-bold">Welcome Back, Patient!</h1>
                  <p className="text-sm opacity-90">Access your health records and appointments.</p>
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

