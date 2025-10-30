import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  InputAdornment,
  Autocomplete,
  FormControl,
  FormHelperText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { MdEmail, MdLocationOn } from "react-icons/md";
import { FaHospital, FaPhoneAlt } from "react-icons/fa";
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";
import Regex from "../../Helper/Regex";
import { getPincodeDetails, registerApi } from "../../api";
import { validateRegistration } from "../../Helper/ErrorHandler";
import type { FormDataBase, LocationItem, ValidationErrors } from "../../types/types";

const RegistrationForm = () => {
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
   const [openPopup, setOpenPopup] = useState(false);
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
    if (value.length === 1 && /^[0-5]/.test(value)) return;
    if (value.length <= 10) setFormData((prev) => ({ ...prev, phone: value }));
  };

  // 🔹 Clear state/district errors automatically if autofilled
  useEffect(() => {
    if (formData.state && formData.district) {
      setErrors((prev) => ({ ...prev, state: "", district: "" }));
    }
  }, [formData.state, formData.district]);

  // 🔹 Handle mobile OTP
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
    if (value.length <= 6)
      setOtpData((prev) => ({ ...prev, mobileOtp: value }));
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
    if (value.length <= 6) setOtpData((prev) => ({ ...prev, emailOtp: value }));
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

  // 🔹 Handle Pincode Autofetch
  const handlePincodeChange = async (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (value.length <= 6) {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        state: "",
        district: "",
        area: "",
      }));
      setStateList([]);
      setDistricList([]);
      setAreaList([]);
    }

    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "PINCode") {
      if (value.length < 6) {
        setErrors((prev) => ({ ...prev, PINCode: "Pincode must be 6 digits" }));
        return;
      }

      if (!Regex.pincode.test(value)) {
        setErrors((prev) => ({ ...prev, PINCode: "Invalid pincode" }));
        return;
      }

      if (value.length === 6) {
        try {
          const result = await getPincodeDetails(value);
          console.log("Pincode API Response:", result);
          if (result.length > 0) {
            const first = result[0];
            setFormData((prev) => ({
              ...prev,
              state: first.State || "",
              district: first.District || "",
            }));

            // ✅ Clear state & district errors after autofetch
            setErrors((prev) => ({
              ...prev,
              state: "",
              district: "",
            }));

            fetchLocationList(result);
          } else {
            setErrors((prev) => ({
              ...prev,
              PINCode: "No records found for this pincode",
            }));
            setStateList([]);
            setDistricList([]);
            setAreaList([]);
          }
        } catch {
          setErrors((prev) => ({
            ...prev,
            PINCode: "Failed to fetch pincode details",
          }));
        }
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
        if (response.success === true) {
 setOpenPopup(true);
        //   setTimeout(() => navigate("/login"), 10000);
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      } catch {
        setErrors({ general: "Registration failed" });
        toast.error("Registration failed");
      } finally {
        setLoading(false);
      }
    }
    
  };
   const handlePopupClose = () => {
    setOpenPopup(false);
    navigate("/login");
  };

  return (
    <div className="bg-[var(--color-bg)] rounded-2xl shadow-2xl p-5">
      <div className="gap-2 p-2 text-center ">
        <h1
          className="text-[var(--color-primary)] font-[var(--font-weight-semibold)]"
          style={{ fontSize: "var(--font-h2)" }}
        >
          Create Account
        </h1>
        <h3 className="text-[var(--color-text)] mb-4">
          Register your clinic below
        </h3>
      </div>

      <form
        onSubmit={handleSubmit}
        className="h-[70vh] grid md:grid-cols-2 gap-4 "
      >
        {/* Clinic Name */}
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
                    <FaHospital className="text-[var(--color-text)]" />
                  </InputAdornment>
                ),
                inputProps: { maxLength: 30 },
              },
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <FormHelperText error>{errors.name}</FormHelperText>
        </FormControl>

        {/* Mobile + OTP */}
        <div className="flex gap-2 items-start">
          <FormControl fullWidth>
            <TextField
              fullWidth
              placeholder="Mobile Number"
              size="small"
              value={formData.phone}
              onChange={handleNumberChange}
              error={!!errors.phone}
              disabled={verified.mobile}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaPhoneAlt className="text-[var(--color-text)]" />
                    </InputAdornment>
                  ),
                  inputProps: { maxLength: 10 },
                },
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <FormHelperText error>{errors.phone}</FormHelperText>
          </FormControl>

          {showOtp && !verified.mobile && (
            <TextField
              placeholder="Enter OTP"
              size="small"
              value={otpData.mobileOtp}
              onChange={handleMobileOtpChange}
              inputProps={{ maxLength: 6 }}
              sx={{
                width: "65%",
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
          )}
        </div>

        {/* Email + OTP */}
        <div className="flex gap-2">
          <FormControl>
            <TextField
              fullWidth
              placeholder="Email Address"
              type="email"
              name="email"
              size="small"
              value={formData.email}
              onChange={(e) => {
                const { name, value } = e.target;
                const cleanedValue = value.replace(/\s/g, "");
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
                      <MdEmail className="text-[var(--color-text)]" />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
            />
            <FormHelperText error>{errors.email}</FormHelperText>
          </FormControl>

          {showEmailOtp && !verified.email && (
            <TextField
              placeholder="Enter OTP"
              size="small"
              value={otpData.emailOtp}
              onChange={handleEmailOtpChange}
              inputProps={{ maxLength: 6 }}
              sx={{
                width: "65%",
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />
          )}
        </div>

        {/* Pincode */}
        <FormControl>
          <TextField
            placeholder="Pincode"
            name="PINCode"
            size="small"
            value={formData.PINCode}
            onChange={handlePincodeChange}
            error={!!errors.PINCode}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <MdLocationOn className="text-[var(--color-text)]" />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <FormHelperText error>{errors.PINCode}</FormHelperText>
        </FormControl>

        {/* State */}
        <FormControl>
          <Autocomplete
            disabled
            options={stateList}
            value={formData.state || null}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="State"
                size="small"
                error={!!errors.state}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    ...(errors.state && {
                      "& fieldset": { borderColor: "#d32f2f !important" },
                    }),
                  },
                }}
              />
            )}
          />
          <FormHelperText error>{errors.state}</FormHelperText>
        </FormControl>

        {/* District */}
        <FormControl>
          <Autocomplete
            disabled
            options={districList}
            value={formData.district || null}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder="District"
                size="small"
                error={!!errors.district}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    ...(errors.district && {
                      "& fieldset": { borderColor: "#d32f2f !important" },
                    }),
                  },
                }}
              />
            )}
          />
          <FormHelperText error>{errors.district}</FormHelperText>
        </FormControl>

        {/* Area */}
        <FormControl fullWidth>
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
                helperText={errors.area || ""}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    ...(errors.area && {
                      "& fieldset": { borderColor: "#d32f2f !important" },
                    }),
                  },
                }}
              />
            )}
          />
        </FormControl>

        {/* Address */}
        <FormControl>
          <TextField
            placeholder="Address"
            name="address"
            size="small"
            value={formData.address}
            onChange={handleAddressChange}
            error={!!errors.address}
            multiline
            rows={3}
            sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
          />
          <FormHelperText error>{errors.address}</FormHelperText>
        </FormControl>

        {/* Submit Button */}
        <div className="col-span-2 ">
          <Button
            type="submit"
            fullWidth
            disabled={loading}
            sx={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-bg)",
              "&:hover": { backgroundColor: "var(--color-primary)" },
            }}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Register"
            )}
          </Button>
        </div>

        {/* Already Registered */}
        <div className="text-center col-span-2 text-sm">
          <label>
            Already have an account?
            <Link
              to="/login"
              className="text-[var(--color-primary)] hover:underline ml-1"
            >
              Click Here to login
            </Link>
          </label>
        </div>
      </form>
       <Dialog
        open={openPopup}
        onClose={handlePopupClose}
        fullWidth
        maxWidth="xs"
        sx={{
          "& .MuiPaper-root": { borderRadius: 3, textAlign: "start", padding: 2 },
        }}
      >
        <DialogTitle>Welcome {formData.name}!</DialogTitle>
        <DialogContent>
          Your registration request has been submitted successfully.
          <br />
          Your credentials have been sent to your registered email.
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center" }}>
          <Button
            onClick={handlePopupClose}
            sx={{
              backgroundColor: "var(--color-primary)",
              color: "#fff",
              px: 4,
              borderRadius: 2,
              "&:hover": { backgroundColor: "var(--color-primary-dark)" },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default RegistrationForm;
