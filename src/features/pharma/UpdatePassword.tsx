import React, { useState } from "react";
import { TextField, InputAdornment, IconButton, Button } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { FaLock } from "react-icons/fa";
import { toast } from "react-toastify";
import { verifyPharmaPassword } from "../../api/pharmacyApi/PharmacyApi";
import { type PharmaProfileInfoResponse } from "../../types/pharmacyType/pharmacyInterfaceType";
import { getSessionItem } from "../../context/sessions/userSession";
import { updatePassword } from "../../api/CommonApi/CommonApi";

interface UpdatePasswordProps {
  profile: PharmaProfileInfoResponse;
}

const UpdatePassword: React.FC<UpdatePasswordProps> = ({ profile }) => {
  const [showPassword, setShowPassword] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isVerified, setIsVerified] = useState(false);
  const [isNewMatch, setIsNewMatch] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const userID = getSessionItem("user", "user_id");

  const handleVerifyPassword = async () => {
    if (!currentPassword) {
      toast.error("Enter current password");
      return;
    }

    try {
      const result = await verifyPharmaPassword(userID, currentPassword);
      console.log("password response", result);
      if (result.success) {
        setIsVerified(true);
        toast.success(result.message);
      } else {
        setIsVerified(false);
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Verify error:", error);
      toast.error("Server error while verifying password");
    }
  };

  const handleNewPasswordChange = (value: string) => {
    setNewPassword(value);

    if (value === confirmPassword) {
      setIsNewMatch(true);
    } else {
      setIsNewMatch(false);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);

    if (newPassword === value) {
      setIsNewMatch(true);
    } else {
      setIsNewMatch(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!isVerified) {
      toast.error("Please verify current password first");
      return;
    }

    if (!newPassword || !confirmPassword) {
      toast.error("Enter new password");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      const response = await updatePassword(profile.pharma_id, newPassword);

      if (response.success) {
        toast.success(response.message);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setIsVerified(false);
      } else {
        toast.error(response.message);
      }
    } catch (error) {
      toast.error("Error updating password");
    }
  };

  return (
    <>

  <div className="p-6 ">
  <h2 className="text-xl font-semibold mb-8">
    Change Password
  </h2>

  {/* Current Password + Verify */}
  <div className="flex items-end gap-4 mb-6 max-w-3xl">
    <TextField
      placeholder="Current Password"
      type={showPassword ? "text" : "password"}
      value={currentPassword}
      onChange={(e) => setCurrentPassword(e.target.value)}
      fullWidth
      size="small"
      sx={{ flex: 1 }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <FaLock />
          </InputAdornment>
        ),
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              onClick={() =>
                setShowPassword((prev) => !prev)
              }
            >
              {showPassword ? (
                <VisibilityOff />
              ) : (
                <Visibility />
              )}
            </IconButton>
          </InputAdornment>
        ),
      }}
    />

    <Button
      variant="contained"
      onClick={handleVerifyPassword}
      disabled={verifying || !currentPassword}
      sx={{
        height: "40px",
        minWidth: "160px",
        borderRadius: "10px",
      }}
    >
      {verifying ? "Verifying..." : "Verify Password"}
    </Button>
  </div>

<div className="max-w-3xl">
  <TextField
    placeholder="New Password"
    type="password"
    value={newPassword}
    onChange={(e) =>
      handleNewPasswordChange(e.target.value)
    }
    fullWidth
    size="small"
    disabled={!isVerified}
    sx={{ mb: 3 }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <FaLock />
        </InputAdornment>
      ),
    }}
  />
</div>

<div className="max-w-3xl">
  <TextField
    placeholder="Confirm Password"
    type="password"
    value={confirmPassword}
    onChange={(e) =>
      handleConfirmPasswordChange(e.target.value)
    }
    fullWidth
    size="small"
    disabled={!isVerified}
    error={!isNewMatch && confirmPassword.length > 0}
    helperText={
      !isNewMatch && confirmPassword.length > 0
        ? "Passwords do not match"
        : ""
    }
    sx={{ mb: 5 }}
    InputProps={{
      startAdornment: (
        <InputAdornment position="start">
          <FaLock />
        </InputAdornment>
      ),
    }}
  />
  </div>

  {/* Update Button */}
  <div className="flex justify-start">
    <Button
      variant="contained"
      color="primary"
      disabled={!isVerified || !isNewMatch}
      onClick={handleUpdatePassword}
      sx={{
        minWidth: "180px",
        borderRadius: "10px",
        height: "42px",
      }}
    >
      Update Password
    </Button>
  </div>
</div>

    </>
  );
};

export default UpdatePassword;
