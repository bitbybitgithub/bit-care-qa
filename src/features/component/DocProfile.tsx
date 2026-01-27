import React, { useEffect, useState } from "react";
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
import {
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTimes,
} from "react-icons/fa";
import { FaGraduationCap } from "react-icons/fa6";
import docImg from "../../assets/doc.jpg";
import { updateDoctorProfile, type UpdateDoctorProfileResponse} from "../../api/UpdateDocProfileApi";
import { getSessionItem } from "../../context/sessions/userSession";
import { getDoctorProfile } from "../../api/DocProfileApi";

// Doctor type matches EXACT API RESPONSE
type Doctor = {
  clinic_id: number;
  address: string;
  phone: string;
  doctor_name: string;
  qualification: string;
  title: string;
  license_no: string;
  experience: number;
};

const DoctorProfile: React.FC = () => {
  const doctorId = getSessionItem("user", "doctor_id");
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Doctor | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] =
    useState<"success" | "error">("success");

  const showAlert = (message: string, severity: "success" | "error") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const handleAlertClose = () => setAlertOpen(false);
  
  const nameRegex = /^[A-Za-z\s]{2,80}$/;
  const qualificationRegex = /^[A-Za-z\s]{2,80}$/;
  const phoneRegex = /^[6-9]\d{9}$/;

  const validators: Record<string, (val: any) => string> = {
    doctor_name: (v) =>
      !v ? "Full Name is required"
      : !nameRegex.test(v)
      ? "Only letters & spaces (2–80 chars)"
      : "",

    qualification: (v) =>
      !v ? "Qualification is required"
      : !qualificationRegex.test(v)
      ? "Only letters & spaces (2–80 chars)"
      : "",

    phone: (v) =>
      !v ? "Phone is required"
      : !phoneRegex.test(v)
      ? "Enter a valid 10-digit mobile"
      : "",

    experience: (v) => {
      if (v === "" || v === null) return "Experience is required";
      const num = Number(v);
      if (!Number.isInteger(num)) return "Must be a whole number";
      if (num < 0) return "Cannot be negative";
      if (num > 60) return "Too high (max 60)";
      return "";
    },
  };

  const validateField = (name: string, val: any) =>
    validators[name] ? validators[name](val) : "";

  const validateAll = (data: Doctor) => {
    const errs: Record<string, string> = {};
    Object.keys(validators).forEach((k) => {
      const msg = validateField(k, (data as any)[k]);
      if (msg) errs[k] = msg;
    });
    return errs;
  };

  const isFormValid = (errs: Record<string, string>) =>
    Object.keys(errs).length === 0;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getDoctorProfile(doctorId);
        setDoctor(data);
        setFormData(data);
      } catch (err) {
        showAlert("Failed to load doctor profile", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleEditClick = () => {
    if (!doctor) return;
    setFormData(doctor);
    setErrors(validateAll(doctor));
    setTouched({});
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!formData) return;

    const { name, value } = e.target;
    let updated = value;

    if (name === "doctor_name") {
      updated = value.replace(/[^A-Za-z\s]/g, "").slice(0, 80);
    } else if (name === "qualification") {
      updated = value.replace(/[^A-Za-z\s]/g, "").slice(0, 80);
    } else if (name === "phone") {
      updated = value.replace(/\D/g, "").slice(0, 10);
    } else if (name === "experience") {
      const digits = value.replace(/\D/g, "").slice(0, 2);
      updated = digits === "" ? "" : String(Math.min(60, Number(digits)));
    }

    const newData = { ...formData, [name]: updated };
    setFormData(newData);

    const msg = validateField(name, updated);
    setErrors((prev) => {
      const n = { ...prev };
      if (msg) n[name] = msg;
      else delete n[name];
      return n;
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));

    if (formData) {
      const msg = validateField(name, (formData as any)[name]);
      setErrors((prev) => {
        const n = { ...prev };
        if (msg) n[name] = msg;
        else delete n[name];
        return n;
      });
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    const finalErrors = validateAll(formData);
    setErrors(finalErrors);
    setTouched({
      doctor_name: true,
      qualification: true,
      phone: true,
      experience: true,
    });

    if (!isFormValid(finalErrors)) {
      showAlert("Please fix validation errors", "error");
      return;
    }

    try {
      const payload = {
        doctor_id: doctorId,
        clinic_id: formData.clinic_id,
        doctor_name: formData.doctor_name,
        qualification: formData.qualification,
        phone: formData.phone,
        experience: Number(formData.experience),
      };

      const res: UpdateDoctorProfileResponse = await updateDoctorProfile(
        payload
      );

      if (res.success) {
        setDoctor({ ...doctor!, ...formData });
        showAlert("Profile updated successfully!", "success");
        setOpen(false);
      } else {
        showAlert(res.message || "Failed to update profile", "error");
      }
    } catch (err) {
      showAlert("Something went wrong while updating", "error");
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
        Failed to load profile.
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex justify-center mt-10">
        <div className="flex flex-col md:flex-row max-w-4xl w-full bg-[var(--color-primary)]/70 rounded-lg shadow-xl overflow-hidden">

          <div className="md:w-2/5 bg-[var(--color-primary)] flex justify-center items-center p-6">
            <img
              src={docImg}
              alt="Doctor"
              className="w-56 h-56 rounded-full object-cover border-4 border-white"
            />
          </div>

          <div className="md:w-3/5 bg-white p-6">
            <h2 className="text-3xl font-semibold">{doctor.doctor_name}</h2>
            <p className="text-gray-600 mb-4">{doctor.qualification}</p>

            <h3 className="font-semibold mb-1">About Doctor</h3>
            <p className="text-sm mb-4">
              {doctor.doctor_name} is a qualified doctor with{" "}
              {doctor.experience} years of experience.
            </p>

            <p className="flex items-center gap-2 text-sm">
              <FaGraduationCap /> {doctor.qualification}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <FaPhoneAlt /> {doctor.phone}
            </p>
            <p className="flex items-center gap-2 text-sm">
              <FaCalendarAlt /> {doctor.experience} years
            </p>
            <p className="flex items-center gap-2 text-sm">
              <FaMapMarkerAlt /> {doctor.address}
            </p>

            <p className="mt-3 text-sm">
              <strong>Title:</strong> {doctor.title}
            </p>
            <p className="text-sm">
              <strong>License No:</strong> {doctor.license_no}
            </p>

            <Button
              variant="contained"
              sx={{ mt: 3, textTransform: "none" }}
              onClick={handleEditClick}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { borderRadius: 3, width: 450 } }}
      >
        <DialogContent sx={{ pt: 2 }}>
          {formData && (
            <div className="flex flex-col gap-3">

              <TextField
                label="Full Name"
                name="doctor_name"
                value={formData.doctor_name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!touched.doctor_name && !!errors.doctor_name}
                helperText={touched.doctor_name ? errors.doctor_name : " "}
                fullWidth
                size="small"
              />

              <TextField
                label="Qualification"
                name="qualification"
                value={formData.qualification}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!touched.qualification && !!errors.qualification}
                helperText={touched.qualification ? errors.qualification : " "}
                fullWidth
                size="small"
              />

              <TextField
                label="Phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!touched.phone && !!errors.phone}
                helperText={touched.phone ? errors.phone : " "}
                fullWidth
                size="small"
              />

              <TextField
                label="Experience (years)"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                onBlur={handleBlur}
                error={!!touched.experience && !!errors.experience}
                helperText={touched.experience ? errors.experience : " "}
                fullWidth
                size="small"
              />

              <TextField
                label="Title"
                value={formData.title}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />

              <TextField
                label="License Number"
                value={formData.license_no}
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
              />
            </div>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>

          <Button
            variant="contained"
            disabled={!isFormValid(errors)}
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={alertOpen}
        autoHideDuration={4000}
        onClose={handleAlertClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleAlertClose} severity={alertSeverity}>
          {alertMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default DoctorProfile;
