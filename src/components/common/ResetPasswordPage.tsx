import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
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
import { usePasswordStrength } from "./usePasswordStrength";
import { getSessionItem } from "../../context/sessions/userSession";
import { checkUserExists, resetPasswordApi, generateOtpApi, verifyOtpApi } from "../../api";
import { FaUser } from "react-icons/fa";
import type { ResetPassErrors } from "../../types/types";

const ResetPasswordPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [errors, setErrors] = useState<ResetPassErrors>({});
  const [loading, setLoading] = useState(false);
  const localuserId = getSessionItem("user", "user_id");
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const from = search.get("from");
  const showMobileBox = from === "forgottenPassword";
  const showUserIdField = localuserId === null;
  const [internalUserId, setInternalUserId] = useState<number | null>(null);
  const { passwordStrength, evaluate } = usePasswordStrength();
  interface FormDataType {
    userId: number | null;
    mobile: string;
    username: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
  }

  const [formData, setFormData] = useState<FormDataType>({
    userId: null,
    mobile: "",
    username: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

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
    if (from === "forgottenPassword") {
      setIsOtpVerified(false);
      setShowOtp(false);
    } else {
      if (localuserId) {
        setFormData((prev) => ({
          ...prev,
          userId: localuserId,
        }));
        setInternalUserId(localuserId);
        setIsOtpVerified(true);
        setShowOtp(false);
      }
    }
  }, [from, localuserId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "otp" && value.length === 6) {
      handleVerifyOtp(value);
    }
    if (name === "newPassword") evaluate(value);
  };

  const handleIsUserExist = async () => {
    if (showMobileBox && showUserIdField && !formData.username) {
      setErrors({ username: "Username is required." });
      return;
    }
    try {
      const response = await checkUserExists(formData.username);
      if (response.success) {
        setFormData((prev) => ({
          ...prev,
          mobile: response.mobileNumber,
          userId: response.userId,
        }));
        setInternalUserId(response.userId);
        await handleSendOtp(response.mobileNumber);

        setShowOtp(true);
      } else {
        toast.error(
          response.message || "User not found. Please check username."
        );
        setShowOtp(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Something went wrong. Please try again.");
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
        email:""
      });
      if (res.success) {
        toast.success("OTP sent to user mobile number successfully!");
        if (res.userId) {
          setFormData((prev) => ({
            ...prev,
            userId: res.userId ? Number(res.userId) : null,
          }));
        }
        setShowOtp(true);
      } else {
        toast.error(res.message || "Failed to send OTP. Please try again.");
      }
    } catch (err: any) {
      console.error("OTP generation error:", err);
      toast.error("Something went wrong while sending OTP.");
    }
  };

  const handleVerifyOtp = async (otpValue?: string) => {
    const finalOtp = otpValue || formData.otp;
    try {
      const payload = {
        userId: formData.userId,
        otp: Number(finalOtp),
        otp_type: 2,
      };
      const res = await verifyOtpApi(payload);
      if (res.success) {
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
      const response = await resetPasswordApi(payload);
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

      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Password reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-[100dvh] bg-[var(--color-surface)]">
      <div className="w-full max-w-[450px] p-6 bg-[var(--color-bg)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] border-2 border-[var(--color-primary)]">
        <h2
          className="text-center font-bold mb-2"
          style={{ fontSize: "var(--font-h3)", color: "var(--color-text)" }}
        >
          {showMobileBox ? "Create new Password" : "Reset Your Password"}
        </h2>

        <p
          className="text-center mb-6"
          style={{
            fontSize: "var(--font-small)",
            color: "var(--color-text-secondary)",
          }}
        >
          Enter and confirm your new password
        </p>

        <form onSubmit={handleSubmit} noValidate className="space-y-3">
          {showMobileBox && showUserIdField && (
            <div className="flex gap-2">
              <FormControl fullWidth>
                <TextField
                  fullWidth
                  placeholder="Enter Your Username"
                  size="small"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  onKeyDown={(e) => {
                    if (e.key === " ") e.preventDefault();
                  }}
                  error={!!errors.username}
                  disabled={isOtpVerified}
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
                        borderColor: "var(--color-border)", // keep same color
                      },
                    "& .MuiOutlinedInput-root.Mui-disabled .MuiOutlinedInput-notchedOutline":
                      {
                        borderColor: "var(--color-border)", // disabled border
                      },
                    "& .MuiOutlinedInput-root.Mui-disabled.Mui-focused .MuiOutlinedInput-notchedOutline":
                      {
                        borderColor: "var(--color-border)", // remove focus border
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
                    minWidth: 90,
                    fontWeight: 600,

                    backgroundColor: "var(--color-success)",

                    cursor:
                      !formData.username || isOtpVerified
                        ? "not-allowed"
                        : "pointer",

                    "&.Mui-disabled": {
                      backgroundColor: isOtpVerified
                        ? "var(--color-success)"
                        : "var(--color-border)",
                      // color: "#fff",
                      cursor: "not-allowed",
                      opacity: 1,
                    },
                  }}
                >
                  {isOtpVerified ? "Verified ✅" : "Verify"}
                </Button>
              )}
              {showOtp && !isOtpVerified && (
                <TextField
                  placeholder="Enter OTP"
                  name="otp"
                  size="small"
                  value={formData.otp}
                  onChange={handleChange}
                  inputProps={{ maxLength: 6 }}
                  className="w-[40%]"
                />
              )}
            </div>
          )}

          <FormControl fullWidth>
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
            <Box sx={{ mt: 1 }}>
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
              // disabled={!isOtpVerified}
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
            {loading ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              "Continue"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
