import React, { useState, useRef, useEffect } from "react";
import type { ChangeEvent,KeyboardEvent } from "react";
import "./Otpverification.css";

interface Props {
  identifier: string;       
  type: "MOBILE" | "EMAIL"; 
}
const Otpverification: React.FC<Props> = ({ identifier, type }) => {
  const [otp, setOtp] = useState<string[]>(new Array(4).fill(""));
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
      fakeVerifyOtp(identifier, otpValue, type)
        .then((res) => {
          console.log("OTP Verified:", res);
          alert(`${type} OTP Verified Successfully!`);
        })
        .catch((err) => {
          console.error("OTP Verification failed:", err);
          alert(`${type} OTP Verification Failed!`);
        });
    }
  }, [otp, identifier, type]);

  return (
    <div className="otp-container">
      <p className="text-sm text-gray-500">
        Enter OTP sent to {type === "MOBILE" ? "mobile" : "email"}:{" "}
        <strong>{identifier}</strong>
      </p>
      {otp.map((value, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          ref={(el) => { inputRefs.current[index] = el; }}
          className="otp-input-box"
        />
      ))}
    </div>
  );
};
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
        reject("Invalid OTP");
      }
    }, 1000);
  });
}

export default Otpverification;