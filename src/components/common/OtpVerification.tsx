import React, { useState, useRef, useEffect } from "react";
import type { ChangeEvent, KeyboardEvent } from "react";
import { CircularProgress, Box } from "@mui/material";
import "./Otpverification.css";
import { toast } from "react-toastify";

interface Props {
  identifier: string;
  type: "MOBILE" | "EMAIL";
  onVerified?: () => void;
  onFailed?: (error: string) => void;
}

const OtpVerification: React.FC<Props> = ({ identifier, type, onVerified, onFailed }) => {
  const [otp, setOtp] = useState<string[]>(new Array(4).fill(""));
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value.replace(/\D/g, "");
    const newOtp = [...otp];

    if (value.length <= 1) {
      newOtp[index] = value;
      setOtp(newOtp);
      if (value && index < 3) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

useEffect(() => {
  const otpValue = otp.join("");
  if (otpValue.length === 4) {
    setLoading(true);
    fakeVerifyOtp(identifier, otpValue, type)
      .then(() => {
        setLoading(false);
        onVerified?.();
        toast.success("OTP Verified Success");
      })
      .catch((err) => {
        setLoading(false);
        onFailed?.(err);
        toast.error(err);
      });
  }
}, [otp]); 


  return (
    <Box className="otp-container flex flex-col items-center">
      <p className="text-sm text-gray-500 mb-2">
        Enter OTP sent to {type === "MOBILE" ? "mobile" : "email"}:{" "}
        <strong>{identifier}</strong>
      </p>

      {loading ? (
        <CircularProgress size={28} />
      ) : (
        <div className="flex gap-2">
          {otp.map((value, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={value}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              className="otp-input-box"
            />
          ))}
        </div>
      )}
    </Box>
  );
};

// Fake OTP verification
function fakeVerifyOtp(
  identifier: string,
  otp: string,
  type: "MOBILE" | "EMAIL"
): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (otp === "1234") {
        resolve(`${type} ${identifier} verified with OTP ${otp}`);
      } else {
        toast.error("Invalid OTP");
      }
    });
  });
}

export default OtpVerification;
