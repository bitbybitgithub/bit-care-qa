import React, { useEffect, useState } from "react";
import {
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCertificate,
  FaCalendarAlt,
} from "react-icons/fa";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import doc from "../../assets/doc.jpg";
import { getDoctorProfile } from "../../api/DocProfileApi";

const DoctorProfile = () => {
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const data = await getDoctorProfile(2); // doctor_id = 2 (can be dynamic)
        setDoctor(data);
        setFormData(data);
      } catch (error) {
        console.error("Failed to load doctor profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorProfile();
  }, []);

  const handleEditClick = () => {
    setFormData(doctor);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    console.log("Updated Data:", formData);
    // TODO: call your update API here (e.g., updateDoctorProfile(formData))
    setDoctor(formData);
    setOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <CircularProgress />
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="flex justify-center items-center h-screen text-red-500">
        Failed to load doctor profile.
      </div>
    );
  }

  return (
    <div className="flex justify-center mt-10">
      {/* Common Card */}
<div className="flex flex-col md:flex-row w-full max-w-full md:max-w-4xl
                bg-blue-100 p-4
                rounded-md md:rounded-lg lg:rounded-l-full lg:rounded-r-lg
                shadow-xl overflow-hidden
                transition-all duration-300 hover:shadow-2xl">
        {/* Left Section */}
        <div className="md:w-2/5 w-full bg-blue-200 flex rounded-l-full justify-center items-center p-6 relative">
          <img
            src={doc}
            alt="Doctor"
            className="w-56 h-56 object-cover rounded-full border-10 border-white shadow-md"
          />
        </div>

        {/* Right Section */}
        <div className="md:w-3/5 w-full bg-white flex flex-col justify-center rounded-l-2xl p-6 relative">
          <h2 className="text-3xl font-semibold text-gray-800 mb-1">
            {doctor.doctor_name}
          </h2>
          <p className="text-indigo-600 font-medium text-sm mb-4">
            {doctor.title}
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-2">
            About Doctor
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {doctor.doctor_name} is a {doctor.title} with over{" "}
            {doctor.experience} years of experience.
          </p>

          <div className="space-y-2 text-gray-700 text-sm">
            <p className="flex items-center">
              <FaCertificate className="mr-2 text-blue-500" />{" "}
              {doctor.qualification}
            </p>
            <p className="flex items-center">
              <FaPhoneAlt className="mr-2 text-green-500" /> {doctor.phone}
            </p>
            <p className="flex items-center">
              <FaCalendarAlt className="mr-2 text-yellow-500" />{" "}
              {doctor.experience} years experience
            </p>
            <p className="flex items-center">
              <FaMapMarkerAlt className="mr-2 text-red-500" /> {doctor.address}
            </p>
          </div>

          <div className="mt-6">
            <Button
              variant="contained"
              color="primary"
              sx={{
                width: "30%",
                borderRadius: "50px",
                textTransform: "none",
                fontWeight: 500,
              }}
              onClick={handleEditClick}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {/* <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Doctor Profile</DialogTitle>
        <DialogContent dividers>
          <div className="flex flex-col gap-4 mt-2">
            <TextField
              label="Name"
              name="doctor_name"
              value={formData.doctor_name || ""}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Title"
              name="title"
              value={formData.title || ""}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Qualification"
              name="qualification"
              value={formData.qualification || ""}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Phone"
              name="phone"
              value={formData.phone || ""}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Experience (years)"
              name="experience"
              value={formData.experience || ""}
              onChange={handleChange}
              fullWidth
              type="number"
            />
            <TextField
              label="Address"
              name="address"
              value={formData.address || ""}
              onChange={handleChange}
              fullWidth
            />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog> */}

      {/*  Edit Doctor Profile Dialog (Themed UI) */}
<Dialog
  open={open}
  onClose={handleClose}
  maxWidth="xs" 
  PaperProps={{
    sx: {
      borderRadius: "24px",
      overflow: "hidden",
      boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
      background: "linear-gradient(145deg, #ebf8ff, #f8fafc)",
      width: "500px", 
      maxWidth: "90%", 
    },
  }}
>

  {/* Header Section */}
  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex items-center justify-start gap-4 text-white rounded-b-3xl rounded-tr-3xl shadow-md">
  <img
    src={doc}
    alt="Doctor"
    className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
  />

  <div className="flex flex-col">
    <h2 className="text-2xl font-semibold leading-tight">
      {formData.doctor_name || "Dr. Name"}
    </h2>
    <p className="text-sm text-blue-100">{formData.title || "Specialist"}</p>
  </div>
</div>


  {/* Content Section */}
  <DialogContent
    dividers
    sx={{
      border: "none",
      px: 4,
      
      backgroundColor: "#f9fafb",
    }}
  >
    <div className="flex flex-col gap-5 mt-2 ">
      <div className="text-center mb-2 px-2">
        <h3 className="text-lg font-semibold text-gray-800">
          Edit Profile Details
        </h3>
        <p className="text-gray-500 text-sm">
          Update your clinic and personal information below.
        </p>
      </div>

      {[
        { label: "Full Name", name: "doctor_name" },
        { label: "Specialty", name: "title" },
        { label: "Qualification", name: "qualification" },
        { label: "Phone Number", name: "phone" },
        { label: "Experience (years)", name: "experience", type: "number" },
        { label: "Clinic Address", name: "address" },
      ].map((field, index) => (
        <TextField
  key={index}
  label={field.label}
  name={field.name}
  value={formData[field.name] || ""}
  onChange={handleChange}
  type={field.type || "text"}
  fullWidth
  variant="outlined"
  sx={{
    marginY: 0, // vertical margin (top & bottom)
    "& .MuiOutlinedInput-root": {
      borderRadius: "18px",
      backgroundColor: "white",
      padding: "0.1px 10px", // inner padding of the input
      "&:hover fieldset": {
        borderColor: "#60a5fa",
      },
      "&.Mui-focused fieldset": {
        borderColor: "#2563eb",
        borderWidth: 1,
      },
    },
    "& .MuiInputLabel-root": {
      margin: 0, // remove default margin
      fontSize: "0.875rem", // smaller label
    },
    "& .MuiInputLabel-root.Mui-focused": {
      color: "#2563eb",
      fontWeight: 500,
    },
  }}
/>

      ))}
    </div>
  </DialogContent>

  {/* Action Buttons */}
  <DialogActions
    sx={{
      justifyContent: "space-between",
      px: 4,
      py: 2,
      borderTop: "1px solid #e5e7eb",
      backgroundColor: "#f9fafb",
    }}
  >
    <Button
      onClick={handleClose}
      sx={{
        textTransform: "none",
        borderRadius: "50px",
        px: 3,
        py: 1,
        fontWeight: 500,
        backgroundColor: "#e5e7eb",
        color: "#374151",
        "&:hover": { backgroundColor: "#d1d5db" },
      }}
    >
      Cancel
    </Button>

    <Button
      onClick={handleSave}
      variant="contained"
      sx={{
        textTransform: "none",
        borderRadius: "50px",
        px: 3,
        py: 1,
        fontWeight: 600,
        background:
          "linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
        "&:hover": {
          background:
            "linear-gradient(90deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)",
        },
        color: "white",
        boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
      }}
    >
      Save Changes
    </Button>
  </DialogActions>
</Dialog>
    </div>
  );
};

export default DoctorProfile;


