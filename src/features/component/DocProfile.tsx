import React, { useEffect, useState } from "react";
import {
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTimes,
} from "react-icons/fa";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
} from "@mui/material";
import doc from "../../assets/doc.jpg";
import { getDoctorProfile } from "../../api/DocProfileApi";
import {
  updateDoctorProfile,
  type UpdateDoctorProfileResponse,
} from "../../api/UpdateDocProfileApi";
import { FaGraduationCap } from "react-icons/fa6";


const DoctorProfile = () => {
  const [doctor, setDoctor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  // Snackbar state
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState<"success" | "error">(
    "success"
  );

  const showAlert = (message: string, severity: "success" | "error") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const handleAlertClose = () => setAlertOpen(false);

  useEffect(() => {
    const fetchDoctorProfile = async () => {
      try {
        const data = await getDoctorProfile(2); // doctor_id = 2 (example)
        setDoctor(data);
        setFormData(data);
      } catch (error) {
        console.error("Failed to load doctor profile:", error);
        showAlert("Failed to load doctor profile", "error");
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

  const handleClose = () => setOpen(false);

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setFormData({ ...formData, [e.target.name]: e.target.value });
  // };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value, type } = e.target;

  // Restrict negative numbers for experience
  if (name === "experience" && type === "number") {
    const numValue = Number(value);
    if (numValue < 0) return; // prevent updating if below 0
  }

  setFormData({ ...formData, [name]: value });
};


  // ✅ Save changes API call
  const handleSave = async () => {
    if (!doctor) return;
    try {
      setSaving(true);

      // map formData to backend expected payload
      const payload = {
        doctor_id: 2, // from fetched doctorv fetch from localstorage
        clinic_id: 101, // as you said
        doctor_name: formData.doctor_name,
        qualification: formData.qualification,
        specialization: formData.title, // map Specialty input to specialization
        phone: formData.phone,
        experience: Number(formData.experience),
      };

      const response: UpdateDoctorProfileResponse = await updateDoctorProfile(
        payload
      );

      if (response.success) {
        setDoctor({ ...doctor, ...payload });
        setOpen(false);
        enqueueSnackbar(response.message || "Profile updated successfully!", {
          variant: "success",
        });
      } else {
        enqueueSnackbar(response.message || "Failed to update profile", {
          variant: "error",
        });
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      enqueueSnackbar("Something went wrong while updating profile", {
        variant: "error",
      });
    } finally {
      setSaving(false);
    }
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
      {/* Profile Card */}
      <div
        className="flex flex-col md:flex-row w-full max-w-full md:max-w-4xl
          bg-blue-100 p-4
          rounded-md md:rounded-lg lg:rounded-l-full lg:rounded-r-lg
          shadow-xl overflow-hidden
          transition-all duration-300 "
      >
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
            {doctor.specialized_in}
          </p>

          <h3 className="text-lg font-medium text-gray-800 mb-2">
            About Doctor
          </h3>
          <p className="text-gray-600 text-sm leading-relaxed mb-4">
            {doctor.doctor_name} is a {doctor.specialized_in} with over{" "}
            {doctor.experience} years of experience.
          </p>

          <div className="space-y-2 text-gray-700 text-sm">
            <p className="flex items-center">
              <FaGraduationCap className="mr-2 text-blue-500" />{" "}
              {doctor.qualification}
            </p>
            <p className="flex items-center">
              <FaPhoneAlt className="mr-2 text-green-500" /> {doctor.phone}
            </p>
            <p className="flex items-center">
              <FaCalendarAlt className="mr-2 text-yellow-500" />{" "}
              {doctor.experience} years
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
      width: {
        xs: "80%", // small screens
        sm: "60%", // small-medium
        md: "30%", // medium and up
      },
      borderRadius: "50px",
      textTransform: "none",
      fontWeight: 500,
      display: "block",      // center the button
      mx: "auto",            // margin auto for horizontal centering
    }}
    onClick={handleEditClick}
  >
    Edit Profile
  </Button>
</div>

          
        </div>
      </div>

      {/* Edit Profile Dialog */}
      {/* <Dialog
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
      > */}

      <Dialog
  open={open}
  onClose={(_, reason) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") return;
    handleClose();
  }}
  disableEscapeKeyDown
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

        {/* Header */}
        {/* <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex items-center justify-start gap-4 text-white rounded-b-3xl rounded-tr-3xl shadow-md">
          <img
            src={doc}
            alt="Doctor"
            className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
          />
          <div className="flex flex-col">
            <h2 className="text-2xl font-semibold leading-tight">
              {formData.doctor_name || "Dr. Name"}
            </h2>
            <p className="text-sm text-blue-100">
              {formData.title || "Specialist"}
            </p>
          </div>
        </div> */}

        {/* Header */}
<div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex items-center justify-between gap-4 text-white rounded-b-3xl rounded-tr-3xl shadow-md relative">
  <div className="flex items-center gap-4">
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

  {/* Close Icon */}
  <button
    onClick={handleClose}
    className="absolute top-3 right-3 text-white text-xl p-1 rounded-full hover:bg-gray hover:bg-opacity-10 transition"
  >
    <FaTimes />
  </button>
</div>


        {/* Content */}
        <DialogContent
          dividers
          sx={{ border: "none", px: 4, backgroundColor: "#f9fafb" }}
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
              {
                label: "Experience (years)",
                name: "experience",
              },
            ].map((field, index) => (
              <TextField
                key={index}
                label={field.label}
                name={field.name}
                value={formData[field.name] || ""}
                onChange={handleChange}
                type= "text"
                fullWidth
                variant="outlined"
                sx={{
                  marginY: 0,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "18px",
                    backgroundColor: "white",
                    padding: "0.1px 10px",
                    "&:hover fieldset": { borderColor: "#60a5fa" },
                    "&.Mui-focused fieldset": {
                      borderColor: "#2563eb",
                      borderWidth: 1,
                    },
                  },
                  "& .MuiInputLabel-root": { margin: 0, fontSize: "0.875rem" },
                  "& .MuiInputLabel-root.Mui-focused": {
                    color: "#2563eb",
                    fontWeight: 500,
                  },
                }}
              />
            ))}
          </div>
        </DialogContent>

        {/* Actions */}
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
            disabled={saving}
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
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Alerts */}
      <Snackbar
        open={alertOpen}
        autoHideDuration={4000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleAlertClose}
          severity={alertSeverity}
          sx={{ width: "100%" }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default DoctorProfile;
function enqueueSnackbar(arg0: string, arg1: { variant: string }) {
  throw new Error("Function not implemented.");
}



// without api------------------------------------------------------
// import React, { useEffect, useState } from "react";
// import {
//   FaPhoneAlt,
//   FaMapMarkerAlt,
//   FaCalendarAlt,
//   FaTimes,
// } from "react-icons/fa";
// import {
//   Button,
//   CircularProgress,
//   Dialog,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Snackbar,
//   Alert,
// } from "@mui/material";
// import doc from "../../assets/doc.jpg";
// // import { getDoctorProfile } from "../../api/DocProfileApi";
// // import { updateDoctorProfile, type UpdateDoctorProfileResponse } from "../../api/UpdateDocProfileApi";
// import { FaGraduationCap } from "react-icons/fa6";

// const DoctorProfile = () => {
//   const [doctor, setDoctor] = useState<any>(null);
//   const [loading, setLoading] = useState(true);
//   const [open, setOpen] = useState(false);
//   const [formData, setFormData] = useState<any>({});
//   const [saving, setSaving] = useState(false);

//   // Snackbar state
//   const [alertOpen, setAlertOpen] = useState(false);
//   const [alertMessage, setAlertMessage] = useState("");
//   const [alertSeverity, setAlertSeverity] = useState<"success" | "error">(
//     "success"
//   );

//   const showAlert = (message: string, severity: "success" | "error") => {
//     setAlertMessage(message);
//     setAlertSeverity(severity);
//     setAlertOpen(true);
//   };

//   const handleAlertClose = () => setAlertOpen(false);

//   useEffect(() => {
//     const fetchDoctorProfile = async () => {
//       try {
//         // ❌ API call commented for UI work
//         // const data = await getDoctorProfile(2);
//         // setDoctor(data);
//         // setFormData(data);

//         // ✅ Dummy data for UI testing
//         const mockData = {
//           doctor_id: 2,
//           doctor_name: "Dr. Priya Sharma",
//           title: "Cardiologist",
//           qualification: "MBBS, MD (Cardiology)",
//           phone: "9876543210",
//           experience: 8,
//           specialized_in: "Heart and Vascular Health",
//           address: "Apollo Clinic, Mumbai",
//         };

//         setDoctor(mockData);
//         setFormData(mockData);
//       } catch (error) {
//         console.error("Failed to load doctor profile:", error);
//         showAlert("Failed to load doctor profile", "error");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDoctorProfile();
//   }, []);

//   const handleEditClick = () => {
//     setFormData(doctor);
//     setOpen(true);
//   };

//   const handleClose = () => setOpen(false);

//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value, type } = e.target;

//     // Prevent negative experience numbers
//     if (name === "experience" && type === "number") {
//       const numValue = Number(value);
//       if (numValue < 0) return;
//     }

//     setFormData({ ...formData, [name]: value });
//   };

//   // ✅ Mocked Save Function (no API call)
//   const handleSave = async () => {
//     if (!doctor) return;
//     try {
//       setSaving(true);

//       // const payload = {
//       //   doctor_id: 2,
//       //   clinic_id: 101,
//       //   doctor_name: formData.doctor_name,
//       //   qualification: formData.qualification,
//       //   specialization: formData.title,
//       //   phone: formData.phone,
//       //   experience: Number(formData.experience),
//       // };

//       // ❌ Real API call disabled
//       // const response: UpdateDoctorProfileResponse = await updateDoctorProfile(payload);

//       // ✅ Mock behavior
//       await new Promise((res) => setTimeout(res, 1000)); // simulate delay
//       setDoctor({ ...doctor, ...formData });
//       setOpen(false);
//       showAlert("Profile updated successfully! (mock)", "success");
//     } catch (error) {
//       console.error("Error updating profile:", error);
//       showAlert("Something went wrong while updating profile", "error");
//     } finally {
//       setSaving(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <CircularProgress />
//       </div>
//     );
//   }

//   if (!doctor) {
//     return (
//       <div className="flex justify-center items-center h-screen text-red-500">
//         Failed to load doctor profile.
//       </div>
//     );
//   }

//   return (
//     <div className="flex justify-center mt-10">
//       {/* Profile Card */}
//       <div
//         className="flex flex-col md:flex-row w-4xl max-w-4xl md:max-w-4xl
//           bg-blue-100 p-4
//           rounded-md md:rounded-lg lg:rounded-l-4xl lg:rounded-r-4xl
//           shadow-xl overflow-hidden
//           transition-all duration-300 "
//       >
//         {/* Left Section */}
//         <div className="md:w-2/5 w-full bg-blue-200 flex rounded-4xl justify-center items-center p-6 relative">
//           <img
//             src={doc}
//             alt="Doctor"
//             className="w-56 h-56 object-cover rounded-full border-10 border-white shadow-md"
//           />
//         </div>

//         {/* Right Section */}
//         <div className="md:w-3/5 w-full bg-white flex flex-col justify-center rounded-l-xl p-6 rounded-r-4xl relative">
//           <h2 className="text-3xl font-semibold text-gray-800 mb-1">
//             {doctor.doctor_name}
//           </h2>
//           <p className="text-indigo-600 font-medium text-sm mb-4">
//             {doctor.specialized_in}
//           </p>

//           <h3 className="text-lg font-medium text-gray-800 mb-2">
//             About Doctor
//           </h3>
//           <p className="text-gray-600 text-sm leading-relaxed mb-4">
//             {doctor.doctor_name} is a {doctor.specialized_in} with over{" "}
//             {doctor.experience} years of experience.
//           </p>

//           <div className="space-y-2 text-gray-700 text-sm">
//             <p className="flex items-center">
//               <FaGraduationCap className="mr-2 text-blue-500" />{" "}
//               {doctor.qualification}
//             </p>
//             <p className="flex items-center">
//               <FaPhoneAlt className="mr-2 text-green-500" /> {doctor.phone}
//             </p>
//             <p className="flex items-center">
//               <FaCalendarAlt className="mr-2 text-yellow-500" />{" "}
//               {doctor.experience} years
//             </p>
//             <p className="flex items-center">
//               <FaMapMarkerAlt className="mr-2 text-red-500" /> {doctor.address}
//             </p>
//           </div>

//           <div className="mt-6">
//             <Button
//               variant="contained"
//               color="primary"
//               sx={{
//                 width: "30%",
//                 borderRadius: "50px",
//                 textTransform: "none",
//                 fontWeight: 500,
//               }}
//               onClick={handleEditClick}
//             >
//               Edit Profile
//             </Button>
//           </div>
//         </div>
//       </div>

//       {/* Edit Profile Dialog */}
//       <Dialog
//         open={open}
//         onClose={(_, reason) => {
//           if (reason === "backdropClick" || reason === "escapeKeyDown") return;
//           handleClose();
//         }}
//         disableEscapeKeyDown
//         maxWidth="xs"
//         PaperProps={{
//           sx: {
//             borderRadius: "24px",
//             overflow: "hidden",
//             boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
//             background: "linear-gradient(145deg, #ebf8ff, #f8fafc)",
//             width: "500px",
//             maxWidth: "90%",
//           },
//         }}
//       >
//         {/* Header */}
//         <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 flex items-center justify-between gap-4 text-white rounded-b-3xl rounded-tr-3xl shadow-md relative">
//           <div className="flex items-center gap-4">
//             <img
//               src={doc}
//               alt="Doctor"
//               className="w-20 h-20 rounded-full border-4 border-white shadow-lg"
//             />
//             <div className="flex flex-col">
//               <h2 className="text-2xl font-semibold leading-tight">
//                 {formData.doctor_name || "Dr. Name"}
//               </h2>
//               <p className="text-sm text-blue-100">
//                 {formData.title || "Specialist"}
//               </p>
//             </div>
//           </div>

//           <button
//             onClick={handleClose}
//             className="absolute top-3 right-3 text-white text-xl p-1 rounded-full hover:bg-gray hover:bg-opacity-10 transition"
//           >
//             <FaTimes />
//           </button>
//         </div>

//         {/* Content */}
//         <DialogContent
//           dividers
//           sx={{ border: "none", px: 4, backgroundColor: "#f9fafb" }}
//         >
//           <div className="flex flex-col gap-5 mt-2 ">
//             <div className="text-center mb-2 px-2">
//               <h3 className="text-lg font-semibold text-gray-800">
//                 Edit Profile Details
//               </h3>
//               <p className="text-gray-500 text-sm">
//                 Update your clinic and personal information below.
//               </p>
//             </div>

//             {[
//               { label: "Full Name", name: "doctor_name" },
//               { label: "Specialty", name: "title" },
//               { label: "Qualification", name: "qualification" },
//               { label: "Phone Number", name: "phone" },
//               {
//                 label: "Experience (years)",
//                 name: "experience",
//               },
//             ].map((field, index) => (
//               <TextField
//                 key={index}
//                 label={field.label}
//                 name={field.name}
//                 value={formData[field.name] || ""}
//                 onChange={handleChange}
//                 type="text"
//                 fullWidth
//                 variant="outlined"
//                 sx={{
//                   marginY: 0,
//                   "& .MuiOutlinedInput-root": {
//                     borderRadius: "18px",
//                     backgroundColor: "white",
//                     padding: "0.1px 10px",
//                     "&:hover fieldset": { borderColor: "#60a5fa" },
//                     "&.Mui-focused fieldset": {
//                       borderColor: "#2563eb",
//                       borderWidth: 1,
//                     },
//                   },
//                   "& .MuiInputLabel-root": { margin: 0, fontSize: "0.875rem" },
//                   "& .MuiInputLabel-root.Mui-focused": {
//                     color: "#2563eb",
//                     fontWeight: 500,
//                   },
//                 }}
//               />
//             ))}
//           </div>
//         </DialogContent>

//         {/* Actions */}
//         <DialogActions
//           sx={{
//             justifyContent: "space-between",
//             px: 4,
//             py: 2,
//             borderTop: "1px solid #e5e7eb",
//             backgroundColor: "#f9fafb",
//           }}
//         >
//           <Button
//             onClick={handleClose}
//             sx={{
//               textTransform: "none",
//               borderRadius: "50px",
//               px: 3,
//               py: 1,
//               fontWeight: 500,
//               backgroundColor: "#e5e7eb",
//               color: "#374151",
//               "&:hover": { backgroundColor: "#d1d5db" },
//             }}
//           >
//             Cancel
//           </Button>

//           <Button
//             onClick={handleSave}
//             variant="contained"
//             disabled={saving}
//             sx={{
//               textTransform: "none",
//               borderRadius: "50px",
//               px: 3,
//               py: 1,
//               fontWeight: 600,
//               background:
//                 "linear-gradient(90deg, #3b82f6 0%, #2563eb 50%, #1d4ed8 100%)",
//               "&:hover": {
//                 background:
//                   "linear-gradient(90deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)",
//               },
//               color: "white",
//               boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
//             }}
//           >
//             {saving ? "Saving..." : "Save Changes"}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Snackbar Alerts */}
//       <Snackbar
//         open={alertOpen}
//         autoHideDuration={4000}
//         onClose={handleAlertClose}
//         anchorOrigin={{ vertical: "top", horizontal: "center" }}
//       >
//         <Alert
//           onClose={handleAlertClose}
//           severity={alertSeverity}
//           sx={{ width: "100%" }}
//         >
//           {alertMessage}
//         </Alert>
//       </Snackbar>
//     </div>
//   );
// };

// export default DoctorProfile;
