import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  FormControl,
  InputAdornment,
  TextField,
  CircularProgress,
} from "@mui/material";
import { FaTimes, FaUser, FaCalendarAlt, FaCheckCircle } from "react-icons/fa";
import { FaPeopleLine } from "react-icons/fa6";
import { IoCall } from "react-icons/io5";
import { toast } from "react-toastify";
import { generateOtpApi } from "../../../api/GenerateAndVerifyOtpApi";
import { verifyPatientpApi } from "../../../api/VerifyPatientApi";
import type { Patient } from "../../../types/patientType/patientTypeInterfaces";
import Regex from "../../../context/constant/Regex";
import { getAge } from "../../../utils/CalculateAge";
import { Mobile_Otp_Sent } from "../../../context/constant/constant";

interface Props {
  open: boolean;
  onClose: () => void;
  onPatientSelect: (patient: Patient | null, contact: string) => void;
}

const LabWalkInVerificationModal: React.FC<Props> = ({
  open,
  onClose,
  onPatientSelect,
}) => {
  const [contact, setContact] = useState("");
  const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
  const [showOtp, setShowOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [editedAfterOtp, setEditedAfterOtp] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [verifiedPatients, setVerifiedPatients] = useState<Patient[] | null>(
    null,
  );
  const [error, setError] = useState({ mobile: "", otp: "" });
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [resendTimer, setResendTimer] = useState(0);
  const resendIntervalRef = useRef<number | null>(null);

  const resetState = () => {
    setContact("");
    setOtp(["", "", "", ""]);
    setShowOtp(false);
    setOtpSent(false);
    setEditedAfterOtp(false);
    setUserId(null);
    setVerifiedPatients(null);
    setError({ mobile: "", otp: "" });
  };

  useEffect(() => {
    if (!open) resetState();
  }, [open]);

  useEffect(() => {
    return () => {
      if (resendIntervalRef.current) {
        clearInterval(resendIntervalRef.current);
      }
    };
  }, []);

  const startResendTimer = () => {
    setResendTimer(30);

    if (resendIntervalRef.current) {
      clearInterval(resendIntervalRef.current);
    }

    resendIntervalRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          if (resendIntervalRef.current) {
            clearInterval(resendIntervalRef.current);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    if (!Regex.MOBILEREGEX.test(contact.trim())) {
      setError({
        ...error,
        mobile: "Enter a valid 10-digit mobile number starting with 6–9",
      });
      return;
    }

    setLoadingGenerate(true);
    try {
      const res = await generateOtpApi({
        mobile_number: contact.trim(),
        otp_type: 2,
      });

      if (res.success) {
        toast.success(Mobile_Otp_Sent);
        setUserId(res.userId ?? null);
        setShowOtp(true);
        setOtpSent(true);
        startResendTimer();
        setEditedAfterOtp(false);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError({ ...error, otp: res.message || "Failed to send OTP" });
      }
    } finally {
      setLoadingGenerate(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp(["", "", "", ""]);
    await handleSendOtp();
  };

  const handleOtpChange = (value: string, index: number) => {
    const val = value.replace(/\D/g, "");
    const updatedOtp = [...otp];
    updatedOtp[index] = val;
    setOtp(updatedOtp);

    if (val && index < 3) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    const finalOtp = otp.join("");

    if (finalOtp.length !== 4 || !userId) {
      setError({ ...error, otp: "Please enter valid 4 digit OTP" });
      return;
    }

    setLoadingVerify(true);
    try {
      const res = await verifyPatientpApi({
        userId,
        otp: Number(finalOtp),
        otp_type: 2,
        mobile_number: contact,
      });
      if (!res.isOtpValid) {
        setError({ ...error, otp: "Please enter valid OTP" });
        setEditedAfterOtp(true);
        return;
      }

      if (res.found && res.patients?.length) {
        setVerifiedPatients(res.patients);
      } else {
        onPatientSelect(null, contact);
      }
    } finally {
      setLoadingVerify(false);
    }
  };

  if (!open) return null;

  const count = verifiedPatients?.length || 0;

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md p-6 bg-[var(--color-surface)] border border-[var(--color-border)]/30 rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] text-[var(--color-text)] transition-all overflow-hidden max-h-[90vh] flex flex-col">
        {!verifiedPatients ? (
          <>
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-xl shrink-0">
                  <FaPeopleLine />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--color-text)]">
                    Add Walk-In Patient
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                    We'll verify contact to find existing patient records
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  resetState();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>

            {/* Mobile Number Input */}
            <div className="mt-2">
              <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1.5">
                Contact Number
              </label>
              <div className="flex items-center gap-2">
                <FormControl fullWidth>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter 10-digit mobile"
                    value={contact}
                    disabled={editedAfterOtp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");

                      if (val.length === 1 && /[0-5]/.test(val)) return;

                      if (showOtp && val !== contact) {
                        setOtp(["", "", "", ""]);
                        setShowOtp(false);
                        setOtpSent(false);
                        setEditedAfterOtp(false);
                      }

                      if (/^[6-9]\d{0,9}$/.test(val) || val === "") {
                        setContact(val);
                        setError({ mobile: "", otp: "" });
                      } else {
                        setContact(val);
                      }
                    }}
                    error={!!error.mobile}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <span className="font-semibold text-xs text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded">
                              +91
                            </span>
                          </InputAdornment>
                        ),
                        inputProps: { maxLength: 10, inputMode: "numeric" },
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: "var(--color-surface-alt)",
                        fontSize: "0.875rem",
                        "&:hover fieldset": {
                          borderColor: "var(--color-primary)",
                        },
                        "&.Mui-focused fieldset": {
                          borderColor: "var(--color-primary)",
                        },
                      },
                    }}
                  />
                </FormControl>

                <Button
                  onClick={handleSendOtp}
                  variant="contained"
                  disabled={contact.length !== 10 || showOtp || loadingGenerate}
                  sx={{
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    borderRadius: "var(--radius-lg)",
                    textTransform: "none",
                    whiteSpace: "nowrap",
                    px: 2.5,
                    py: 1,
                    boxShadow: "var(--shadow-xs)",
                    backgroundColor: "var(--color-primary)",
                    color: "#ffffff",
                    "&:hover": {
                      backgroundColor: "var(--color-primary)",
                      opacity: 0.9,
                    },
                    "&.Mui-disabled": {
                      backgroundColor: "var(--color-border)",
                      color: "var(--color-text-secondary)",
                      opacity: 0.6,
                    },
                  }}
                >
                  {loadingGenerate ? (
                    <CircularProgress size={18} sx={{ color: "#ffffff" }} />
                  ) : showOtp ? (
                    "OTP Sent"
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </div>

              {error.mobile && (
                <p className="mt-1 text-xs text-[var(--color-error)]">
                  {error.mobile}
                </p>
              )}
            </div>

            {/* OTP Section */}
            {showOtp && (
              <div className="mt-5 p-4 rounded-[var(--radius-lg)] border border-[var(--color-border)]/40 bg-[var(--color-surface-alt)] text-center animate-fadeIn">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] mb-3">
                  Enter 4-digit verification code sent to +91 {contact}
                </p>

                <div className="flex justify-center items-center gap-3">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      maxLength={1}
                      inputMode="numeric"
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      className="w-11 h-12 text-center text-lg font-bold rounded-[var(--radius-lg)] border bg-[var(--color-surface)] text-[var(--color-text)] outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                      style={{
                        borderColor: error.otp
                          ? "var(--color-error)"
                          : digit
                          ? "var(--color-primary)"
                          : "var(--color-border)",
                      }}
                    />
                  ))}
                </div>

                {otpSent && !loadingGenerate && (
                  <div className="mt-3 text-xs">
                    {resendTimer > 0 ? (
                      <span className="text-[var(--color-text-secondary)]">
                        Resend code in{" "}
                        <strong className="text-[var(--color-primary)]">
                          {resendTimer}s
                        </strong>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        className="font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                      >
                        Didn't receive code? Resend OTP
                      </button>
                    )}
                  </div>
                )}

                {error.otp && (
                  <p className="mt-2 text-xs text-[var(--color-error)] font-medium">
                    {error.otp}
                  </p>
                )}

                <div className="mt-4">
                  <Button
                    fullWidth
                    onClick={handleConfirm}
                    disabled={loadingVerify || otp.join("").length !== 4}
                    variant="contained"
                    sx={{
                      py: 1,
                      fontWeight: 600,
                      borderRadius: "var(--radius-lg)",
                      textTransform: "none",
                      backgroundColor: "var(--color-primary)",
                      color: "#ffffff",
                      boxShadow: "var(--shadow-md)",
                      "&:hover": {
                        backgroundColor: "var(--color-primary)",
                        opacity: 0.9,
                      },
                      "&.Mui-disabled": {
                        backgroundColor: "var(--color-border)",
                        color: "var(--color-text-secondary)",
                        opacity: 0.6,
                      },
                    }}
                  >
                    {loadingVerify ? (
                      <span className="flex items-center gap-2">
                        <CircularProgress size={16} sx={{ color: "#ffffff" }} />
                        Verifying...
                      </span>
                    ) : (
                      "Confirm & Continue"
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Verified Patients List */
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-[var(--color-border)]/30">
              <div>
                <h3 className="font-bold text-base text-[var(--color-text)]">
                  {count} Existing Patient{count > 1 ? "s" : ""} Found
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Select an existing profile or register as new
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  resetState();
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1 my-2">
              {verifiedPatients.map((p) => {
                const genderInitial =
                  p.gender?.toString()?.[0]?.toUpperCase() || "-";
                const calculatedAge = getAge(p.date_of_birth);

                return (
                  <div
                    key={p.patient_id}
                    onClick={() => onPatientSelect(p, contact)}
                    className="group flex items-center justify-between p-3.5 rounded-[var(--radius-lg)] border border-[var(--color-border)]/50 hover:border-[var(--color-primary)] bg-[var(--color-surface-alt)] hover:shadow-[var(--shadow-md)] transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-base shrink-0 group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                        <FaUser />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-[var(--color-text)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                            {p.patient_name}
                          </h4>
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                            {genderInitial}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-[var(--color-text-secondary)] mt-1">
                          <span className="flex items-center gap-1">
                            <FaCalendarAlt className="text-[10px]" />
                            {p.date_of_birth
                              ? new Date(p.date_of_birth).toLocaleDateString()
                              : "N/A"}
                          </span>
                          <span className="flex items-center gap-1">
                            <IoCall className="text-[10px]" />
                            {p.mobile_number || contact}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 pl-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                        {calculatedAge} yrs
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[var(--color-border)]/30 text-center">
              <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                Want to create a different patient under this number?
              </p>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => onPatientSelect(null, contact)}
                sx={{
                  py: 0.8,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8125rem",
                  borderRadius: "var(--radius-lg)",
                  borderColor: "var(--color-primary)",
                  color: "var(--color-primary)",
                  "&:hover": {
                    borderColor: "var(--color-primary)",
                    backgroundColor: "var(--color-primary)",
                    color: "#ffffff",
                  },
                }}
              >
                + Register New Patient
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabWalkInVerificationModal;
