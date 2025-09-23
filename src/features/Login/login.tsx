import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { TextField, Button } from "@mui/material";
import { loginSuccess } from "../../redux/authSlice";
import type { AppDispatch } from "../../redux/store";
import Regex from "../../context/Regex";

const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [number, setNumber] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ number: "", password: "" });

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    if (value.length <= 10) {
      setNumber(value);

      if (Regex.MOBILEREGEX.test(value)) {
        setErrors((prev) => ({ ...prev, number: "" }));
      } else {
        setErrors((prev) => ({
          ...prev,
          number: "Mobile Number must start from 6-9",
        }));
      }
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!Regex.MOBILEREGEX.test(number)) return;

    dispatch(loginSuccess());
    navigate("/dashboard");
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-800">
         Welcome to BitCare Login
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TextField
            value={number}
            placeholder="Enter Mobile Number"
            onChange={handleNumberChange}
            error={!!errors.number}
            helperText={errors.number}
            fullWidth
            inputProps={{ maxLength: 10 }}
          />

          <TextField
            type="password"
            placeholder=""
            value={password}
            onChange={handlePasswordChange}
            fullWidth
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={!!errors.number || !number || !password}
          >
            Login
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Login;
