import React, { useState } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { saveDocAPI } from "../../api/SaveDocApi";
import Regex from "../../Helper/Regex";
import { VscPersonAdd } from "react-icons/vsc";
import { FaTimes } from "react-icons/fa";


import { FaUser, FaEnvelope, FaPhone, FaUserMd, FaKey } from "react-icons/fa";

interface AddUserProps {
  onClose: () => void;
  clinicId: number;
}

const AddUser: React.FC<AddUserProps> = ({ onClose, clinicId }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    // doctor: "",
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isClosing, setIsClosing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation();
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 400);
  };

  const validateFields = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    else if (!Regex.name.test(formData.name.trim())) newErrors.name = "Enter a valid name (letters only, 5–50 chars)";

    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!Regex.email.test(formData.email.trim())) newErrors.email = "Enter a valid email";

    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!Regex.MOBILEREGEX.test(formData.phone.trim())) newErrors.phone = "Enter a valid 10-digit phone number starting with 6-9";

    if (!formData.role.trim()) newErrors.role = "Role number is required";
    if (!formData.username.trim()) newErrors.username = "Username number is required";
    if (!formData.password.trim()) newErrors.password = "Password number is required";

    setErrors(newErrors);
    // return Object.keys(newErrors).length === 0;

     if (Object.keys(newErrors).length > 0) {
    toast.error("Please fill all required fields");
    return false;
  }
  return true;
  };

  const handleSave = async () => {
    if (!validateFields()) return;
    setIsSaving(true);
    try {
      const resp = await saveDocAPI({
        clinic_id: clinicId,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role.trim(),
        username: formData.username.trim(),
        password: formData.password.trim(),
      });

      const data = resp?.data ?? resp;
      if (data?.success) {
        toast.success(data?.message || "User added successfully!");
        setFormData({
          name: "",
          email: "",
          phone: "",
          role: "",
          // doctor: "",
          username: "",
          password: "",
        });
        setErrors({});
        handleClose();
      } else {
        if (data?.message) toast.error(data.message);
      }
    } catch (error: any) {
      toast.error("Failed to save user. Check console for details.");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const fields: { name: string; icon: React.ReactNode; type?: string }[] = [
    { name: "name", icon: <FaUser /> },
    { name: "email", icon: <FaEnvelope />, type: "email" },
    { name: "phone", icon: <FaPhone /> },
    { name: "role", icon: <FaUserMd /> },
    // { name: "doctor", icon: <FaClipboardList /> },
    { name: "username", icon: <FaUser /> },
    { name: "password", icon: <FaKey />, type: "password" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center bg-white/40 backdrop-blur-md"
      
    >
      <div
        onClick={handleModalClick}
        className={`bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl w-full max-w-md mx-4 sm:mx-0 p-6 transform ${isClosing ? "animate-slide-out" : "animate-slide-in"
          }`}
      >

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <VscPersonAdd className="text-blue-600 text-2xl" />
            <h2 className="text-xl font-semibold text-gray-800">Add New User</h2>
          </div>

          <button
            onClick={handleClose}
            className="flex justify-center items-center w-8 h-8 rounded-full bg-gray-200 hover:bg-red-500 hover:text-white transition text-gray-600"
          >
            <FaTimes />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {fields.map((field) => (
            <div key={field.name} className="flex flex-col relative">
              <div className="flex items-center">
                {/* Circular icon outside input */}
                <div className="flex-shrink-0 w-10 h-10 flex justify-center items-center bg-gray-200 text-blue-400 rounded-full shadow-md mr-3">
                  {field.icon}
                </div>

                {/* Input field */}
                <input
                  type={field.type || "text"}
                  name={field.name}
                  placeholder={field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                  value={(formData as any)[field.name]}
                  onChange={handleChange}
                  className={`flex-1 border rounded-lg px-4 py-2 bg-white/70 backdrop-blur-sm focus:outline-none transition ${["name", "email", "phone", "role","username","password"].includes(field.name) && errors[field.name]
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-300 focus:ring-blue-400"
                    }`}
                />
              </div>
              {/* {["name", "email", "phone","role","username","password"].includes(field.name) && errors[field.name] && (
                <span className="text-red-500 text-xs ml-15">{errors[field.name]}</span>
              )} */}
            </div>
          ))}

        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
            disabled={isSaving}
          >
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

