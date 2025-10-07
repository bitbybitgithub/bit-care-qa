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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Prevent clicks inside the modal from closing it
  const handleModalClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
  };

  return (
    <div
      className="fixed inset-0 flex justify-center items-center z-50 backdrop-blur-sm bg-black/30"
      onClick={onClose} 
    >
      {/* Modal Card */}
      <div
        className="bg-white w-full md:w-1/3 rounded-3xl p-6 shadow-xl animate-scale-up z-50"
        onClick={handleModalClick} 
      >
        <h2 className="text-xl font-semibold mb-4 text-center">Add New User</h2>

        <div className="flex flex-col gap-4">
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="role"
            placeholder="Role"
            value={formData.role}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            name="doctor"
            placeholder="Doctor"
            value={formData.doctor}
            onChange={handleChange}
            className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition"
            onClick={onClose} // Cancel button closes modal
          >
            Cancel
          </button>
          <button className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition">
            Save
          </button>
        </div>
      </div>

      {/* Keyframes for scale-up animation */}
      <style>
        {`
          @keyframes scaleUp {
            0% { transform: scale(0.5); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-scale-up {
            animation: scaleUp 0.3s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
};

export default AddUser;
