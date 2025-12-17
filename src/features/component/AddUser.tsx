import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import {
  Button,
  FormControl,
  InputAdornment,
  MenuItem,
  TextField,
} from "@mui/material";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaUserMd,
  FaKey,
} from "react-icons/fa";
import { VscPersonAdd } from "react-icons/vsc";

import Regex from "../../Helper/Regex";
import { saveDocAPI } from "../../api/SaveDocApi";
import { getSessionItem } from "../../context/sessions/userSession";
import { getRoles, type Role } from "../../api/MasterApi";

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
  const [roles, setRoles] = useState<Role[]>([]);
  const [formData, setFormData] = useState<Form>({
    name: "",
    email: "",
    phone: "",
    role: "",
    username: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const clinicId = getSessionItem("user", "clinic_id");
  const createdBy = getSessionItem("user", "role");

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const result = await getRoles();
        setRoles(Array.isArray(result.data) ? result.data : []);
        if (!result.success) {
          toast.error(result.error || "Failed to load roles");
        }
      } catch (err) {
        console.error("fetchRoles error:", err);
        setRoles([]);
        toast.error("Failed to load roles");
      }
    };

    fetchRoles();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "name" && /[^a-zA-Z\s]/.test(value)) return;
    if (name === "phone") {
      if (/[^0-9]/.test(value)) return;
      if (value.length === 1 && !/^[6-9]$/.test(value)) return;
      if (value.length > 10) return;
    }

    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const validateFields = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    else if (!Regex.name.test(formData.name))
      newErrors.name = "Invalid name";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!Regex.email.test(formData.email))
      newErrors.email = "Invalid email";

    if (!Regex.MOBILEREGEX.test(formData.phone))
      newErrors.phone = "Invalid phone number";

    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.username.trim())
      newErrors.username = "Username required";
    if (!formData.password.trim())
      newErrors.password = "Password required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
        role: formData.role,
        username: formData.username.trim(),
        password: formData.password.trim(),
        created_by: createdBy,
      };

      const resp = await saveDocAPI(payload);
      const data = (resp as any)?.data ?? resp;

      if (data?.success) {
        toast.success(data.message || "User added successfully");
        handleClose();
      } else {
        toast.error(data?.message || "Failed to add user");
      }
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save user");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur">
      <div
        className={`bg-white rounded-xl w-full max-w-md p-6 transition ${
          isClosing ? "animate-slide-out" : "animate-slide-in"
        }`}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <VscPersonAdd className="text-blue-600 text-xl" />
            <h3 className="font-semibold text-lg">Add New User</h3>
          </div>
          <button onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        {/* FORM */}
        <div className="flex flex-col gap-2">
          <TextField
            name="name"
            placeholder="Name"
            size="small"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name || " "}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaUser />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            name="email"
            placeholder="Email"
            size="small"
            value={formData.email}
            onChange={handleChange}
            error={!!errors.email}
            helperText={errors.email || " "}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaEnvelope />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            name="phone"
            placeholder="Phone"
            size="small"
            value={formData.phone}
            onChange={handleChange}
            error={!!errors.phone}
            helperText={errors.phone || " "}
            inputProps={{ maxLength: 10 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaPhoneAlt />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            name="username"
            placeholder="Username"
            size="small"
            value={formData.username}
            onChange={handleChange}
            error={!!errors.username}
            helperText={errors.username || " "}
             InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaUser />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            name="password"
            type="password"
            placeholder="Password"
            size="small"
            value={formData.password}
            onChange={handleChange}
            error={!!errors.password}
            helperText={errors.password || " "}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaKey />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            select
            size="small"
            name="role"
            placeholder="Select Role"
            value={formData.role}
            onChange={handleChange}
            error={!!errors.role}
            helperText={errors.role || " "}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FaUserMd />
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
            {roles.length === 0 ? (
              <MenuItem disabled>No roles available</MenuItem>
            ) : (
              roles.map((r) => (
                <MenuItem key={r.role_id} value={r.role_name}>
                  {r.role_name}
                </MenuItem>
              ))
            )}
          </TextField>
        </div>

        {/* ACTION */}
        <div className="flex justify-center mt-6">
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
