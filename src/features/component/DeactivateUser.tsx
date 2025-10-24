import React, { useState, useEffect } from "react";
import type { Doctor } from "../../api/DocListApi";
import Regex from "../../Helper/Regex"; // single clean import

interface DeactivateUserProps {
  doctor: Doctor;
  onClose: () => void;
  onToggleStatus: (
    id: number,
    newStatus: "Active" | "Inactive",
    phone?: string
  ) => void;
}

const DeactivateUser: React.FC<DeactivateUserProps> = ({
  doctor,
  onClose,
  onToggleStatus,
}) => {
  const [phone, setPhone] = useState(doctor.phone || "");
  const [phoneError, setPhoneError] = useState("");
  const isActive = doctor.status === "Active";

  // ✅ Reset phone whenever modal opens or doctor changes
  useEffect(() => {
    setPhone(doctor.phone || "");
    setPhoneError("");
  }, [doctor]);

  const handleToggle = () => {
    if (!Regex.MOBILEREGEX.test(phone)) {
      alert("Invalid phone number. Must start with 6-9 and be 10 digits.");
      return;
    }

    const newStatus: "Active" | "Inactive" = isActive ? "Inactive" : "Active";
    onToggleStatus(doctor.id, newStatus, phone);

    // ✅ Clear phone before closing
    setPhone("");
    setPhoneError("");
    setTimeout(onClose, 0);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black/20">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg relative">
        <h2 className="text-xl font-semibold mb-4">Personal Details</h2>

        <div className="flex flex-col gap-3">
          {/* Read-only fields */}
          <input
            type="text"
            value={doctor.name}
            readOnly
            className="w-full px-3 py-2 border rounded-xl bg-gray-100 text-gray-700"
          />
          <input
            type="text"
            value={doctor.specialist || ""}
            readOnly
            className="w-full px-3 py-2 border rounded-xl bg-gray-100 text-gray-700"
          />

          {/* Editable phone field */}
          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => {
              const value = e.target.value;
              setPhone(value);

              if (!Regex.MOBILEREGEX.test(value)) {
                setPhoneError(
                  "Invalid phone number. Must start with 6-9 and be 10 digits."
                );
              } else {
                setPhoneError("");
              }
            }}
            className={`w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 ${
              phoneError
                ? "border-red-500 focus:ring-red-400"
                : "focus:ring-blue-400"
            }`}
            maxLength={10}
          />

          {phoneError && (
            <p className="text-red-500 text-sm mt-1">{phoneError}</p>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          className={`mt-5 w-full py-2.5 rounded-2xl font-medium shadow-md transition ${
            isActive
              ? "bg-red-500 hover:bg-red-600 text-white"
              : "bg-green-500 hover:bg-green-600 text-white"
          }`}
        >
          {isActive ? "Deactivate Account" : "Activate Account"}
        </button>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 font-bold"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default DeactivateUser;
