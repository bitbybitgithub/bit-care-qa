import { useState } from "react";

export const usePasswordStrength = () => {
  const [passwordStrength, setStrength] = useState({
    level: "",
    color: "",
    suggestion: "",
    progress: 0,
  });

  const evaluate = (password: string) => {
    const rules = [
      /.{8,}/.test(password),
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[^A-Za-z0-9]/.test(password),
    ];

    const passed = rules.filter(Boolean).length;
    const config = {
      0: { level: "", color: "", suggestion: "", progress: 0 },
      1: { level: "Weak", color: "var(--color-error)", suggestion: "Use at least 8 characters with letters and numbers.", progress: 33 },
      2: { level: "Weak", color: "var(--color-error)", suggestion: "Use at least 8 characters with letters and numbers.", progress: 33 },
      3: { level: "Medium", color: "var(--color-warning)", suggestion: "Add symbols and mix uppercase/lowercase.", progress: 66 },
      4: { level: "Medium", color: "var(--color-warning)", suggestion: "Add symbols and mix uppercase/lowercase.", progress: 66 },
      5: { level: "Strong", color: "var(--color-success)", suggestion: "Excellent! Your password is strong.", progress: 100 },
    };

    setStrength(config[passed as keyof typeof config]);
  };

  return { passwordStrength, evaluate };
};
