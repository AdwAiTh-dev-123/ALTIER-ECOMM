// frontend/src/components/auth/OtpInput.jsx
import React, { useRef } from "react";

const OtpInput = ({ value, onChange, length = 6, disabled }) => {
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const newOtp = value.split("");
    newOtp[index] = char;
    const combined = newOtp.join("");
    onChange(combined);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    onChange(pasted);
    const targetIndex = Math.min(pasted.length, length - 1);
    inputRefs.current[targetIndex]?.focus();
  };

  return (
    <div className="otp-container" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => (inputRefs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          disabled={disabled}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKeyDown(e, i)}
          className="otp-box"
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
};

export default OtpInput;
