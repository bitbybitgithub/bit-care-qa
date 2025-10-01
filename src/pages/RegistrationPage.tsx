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
import Regex, { regex } from "../context/Regex";
import Otpverification from "../components/forms/Otpverification";
import { validateRegistration } from "../Helper/ErrorHandler";
import { getPincodeDetails } from "../api/ServiceApi";
import { registerApi } from "../api/formApi";
import { useNavigate } from "react-router-dom";

const Registration = () => {
  const [formData, setFormData] = useState<FormDataBase>({
    name: "",
    email: "",
    phone: "",
    type: "",
    address: "",
    strNumber: "B3",
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
    setFormData({ ...formData, [name]: value });
    setErrors((prev) => ({ ...prev, [name]: "" }));
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

    setFormData((prev) => ({ ...prev, [name]: value }));
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
        setShowOtp(true);
        if (!Regex.MOBILEREGEX.test(formData.phone)) {
          setErrors({ phone: "Number should start with 6,7,8,9" });
          return;
        }

        try {
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

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "email") {
      if (Regex.email.test(value)) {
        setShowEmailOtp(true);
        console.log("Pretend sending OTP to email:", value);
      } else if (value.length > 0) {
        setErrors((prev) => ({ ...prev, email: "Invalid email address" }));
        setShowEmailOtp(false);
      } else {
        setShowEmailOtp(false);
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
        if (response.isRegistered == true) {
          alert("Registration Successful");
          navigate("/login");
        } else {
          alert("Something Went Wrong");
        }
      } catch (err: any) {
        setErrors({ general: err.message || "Registration failed" });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Box className="bg-gray-100 min-h-screen flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl flex w-full max-w-6xl overflow-hidden">
        {/* Left Image Section */}
        <div className="w-2/5 relative bg-blue-700 flex items-center justify-center hidden md:flex p-10">
          <img
            src={DrBgReg} // the background image with scattered icons
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

              {/* {showOtp && <Otpverification type="MOBILE" identifier={formData.phone} />} */}
              <Dialog
                open={showOtp} // Control visibility
                onClose={() => setShowOtp(false)}
                maxWidth="xs"
                fullWidth
              >
                <DialogTitle className="flex justify-between items-center">
                  Enter OTP
                  <IconButton onClick={() => setShowOtp(false)}>
                    {/* <FaTimes /> */}
                  </IconButton>
                </DialogTitle>

                <DialogContent>
                  <Otpverification type="MOBILE" identifier={formData.phone} />
                </DialogContent>
              </Dialog>

              {/* Email */}
              <FormControl fullWidth>
                <TextField
                  placeholder="Email Address"
                  type="email"
                  name="email"
                  size="small"
                  value={formData.email}
                  onChange={handleEmailChange}
                  error={!!errors.email}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <MdEmail className="text-gray-500" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "0.75rem" },
                  }}
                />
                <FormHelperText
                  error={!!errors.email}
                  className="h-[20px] text-xs"
                >
                  {errors.email || ""}
                </FormHelperText>
              </FormControl>

              {/* {showEmailOtp && <Otpverification identifier={formData.email} type="EMAIL" />} */}
              <Dialog
                open={showEmailOtp}
                onClose={() => setShowEmailOtp(false)}
                maxWidth="xs"
                fullWidth
              >
                <DialogTitle className="flex justify-between items-center">
                  Enter OTP
                  <IconButton onClick={() => setShowEmailOtp(false)}>
                    {/* <FaTimes /> */}
                  </IconButton>
                </DialogTitle>

                <DialogContent>
                  <Otpverification type="EMAIL" identifier={formData.email} />
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
                  onChange={handleInputChange}
                  error={!!errors.address}
                  multiline
                  rows={3}
                  sx={{
                    "& .MuiOutlinedInput-root": { borderRadius: "0.75rem" },
                  }}
                />
                <FormHelperText
                  error={!!errors.address}
                  className="h-[20px] 
                text-xs"
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
                  {loading ? "Registering..." : "Register"}
                </Button>
              </div>
              {errors.general && (
                <Typography color="error" align="center" className="col-span-2">
                  {errors.general}
                </Typography>
              )}
            </Box>
          </Container>
        </div>
      </div>
    </Box>
  );
};

export default Registration;
