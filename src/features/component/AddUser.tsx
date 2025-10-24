

import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { saveDocAPI } from "../../api/SaveDocApi";
import Regex from "../../Helper/Regex";

interface AddUserProps {
  onClose: () => void;
  clinicId: number;
}

const AddUser: React.FC<AddUserProps> = ({ onClose, clinicId }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    doctor: "",
    phone: "",
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // clear error while typing
  };

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 400);
  };

  const validateForm = (): boolean => {
    const { name, email, phone, username, password } = formData;
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = "Name is required";
    else if (!Regex.name.test(name.trim())) newErrors.name = "Enter a valid name (only letters, min 3 chars)";

    if (!email.trim()) newErrors.email = "Email is required";
    else if (!Regex.email.test(email.trim())) newErrors.email = "Enter a valid email address";

    if (!phone.trim()) newErrors.phone = "Phone number is required";
    else if (!Regex.MOBILEREGEX.test(phone.trim())) newErrors.phone = "Enter a valid 10-digit mobile number";

    if (!username.trim()) newErrors.username = "Username is required";
    else if (!Regex.username.test(username.trim())) newErrors.username = "Username must be 3–16 characters (letters, numbers, underscores)";

    if (!password.trim()) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters long";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    // client-side validation first
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // saveDocAPI uses emrAPI.post("/doctors/add-doctor", doctorData)
      const resp = await saveDocAPI({
        clinic_id: clinicId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role.trim(),
        phone: formData.phone.trim(),
        username: formData.username.trim(),
        password: formData.password.trim(),
      });

      // Expecting backend to return something like { success: true, message: '...', data: {...} }
      const data = resp?.data ?? resp;
      if (data?.success) {
        toast.success(data?.message || "User added successfully!");
        setFormData({
          name: "",
          email: "",
          role: "",
          doctor: "",
          phone: "",
          username: "",
          password: "",
        });
        setErrors({});
        handleClose();
      } else {
        // Backend returned success: false — try to extract validation errors
        // Backend common patterns:
        //  - { success: false, errors: { username: 'Taken', email: 'Invalid' }, message: '...' }
        //  - { success: false, message: 'Username already exists' }
        const serverErrors: Record<string, string> = {};
        if (data?.errors && typeof data.errors === "object") {
          Object.entries(data.errors).forEach(([k, v]) => {
            serverErrors[k] = Array.isArray(v) ? (v as any).join(", ") : String(v);
          });
        } else if (data?.message && typeof data.message === "string") {
          // If backend gives a single message, show it as a toast and optionally attach it to a generic field
          toast.error(data.message);
        }
        setErrors((prev) => ({ ...prev, ...serverErrors }));
      }
    } catch (error: any) {
      console.error("Save failed:", error);

      // Try to map axios-like error responses to inline errors
      const resp = error?.response?.data;
      if (resp) {
        // resp might be { errors: {...} } or { message: '...' }
        if (resp.errors && typeof resp.errors === "object") {
          const serverErrors: Record<string, string> = {};
          Object.entries(resp.errors).forEach(([k, v]) => {
            serverErrors[k] = Array.isArray(v) ? (v as any).join(", ") : String(v);
          });
          setErrors((prev) => ({ ...prev, ...serverErrors }));
        } else if (resp.message) {
          // generic server message
          toast.error(String(resp.message));
        } else {
          toast.error("Failed to save user. See console for details.");
        }
      } else {
        // network error or something unexpected
        toast.error("Network or server error. Check console.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const fields = ["name", "email", "role", "doctor", "phone", "username", "password"];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center bg-white/40 backdrop-blur-md"
      onClick={handleClose}
    >
      <div
        onClick={handleModalClick}
        className={`bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl w-full sm:w-[400px] p-6 transform ${
          isClosing ? "animate-slide-out" : "animate-slide-in"
        }`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Add New User</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-red-500 transition text-lg">✕</button>
        </div>

        <div className="flex flex-col gap-4">
          {fields.map((field) => (
            <div key={field} className="flex flex-col">
              <input
                type={field === "email" ? "email" : field === "password" ? "password" : "text"}
                name={field}
                placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={(formData as any)[field]}
                onChange={handleChange}
                className={`border rounded-lg px-4 py-2 bg-white/70 backdrop-blur-sm focus:outline-none transition ${
                  errors[field] ? "border-red-500 focus:ring-red-300" : "border-gray-300 focus:ring-blue-400"
                }`}
              />
              {errors[field] && <span className="text-red-500 text-xs mt-1">{errors[field]}</span>}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button onClick={handleClose} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition" disabled={isSaving}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddUser;


