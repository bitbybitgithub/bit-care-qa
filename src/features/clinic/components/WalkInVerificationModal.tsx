import React, { useState, useRef, useEffect } from "react";
import { Button, FormControl, InputAdornment, TextField } from "@mui/material";
import { FaTimes, FaUser, FaCalendarAlt } from "react-icons/fa";
import { FaPeopleLine } from "react-icons/fa6";
import { IoCall } from "react-icons/io5";
import { generateOtpApi } from "../../../api/GenerateAndVerifyOtpApi";
import { verifyPatientpApi } from "../../../api/VerifyPatientApi";
import type { Patient } from "../../../types/patientType/patientTypeInterfaces";
import Regex from "../../../context/constant/Regex";
import { getAge } from "../../../utils/CalculateAge";
import { Mobile_Otp_Sent } from "../../../context/constant/constant";
import { toast } from "react-toastify";

interface Props {
  open: boolean;
  onClose: () => void;
  onPatientSelect: (patient: Patient | null, contact: string) => void;
}

const WalkInVerificationModal: React.FC<Props> = ({
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
  const count = verifiedPatients?.length || 0;
  const [error, setError] = useState({ mobile: "", otp: "" });
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const [loadingVerify, setLoadingVerify] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [resendTimer, setResendTimer] = useState(0);
  const resendIntervalRef = useRef<number | null>(null);

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

  if (!open) return null;

  const startResendTimer = () => {
    setResendTimer(30); // 30 seconds cooldown

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
        toast.success(Mobile_Otp_Sent)
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

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center px-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
    >
      <div
        className="w-full max-w-md p-6 animate-fadeIn overflow-y-auto max-h-[90vh]"
        style={{
          backgroundColor: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          boxShadow: "var(--shadow-xl)",
          color: "var(--color-text)",
          transition: "all var(--transition-normal)",
        }}
      >
        {!verifiedPatients && (
          <>
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <FaPeopleLine
                  className="text-[var(--color-primary)]"
                  style={{ fontSize: "var(--font-h2)" }}
                />
                <h3
                  className="font-semibold text-[var(--color-primary)]"
                  style={{ fontSize: "var(--font-h3)" }}
                >
                  Add Walk-In Patient
                </h3>
              </div>
              <button
                onClick={() => {
                  onClose();
                  resetState();
                }}
                className="w-8 h-8 flex justify-center items-center rounded-[var(--radius-full)] cursor-pointer text-[var(--color-surface-alt)] bg-[var(--color-primary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)] transition"
              >
                <FaTimes />
              </button>
            </div>

            <p style={{ fontSize: "var(--font-small)" }}>
              We'll verify your contact to find existing records
            </p>
          </>
        )}

        {!verifiedPatients && (
          <>
            <div className="mt-4">
              <div className="flex items-center gap-3">
                <FormControl>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter 10-digit number"
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
                            <span
                              style={{
                                fontWeight: 600,
                                color: "var(--color-text-secondary)",
                              }}
                            >
                              +91
                            </span>
                          </InputAdornment>
                        ),
                        inputProps: { maxLength: 10 },
                      },
                    }}
                  />
                </FormControl>

                <Button
                  onClick={handleSendOtp}
                  variant="text"
                  disabled={contact.length !== 10 || showOtp || loadingGenerate}
                  sx={{
                    fontWeight: 600,
                    fontSize: "var(--font-small)",
                    color: "var(--color-surface-alt)",
                    boxShadow: "var(--shadow-md)",
                    textTransform: "none",
                    backgroundColor: "var(--color-info)",
                    "&:hover": {
                      backgroundColor: "var(--color-info)",
                      opacity: 0.8,
                    },
                    "&.Mui-disabled": {
                      color: "var(--color-white)",
                      cursor: "not-allowed",
                      opacity: 0.7,
                      pointerEvents: "auto",
                    },
                  }}
                >
                  Send OTP
                </Button>
              </div>

              {error.mobile && (
                <p
                  className="mt-1"
                  style={{
                    fontSize: "var(--font-xs)",
                    color: "var(--color-error)",
                  }}
                >
                  {error.mobile}
                </p>
              )}
            </div>

            {showOtp && (
              <div className="mt-4 text-center">
                <p
                  className="font-medium mb-2"
                  style={{
                    color: "var(--color-text-secondary)",
                    fontSize: "var(--font-small)",
                  }}
                >
                  Enter 4-digit OTP
                </p>

                <div className="flex justify-center gap-2 sm:gap-2.5">
                  {otp.map((digit, index) => (
                    <input
                      key={index}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, index)}
                      onKeyDown={(e) => handleOtpKeyDown(e, index)}
                      maxLength={1}
                      ref={(el) => {
                        otpRefs.current[index] = el;
                      }}
                      className="text-center outline-none"
                      style={{
                        width: "2.5rem",
                        height: "2.5rem",
                        boxShadow: "var(--shadow-md)",
                        border: `1px solid ${
                          error.otp ? "var(--color-error)" : "var(--color-none)"
                        }`,
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: "var(--color-bg)",
                        color: "var(--color-text)",
                        fontWeight: "var(--font-weight-semibold)",
                      }}
                    />
                  ))}

                  {loadingVerify && (
                    <div className="relative w-5 h-5 mt-1">
                      <div
                        className="absolute inset-0 border-4 rounded-full animate-spin"
                        style={{
                          borderColor: "var(--color-border)",
                          borderTopColor: "var(--color-success)",
                        }}
                      ></div>
                    </div>
                  )}
                </div>

                {otpSent && !loadingGenerate && (
                  <div className="mt-2">
                    {resendTimer > 0 ? (
                      <p
                        style={{
                          fontSize: "var(--font-small)",
                          color: "var(--color-text-secondary)",
                        }}
                      >
                        Resend OTP in {resendTimer}s
                      </p>
                    ) : (
                      <button
                        onClick={handleResendOtp}
                        className="font-semibold transition-all"
                        style={{
                          fontSize: "var(--font-small)",
                          color: "var(--color-primary)",
                        }}
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                )}

                {error.otp && (
                  <p
                    className="mt-1"
                    style={{
                      fontSize: "var(--font-xs)",
                      color: "var(--color-error)",
                    }}
                  >
                    {error.otp}
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {verifiedPatients && verifiedPatients.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-3">
              <h3>
                {count} Patient{count > 1 ? "s" : ""}{" "}
                {count > 0 ? "found for existing contact" : "alreay exist"}
              </h3>
              <button
                onClick={() => {
                  onClose();
                  resetState();
                }}
                className="w-8 h-8 flex justify-center items-center rounded-full cursor-pointer text-[var(--color-surface-alt)] bg-[var(--color-primary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)] transition"
              >
                <FaTimes />
              </button>
            </div>

            {verifiedPatients.map((p) => (
              <div
                key={p.patient_id}
                onClick={() => onPatientSelect(p, contact)}
                className="flex items-center justify-between bg-[var(--color-surface-alt)] border-2 border-gray-200 rounded-2xl sm:p-4 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
              >
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 flex items-center justify-center rounded-full"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
                      }}
                    >
                      <FaUser className="text-white text-xl" />
                    </div>

                    <h4>{p.patient_name}</h4>
                    <span
                      style={{ color: "var(--color-primary)", fontWeight: 500 }}
                    >
                      ({p.gender?.toString()?.[0]?.toUpperCase() || "-"})
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-gray-500" />
                      <span>
                        {new Date(p.date_of_birth).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <IoCall className="text-gray-500" />
                      <span>{p.mobile_number}</span>
                    </div>

                    <div className="bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 px-4 py-1 rounded-full text-sm font-semibold">
                      {getAge(p.date_of_birth)} yrs
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="text-center mt-4">
              <p>Do you want to register a new patient? Click below</p>
              <Button
                variant="contained"
                onClick={() => onPatientSelect(null, contact)}
              >
                Register New Patient
              </Button>
            </div>
          </>
        )}

        <div className="flex justify-center mt-4">
          {showOtp && !verifiedPatients && (
            <Button
              onClick={handleConfirm}
              disabled={loadingVerify}
              variant="contained"
            >
              {loadingVerify ? "Verifying..." : "Confirm"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default WalkInVerificationModal;
