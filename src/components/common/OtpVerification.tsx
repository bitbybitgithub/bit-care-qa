import React, { useEffect, useRef, useState } from "react";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import { toast } from "react-toastify";
import { generateOtpApi, verifyOtpApi } from "../../api/GenerateAndVerifyOtpApi";
import { Email_Otp_Sent, Email_Otp_Verify, Mobile_Otp_Sent, Mobile_Otp_Verify, RESEND_COOLDOWN } from "../../context/constant/constant";

interface Props {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  contact: string;
  otpType: 1 | 2;
  userId?: number;
  onUserId?: (id: number) => void;
  onVerified: () => void;
}

const OtpVerification: React.FC<Props> = ({
  anchorEl,
  open,
  onClose,
  contact,
  otpType,
  userId,
  onUserId,
  onVerified,
}) => {
  const [otp, setOtp] = useState("");
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [lastSent, setLastSent] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);

  const inputRef = useRef<HTMLInputElement | null>(null);

  const canResend = Date.now() - lastSent >= RESEND_COOLDOWN;

  const sendOtp = async () => {
    if (!contact) return toast.error("Missing contact");
    if (!canResend) return;

    setSending(true);

    try {
      const primary =
        otpType === 2
          ? { mobile_number: contact, otp_type: otpType }
          : { email: contact, otp_type: otpType };

      let res = await generateOtpApi(primary);

      if (!res?.success) {
        const alternates = [
          { email_address: contact, otp_type: otpType },
          { user_email: contact, otp_type: otpType },
        ];

        for (const alt of alternates) {
          const altRes = await generateOtpApi(alt);
          if (altRes?.success) {
            res = altRes;
            break;
          }
        }
      }

      if (!res?.success) {
        toast.error(res?.message || "Failed to send OTP");
        return;
      }
      if(res.success)
      {if(otpType==2)
        {toast.success(Mobile_Otp_Sent)}
        if(otpType==1)
        {toast.success(Email_Otp_Sent)}
      }
      const now = Date.now();
      setLastSent(now);
      setTimeLeft(RESEND_COOLDOWN / 1000);

      if (res.userId) onUserId?.(Number(res.userId));

      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      toast.error("Error sending OTP");
    } finally {
      setSending(false);
    }
  };

  const verifyOtp = async (entered: string) => {
    if (!userId) return toast.error("User ID missing for verification");

    setVerifying(true);

    try {
      const res = await verifyOtpApi({
        userId,
        otp: Number(entered),
        otp_type: otpType,
      });

      if (!res?.success) {
        toast.error(res?.message || "Invalid OTP");
        return;
      }
      if(res.success)
      {if(otpType==2)
        {toast.success(Mobile_Otp_Verify)}
        if(otpType==1)
        {toast.success(Email_Otp_Verify)}
      }
      toast.success("OTP verified");
      setOtp("");
      onClose();
      onVerified();
    } catch {
      toast.error("Verification failed");
    } finally {
      setVerifying(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9]/g, "");
    setOtp(v);

    if (v.length === 4) verifyOtp(v);
  };

  useEffect(() => {
    if (open) sendOtp();
  }, [open]);

  useEffect(() => {
    if (!lastSent) return;

    const interval = setInterval(() => {
      const diff = RESEND_COOLDOWN - (Date.now() - lastSent);
      const seconds = Math.max(Math.ceil(diff / 1000), 0);

      setTimeLeft(seconds);

      if (seconds <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [lastSent]);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      transformOrigin={{ vertical: "top", horizontal: "center" }}
    >
      <div className="p-4 w-[260px] flex flex-col gap-3">
        <TextField
          placeholder="Enter OTP"
          value={otp}
          onChange={handleChange}
          fullWidth
          inputRef={inputRef}
          inputProps={{ maxLength: 4, inputMode: "numeric" }}
        />

        <div className="flex items-center justify-center gap-2">
          {!verifying && (
            <>
              <button
                onClick={sendOtp}
                disabled={!canResend || sending}
                className={`text-sm hover:underline disabled:text-gray-400 disabled:cursor-not-allowed ${
                  sending ? "text-gray-500" : "text-blue-600"
                }`}
              >
                {sending ? "Sending OTP..." : "Resend OTP"}
              </button>

              {!canResend && (
                <span className="text-xs text-gray-500">
                  {timeLeft}s
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </Popover>
  );
};

export default OtpVerification;