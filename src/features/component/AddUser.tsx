import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { saveDocAPI } from "../../api/SaveDocApi";
import Regex from "../../Helper/Regex";
import { VscPersonAdd } from "react-icons/vsc";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaUserMd,
  FaKey,
} from "react-icons/fa";
import { getSessionItem } from "../../context/sessions/userSession";
import { getRoles } from "../../api/MasterApi";
import {
  Button,
  FormControl,
  InputAdornment,
  MenuItem,
  TextField,
} from "@mui/material";

interface AddUserProps {
  onClose: () => void;
}

interface Form {
  name: string;
  email: string;
  phone: string;
  role: string;
  username: string;
  password: string;
}

const AddUser: React.FC<AddUserProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<Form>({
    name: "",
    email: "",
    role: "",
    phone: "",
    username: "",
    password: "",
  });

  const clinicId = getSessionItem("user", "clinic_id");
  const role = getSessionItem("user", "role");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const result = await getRoles();
        if (result?.success && result.data) {
          setRoles(result.data);
        } else {
          toast.error(result?.error || "Failed to load roles");
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
        toast.error("Failed to fetch roles");
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "name" && /[^a-zA-Z\s]/.test(value)) return;

    if (name === "phone") {
      if (/[^0-9]/.test(value)) return;
      if (value.length === 1 && !/^[6-9]$/.test(value)) return;
      if (value.length > 10) return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const validateFields = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    else if (!Regex.name.test(formData.name.trim()))
      newErrors.name = "Enter a valid name (letters only, 5–50 chars)";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!Regex.email.test(formData.email.trim()))
      newErrors.email = "Enter a valid email";

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!Regex.MOBILEREGEX.test(formData.phone.trim()))
      newErrors.phone = "Enter a valid 10-digit phone number starting with 6–9";

    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    if (!formData.password.trim()) newErrors.password = "Password is required";

    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      // toast.error("Please fill all required fields correctly");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateFields()) return;
    setIsSaving(true);

    try {
      const payload = {
        clinic_id: clinicId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role.trim(),
        username: formData.username.trim(),
        password: formData.password.trim(),
        created_by: role,
      };

      const resp = await saveDocAPI(payload);
      const data = resp?.data ?? resp;

      if (data?.success) {
        toast.success(data?.message || "User added successfully");
        setFormData({
          name: "",
          email: "",
          phone: "",
          role: "",
          username: "",
          password: "",
        });
        window.location.reload();
        handleClose();
      } else {
        toast.error(data?.message || "Failed to add user");
        window.location.reload();
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save user");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-[var(--color-white)]/40 backdrop-blur-md">
      <div
        className={`bg-[var(--color-bg)]  border border-[var(--color-primary)] shadow-[var(shadow-lg)] rounded-[var(--radius-lg)] w-full max-w-md mx-4 p-6 transform transition-all ${
          isClosing ? "animate-slide-out" : "animate-slide-in"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <VscPersonAdd
              className="text-[var(--color-primary)]"
              style={{ fontSize: "var(--font-h2)" }}
            />
            <h2 className="text-xl font-semibold text-[var(--color-primary)]">
              Add New User
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex justify-center items-center rounded-[var(--radius-full)] cursor-pointer text-[var(--color-white)] bg-[var(--color-primary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)] transition"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-col gap-y-1">
          {/* NAME */}
          <FormControl fullWidth>
            <TextField
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              size="small"
              error={!!errors.name}
              helperText={errors.name || " "}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaUser className="text-[var(--color-text)]" />
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>

          {/* EMAIL */}
          <FormControl fullWidth>
            <TextField
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              size="small"
              error={!!errors.email}
              helperText={errors.email || " "}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaEnvelope className="text-[var(--color-text)]" />
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>

          {/* PHONE */}
          <FormControl fullWidth>
            <TextField
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              size="small"
              error={!!errors.phone}
              helperText={errors.phone || " "}
              inputProps={{ maxLength: 10, inputMode: "tel" }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaPhoneAlt className="text-[var(--color-text)]" />
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>

          {/* USERNAME */}
          <FormControl fullWidth>
            <TextField
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              size="small"
              error={!!errors.username}
              helperText={errors.username || " "}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaUser className="text-[var(--color-text)]" />
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>

          {/* PASSWORD */}
          <FormControl fullWidth>
            <TextField
              name="password"
              type="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              size="small"
              error={!!errors.password}
              helperText={errors.password || " "}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaKey className="text-[var(--color-text)]" />
                  </InputAdornment>
                ),
              }}
            />
          </FormControl>

          {/* ROLE SELECT */}
          <FormControl fullWidth error={!!errors.role}>
            <TextField
              select
              name="role"
              error={!!errors.role} 
              label="" // optional: remove if you don't want a floating label
              value={formData.role}
              onChange={(e: React.ChangeEvent<any>) => handleChange(e)} 
              className="text-[var(--color-text)]"
              size="small"
              fullWidth
              helperText={errors.role || " "}
              // variant="outlined"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaUserMd className="text-[var(--color-text)]"/>
                  </InputAdornment>
                ),
              }}
              SelectProps={{
                displayEmpty: true,
                renderValue: (selected: any) =>
                  !selected ? (
                    <span style={{ color: "rgba(0,0,0,0.6)" }}>
                      Select Role
                    </span>
                  ) : (
                    selected
                  ),
              }}
            >
              <MenuItem value="">
                <em>Select Role</em>
              </MenuItem>

              {roles.map((r) => (
                <MenuItem key={r.role_id} value={r.role_name}>
                  {r.role_name}
                </MenuItem>
              ))}
            </TextField>
          </FormControl>
          {/* <FormControl fullWidth error={!!errors.role}>
            <TextField
              name="role"
              select
              size="small"
              value={formData.role}
              onChange={handleChange}
              placeholder="Select Role"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaUserMd />
                  </InputAdornment>
                ),
               
              }}
              helperText={errors.role || " "}
            >
              <option value="">Select Role</option>
              {roles.map((r) => (
                <option key={r.role_id} value={r.role_name}>
                  {r.role_name}
                </option>
              ))}
            </TextField>
          </FormControl> */}
        </div>

        <div className="flex justify-center gap-4 mt-8">
       
          <Button
            onClick={handleSave}
            disabled={isSaving}
            variant="contained"
            className="px-4 py-2 rounded-xl bg-[var(--color-success)] hover:bg-blue-700 text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed normal-case"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
