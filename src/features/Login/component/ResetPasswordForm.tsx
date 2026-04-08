import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
  LinearProgress,
  Box,
  Typography,
  FormHelperText,
  FormControl,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { toast } from "react-toastify";
import { FaUser } from "react-icons/fa";
import { getSessionItem } from "../../../context/sessions/userSession";
import type { ResetPassErrors } from "../../../types/types";
import { usePasswordStrength } from "../../../components/common/usePasswordStrength";
import {
  generateOtpApi,
  verifyOtpApi,
} from "../../../api/GenerateAndVerifyOtpApi";
import { checkUserExists, resetPasswordApi  } from "../../../api/auth/CommonAuthApi";

interface ForgotPasswordProps {
  source: "resetPassword" | "forgottenPassword";
  setSource: React.Dispatch<
    React.SetStateAction<"resetPassword" | "forgottenPassword" | null>
  >;
}

interface FormDataType {
  userId: number | null;
  mobile: string;
  username: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

const ResetPasswordForm: React.FC<ForgotPasswordProps> = ({
  source,
  setSource,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [errors, setErrors] = useState<ResetPassErrors>({});
  const [loading, setLoading] = useState(false);
  const [userId, setUseId] = useState(0);
  const localuserId = getSessionItem("user", "user_id");
  const navigate = useNavigate();
  const showMobileBox = source === "forgottenPassword" || source === "resetPassword";
  const showUserIdField = localuserId === null;
  const [isUsernameLocked, setIsUsernameLocked] = useState(false);
  const [internalUserId, setInternalUserId] = useState<number | null>(null);
  const { passwordStrength, evaluate } = usePasswordStrength();
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [formData, setFormData] = useState<FormDataType>({
    userId: null,
    mobile: "",
    username: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const canConfirmPassword =
    isOtpVerified && formData.newPassword && passwordStrength.level !== "Weak";

  useEffect(() => {
    const username = formData.username;
    if (username.length === 0) {
      setShowOtp(false);
      setErrors({});
      return;
    }

    if (username.length < 5) {
      setErrors({ username: "Username must be at least 5 characters" });
      setShowOtp(false);
      return;
    }
    setErrors({});
  }, [formData.username]);

  useEffect(() => {
    if (source === "forgottenPassword") {
      setIsOtpVerified(false);
      setShowOtp(false);
    } else {
      if (localuserId) {
        const numericId = Number(localuserId);
        setFormData((prev) => ({
          ...prev,
          userId: isNaN(numericId) ? null : numericId,
        }));
        setInternalUserId(isNaN(numericId) ? null : numericId);
        setIsOtpVerified(true);
        setShowOtp(false);
      }
    }
  }, [source, localuserId]);

  useEffect(() => {
    if (resendCooldown <= 0) return;

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    let updatedValue = value;

    if (name === "otp") {
      updatedValue = value.replace(/\D/g, "").slice(0, 4);
    }

    setFormData((prev) => ({ ...prev, [name]: updatedValue }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "otp" && updatedValue.length === 4) {
      handleVerifyOtp(updatedValue);
    }

    if (name === "newPassword") evaluate(updatedValue);
  };


  const handleIsUserExist = async () => {
    if (showMobileBox && showUserIdField && !formData.username) {
      setErrors({ username: "Username is required." });
      return;
    }

    try {
      const response = await checkUserExists(formData.username);

      if (response.success) {
        const numericId = Number(response.userId);

        setFormData((prev) => ({
          ...prev,
          mobile: response.mobileNumber,
          userId: isNaN(numericId) ? null : numericId,
        }));

        setInternalUserId(isNaN(numericId) ? null : numericId);

        setIsUsernameLocked(true); //  LOCK username HERE 

        await handleSendOtp(response.mobileNumber);
        setShowOtp(true);
      } else {
        toast.error(response.message || "User not found.");
        setShowOtp(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong.");
    }
  };

  const handleSendOtp = async (mobileNumber: string) => {
    if (!mobileNumber) {
      toast.error("Mobile number not available for this user.");
      return;
    }

    try {
      const res = await generateOtpApi({
        mobile_number: mobileNumber,
        otp_type: 2,
      });
      setUseId(res.userId)
      if (res.success) {
        toast.success("OTP sent to user mobile number successfully!");
        setShowOtp(true);
        setIsOtpVerified(false);
        setResendCooldown(20);
        setFormData((prev) => ({
          ...prev,
          otp: "",
        }));
      } else {
        toast.error(res.message || "Failed to send OTP. Please try again.");
      }
    } catch (err: any) {
      console.error("OTP generation error:", err);
      toast.error("Something went wrong while sending OTP.");
    }
  };

  const handleResendOtp = async () => {
    if (!formData.mobile) {
      toast.error("Mobile number not available for this user.");
      return;
    }

    if (resendCooldown > 0) return;

    try {
      setResendLoading(true);

      const res = await generateOtpApi({
        mobile_number: formData.mobile,
        otp_type: 2,
      });

      if (res.success) {
        toast.success("OTP resent successfully!");
        setFormData((prev) => ({
          ...prev,
          otp: "",
        }));
        setShowOtp(true);
        setIsOtpVerified(false);
        setResendCooldown(20);
      } else {
        toast.error(res.message || "Failed to resend OTP.");
      }
    } catch (error: any) {
      console.error("Resend OTP error:", error);
      toast.error("Something went wrong while resending OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const finalOtp = otpValue || formData.otp;
    if (!finalOtp || finalOtp.length < 4) return;

    try {
      const payload = {
        userId: userId,
        otp: finalOtp,
        otp_type: 2,
      };
      const res = await verifyOtpApi(payload as any);

      if (res.success !== false && (res.isOtpValid ?? true)) {
        toast.success("OTP verified successfully!");
        setErrors({ username: "" });
        setIsOtpVerified(true);
        setShowOtp(false);
      } else {
        toast.error(res.message || "Invalid OTP, please try again.");
      }
    } catch (error: any) {
      console.error("OTP verification failed:", error);
      toast.error("Something went wrong. Please try again later.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (showMobileBox && !isOtpVerified) {
      setErrors({ username: "Please Verify Username first." });
      return;
    } else if (!formData.newPassword) {
      setErrors({ newPassword: "Please fill new password field" });
      return;
    } else if (passwordStrength.level === "Weak") {
      setErrors({
        newPassword: "Please choose a stronger password before continuing.",
      });
      return;
    } else if (!formData.confirmPassword) {
      setErrors({
        confirmPassword: "Please fill new password field",
      });
      return;
    } else if (formData.newPassword !== formData.confirmPassword) {
      setErrors({
        confirmPassword: "Passwords do not match",
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        userId: internalUserId,
        newPassword: formData.newPassword,
      };

      const response = await resetPasswordApi(payload as any);

      toast.success(response?.message || "Password reset successfully");
      setIsOtpVerified(false);
      setFormData({
        userId: 0,
        mobile: "",
        username: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsUsernameLocked(false);
      setSource(null);
    } catch (error: any) {
      toast.error(error.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col items-center justify-center h-full px-10 space-y-5 w-full"
    >
      <h1 className="text-2xl font-extrabold text-[var(--color-primary)]">
        {showMobileBox ? "Create new Password" : "Reset Your Password"}
      </h1>

      {showMobileBox && showUserIdField && (
        <div className="w-full flex flex-col gap-2 ">
          {/* Username + Verify row */}
          <div className="flex gap-2 items-start">
            <FormControl fullWidth>
              <TextField
                fullWidth
                placeholder="Enter Username"
                size="small"
                name="username"
                value={formData.username}
                onChange={handleChange}
                onKeyDown={(e) => {
                  if (e.key === " ") e.preventDefault();
                }}
                error={!!errors.username}
                // disabled={isOtpVerified}
                disabled={isUsernameLocked}
                inputProps={{ maxLength: 25 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaUser className="text-[var(--color-text-secondary)]" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root.Mui-disabled:hover .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: "var(--color-border)",
                  },
                  "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: "var(--color-border)",
                  },
                  "& .MuiOutlinedInput-root.Mui-disabled.Mui-focused .MuiOutlinedInput-notchedOutline":
                  {
                    borderColor: "var(--color-border)",
                  },
                }}
              />

              <FormHelperText
                error={!!errors.username}
                sx={{
                  minHeight: "20px",
                  visibility: errors.username ? "visible" : "hidden",
                }}
              >
                {errors.username}
              </FormHelperText>
            </FormControl>

            {!showOtp && (
              <Button
                variant="contained"
                size="small"
                onClick={handleIsUserExist}
                disabled={!formData.username || isOtpVerified}
                sx={{
                  height: 40,
                  minWidth: 100,
                  fontWeight: 600,
                  backgroundColor: "var(--color-success)",
                  color: "var(--color-white)",
                  whiteSpace: "nowrap",
                  cursor:
                    !formData.username || isOtpVerified ? "not-allowed" : "pointer",
                  "&.Mui-disabled": {
                    color: "var(--color-white)",
                    backgroundColor: isOtpVerified
                      ? "var(--color-success)"
                      : "var(--color-border)",
                    cursor: "not-allowed",
                    opacity: 1,
                  },
                }}
              >
                {isOtpVerified ? "Verified" : "Verify"}
              </Button>
            )}
          </div>

          {/* OTP section below username */}
          {showOtp && !isOtpVerified && (
            <div className="w-[75%] flex flex-col gap-1 mt-0.5 ">

              {/* OTP + Resend inline */}
              <div className="flex items-center gap-1">
                {/* FIXED WIDTH OTP INPUT */}

                <div className="flex gap-3 justify-center">
                  {[0, 1, 2, 3].map((index) => (
                    <TextField
                      key={index}
                      value={formData.otp[index] || ""}
                      inputRef={(el) => (otpRefs.current[index] = el)}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");

                        const otpArray = formData.otp.split("");

                        // allow clearing
                        if (val === "") {
                          otpArray[index] = "";
                          setFormData((prev) => ({
                            ...prev,
                            otp: otpArray.join(""),
                          }));

                          return;
                        }

                        // set digit
                        otpArray[index] = val[0];
                        const newOtp = otpArray.join("").slice(0, 4);

                        setFormData((prev) => ({ ...prev, otp: newOtp }));

                        // move forward
                        if (index < 3) {
                          otpRefs.current[index + 1]?.focus();
                        }

                        if (newOtp.length === 4) {
                          handleVerifyOtp(newOtp);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace") {
                          const otpArray = formData.otp.split("");

                          if (otpArray[index]) {
                            // clear current
                            otpArray[index] = "";
                            setFormData((prev) => ({
                              ...prev,
                              otp: otpArray.join(""),
                            }));
                          } else if (index > 0) {
                            // move back
                            otpRefs.current[index - 1]?.focus();
                          }
                        }
                      }}
                      inputProps={{
                        maxLength: 1,
                        style: {
                          textAlign: "center",
                          fontSize: "18px",
                          fontWeight: 600,
                        },
                      }}
                      sx={{
                        width: "40px",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "16px",
                          height: "40px",
                        },
                      }}
                    />
                  ))}
                </div>
                {/* FIXED WIDTH BUTTON → NO LAYOUT SHIFT */}
                <div className="w-[90px] flex justify-end">
                  <Button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || resendLoading}
                    sx={{
                      minWidth: "90px",
                      maxWidth: "90px",
                      padding: "6px 6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      color:
                        resendCooldown > 0
                          ? "var(--color-text-secondary)"
                          : "var(--color-info)",
                    }}
                  >
                    {resendLoading
                      ? "Sending..."
                      : resendCooldown > 0
                        ? `Resend in ${resendCooldown}s`
                        : "Resend OTP"}
                  </Button>
                </div>
              </div>

            </div>
          )}
        </div>
      )}

      <FormControl fullWidth >
        <TextField
          placeholder="New password"
          name="newPassword"
          type={showPassword ? "text" : "password"}
          variant="outlined"
          fullWidth
          size="small"
          value={formData.newPassword}
          onKeyDown={(e) => {
            if (e.key === " ") e.preventDefault();
          }}
          onChange={handleChange}
          disabled={!isOtpVerified}
          error={!!errors.newPassword}
          inputProps={{ maxLength: 25 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword((p) => !p)}
                  disabled={showMobileBox ? !isOtpVerified : false}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <FormHelperText
          error={!!errors.newPassword}
          sx={{
            minHeight: "20px",
            visibility: errors.newPassword ? "visible" : "hidden",
          }}
        >
          {errors.newPassword}
        </FormHelperText>
      </FormControl>

      {formData.newPassword && (
        <Box sx={{ width: "100%" }}>
          <LinearProgress
            variant="determinate"
            value={passwordStrength.progress}
            sx={{
              height: 4,
              borderRadius: 2,
              backgroundColor: "#e0e0e0",
              "& .MuiLinearProgress-bar": {
                backgroundColor: passwordStrength.color,
              },
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: passwordStrength.color,
              fontWeight: 500,
              mt: 0.5,
            }}
          >
            Password strength: {passwordStrength.level}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: "var(--color-text-secondary)",
              display: "block",
            }}
          >
            {passwordStrength.suggestion}
          </Typography>
        </Box>
      )}

      <FormControl fullWidth>
        <TextField
          placeholder="Confirm password"
          name="confirmPassword"
          type={showConfirm ? "text" : "password"}
          variant="outlined"
          fullWidth
          size="small"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={!canConfirmPassword}
          inputProps={{ maxLength: 25 }}
          error={!!errors.confirmPassword}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowConfirm((p) => !p)}
                  disabled={showMobileBox ? !isOtpVerified : false}
                >
                  {showConfirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
        <FormHelperText
          error={!!errors.confirmPassword}
          sx={{
            minHeight: "20px",
            visibility: errors.confirmPassword ? "visible" : "hidden",
          }}
        >
          {errors.confirmPassword}
        </FormHelperText>
      </FormControl>

      <Button
        type="submit"
        fullWidth
        sx={{
          backgroundColor: "var(--color-primary)",
          color: "var(--color-bg)",
          "&:hover": { backgroundColor: "var(--color-primary)" },
        }}
      >
        {loading ? <CircularProgress size={20} color="inherit" /> : "Save"}
      </Button>

      <div className="text-left mt-2 mb-3 w-full">
        <button
          onClick={() => setSource(null)}
          className="text-sm text-[var(--color-info)] hover:underline font-medium"
          type="button"
        >
          Back
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;
