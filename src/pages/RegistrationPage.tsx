import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  InputAdornment,
  Autocomplete,
  FormControl,
  FormHelperText,
  CircularProgress,
} from "@mui/material";
import { MdEmail, MdLocationOn } from "react-icons/md";
import { FaHospital, FaPhoneAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import { validateRegistration } from "../helper/ErrorHandler";
import { getPincodeDetails } from "../api/ServiceApi";
import { registerApi } from "../api";
import type {
  FormDataBase,
  ValidationErrors,
  LocationItem,
} from "../types/types";
import DocFaceMask from "../assets/DocStaff2.png";
import DrBgReg from "../assets/DrBgReg.png";
import Regex, { regex } from "../helper/Regex";
const Registration = () => {
  const [formData, setFormData] = useState<FormDataBase>({
    name: "",
    email: "",
    phone: "",
    address: "",
    PINCode: "",
    area: "",
    district: "",
    state: "",
  });

  const [otpData, setOtpData] = useState({
    mobileOtp: "",
    emailOtp: "",
  });

  const [verified, setVerified] = useState({
    mobile: false,
    email: false,
  });

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [districList, setDistricList] = useState<string[]>([]);
  const [stateList, setStateList] = useState<string[]>([]);
  const [areaList, setAreaList] = useState<string[]>([]);

  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "name") {
      let error = "";
      if (!value.trim()) error = "Name is required";
      else if (value.length < 5)
        error = "Name must be at least 5 characters long";
      else if (!Regex.name.test(value))
        error = "Cannot enter numbers or special characters";
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "address") {
      if (!Regex.address.test(value)) {
        setErrors((prev) => ({
          ...prev,
          address: "Address must be at least 10 characters",
        }));
      } else {
        setErrors((prev) => ({ ...prev, address: "" }));
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setFormData((prev) => ({ ...prev, phone: value }));
    }
  };

  useEffect(() => {
    if (formData.phone.length === 10 && !verified.mobile) {
      if (!Regex.MOBILEREGEX.test(formData.phone)) {
        setErrors({ phone: "Number should start with 6,7,8,9" });
        return;
      }
      setShowOtp(true);
      toast.info("OTP sent to your mobile");
      console.log("Send OTP to:", formData.phone);
      setErrors({});
    } else if (formData.phone.length < 10) {
      setShowOtp(false);
      setOtpData((prev) => ({ ...prev, mobileOtp: "" }));
    }
  }, [formData.phone]);

  const handleMobileOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) {
      setOtpData((prev) => ({ ...prev, mobileOtp: value }));
    }

    if (value.length === 6) {
      if (value === "123456") {
        toast.success("Mobile OTP verified successfully!");
        setVerified((prev) => ({ ...prev, mobile: true }));
        setShowOtp(false);
      } else {
        toast.error("Invalid mobile OTP!");
        setOtpData((prev) => ({ ...prev, mobileOtp: "" }));
        setVerified((prev) => ({ ...prev, mobile: false }));
      }
    }
  };

  const handleEmailKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (
      e.key === " " &&
      (e.currentTarget.selectionStart === 0 ||
        e.currentTarget.value.length === 0)
    ) {
      e.preventDefault();
    }
  };
  const handleEmailBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value } = e.target;
    const cleanedValue = value.replace(/\s/g, "");
    setFormData((prev) => ({ ...prev, email: cleanedValue }));
    setErrors((prev) => ({ ...prev, email: "" }));

    if (Regex.email.test(cleanedValue) && !verified.email) {
      toast.info("OTP sent to your email");
      console.log("Send email OTP to:", cleanedValue);
      setShowEmailOtp(true);
    } else {
      setShowEmailOtp(false);
      setOtpData((prev) => ({ ...prev, emailOtp: "" }));
    }
  };

  const handleEmailOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) {
      setOtpData((prev) => ({ ...prev, emailOtp: value }));
    }
    if (value.length === 6) {
      if (value === "123456") {
        toast.success("Email OTP verified successfully!");
        setVerified((prev) => ({ ...prev, email: true }));
        setShowEmailOtp(false);
      } else {
        toast.error("Invalid email OTP!");
        setOtpData((prev) => ({ ...prev, emailOtp: "" }));
        setVerified((prev) => ({ ...prev, email: false }));
      }
    }
  };

  const fetchLocationList = (responseData: LocationItem[]) => {
    const stateSet = new Set<string>();
    const districtSet = new Set<string>();
    const areaSet = new Set<string>();

    responseData.forEach((item) => {
      if (item?.State) stateSet.add(item.State);
      if (item?.District) districtSet.add(item.District);
      if (item?.Name) areaSet.add(item.Name);
    });

    setStateList(Array.from(stateSet));
    setDistricList(Array.from(districtSet));
    setAreaList(Array.from(areaSet));
  };

  const handlePincodeChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (value.length <= 6) {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "PINCode") {
      if (value.length < 6) {
        setErrors((prev) => ({ ...prev, PINCode: "Pincode must be 6 digits" }));
      } else if (!regex.pincode.test(value)) {
        setErrors((prev) => ({ ...prev, PINCode: "Invalid pincode" }));
      } else if (value.length === 6) {
        try {
          const result = await getPincodeDetails(value);
          console.log("Pincode API Response:", result);
          fetchLocationList(result);
        } catch {
          setErrors((prev) => ({
            ...prev,
            PINCode: "Failed to fetch pincode",
          }));
        }
      }
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
    const validationErrors = validateRegistration(formData as FormDataBase);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length === 0) {
      setLoading(true);
      try {
        const response = await registerApi(formData);
        console.log("Registration API Response:", response);
        if (response.success === true) {
          toast.success(
            `Welcome ${formData.name}!\nYour registration request has been submitted successfully. We will verify your clinic and notify you once it’s approved.
            Your User ID: ${response.data.user_id}
            Temporary Password: ${response.data.password}
            Please change your password after your first login.
            `
          );
          setTimeout(() => {
            navigate("/login");
          }, 5000);
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      } catch (err) {
        setErrors({ general: "Registration failed" });
        toast.error("Registration failed");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box className="bg-gray-100 min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl flex w-full max-w-6xl overflow-hidden">
        <div className="w-2/5 relative bg-blue-700 hidden md:flex items-center justify-center p-10">
          <img
            src={DrBgReg}
            alt="bg"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <img
            src={DocFaceMask}
            alt="doctor"
            className="relative rounded-lg shadow-lg z-10"
          />
        </div>

        <div className="w-full md:w-3/5 p-8 flex items-center justify-center">
          <Container>
            <Box
              component="form"
              onSubmit={handleSubmit}
              className="grid grid-cols-2 gap-4"
            >
              <Typography
                variant="h5"
                className="col-span-2 text-center font-bold text-blue-800 mb-2"
              >
                Register Your Clinic
              </Typography>

              <FormControl fullWidth>
                <TextField
                  placeholder="Clinic Name"
                  name="name"
                  size="small"
                  value={formData.name}
                  onChange={handleInputChange}
                  error={!!errors.name}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FaHospital className="text-gray-500" />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormHelperText error>{errors.name}</FormHelperText>
              </FormControl>

              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Mobile Number"
                  size="small"
                  value={formData.phone}
                  onChange={handleNumberChange}
                  error={!!errors.phone}
                  disabled={verified.mobile}
                  inputProps={{ maxLength: 10 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FaPhoneAlt className="text-gray-500" />
                      </InputAdornment>
                    ),
                  }}
                />
                {showOtp && !verified.mobile && (
                  <TextField
                    placeholder="Enter OTP"
                    size="small"
                    value={otpData.mobileOtp}
                    onChange={handleMobileOtpChange}
                    inputProps={{ maxLength: 6 }}
                    sx={{ width: "65%" }}
                  />
                )}
              </Box>

              <Box sx={{ display: "flex", gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Email Address"
                  type="email"
                  name="email"
                  size="small"
                  value={formData.email}
                  onChange={(e) => {
                    const { name, value } = e.target;
                    const cleanedValue = value.replace(/\s/g, ""); // remove all spaces
                    setFormData((prev) => ({ ...prev, [name]: cleanedValue }));
                    setErrors((prev) => ({ ...prev, [name]: "" }));
                  }}
                  onBlur={handleEmailBlur}
                  error={!!errors.email}
                  slotProps={{
                    input: {
                      onKeyDown: handleEmailKeyDown,
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdEmail className="text-gray-500" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                {showEmailOtp && !verified.email && (
                  <TextField
                    placeholder="Enter OTP"
                    size="small"
                    value={otpData.emailOtp}
                    onChange={handleEmailOtpChange}
                    inputProps={{ maxLength: 6 }}
                    sx={{ width: "65%" }}
                  />
                )}
              </Box>

              <TextField
                placeholder="Pincode"
                name="PINCode"
                size="small"
                value={formData.PINCode}
                onChange={handlePincodeChange}
                error={!!errors.PINCode}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MdLocationOn className="text-gray-500" />
                    </InputAdornment>
                  ),
                }}
              />
              <Autocomplete
                disabled={stateList.length === 0}
                options={stateList}
                value={formData.state || null}
                onChange={(e, val) =>
                  setFormData((p) => ({ ...p, state: val || "" }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="State"
                    size="small"
                    error={!!errors.district}
                  />
                )}
              />
              <Autocomplete
                disabled={districList.length === 0}
                options={districList}
                value={formData.district || null}
                onChange={(e, val) =>
                  setFormData((p) => ({ ...p, district: val || "" }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={!!errors.district}
                    placeholder="District"
                    size="small"
                  />
                )}
              />
              <Autocomplete
                disabled={areaList.length === 0}
                options={areaList}
                value={formData.area || null}
                onChange={(e, val) =>
                  setFormData((p) => ({ ...p, area: val || "" }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Area"
                    size="small"
                    error={!!errors.area}
                  />
                )}
              />
              <TextField
                placeholder="Address"
                name="address"
                size="small"
                value={formData.address}
                onChange={handleAddressChange}
                error={!!errors.address}
                multiline
                rows={3}
              />

              <div className="col-span-2 mt-2">
                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  sx={{ backgroundColor: "#0f46c9", color: "#fff" }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Register"
                  )}
                </Button>
              </div>

              <div className="text-center col-span-2 text-sm">
                <label>
                  Already have an account?
                  <Link
                    to="/login"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    Click Here to login
                  </Link>
                </label>
              </div>
            </Box>
          </Container>
        </div>
      </div>
    </Box>
  );
};

export default Registration;
