import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  IconButton,
  InputAdornment,
  Paper,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { toast } from "react-toastify";
import { FaPhoneAlt } from "react-icons/fa";
import type { ResetPassErrors } from "../../types/types";
import { useSearchParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import {resetPasswordApi } from "../../api";
import { getSessionItem } from "../../context/sessions/userSession";

const ResetPasswordPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [errors, setErrors] = useState<ResetPassErrors>({});
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    mobile: "",
    userId : "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const localuserId = getSessionItem("user_id")

  console.log("localUser Id",localuserId)

  const [search] = useSearchParams();
  const navigate = useNavigate();
  const from = search.get("from");
  const showMobileBox = from === "forgotenPassword";
  const showUserIdField = localuserId === 0;

  console.log("Reset Urls from : ",from)

  useEffect(() => {
    if (formData.userId.length === 2) {
      if (!/^\d{2}$/.test(formData.userId)) {
        setErrors({ userId: "User ID should be 4 digits" });
        setShowOtp(false);
        return;
      }

      setErrors({});
      setShowOtp(true);
      toast.success("OTP sent to your user ID");
      console.log("Pretend sending OTP to:", formData.userId);
    } else if (formData.userId.length > 0 && formData.userId.length < 2) {
      setShowOtp(false);
      setErrors({ userId: "Invalid User ID" });
    } else {
      setShowOtp(false);
    }
  }, [formData.userId]);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleVerifyOtp = () => {
    if (formData.otp === "123456") {
      setIsOtpVerified(true);
      setShowOtp(false);
      toast.success("OTP verified successfully");
    } else {
      toast.error("Invalid OTP. Please try again.");
      setFormData((prev) => ({ ...prev, otp: "" }));
      setIsOtpVerified(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (showMobileBox && showUserIdField && !formData.userId) {
      toast.error("User ID is required");
      return;
    }
    if (showMobileBox && !isOtpVerified) {
      toast.error("Please verify OTP first");
      return;
    }
    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error("Please fill both password fields");
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setErrors({ newPassword: "Passwords do not match" });
      return;
    }
    try {
      setLoading(true);
      const payload = {
        otp: formData.otp,
        userId: Number(localuserId) || Number(formData.userId),
        password: formData.newPassword,
        newPassword: formData.confirmPassword,
      };
      console.log("Final Payload before API:", payload);
      const response = await resetPasswordApi(payload);
      toast.success(response?.message || "Password reset successfully");
      console.log("API Response:", response);
      setFormData({
        mobile: "",
        userId: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsOtpVerified(false);
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Password reset failed");
      console.error("Reset Password Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f5f6f8",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 450,
          p: 4,
          borderRadius: 2,
        }}
      >
        {showMobileBox ? (
          <Typography variant="h6" fontWeight="bold" textAlign="center" mb={2}>
            Create new password
          </Typography>
        ) : (
          <Typography variant="h6" fontWeight="bold" textAlign="center" mb={2}>
            Reset Your Password
          </Typography>
        )}
        <Typography
          variant="body2"
          textAlign="center"
          mb={3}
          color="text.secondary"
        >
          Enter and confirm your new password
        </Typography>
        <form onSubmit={handleSubmit} noValidate>
          {showMobileBox && showUserIdField && (
            <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
              <TextField
                fullWidth
                placeholder="Enter Your User Id"
                size="small"
                name="userId"
                value={formData.userId}
                onChange={handleChange}
                error={!!errors.userId}
                helperText={errors.userId}
                inputProps={{ maxLength: 2 }}
                disabled={isOtpVerified}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaPhoneAlt className="text-gray-500" />
                    </InputAdornment>
                  ),
                }}
              />

              {showOtp && !isOtpVerified && (
                <TextField
                  placeholder="Enter OTP"
                  name="otp"
                  size="small"
                  value={formData.otp}
                  onChange={handleChange}
                  inputProps={{ maxLength: 6 }}
                  sx={{ width: "40%" }}
                />
              )}
            </Box>
          )}

          {showMobileBox && showUserIdField && showOtp && !isOtpVerified && (
            <Button
              variant="outlined"
              size="small"
              fullWidth
              sx={{ mb: 2 }}
              onClick={handleVerifyOtp}
              disabled={formData.otp.length !== 6}
            >
              Verify OTP
            </Button>
          )}
          <TextField
            placeholder="New password"
            name="newPassword"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            size="small"
            value={formData.newPassword}
            onChange={handleChange}
            disabled={showMobileBox ? !isOtpVerified : false}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    disabled={showMobileBox ? !isOtpVerified : false}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
          <TextField
            placeholder="Confirm password"
            name="confirmPassword"
            type={showConfirm ? "text" : "password"}
            variant="outlined"
            fullWidth
            size="small"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={!!errors.newPassword}
            helperText={errors.newPassword}
            disabled={showMobileBox ? !isOtpVerified : false}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowConfirm((prev) => !prev)}
                    disabled={showMobileBox ? !isOtpVerified : false}
                  >
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Button
            variant="contained"
            fullWidth
            type="submit"
            disabled={showMobileBox ? !isOtpVerified : false}
          >
            Continue
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ResetPasswordPage;
