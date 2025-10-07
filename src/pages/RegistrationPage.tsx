import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  InputAdornment,
  IconButton,
  Autocomplete,
  FormControl,
  FormHelperText,
  Dialog,
  DialogContent,
  DialogTitle,
  CircularProgress,
} from "@mui/material";
import { MdEmail, MdLocationOn } from "react-icons/md";
import { FaHospital, FaPhoneAlt } from "react-icons/fa";

import type {
  FormDataBase,
  ValidationErrors,
  LocationItem,
} from "../types/types";
import DocFaceMask from "../assets/DocStaff2.png";
import DrBgReg from "../assets/DrBgReg.png";
import Regex, { regex } from "../helper/Regex";
import { validateRegistration } from "../helper/ErrorHandler";
import { getPincodeDetails } from "../api/ServiceApi";
import { registerApi } from "../api";
import { useNavigate, Link } from "react-router-dom";
import OtpVerification from "../components/common/OtpVerification";
import { toast } from "react-toastify";

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
  const [districList, setDistricList] = useState<string[]>([]);
  const [stateList, setStateList] = useState<string[]>([]);
  const [areaList, setAreaList] = useState<string[]>([]);

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);

  const [showOtp, setShowOtp] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);

  const navigate = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "name") {
      let error = "";
      if (!value.trim()) {
        error = "Name is required";
      } else if (value.length < 5) {
        error = "Name must be at least 5 characters long";
      } else if (!Regex.name.test(value)) {
        error = "Cannot enter numbers or special characters";
      }
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

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setFormData((prev) => ({ ...prev, phone: value }));
    }
  };

  useEffect(() => {
    const handleOtpFlow = async () => {
      if (formData.phone.length === 10) {
        if (!Regex.MOBILEREGEX.test(formData.phone)) {
          setErrors({ phone: "Number should start with 6,7,8,9" });
          return;
        }
        try {
          setShowOtp(true);
          console.log("Pretend sending OTP to:", formData.phone);
          setErrors({});
        } catch (error) {
          console.error("Send OTP failed:", error);
          setErrors({ phone: "Failed to send OTP. Try again." });
        }
      } else if (formData.phone.length > 0 && formData.phone.length < 10) {
        setShowOtp(false);
        setErrors({ phone: "Invalid number" });
      } else {
        setShowOtp(false);
        setErrors({});
      }
    };

    handleOtpFlow();
  }, [formData.phone]);

  const handleEmailBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value } = e.target;
    const trimmedValue = value.trim(); // Remove leading/trailing spaces

    if (Regex.email.test(trimmedValue)) {
      setShowEmailOtp(true);
      setErrors((prev) => ({ ...prev, email: "" })); // Clear any previous error
      console.log("Pretend sending OTP to email:", trimmedValue);
    } else if (trimmedValue.length > 0) {
      setErrors((prev) => ({ ...prev, email: "Invalid email address" }));
      setShowEmailOtp(false);
    } else {
      setShowEmailOtp(false);
      setErrors((prev) => ({ ...prev, email: "" })); 
    }
  };

  const handleEmailKeyDown = (
  e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
) => {
  if (e.key === " " && (e.currentTarget.selectionStart === 0 || e.currentTarget.value.length === 0)) {
    e.preventDefault();
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
        if (response.isRegistered === true) {
          toast.success(
            `Welcome ${formData.name}!\nYour registration request has been submitted successfully. We will verify your clinic and notify you once it’s approved.`
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
        <div className="w-2/5 relative bg-blue-700 items-center justify-center hidden md:flex p-10">
          <img
            src={DrBgReg}
            alt="Medical Icons Background"
            className="absolute inset-0 w-full h-full object-cover opacity-50 z-0"
          />
          <img
            src={DocFaceMask}
            alt="Doctor with Mask"
            className="relative  rounded-lg shadow-lg z-10"
          />
        </div>
        <div className="w-full md:w-3/5 p-8 flex items-center justify-center">
          <Container>
            <Box
              component="form"
              onSubmit={handleSubmit}
              className="grid grid-cols-2 gap-4"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  fontFamily: "'Playfair Display', serif",
                  marginBottom: "10px",
                }}
                className="col-span-2 text-center font-bold text-blue-800"
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
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaHospital className="text-gray-500" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "0.75rem" },
                  }}
                />
                <FormHelperText
                  error={!!errors.name}
                  className="h-[20px] text-xs"
                >
                  {errors.name || ""}
                </FormHelperText>
              </FormControl>

              <FormControl fullWidth>
                <TextField
                  placeholder="Mobile Number"
                  size="small"
                  value={formData.phone}
                  onChange={handleNumberChange}
                  error={!!errors.phone}
                  inputProps={{ maxLength: 10 }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaPhoneAlt className="text-gray-500" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "0.75rem" },
                  }}
                />
                <FormHelperText
                  error={!!errors.phone}
                  className="h-[20px] text-xs"
                >
                  {errors.phone || ""}
                </FormHelperText>
              </FormControl>

              <Dialog
                open={showOtp}
                onClose={() => setShowOtp(false)}
                maxWidth="xs"
                fullWidth
              >
                <DialogTitle className="flex justify-between items-center">
                  Enter OTP
                  <IconButton onClick={() => setShowOtp(false)} />
                </DialogTitle>

                <DialogContent>
                  <OtpVerification
                    type="MOBILE"
                    identifier={formData.phone}
                    onVerified={() => {
                      setShowOtp(false);
                    }}
                    onFailed={() => {
                      setShowOtp(false);
                    }}
                  />
                </DialogContent>
              </Dialog>

              <FormControl fullWidth>
                <TextField
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
                  sx={{"& .MuiOutlinedInput-root": {
                      borderRadius: "0.75rem",},}}
                />
                <FormHelperText
                  error={!!errors.email}
                  className="h-[20px] text-xs"
                >
                  {errors.email || ""}
                </FormHelperText>
              </FormControl>

              <Dialog
                open={showEmailOtp}
                onClose={() => setShowEmailOtp(false)}
                maxWidth="xs"
                fullWidth
              >
                <DialogTitle className="flex justify-between items-center">
                  Enter OTP
                  <IconButton onClick={() => setShowEmailOtp(false)} />
                </DialogTitle>

                <DialogContent>
                  <OtpVerification
                    type="EMAIL"
                    identifier={formData.email}
                    onVerified={() => {
                      setShowEmailOtp(false);
                      toast.success("Email OTP verified successfully!");
                    }}
                    onFailed={(error: string) => {
                      toast.error(error);
                    }}
                  />
                </DialogContent>
              </Dialog>

              <FormControl fullWidth>
                <TextField
                  placeholder="Pincode"
                  name="PINCode"
                  value={formData.PINCode}
                  size="small"
                  onChange={handlePincodeChange}
                  error={!!errors.PINCode}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "0.75rem" },
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdLocationOn className="text-gray-500" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <FormHelperText
                  error={!!errors.PINCode}
                  className="h-[20px] text-xs"
                >
                  {errors.PINCode || ""}
                </FormHelperText>
              </FormControl>
              <FormControl fullWidth>
                <Autocomplete
                  disabled={stateList.length === 0}
                  options={stateList}
                  value={formData.state || null}
                  onChange={(e, newValue) =>
                    setFormData((prev) => ({ ...prev, state: newValue || "" }))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="State"
                      error={!!errors.state}
                      size="small"
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "0.75rem" },
                      }}
                    />
                  )}
                />
                <FormHelperText
                  error={!!errors.state}
                  className="h-[20px] text-xs"
                >
                  {errors.state || ""}
                </FormHelperText>
              </FormControl>

              <FormControl fullWidth>
                <Autocomplete
                  disabled={districList.length === 0}
                  options={districList}
                  size="small"
                  value={formData.district || null}
                  onChange={(e, newValue) =>
                    setFormData((prev) => ({
                      ...prev,
                      district: newValue || "",
                    }))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="District"
                      error={!!errors.district}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "0.75rem" },
                      }}
                    />
                  )}
                />
                <FormHelperText
                  error={!!errors.district}
                  className="h-[20px] text-xs"
                >
                  {errors.district || ""}
                </FormHelperText>
              </FormControl>

              <FormControl fullWidth>
                <Autocomplete
                  disabled={areaList.length === 0}
                  options={areaList}
                  size="small"
                  value={formData.area || null}
                  onChange={(e, newValue) =>
                    setFormData((prev) => ({ ...prev, area: newValue || "" }))
                  }
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder="Area"
                      error={!!errors.area}
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "0.75rem" },
                      }}
                    />
                  )}
                />
                <FormHelperText
                  error={!!errors.area}
                  className="h-[20px] text-xs"
                >
                  {errors.area || ""}
                </FormHelperText>
              </FormControl>

              <FormControl fullWidth>
                <TextField
                  placeholder="Address"
                  name="address"
                  size="small"
                  value={formData.address}
                  onChange={handleAddressChange}
                  error={!!errors.address}
                  multiline
                  rows={3}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "0.75rem" },
                  }}
                />
                <FormHelperText
                  error={!!errors.address}
                  className="h-[20px] text-xs"
                >
                  {errors.address || ""}
                </FormHelperText>
              </FormControl>

              <div className="col-span-2 mt-2">
                <Button
                  type="submit"
                  fullWidth
                  disabled={loading}
                  sx={{ backgroundColor: "#0f46c9", color: "#fff" }}
                  className="bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl py-2 transition"
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
                    className="text-blue-600 hover:underline cursor-pointer ml-1"
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
