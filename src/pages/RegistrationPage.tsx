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
} from "@mui/material";
import { FaEye, FaEyeSlash } from "react-icons/fa";

import type {
  FormDataBase,
  ValidationErrors,
  LocationItem,
} from "../types/types";
import DocFaceMask from "../assets/blue-doctor-icon-png.png"
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
    password: "",
    confirmPassword: "",
    number: "",
  });
  const [districList, setDistricList] = useState<string[]>([]);
  const [stateList, setStateList] = useState<string[]>([]);
  const [areaList, setAreaList] = useState<string[]>([]);

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    const stateList: string[] = [];
    const districtList: string[] = [];
    const areaList: string[] = [];

    responseData.forEach((item) => {
      if (item?.State) stateList.push(item.State);
      if (item?.District) districtList.push(item.District);
      if (item?.Name) areaList.push(item.Name);
    });

    setStateList(stateList);
    setDistricList(districtList);
    setAreaList(areaList);
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
          // if (result && result[0]?.Status === "Success") {
          //   const offices = result[0]?.PostOffice || [];
          //   setPostOffices(offices);
          //   if (offices.length > 0) {
          //     handlePostOfficeSelect(offices[0].Name, offices[0]);
          //   }
          // } else if (result && result[0]?.Status === "Error") {
          //   setErrors((prev) => ({
          //     ...prev,
          //     PINCode: "Invalid or not found",
          //   }));
          // }
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
          // await sendOtp({ mobile: formData.phone, OtpType: OtpType.MOBILE_VERIFICATION });
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
  const validationErrors = validateRegistration(formData as FormDataBase);
  setErrors(validationErrors);

  if (Object.keys(validationErrors).length === 0) {
    setLoading(true);
    try {
      const response = await registerApi(formData);
      console.log("Registration API Response:", response);
      if (response.isRegistered==true) {
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
    <Box className="bg-blue-400 text-center flex min-h-screen">
            <div className="mt-2">
              <img className="max-w-4/6 ml-10" src={DocFaceMask}></img>
            </div>
       
      <div className="mt-10">
        <Container>
          {/* <Box>
            <Typography variant="h5" fontWeight="bold">
              REGISTER YOUR CLINIC
            </Typography>
          </Box> */}

          <Box 
          component="form" onSubmit={handleSubmit}>
            <TextField
              margin="dense"
              fullWidth
              placeholder="Clinic Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={!!errors.name}
              helperText={errors.name}
              sx={{
                "& .MuiInputBase-root": {
                  backgroundColor: "#E5E7EB",
                  border: "2px solid #9ca3af",
                  borderRadius: "0.5rem",
                },
                "& .MuiInputBase-input": {
                  fontSize: "12px",
                  fontWeight: 500,
                  height: "8px",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
              }}
            />

            <TextField
              margin="dense"
              value={formData.phone}
              inputMode="numeric"
              placeholder="Enter Mobile Number"
              onChange={handleNumberChange}
              error={!!errors.phone}
              helperText={errors.phone}
              fullWidth
              inputProps={{ maxLength: 10 }}
              sx={{
                "& .MuiInputBase-root": {
                  backgroundColor: "#E5E7EB",
                  border: "2px solid #9ca3af",
                  borderRadius: "0.5rem",
                },
                "& .MuiInputBase-input": {
                  fontSize: "12px",
                  fontWeight: 500,
                  height: "8px",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
              }}
            />

            {showOtp && (
              <Otpverification type="MOBILE" identifier={formData.phone} />
            )}

            <TextField
              margin="dense"
              fullWidth
              placeholder="Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleEmailChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={{
                "& .MuiInputBase-root": {
                  backgroundColor: "#E5E7EB",
                  border: "2px solid #9ca3af",
                  borderRadius: "0.5rem",
                },
                "& .MuiInputBase-input": {
                  fontSize: "12px",
                  fontWeight: 500,
                  height: "8px",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                  marginBottom: "0px",
                },
              }}
            />

            {showEmailOtp && (
              <Otpverification identifier={formData.email} type="EMAIL" />
            )}
            <div className="flex justify-between">
              <TextField
                margin="dense"
                placeholder="Pincode"
                name="PINCode"
                onChange={handlePincodeChange}
                value={formData.PINCode}
                error={!!errors.PINCode}
                helperText={errors.PINCode}
                sx={{
                  "& .MuiInputBase-root": {
                    backgroundColor: "#E5E7EB",
                    border: "2px solid #9ca3af",
                    borderRadius: "0.5rem",
                    margin: "none",
                    width: "200px",
                  },
                  "& .MuiInputBase-input": {
                    fontSize: "12px",
                    fontWeight: 500,
                    height: "8px",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    border: "none",
                  },
                }}
              />
              <Autocomplete
                disabled={areaList.length === 0}
                options={areaList}
                value={formData.area || null}
                onChange={(e, newValue) =>
                  setFormData((prev) => ({ ...prev, area: newValue || "" }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    placeholder="Area"
                    name="area"
                    error={!!errors.area}
                    helperText={errors.area}
                    sx={{
                      "& .MuiInputBase-root": {
                        backgroundColor: "#E5E7EB",
                        border: "2px solid #9ca3af",
                        borderRadius: "0.5rem",
                        width: "220px",
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "12px",
                        fontWeight: 500,
                        height: "8px",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                    }}
                  />
                )}
              />
            </div>

            <div className="flex justify-between">
              <Autocomplete
                disabled={districList.length === 0}
                options={districList}
                value={formData.district || null}
                onChange={(e, newValue) =>
                  setFormData((prev) => ({ ...prev, district: newValue || "" }))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    margin="dense"
                    fullWidth
                    placeholder="District"
                    name="district"
                    error={!!errors.district}
                    helperText={errors.district}
                    sx={{
                      "& .MuiInputBase-root": {
                        backgroundColor: "#E5E7EB",
                        border: "2px solid #9ca3af",
                        borderRadius: "0.5rem",
                        width:200
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "12px",
                        fontWeight: 500,
                        height: "8px",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                    }}
                  />
                )}
              />

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
                    fullWidth
                    margin="dense"
                    placeholder="State"
                    name="state"
                    error={!!errors.state}
                    helperText={errors.state}
                    sx={{
                      "& .MuiInputBase-root": {
                        backgroundColor: "#E5E7EB",
                        border: "2px solid #9ca3af",
                        borderRadius: "0.5rem",
                        width:"220px"
                      },
                      "& .MuiInputBase-input": {
                        fontSize: "12px",
                        fontWeight: 500,
                        height: "8px",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        border: "none",
                      },
                    }}
                  />
                )}
              />
            </div>
            <TextField
              margin="dense"
              fullWidth
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              error={!!errors.password}
              helperText={errors.password}
              sx={{
                "& .MuiInputBase-root": {
                  backgroundColor: "#E5E7EB",
                  border: "2px solid #9ca3af",
                  borderRadius: "0.5rem",
                },
                "& .MuiInputBase-input": {
                  fontSize: "12px",
                  fontWeight: 500,
                  height: "8px",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "#fff" }}
                    >
                      {showPassword ? <FaEye /> : <FaEyeSlash />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              fullWidth
              margin="dense"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              sx={{
                "& .MuiInputBase-root": {
                  backgroundColor: "#E5E7EB",
                  border: "2px solid #9ca3af",
                  borderRadius: "0.5rem",
                },
                "& .MuiInputBase-input": {
                  fontSize: "12px",
                  fontWeight: 500,
                  height: "8px",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  border: "none",
                },
              }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      edge="end"
                      sx={{ color: "#fff" }}
                    >
                      {showConfirmPassword ? <FaEye /> : <FaEyeSlash />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Autocomplete
              fullWidth
              options={["Clinic", "Single Doctor", "Admin"]}
              value={formData.type || null}
              onChange={(event, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  type: newValue || "",
                }));
                setErrors((prev) => ({ ...prev, type: "" }));
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  margin="dense"
                  placeholder="Select User Type"
                  error={!!errors.type}
                  helperText={errors.type}
                  name="type"
                  sx={{
                    "& .MuiInputBase-root": {
                      backgroundColor: "#E5E7EB",
                      border: "2px solid #9ca3af",
                      borderRadius: "0.5rem",
                    },
                    "& .MuiInputBase-input": {
                      fontSize: "12px",
                      fontWeight: 500,
                      height: "8px",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      border: "none",
                    },
                  }}
                />
              )}
            />

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                bgcolor: "green",
                color:"black",
              }}
            >
              {loading ? "Registering..." : "Register"}
            </Button>
            {errors.general && (
              <Typography color="error" align="center">
                {errors.general}
              </Typography>
            )}
          </Box>
        </Container>
      </div>
    </Box>
  );
};

export default Registration;
