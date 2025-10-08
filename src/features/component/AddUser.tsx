import React, { useState } from "react";

interface AddUserProps {
  onClose: () => void;
}

const AddUser: React.FC<AddUserProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    doctor: "",
  });
  const [isClosing, setIsClosing] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // prevent backdrop click propagation
  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => onClose(), 400);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center bg-white/40 backdrop-blur-md"
      onClick={handleClose}
    >
      {/* Modal Card */}
      <div
        onClick={handleModalClick}
        className={`bg-white/90 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-3xl w-full sm:w-[400px] p-6 transform ${
          isClosing ? "animate-slide-out" : "animate-slide-in"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            Add New User
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-red-500 transition text-lg"
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <input
            type="text"
            name="role"
            placeholder="Role"
            value={formData.role}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
          <input
            type="text"
            name="doctor"
            placeholder="Doctor"
            value={formData.doctor}
            onChange={handleChange}
            className="border border-gray-300 rounded-lg px-4 py-2 bg-white/70 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md transition">
            Save
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes slideInFromLeft {
            0% {
              transform: translateX(-100%) scale(1);
              opacity: 0;
            }
            60% {
              transform: translateX(10%) scale(1.03);
              opacity: 1;
            }
            100% {
              transform: translateX(0) scale(1);
              opacity: 1;
            }
          }

          @keyframes slideOutToRight {
            0% {
              transform: translateX(0) scale(1);
              opacity: 1;
            }
            40% {
              transform: translateX(10%) scale(1.05);
              opacity: 0.8;
            }
            100% {
              transform: translateX(100%) scale(0.9);
              opacity: 0;
            }
          }

          .animate-slide-in {
            animation: slideInFromLeft 0.5s ease-out forwards;
          }

          .animate-slide-out {
            animation: slideOutToRight 0.5s ease-in forwards;
          }
        `}
      </style>
    </div>
  );
};

export default AddUser;
