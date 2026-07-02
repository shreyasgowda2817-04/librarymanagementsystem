import React, { useState, useRef, useEffect } from "react";

export default function OTPInput({ length = 6, value, onChange, onComplete }) {
  const [otp, setOtp] = useState(new Array(length).fill(""));
  const inputs = useRef([]);

  useEffect(() => {
    if (value === "") {
      setOtp(new Array(length).fill(""));
    }
  }, [value, length]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value.substring(element.value.length - 1);
    setOtp(newOtp);
    onChange(newOtp.join(""));

    // Move to next input if value is entered
    if (element.value && index < length - 1) {
      inputs.current[index + 1].focus();
    }

    if (newOtp.join("").length === length && onComplete) {
      onComplete(newOtp.join(""));
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0) {
        inputs.current[index - 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").slice(0, length);
    if (!/^\d+$/.test(data)) return;

    const newOtp = data.split("");
    const updatedOtp = [...otp];
    newOtp.forEach((char, i) => {
      if (i < length) updatedOtp[i] = char;
    });
    setOtp(updatedOtp);
    onChange(updatedOtp.join(""));
    
    // Focus last filled or next empty
    const nextIndex = Math.min(newOtp.length, length - 1);
    inputs.current[nextIndex].focus();
  };

  return (
    <div className="flex justify-between gap-3 sm:gap-4 py-4">
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          ref={(el) => (inputs.current[index] = el)}
          maxLength="1"
          value={data}
          onPaste={handlePaste}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-full h-16 sm:h-20 text-center text-3xl font-black rounded-xl border-2 border-slate-200 dark:border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all"
        />
      ))}
    </div>
  );
}
