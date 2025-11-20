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
  FaPhone,
  FaUserMd,
  FaKey,
} from "react-icons/fa";
import { getSessionItem } from "../../context/sessions/userSession";
import { getRoles } from "../../api/MasterApi";

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
      toast.error("Please fill all required fields correctly");
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
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-white/40 backdrop-blur-md">
      <div
        className={`bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl w-full max-w-md mx-4 p-6 transform transition-all ${
          isClosing ? "animate-slide-out" : "animate-slide-in"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <VscPersonAdd className="text-blue-600 text-2xl" />
            <h2 className="text-xl font-semibold text-gray-800">
              Add New User
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex justify-center items-center rounded-full bg-gray-200 hover:bg-red-500 hover:text-white transition"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {["name", "email", "phone", "username", "password"].map((field) => (
            <div key={field} className="flex items-center">
              <div className="flex-shrink-0 w-10 h-10 flex justify-center items-center bg-gray-200 text-blue-400 rounded-full shadow-md mr-3">
                {field === "name" && <FaUser />}
                {field === "email" && <FaEnvelope />}
                {field === "phone" && <FaPhone />}
                {field === "username" && <FaUser />}
                {field === "password" && <FaKey />}
              </div>
              <input
                type={field === "password" ? "password" : "text"}
                name={field}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={(formData as any)[field]}
                onChange={handleChange}
                className={`flex-1 border rounded-lg px-4 py-2 bg-white/70 focus:outline-none transition ${
                  errors[field]
                    ? "border-red-500 focus:ring-red-300"
                    : "border-gray-300 focus:ring-blue-400"
                }`}
              />
            </div>
          ))}

          {/* Role dropdown */}
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 flex justify-center items-center bg-gray-200 text-blue-400 rounded-full shadow-md mr-3">
              <FaUserMd />
            </div>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className={`flex-1 border rounded-lg px-4 py-2 bg-white/70 focus:outline-none transition ${
                errors.role
                  ? "border-red-500 focus:ring-red-300"
                  : "border-gray-300 focus:ring-blue-400"
              }`}
            >
              <option value="">Select Role</option>
              {roles.map((r) => (
                <option key={r.role_id} value={r.role_name}>
                  {r.role_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={handleClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
