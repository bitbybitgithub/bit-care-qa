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
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { toast } from "react-toastify";
import { FaUser, FaLock } from "react-icons/fa";
import { getSessionItem } from "../../../context/sessions/userSession";
import type { ResetPassErrors } from "../../../types/types";
import { usePasswordStrength } from "../../../components/common/usePasswordStrength";
import {
  generateOtpApi,
  verifyOtpApi,
} from "../../../api/GenerateAndVerifyOtpApi";
import { checkUserExists, resetPasswordApi  } from "../../../api/auth/CommonAuthApi";
import { ArrowLeft, CheckCircleIcon } from "lucide-react";

/* ---- Visual tokens (same look as the registration / login forms) ---- */
const FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] " +
  "focus-visible:ring-offset-2";

const LABEL_CLASS =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wider text-slate-600";

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "var(--color-bg)",
    fontSize: 14,
    minHeight: 40,
    padding: "0 8px 0 14px",
    transition: "background-color .15s",
    "& fieldset": { borderColor: "var(--color-border)" },
    "&:hover fieldset": { borderColor: "var(--color-primary-light)" },
    "&.Mui-focused": { backgroundColor: "var(--color-surface-alt)" },
    "&.Mui-focused fieldset": {
      borderColor: "var(--color-primary)",
      borderWidth: "1.5px",
    },
    "&.Mui-error fieldset": { borderColor: "var(--color-error)" },
    "&.Mui-disabled": { backgroundColor: "var(--color-surface)" },
  },
  "& .MuiInputBase-input": {
    padding: "9px 6px 9px 0",
    fontSize: 14,
    lineHeight: "22px",
    boxSizing: "border-box",
    height: "auto",
    "&::placeholder": { color: "var(--color-text-secondary)", opacity: 1 },
    "&.Mui-disabled": { WebkitTextFillColor: "var(--color-disabled)" },
  },
  "& .MuiInputAdornment-positionStart": { marginRight: "10px" },
  "& .MuiFormHelperText-root": {
    minHeight: 16,
    margin: "2px 2px 0",
    fontSize: 11.5,
    lineHeight: "16px",
  },
};

const otpBoxSx = {
  width: 44,
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    height: 44,
    backgroundColor: "var(--color-bg)",
    "& fieldset": { borderColor: "var(--color-border)" },
    "&:hover fieldset": { borderColor: "var(--color-primary-light)" },
    "&.Mui-focused": { backgroundColor: "var(--color-surface-alt)" },
    "&.Mui-focused fieldset": {
      borderColor: "var(--color-primary)",
      borderWidth: "1.5px",
    },
  },
  "& .MuiInputBase-input": { padding: 0 },
};

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
      setErrors({ newPassword: "Please fill New password" });
      return;
    } else if (passwordStrength.level === "Weak") {
      setErrors({
        newPassword: "Please choose a stronger password before continuing.",
      });
      return;
    } else if (!formData.confirmPassword) {
      setErrors({
        confirmPassword: "Please fill Confirm password",
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
    <form onSubmit={handleSubmit} noValidate className="w-full">
      {/* heading */}
      <div className="mb-5">
        <h2
          className="font-[var(--font-weight-bold)] text-[var(--color-text)]"
          style={{ fontSize: "var(--font-h3, 1.5rem)" }}>
          {showMobileBox ? "Create new" : "Reset your"}{" "}
          <span className="text-[var(--color-primary)]">password</span>
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {showUserIdField
            ? "Verify your username with an OTP, then choose a new password."
            : "Choose a new password to continue."}
        </p>
      </div>

      {showMobileBox && showUserIdField && (
        <div className="mb-1">
          {/* Username + Verify row */}
          <label htmlFor="reset-username" className={LABEL_CLASS}>
            Username
          </label>
          <div className="flex items-start gap-2">
            <TextField
              id="reset-username"
              fullWidth
              placeholder="Enter username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (e.key === " ") e.preventDefault();
              }}
              error={!!errors.username}
              helperText={errors.username || " "}
              disabled={isUsernameLocked}
              inputProps={{ maxLength: 25 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaUser size={14} className="text-slate-400" />
                  </InputAdornment>
                ),
                endAdornment: isOtpVerified && (
                  <InputAdornment position="end">
                    <CheckCircleIcon size={18} style={{ color: "var(--color-success)" }} />
                  </InputAdornment>
                ),
              }}
              sx={inputSx}
            />

            {!showOtp && !isOtpVerified && (
              <Button
                type="button"
                size="small"
                onClick={handleIsUserExist}
                disabled={!formData.username || isOtpVerified}
                sx={{
                  height: 40,
                  minWidth: 84,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  backgroundColor: "var(--color-primary)",
                  color: "var(--color-surface)",
                  "&:hover": {
                    backgroundColor: "var(--color-primary)",
                    opacity: 0.92,
                  },
                  "&.Mui-disabled": {
                    backgroundColor: "var(--color-surface)",
                    color: "var(--color-disabled)",
                    cursor: "not-allowed",
                    pointerEvents: "auto",
                  },
                }}>
                Verify
              </Button>
            )}
          </div>

          {/* OTP section below username */}
          {showOtp && !isOtpVerified && (
            <div className="anim-fade-up mb-2 rounded-xl border border-slate-200 bg-[color-mix(in_srgb,var(--color-primary)_4%,white)] p-3">
              <p className={`${LABEL_CLASS} text-center`}>Enter the 4-digit OTP</p>

              <div className="flex justify-center gap-2.5">
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
                      inputMode: "numeric",
                      "aria-label": `OTP digit ${index + 1}`,
                      style: {
                        textAlign: "center",
                        fontSize: "18px",
                        fontWeight: 600,
                      },
                    }}
                    sx={otpBoxSx}
                  />
                ))}
              </div>

              <div className="mt-2 flex justify-center">
                <Button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0 || resendLoading}
                  sx={{
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    color: "var(--color-primary)",
                    "&.Mui-disabled": { color: "var(--color-disabled)" },
                  }}>
                  {resendLoading
                    ? "Sending..."
                    : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend OTP"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New password */}
      <div className="mb-1">
        <label htmlFor="reset-new-password" className={LABEL_CLASS}>
          New password
        </label>
        <TextField
          id="reset-new-password"
          placeholder="Enter new password"
          name="newPassword"
          type={showPassword ? "text" : "password"}
          fullWidth
          value={formData.newPassword}
          onKeyDown={(e) => {
            if (e.key === " ") e.preventDefault();
          }}
          onChange={handleChange}
          disabled={!isOtpVerified}
          error={!!errors.newPassword}
          helperText={errors.newPassword || " "}
          inputProps={{ maxLength: 25 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaLock size={14} className="text-slate-400" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  size="small"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((p) => !p)}
                  disabled={showMobileBox ? !isOtpVerified : false}>
                  {showPassword ? (
                    <VisibilityOff fontSize="small" />
                  ) : (
                    <Visibility fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />
      </div>

      {formData.newPassword && (
        <Box sx={{ width: "100%", mb: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={passwordStrength.progress}
            sx={{
              height: 5,
              borderRadius: 3,
              backgroundColor: "var(--color-surface)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: passwordStrength.color,
                borderRadius: 3,
              },
            }}
          />
          <Typography
            variant="body2"
            sx={{
              color: passwordStrength.color,
              fontWeight: 600,
              fontSize: 12,
              mt: 0.5,
            }}>
            Password strength: {passwordStrength.level}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "var(--color-text-secondary)", display: "block", lineHeight: 1.3 }}>
            {passwordStrength.suggestion}
          </Typography>
        </Box>
      )}

      {/* Confirm password */}
      <div className="mb-3">
        <label htmlFor="reset-confirm-password" className={LABEL_CLASS}>
          Confirm password
        </label>
        <TextField
          id="reset-confirm-password"
          placeholder="Re-enter new password"
          name="confirmPassword"
          type={showConfirm ? "text" : "password"}
          fullWidth
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={!canConfirmPassword}
          inputProps={{ maxLength: 25 }}
          error={!!errors.confirmPassword}
          helperText={errors.confirmPassword || " "}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FaLock size={14} className="text-slate-400" />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  size="small"
                  aria-label={showConfirm ? "Hide password" : "Show password"}
                  onClick={() => setShowConfirm((p) => !p)}
                  disabled={showMobileBox ? !isOtpVerified : false}>
                  {showConfirm ? (
                    <VisibilityOff fontSize="small" />
                  ) : (
                    <Visibility fontSize="small" />
                  )}
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={inputSx}
        />
      </div>

      <Button
        type="submit"
        fullWidth
        disabled={loading}
        aria-busy={loading}
        sx={{
          minHeight: 44,
          borderRadius: "10px",
          textTransform: "none",
          fontSize: "0.95rem",
          fontWeight: 600,
          boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
          backgroundColor: "var(--color-primary)",
          color: "var(--color-surface)",
          "&:hover": {
            backgroundColor: "var(--color-primary)",
            opacity: 0.92,
            boxShadow: "0 2px 6px rgba(0,0,0,0.18)",
          },
          "&.Mui-disabled": {
            backgroundColor: "var(--color-primary)",
            color: "var(--color-surface)",
            opacity: 0.7,
          },
        }}>
        {loading ? (
          <CircularProgress size={22} color="inherit" />
        ) : (
          "Save password"
        )}
      </Button>

      <div className="mt-4 flex justify-center">
        <button
          onClick={() => setSource(null)}
          className={`flex items-center gap-1.5 rounded text-sm font-semibold text-[var(--color-primary)] hover:underline underline-offset-2 ${FOCUS_RING}`}
          type="button">
          <ArrowLeft size={15} aria-hidden />
          Back to sign in
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;