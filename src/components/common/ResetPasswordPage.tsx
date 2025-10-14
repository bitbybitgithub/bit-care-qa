import React, { useState } from "react";
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
import { useNavigate } from "react-router-dom";
import { resetPasswordApi } from "../../api";

const ResetPasswordPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    userId: Number(localStorage.getItem("userId")) || 0,
    newPassword: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId) {
      toast.error("User ID is required");
      return;
    }

    if (!formData.newPassword || !formData.confirmPassword) {
      toast.error("Please fill both password fields");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    try {
      setLoading(true);
      const payload = {
        userId: Number(formData.userId),
        newPassword: formData.newPassword,

      };

      console.log("Reset Password Payload:", payload);

      const response = await resetPasswordApi(payload);
      toast.success(response?.message || "Password reset successful");

      setFormData({
        userId: Number(localStorage.getItem("userId")) || 0,
        newPassword: "",
        confirmPassword: "",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Reset Password Error:", error);
      toast.error(error.message || "Password reset failed");
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
        <Typography variant="h6" fontWeight="bold" textAlign="center" mb={2}>
          Reset Your Password
        </Typography>

        <Typography
          variant="body2"
          textAlign="center"
          mb={3}
          color="text.secondary"
        >
          Enter your User ID and new password
        </Typography>

        <form onSubmit={handleSubmit} noValidate>
          <TextField
            placeholder="Enter User ID"
            name="userId"
            type="text"
            variant="outlined"
            fullWidth
            size="small"
            value={formData.userId || ""}
            onChange={handleChange}
            error={!!errors.userId}
            helperText={errors.userId}
            sx={{ mb: 2 }}
          />

          <TextField
            placeholder="New password"
            name="newPassword"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            size="small"
            value={formData.newPassword}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((prev) => !prev)}>
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
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm((prev) => !prev)}>
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 3 }}
          />

          <Button variant="contained" fullWidth type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Continue"}
          </Button>
        </form>
      </Paper>
    </Box>
  );
};

export default ResetPasswordPage;
