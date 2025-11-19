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
import type {
  FormDataBase,
  LocationItem,
  ValidationErrors,
} from "../../types/types";
import { generateOtpApi } from "../../api/GenerateOtpApi";
import { verifyOtpApi } from "../../api/VerifyOtpApi";

const RegistrationForm = () => {
  const [formData, setFormData] = useState<FormDataBase>({
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
  });

  const [otpData, setOtpData] = useState({ mobileOtp: "", emailOtp: "" });
  const [verified, setVerified] = useState({ mobile: false, email: false });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [showEmailOtp, setShowEmailOtp] = useState(false);
  const [districList, setDistricList] = useState<string[]>([]);
  const [stateList, setStateList] = useState<string[]>([]);
  const [areaList, setAreaList] = useState<string[]>([]);
  const [openPopup, setOpenPopup] = useState(false);
  const navigate = useNavigate();
  const RESEND_COOLDOWN = 30000;
  const [lastSentAt, setLastSentAt] = useState<{
    mobile?: number;
    email?: number;
  }>({});


  // --- common send OTP (improved for email payload fallbacks + logging) ---
  type SendOtpArgs = { mobileNumber?: string; email?: string; otpType: 1 | 2 };

  const handleSendOtp = async ({
    mobileNumber,
    email,
    otpType,
  }: SendOtpArgs) => {
    try {
      if (otpType === 2 && !mobileNumber) {
        toast.error("Mobile number not available.");
        return;
      }
      if (otpType === 1 && !email) {
        toast.error("Email not available.");
        return;
      }

      // build primary payload for each type
      const primaryPayload =
        otpType === 2
          ? { mobile_number: mobileNumber, otp_type: otpType }
          : { email: email, otp_type: otpType };

      console.log("Sending OTP payload (primary):", primaryPayload);
      let res = await generateOtpApi(primaryPayload);

      // If email OTP and primary failed, try common alternative key(s)
      if (otpType === 1 && (!res || !res.success)) {
        // try alternate payload keys which some backends expect
        const alternates = [
          { email_address: email, otp_type: otpType },
          { user_email: email, otp_type: otpType },
        ];
        for (const alt of alternates) {
          console.log("Trying alternate OTP payload:", alt);
          // call API again with the alt payload
          // eslint-disable-next-line no-await-in-loop
          const altRes = await generateOtpApi(alt);
          if (altRes && altRes.success) {
            res = altRes;
            break;
          } else {
            // keep last response for logging
            res = altRes || res;
          }
        }
      }
      console.log("generateOtpApi response:", res);
      if (!res) {
        toast.error("No response from OTP API.");
        return;
      }

      if (res.success) {
        toast.success(
          otpType === 2 ? "OTP sent to mobile." : "OTP sent to email."
        );

        // persist returned userId if provided
        if (res.userId) {
          setFormData((prev) => ({
            ...prev,
            userId: Number(res.userId) || prev.userId,
          }));
        }

        // show OTP input & record timestamp (if you use lastSentAt)
        if (otpType === 2) {
          setShowOtp(true);
          setLastSentAt((s) => ({ ...s, mobile: Date.now() }));
        } else {
          setShowEmailOtp(true);
          setLastSentAt((s) => ({ ...s, email: Date.now() }));
        }
      } else {
        // helpful error message for debugging
        const serverMsg = res.message || res.error || JSON.stringify(res);
        toast.error(serverMsg || "Failed to send OTP. Check console/network.");
        console.error("OTP send failed response:", res);
      }
    } catch (err: any) {
      console.error("generateOtpApi error:", err);
      toast.error("Error sending OTP. See console for details.");
    }
  };

  type VerifyArgs = {
    otpValue: string;
    otpType: 1 | 2;
    channel: "email" | "mobile";
  };

  const handleVerifyOtp = async ({
    otpValue,
    otpType,
    channel,
  }: VerifyArgs) => {
    try {
      const payload = {
        userId: formData.userId,
        otp: Number(otpValue),
        otp_type: otpType,
      };
      console.log("payload is : ", payload);
      const res = await verifyOtpApi(payload);

      if (res.success) {
        toast.success("OTP verified");

        if (channel === "mobile") {
          setVerified((p) => ({ ...p, mobile: true }));
          setShowOtp(false);
          setOtpData((p) => ({ ...p, mobileOtp: "" }));
        } else {
          setVerified((p) => ({ ...p, email: true }));
          setShowEmailOtp(false);
          setOtpData((p) => ({ ...p, emailOtp: "" }));
        }
      } else {
        toast.error(res.message || "Invalid OTP");
      }
    } catch {
      toast.error("OTP verification failed");
    }
  };

  const handleMobileOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) setOtpData((p) => ({ ...p, mobileOtp: value }));
    if (value.length === 6) {
      handleVerifyOtp({ otpValue: value, otpType: 2, channel: "mobile" });
    }
  };

  const handleEmailOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 6) setOtpData((p) => ({ ...p, emailOtp: value }));
    if (value.length === 6) {
      handleVerifyOtp({ otpValue: value, otpType: 1, channel: "email" });
    }
  };

  useEffect(() => {
    if (formData.phone.length === 10 && !verified.mobile) {
      if (!Regex.MOBILEREGEX.test(formData.phone)) {
        setErrors({ phone: "Number should start with 6,7,8,9" });
        return;
      }

      if (Date.now() - (lastSentAt.mobile || 0) >= RESEND_COOLDOWN) {
        handleSendOtp({ mobileNumber: formData.phone, otpType: 2 });
      } else {
        setShowOtp(true);
      }
    }
  }, [formData.phone]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "name") {
      let error = "";
      if (!value.trim()) {
        error = "Clinic name is required";
      } else if (value.trim().length < 5) {
        error = "Clinic name must be at least 5 characters long";
      } else if (value.trim().length > 50) {
        error = "Clinic name cannot exceed 50 characters";
      } else if (!Regex.name.test(value.trim())) {
        error = "Only alphabets and spaces are allowed";
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

  const EmailRegex =
    /^[a-zA-Z0-9._%+-]+@(?:gmail|outlook|hotmail|yahoo|live|icloud|protonmail|zoho|gmx|aol|yandex|[a-zA-Z0-9-]+)\.(?:com|in|co|net|org|edu|gov|io|me|tech|info|biz|us|uk|ca|au|de|fr|co\.in|co\.uk|[a-z]{2,})$/;

  const handleEmailBlur = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { value } = e.target;
    const cleanedValue = value.trim().replace(/\s/g, "");
    setFormData((prev) => ({ ...prev, email: cleanedValue }));
    setErrors((prev) => ({ ...prev, email: "" }));

    if (!cleanedValue) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
      setShowEmailOtp(false);
      return;
    }

    if (!EmailRegex.test(cleanedValue)) {
      setErrors((prev) => ({
        ...prev,
        email: "Please enter a valid email address (e.g., user@gmail.com)",
      }));
      setShowEmailOtp(false);
      return;
    }

    // ✅ Valid email — actually call handleSendOtp (email otp_type = 1)
    // this will attempt primary and fallback payloads and log responses
    handleSendOtp({ email: cleanedValue, otpType: 1 });
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

  if (Object.keys(validationErrors).length !== 0) return;

  setLoading(true);

  try {
    let response = await registerApi(formData);
    console.log("Original Axios Response:", response);

    // ⭐ IMPORTANT: Normalize axios response to your expected shape
    // so that response.success === data.success
    response = {
      success: response?.success,
      message: response?.message,
      data: response?.data,
      error: response?.error,
      errors: response?.errors,
    };

    console.log("Normalized Response:", response);

    // ⭐ SUCCESS CASE → open popup ONLY (no toast)
    if (response.success === true) {
      setOpenPopup(true);
      return;
    }

    // ⭐ FAILURE CASE → Map server error(s)
    const errMsg =
      response.message ||
      response.data?.message ||
      response.error ||
      (response.errors && Object.values(response.errors).join("\n")) ||
      "Something went wrong. Please try again.";

    toast.error(errMsg);

  } catch (error: any) {
    console.error("Registration API Error:", error);

    const errResp = error?.response?.data;

    const errMsg =
      errResp?.message ||
      errResp?.data?.message ||
      errResp?.error ||
      (errResp?.errors && Object.values(errResp.errors).join("\n")) ||
      error.message ||
      "Registration failed.";

    toast.error(errMsg);

  } finally {
    setLoading(false);
  }
};

  const handlePopupClose = () => {
    setOpenPopup(false);
    navigate("/login");
  };

  const FieldErrorText = ({ error }: { error?: string }) => (
    <FormHelperText
      error={!!error}
      sx={{
        minHeight: "20px",
        visibility: error ? "visible" : "hidden",
      }}
    >
      {error}
    </FormHelperText>
  );

  return (
    <div className="bg-[var(--color-bg)] rounded-2xl shadow-2xl p-5">
      <div className="gap-2 p-2 text-center ">
        <h1
          className="text-[var(--color-primary)] font-[var(--font-weight-semibold)]"
          style={{ fontSize: "var(--font-h2)" }}
        >
          Create Account
        </h1>
        <h3 className="text-[var(--color-text)] ">
          Register your clinic below
        </h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className=" grid md:grid-cols-2  gap-2 md:gap-5 my-4">
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
            <FieldErrorText error={errors.name} />
          </FormControl>

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
                sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
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
              />
              <FieldErrorText error={errors.phone} />
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

          <div className="flex gap-2">
            <FormControl fullWidth>
              <TextField
                fullWidth
                placeholder="Email Address"
                type="email"
                name="email"
                size="small"
                value={formData.email}
                disabled={verified.email}
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
              <FieldErrorText error={errors.email} />
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
            <FieldErrorText error={errors.PINCode} />
          </FormControl>

          <FormControl>
            <Autocomplete
              readOnly
              open={false}
              popupIcon={null}
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
            <FieldErrorText error={errors.state} />
          </FormControl>

          <FormControl>
            <Autocomplete
              readOnly
              open={false}
              popupIcon={null}
              options={stateList}
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
            <FieldErrorText error={errors.district} />
          </FormControl>

          <FormControl fullWidth>
            <FormControl fullWidth>
              <Autocomplete
                readOnly={areaList.length === 0}
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
              <FieldErrorText error={errors.area} />
            </FormControl>
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
              slotProps={{
                input: {
                  inputProps: { maxLength: 70 },
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": { borderRadius: 2 },
              }}
            />

            {/* Address has its own special case */}
            <FormHelperText
              error={!!errors.address}
              sx={{
                minHeight: "20px",
                visibility:
                  errors.address || formData.address ? "visible" : "hidden",
              }}
            >
              {errors.address
                ? errors.address
                : formData.address
                ? `${formData.address.length}/70 characters`
                : ""}
            </FormHelperText>
          </FormControl>
        </div>

        {/* Submit Button */}
        <div className="col-span-2">
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
        <div className="text-center col-span-2 text-sm mt-2">
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
          "& .MuiPaper-root": {
            borderRadius: 3,
            textAlign: "start",
            padding: 2,
          },
        }}
      >
        <DialogTitle>Welcome {formData.name}!</DialogTitle>
        <DialogContent>
          Your registration request has been submitted successfully. Your
          credentials have been sent to your registered email.
          You are one step away from activating this clinic app to raise any questions contact (98989898989)
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
