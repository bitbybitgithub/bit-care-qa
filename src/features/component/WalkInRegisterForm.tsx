import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaCalendarAlt,
  FaEnvelope,
  FaUserMd,
  FaClipboardList,
} from "react-icons/fa";
import { MdPhoneInTalk } from "react-icons/md";
import {
  validateRegistration,
  type Errors as ValidationErrors,
} from "../../helper/ErrorHandler";

type WalkinFormData = {
  name: string;
  dob: string;
  email: string;
  phone: string;
  doctor: string;
  reason: string;
};

type WalkInRegisterFormProps = {
  onClose: () => void;
    patientData?: any; 
};

const doctors = ["Dr. A. Patel", "Dr. R. Mehta", "Dr. S. Rao", "Dr. K. Singh"];

const WalkInRegisterForm: React.FC<WalkInRegisterFormProps> = ({ onClose, patientData }) => {
  const [formData, setFormData] = useState<WalkinFormData>({
    name: "",
    dob: "",
    email: "",
    phone: "",
    doctor: "",
    reason: "",
  });

  const [errors, setErrors] = useState<Partial<ValidationErrors>>({});
//   useEffect(() => {
//     console.log(patientData);
    
//   if (patientData) {
//     setFormData({
//       name: patientData.patient_name ||"",
      
//       dob:
//         patientData.date_of_birth ||  
//         "",
//       email: patientData.email || "",
//       phone: patientData.mobile_number || patientData.mobile_number || "",
//       doctor: "",
//       reason: "",
//     });
//   } else {
//     // reset to empty if no existing patient
//     setFormData({
//       name: "",
//       dob: "",
//       email: "",
//       phone: "",
//       doctor: "",
//       reason: "",
//     });
//   }
// }, [patientData]);
useEffect(() => {
  console.log(patientData);

  if (patientData) {
    setFormData({
      name: patientData.patient_name || "",
      dob: patientData.date_of_birth
        ? new Date(patientData.date_of_birth).toISOString().split("T")[0]
        : "",
      email: patientData.email || "",
      phone: patientData.mobile_number || "",
      doctor: "",
      reason: "",
    });
  } else {
    // reset to empty if no existing patient
    setFormData({
      name: "",
      dob: "",
      email: "",
      phone: "",
      doctor: "",
      reason: "",
    });
  }
}, [patientData]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    const key = name as keyof WalkinFormData;
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [key]: "" }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
    };

    const validationErrors = validateRegistration(payload as any);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    alert("Walk-in registration successful!");
    setFormData({
      name: "",
      dob: "",
      email: "",
      phone: "",
      doctor: "",
      reason: "",
    });
    setErrors({});
    onClose(); 
  };

  
  return (
    <div className="fixed inset-0 flex justify-center items-center bg-black/40 z-50">
      <form
        onSubmit={handleSubmit}
        className="relative bg-white shadow-2xl rounded-2xl p-8 w-full max-w-lg"
      >

        <h2 className="text-2xl font-semibold text-center mb-6 text-gray-800">
          Walk-In Patient Registration
        </h2>

        {/* Name */}
        <div className="mb-2">
          <label className="block text-gray-700 font-medium mb-1">Full Name</label>
          <div
            className={`flex items-center border rounded-lg px-3 py-2 transition-all ${
              errors.name
                ? "border-red-500 ring-1 ring-red-400"
                : "focus-within:ring-2 focus-within:ring-blue-400"
            }`}
          >
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className="w-full outline-none"
            />
          </div>
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* DOB + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Date of Birth
            </label>
            <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
              <FaCalendarAlt className="text-gray-500 mr-2" />
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Mobile Number
            </label>
            <div
              className={`flex items-center border rounded-lg px-3 py-2 transition-all ${
                errors.phone
                  ? "border-red-500 ring-1 ring-red-400"
                  : "focus-within:ring-2 focus-within:ring-blue-400"
              }`}
            >
              <MdPhoneInTalk
                className={`mr-2 ${
                  errors.phone ? "text-red-500" : "text-gray-500"
                }`}
              />
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
                inputMode="numeric"
                className="w-full outline-none"
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="mb-2">
          <label className="block text-gray-700 font-medium mb-1">
            Email Address
          </label>
          <div
            className={`flex items-center border rounded-lg px-3 py-2 transition-all ${
              errors.email
                ? "border-red-500 ring-1 ring-red-400"
                : "focus-within:ring-2 focus-within:ring-blue-400"
            }`}
          >
            <FaEnvelope
              className={`mr-2 ${
                errors.email ? "text-red-500" : "text-gray-500"
              }`}
            />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@domain.com"
              className="w-full outline-none"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>

        {/* Doctor */}
        <div className="mb-2">
          <label className="block text-gray-700 font-medium mb-1">
            Select Doctor
          </label>
          <div className="flex items-center border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
            <FaUserMd className="text-gray-500 mr-2" />
            <select
              name="doctor"
              value={formData.doctor}
              onChange={handleChange}
              className="w-full outline-none bg-transparent"
            >
              <option value="">-- Select Doctor --</option>
              {doctors.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">
            Reason for Visit
          </label>
          <div className="flex items-start border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-400">
            <FaClipboardList className="text-gray-500 mt-2 mr-2" />
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Describe reason for visit"
              rows={3}
              className="w-full outline-none resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-full transition"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 hover:bg-gray-100 rounded-full py-2 font-medium transition"
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );


  
};

export default WalkInRegisterForm;
