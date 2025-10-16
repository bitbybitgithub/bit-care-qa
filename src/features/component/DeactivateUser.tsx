import React, { useState } from "react";
import type { Doctor } from "../../api/DocListApi";

interface DeactivateUserProps {
  doctor: Doctor;
  onClose: () => void;
  onToggleStatus: (id: number, newStatus: "Active" | "Inactive", phone?: string) => void;
}

const DeactivateUser: React.FC<DeactivateUserProps> = ({
  doctor,
  onClose,
  onToggleStatus,
}) => {
  const [phone, setPhone] = useState(doctor.phone || "");
  const isActive = doctor.status === "Active";

  const handleToggle = () => {
  const newStatus: "Active" | "Inactive" = isActive ? "Inactive" : "Active";
  onToggleStatus(doctor.id, newStatus, phone);
  onClose();
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
          {/* <input
            type="email"
            value={doctor.email || ""}
            readOnly
            className="w-full px-3 py-2 border rounded-xl bg-gray-100 text-gray-700"
          />
          <input
            type="text"
            value={doctor.role || ""}
            readOnly
            className="w-full px-3 py-2 border rounded-xl bg-gray-100 text-gray-700"
          /> */}

          {/* Editable phone field */}
          <input
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
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
