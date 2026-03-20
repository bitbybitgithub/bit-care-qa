import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Button, InputAdornment, MenuItem, TextField } from "@mui/material";
import {
  FaTimes,
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaUserMd,
  FaKey,
} from "react-icons/fa";
import { VscPersonAdd } from "react-icons/vsc";
import { saveUsersAPI } from "../../api/clinic/SaveUpdateUserApi";
import { getSessionItem } from "../../context/sessions/userSession";
import { getRoles, type Role } from "../../api/MasterApi";
import { saveLabPharmaUserAPI } from "../../api/CommonApi/SaveLabPharmacyUserApi";
import Regex from "../../context/constant/Regex";

interface AddUserProps {
  onClose: () => void;
  module: string;
  onSuccess?: () => void;
}

interface Form {
  name: string;
  email: string;
  phone: string;
  role: string;
  username: string;
  password: string;
}

const AddUser: React.FC<AddUserProps> = ({ onClose, module,onSuccess }) => {
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
  const [entityId, setEntityId] = useState(0);
  const clinicId = getSessionItem("user", "clinic_id");
  const createdBy = getSessionItem("user", "role");
  const  entity_id= getSessionItem("user", "entity_type");
  const entity_name = getSessionItem<string>("user", "entity_name");
  const clinic_id = getSessionItem<number>("user", "clinic_id");
  const lab_id = getSessionItem<number>("user", "lab_id");
  const pharmacy_id = getSessionItem<number>("user", "pharmacy_id");

  const getEntityId = useCallback((): number => {
  if (entity_name === "clinic") return clinic_id;
  if (entity_name === "lab") return lab_id;
  if (entity_name === "pharmacy") return pharmacy_id;
  return 0;
}, [entity_name, clinic_id, lab_id, pharmacy_id]);

  useEffect(() => {
    setEntityId(getEntityId());
    const fetchRoles = async () => {
      try {
        const result = await getRoles(entity_id);
        setRoles(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        console.error("fetchRoles error:", err);
        toast.error("Failed to load roles");
        setRoles([]);
      }
    };

    fetchRoles();
  }, [module,getEntityId]);

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
    if (name === 'email') {
          setFormData((p) => ({ ...p, [name]: value.toLowerCase() }));
    }
    else {
      setFormData((p) => ({ ...p, [name]: value }));
    }
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const validateFields = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    else if (!Regex.name.test(formData.name)) newErrors.name = "Invalid name";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!Regex.email.test(formData.email))
      newErrors.email = "Invalid email";

    if (!Regex.MOBILEREGEX.test(formData.phone))
      newErrors.phone = "Invalid phone number";

    if (!formData.role) newErrors.role = "Role is required";
    if (!formData.username.trim()) newErrors.username = "Username required";
    if (!formData.password.trim()) newErrors.password = "Password required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateFields()) return;
    setIsSaving(true);

    try {
      let response;

      if (module === "CLINIC") {
        response = await saveUsersAPI({
          clinic_id: clinicId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          username: formData.username.trim(),
          password: formData.password.trim(),
          created_by: createdBy,
        });
      } else {
        response = await saveLabPharmaUserAPI({
          entity_type: entity_name,
          entity_id: entityId,
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          role: formData.role,
          username: formData.username.trim(),
          password: formData.password.trim(),
          created_by: createdBy,
        });
      }

      const data = (response as any)?.data ?? response;
      if (data?.success) {
        onSuccess?.();
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

  useEffect(() => {
  if (roles.length === 1 && !formData.role) {
    setFormData((prev) => ({
      ...prev,
      role: roles[0].role_name,
    }));
  }
}, [roles, formData.role]);


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur">
      <div
        className={`bg-[var(--color-surface-alt)] rounded-xl w-full max-w-md p-6 transition ${isClosing ? "animate-slide-out" : "animate-slide-in"
          }`}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <VscPersonAdd className="text-blue-600 text-xl" />
            <h3 className="font-semibold text-lg">Add New User</h3>
          </div>
          <button
            onClick={handleClose}
            className="bg-[var(--color-primary)] p-1 rounded-full text-white"
          >
            <FaTimes />
          </button>
        </div>

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

          {roles.length <= 1 ? (
            <TextField
              size="small"
              name="role"
              value={roles.length === 1 ? roles[0].role_name : ""}
              disabled
              placeholder="Role"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FaUserMd />
                  </InputAdornment>
                ),
              }}
              helperText={roles.length === 0 ? "No roles available" : " "}
            />
          ) : (
            <TextField
              select
              size="small"
              name="role"
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
                    <span style={{ color: "rgba(0,0,0,0.6)" }}>Select Role</span>
                  ) : (
                    selected
                  ),
                   MenuProps: {
                disablePortal: true, 
                anchorOrigin: {
                  vertical: "top",
                  horizontal: "left",
                },
                transformOrigin: {
                  vertical: "bottom",
                  horizontal: "left",
                },
                PaperProps: {
                  sx: {
                    mt:0,
                  },
                },
              },
              }}
            >
              {roles.map((r) => (
                <MenuItem key={r.role_id} value={r.role_name}>
                  {r.role_name}
                </MenuItem>
              ))}
            </TextField>
          )}

        </div>

        <div className="flex justify-center mt-6">
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddUser;