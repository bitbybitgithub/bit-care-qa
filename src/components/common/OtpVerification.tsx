import React, { useEffect, useState } from "react";
import Popover from "@mui/material/Popover";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import { toast } from "react-toastify";
import { generateOtpApi, verifyOtpApi } from "../../api/GenerateAndVerifyOtpApi";
import { RESEND_COOLDOWN } from "../../context/constant/constant";

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

  const canResend = Date.now() - lastSent >= RESEND_COOLDOWN;

  const sendOtp = async () => {
    if (!contact) return toast.error("Missing contact");

    setSending(true);
    try {
      const primary = otpType === 2
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
      toast.success("OTP sent");
      setLastSent(Date.now());

      if (res.userId) onUserId?.(Number(res.userId));
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
    if (v.length === 6) verifyOtp(v);
  };

  useEffect(() => {
    if (open) sendOtp();
  }, [open]);

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
          placeholder="Enter Your OTP"
          value={otp}
          onChange={handleChange}
          fullWidth
          inputProps={{ maxLength: 6 }}
        />

        {(sending || verifying) && (
          <div className="flex justify-center">
            <CircularProgress size={22} />
          </div>
        )}

        {!verifying && (
          <button
            onClick={sendOtp}
            disabled={!canResend}
            className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
          >
            {canResend ? "Resend OTP" : "Wait 30s to resend"}
          </button>
        )}
      </div>
    </Popover>
  );
};

export default OtpVerification;
