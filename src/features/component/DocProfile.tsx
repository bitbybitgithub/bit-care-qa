// DoctorProfile.tsx
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

type Doctor = {
  doctor_name: string;
  specialized_in: string;
  qualification: string;
  phone: string;
  experience: number | string;
  address?: string;
  [k: string]: any;
};

const DoctorProfile = () => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState<Doctor>({
    doctor_name: "",
    specialized_in: "",
    qualification: "",
    phone: "",
    experience: "" as any,
  });

  const [saving, setSaving] = useState(false);

  // validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

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

  // ---------- Validation rules ----------
  const nameRegex = /^[A-Za-z\s]{2,80}$/;
  const specialtyRegex = /^[A-Za-z\s]{2,60}$/;
  const qualificationRegex = /^[A-Za-z\s]{2,80}$/;
  const phoneRegex = /^[6-9]\d{9}$/;

  const validators: Record<string, (val: any) => string> = {
    doctor_name: (v) =>
      !v
        ? "Full Name is required"
        : !nameRegex.test(v)
        ? "Only letters & spaces (2–80 chars)"
        : "",
    specialized_in: (v) =>
      !v
        ? "Specialty is required"
        : !specialtyRegex.test(v)
        ? "Only letters & spaces (2–60 chars)"
        : "",
    qualification: (v) =>
      !v
        ? "Qualification is required"
        : !qualificationRegex.test(v)
        ? "Only letters & spaces (2–80 chars)"
        : "",
    phone: (v) =>
      !v
        ? "Phone is required"
        : !phoneRegex.test(v)
        ? "Enter a valid 10-digit Indian mobile"
        : "",
    experience: (v) => {
      if (v === "" || v === null || v === undefined)
        return "Experience is required";
      const n = Number(v);
      if (!Number.isInteger(n)) return "Experience must be a whole number";
      if (n < 0) return "Experience cannot be negative";
      if (n > 60) return "Experience seems too high (max 60)";
      return "";
    },
  };

  const validateField = (name: string, value: any) =>
    validators[name] ? validators[name](value) : "";
  const validateAll = (data: Doctor) => {
    const next: Record<string, string> = {};
    Object.keys(validators).forEach((k) => {
      const msg = validateField(k, (data as any)[k]);
      if (msg) next[k] = msg;
    });
    return next;
  };
  const isFormValid = (errs: Record<string, string>) =>
    Object.keys(errs).length === 0;

  // ---------- Fetch ----------
  useEffect(() => {
    const run = async () => {
      try {
        const data = await getDoctorProfile(2);
        setFormData(data);
        setDoctor(data);
      } catch (e) {
        console.error(e);
        showAlert("Failed to load doctor profile", "error");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // ---------- Dialog ----------
  const handleEditClick = () => {
    if (!doctor) return;
    setFormData(doctor);
    setErrors(validateAll(doctor));
    setTouched({});
    setOpen(true);
  };
  const handleClose = () => setOpen(false);

  // ---------- Input guards (bind to native <input> via slotProps.input) ----------
  // letters & spaces only
  const handleBeforeInputText: React.FormEventHandler<HTMLInputElement> = (
    e
  ) => {
    const native = e.nativeEvent as InputEvent;
    const data = native?.data ?? "";
    if (!data) return;
    if (!/^[A-Za-z\s]+$/.test(data)) e.preventDefault();
  };
  // digits only
  const handleBeforeInputDigits: React.FormEventHandler<HTMLInputElement> = (
    e
  ) => {
    const native = e.nativeEvent as InputEvent;
    const data = native?.data ?? "";
    if (!data) return;
    if (!/^\d+$/.test(data)) e.preventDefault();
  };
  const handlePasteTextOnly = (
    e: React.ClipboardEvent<HTMLInputElement>,
    max: number
  ) => {
    const text = e.clipboardData.getData("text");
    if (!/^[A-Za-z\s]*$/.test(text)) {
      e.preventDefault();
      showAlert("Only letters & spaces are allowed.", "error");
      return;
    }
    if (text.length > max) {
      e.preventDefault();
      showAlert(`Maximum ${max} characters allowed.`, "error");
    }
  };
  const handlePasteDigitsOnly = (
    e: React.ClipboardEvent<HTMLInputElement>,
    max: number
  ) => {
    const text = e.clipboardData.getData("text");
    if (!/^\d*$/.test(text)) {
      e.preventDefault();
      showAlert("Only digits are allowed.", "error");
      return;
    }
    if (text.length > max) {
      e.preventDefault();
      showAlert(`Maximum ${max} digits allowed.`, "error");
    }
  };

  // ---------- Form handlers ----------
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    let next = value;

    if (name === "experience") {
      // keep digits only, clamp to 2 chars, and cap to 60 (but allow empty while typing)
      const digits = value.replace(/\D/g, "").slice(0, 2);
      // don't auto-convert empty to 0
      if (digits === "") {
        next = "";
      } else {
        const n = Math.min(60, parseInt(digits, 10));
        next = String(n);
      }
    } else if (name === "phone") {
      // digits only, clamp to 10
      next = value.replace(/\D/g, "").slice(0, 10);
    } else if (name === "doctor_name") {
      // letters + spaces only, clamp to 80
      next = value.replace(/[^A-Za-z\s]/g, "").slice(0, 30);
    } else if (name === "specialized_in") {
      // letters + spaces only, clamp to 60
      next = value.replace(/[^A-Za-z\s]/g, "").slice(0, 60);
    } else if (name === "qualification") {
      // letters + spaces only, clamp to 80
      next = value.replace(/[^A-Za-z\s]/g, "").slice(0, 80);
    }

    setFormData((p) => ({ ...p, [name]: next }));

    // revalidate the changed field
    const msg = validateField(name, next);
    setErrors((prev) => {
      const copy = { ...prev };
      if (msg) copy[name] = msg;
      else delete copy[name];
      return copy;
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
    const msg = validateField(name, (formData as any)[name]);
    setErrors((prev) => {
      const next = { ...prev };
      if (msg) next[name] = msg;
      else delete next[name];
      return next;
    });
  };

  // ---------- Save ----------
  const handleSave = async () => {
    if (!doctor) return;
    const finalErrors = validateAll(formData);
    setErrors(finalErrors);
    setTouched({
      doctor_name: true,
      specialized_in: true,
      qualification: true,
      phone: true,
      experience: true,
    });
    if (!isFormValid(finalErrors)) {
      showAlert("Please fix the validation errors.", "error");
      return;
    }
    try {
      setSaving(true);
      const payload = {
        doctor_id: 2,
        clinic_id: 101,
        doctor_name: formData.doctor_name,
        qualification: formData.qualification,
        specialization: formData.specialized_in,
        phone: formData.phone,
        experience: Number(formData.experience),
      };
      const res: UpdateDoctorProfileResponse = await updateDoctorProfile(
        payload
      );
      if (res.success) {
        setDoctor({
          ...doctor,
          ...formData,
          specialization: formData.specialized_in,
        });
        setOpen(false);
        showAlert(res.message || "Profile updated successfully!", "success");
      } else {
        showAlert(res.message || "Failed to update profile", "error");
      }
    } catch (e) {
      console.error(e);
      showAlert("Something went wrong while updating profile", "error");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Render ----------
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
    <div>
      <div className="flex justify-center mt-10">
        {/* Profile Card */}
        <div className="flex flex-col md:flex-row w-full max-w-full md:max-w-4xl bg-[var(--color-primary)]/70 p-4 rounded-md md:rounded-lg lg:rounded-l-full lg:rounded-r-lg shadow-xl overflow-hidden transition-all duration-300 ">
          {/* Left */}
          <div className="md:w-2/5 w-full bg-[var(--color-primary)] flex rounded-l-full justify-center items-center p-6 relative">
            <img
              src={doc}
              alt="Doctor"
              className="w-56 h-56 object-cover rounded-full border-10 border-[var(--color-surface)] shadow-md"
            />
          </div>

          {/* Right */}
          <div className="md:w-3/5 w-full bg-[var(--color-bg)] flex flex-col justify-center rounded-l-2xl p-6 relative">
            <h2 className="text-3xl font-semibold mb-1">
              {doctor.doctor_name}
            </h2>
            <p className=" font-medium text-sm mb-4">{doctor.specialized_in}</p>

            <h3 className="text-lg font-medium mb-2">About Doctor</h3>
            <p className=" text-sm leading-relaxed mb-4">
              {doctor.doctor_name} is a {doctor.specialized_in} with over{" "}
              {doctor.experience} years of experience.
            </p>

            <div className="space-y-2 text-[var(-color-text)] text-sm">
              <p className="flex items-center">
                <FaGraduationCap className="mr-2" /> {doctor.qualification}
              </p>
              <p className="flex items-center">
                <FaPhoneAlt className="mr-2" /> {doctor.phone}
              </p>
              <p className="flex items-center">
                <FaCalendarAlt className="mr-2" /> {doctor.experience} years
              </p>
              <p className="flex items-center">
                <FaMapMarkerAlt className="mr-2" /> {doctor.address}
              </p>
            </div>

            <div className="mt-6">
              <Button
                variant="contained"
                color="primary"
                sx={{
                  width: { xs: "80%", sm: "60%", md: "30%" },
                  borderRadius: "50px",
                  textTransform: "none",
                  fontWeight: 500,
                  display: "block",
                  mx: "auto",
                }}
                onClick={handleEditClick}
              >
                Edit Profile
              </Button>
            </div>
          </div>
        </div>

        <Dialog
          open={open}
          onClose={(_, reason) => {
            if (reason === "backdropClick" || reason === "escapeKeyDown")
              return;
            handleClose();
          }}
          disableEscapeKeyDown
          // maxWidth="xs"
          PaperProps={{
            sx: {
              // borderRadius: "24px",
              borderRadius: "var(--radius-xl)",
              // overflow: "hidden",
              boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
              width: "450px",
              maxWidth: "90%",
            },
          }}
        >
          {/* Header */}
          <div className="bg-[var(--color-primary)] p-1 flex items-center justify-between  gap-4 text-[var(--color-white)] rounded-t-[var(--radius-xl)] shadow-md relative">
            <div className="flex items-center ">
              <img
                src={doc}
                alt="Doctor"
                className="w-16 h-16 ml-5 rounded-full border-4 border-[var(--color-surface)] shadow-lg"
              />
              <div className="flex flex-col ml-2">
                <h2 className="text-xl font-semibold">
                  {doctor.doctor_name || "Dr. Name"}
                </h2>
                <p className="text-sm ">
                  {doctor.specialized_in || "Specialist"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 text-[var(--color-text)] text-xl p-1 rounded-full bg-[var(--color-bg)] hover:opacity-80 transition"
            >
              <FaTimes />
            </button>
          </div>

          {/* Content */}
          <DialogContent
            dividers
            sx={{ border: "none", px: 4, backgroundColor: "var(--color-bg)" }}
          >
            <div className="flex flex-col gap-y-1">
              {/* Full Name */}
              <div>
                <h1 className="mb-1">Full Name</h1>
                <TextField
                  name="doctor_name"
                  value={formData.doctor_name || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={!!touched.doctor_name && !!errors.doctor_name}
                  helperText={
                    touched.doctor_name && errors.doctor_name
                      ? errors.doctor_name
                      : " "
                  }
                  // If your MUI doesn't have slotProps, replace with:
                  // inputProps={{ maxLength: 80, onBeforeInput: handleBeforeInputText, inputMode: "text" }}
                  // FormHelperTextProps={{ sx: { minHeight: 15, m: 0, mt: 0.5 } }}
                  slotProps={{
                    input: {
                      maxLength: 30,
                      onBeforeInput: handleBeforeInputText,
                      onPaste: (e: React.ClipboardEvent<HTMLInputElement>) =>
                        handlePasteTextOnly(e, 80),
                      inputMode: "text",
                    },
                    formHelperText: { sx: { minHeight: 15, m: 0, mt: 0.5 } },
                  }}
                  type="text"
                  fullWidth
                  size="small"
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      "&.Mui-focused fieldset": { borderWidth: 1 },
                    },
                    "& .MuiFormHelperText-root": { lineHeight: 1.2 },
                  }}
                />
              </div>

              {/* Specialty */}
              <div>
                <h1 className="mb-1">Specialty</h1>
                <TextField
                  name="specialized_in"
                  value={formData.specialized_in || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={!!touched.specialized_in && !!errors.specialized_in}
                  helperText={
                    touched.specialized_in && errors.specialized_in
                      ? errors.specialized_in
                      : " "
                  }
                  slotProps={{
                    input: {
                      maxLength: 60,
                      onBeforeInput: handleBeforeInputText,
                      onPaste: (e: React.ClipboardEvent<HTMLInputElement>) =>
                        handlePasteTextOnly(e, 60),
                      inputMode: "text",
                    },
                    formHelperText: { sx: { minHeight: 15, m: 0, mt: 0.5 } },
                  }}
                  type="text"
                  fullWidth
                  size="small"
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      "&.Mui-focused fieldset": { borderWidth: 1 },
                    },
                    "& .MuiFormHelperText-root": { lineHeight: 1.2 },
                  }}
                />
              </div>

              {/* Qualification */}
              <div>
                <h1 className="mb-1">Qualification</h1>
                <TextField
                  name="qualification"
                  value={formData.qualification || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={!!touched.qualification && !!errors.qualification}
                  helperText={
                    touched.qualification && errors.qualification
                      ? errors.qualification
                      : " "
                  }
                  slotProps={{
                    input: {
                      maxLength: 80,
                      onBeforeInput: handleBeforeInputText,
                      onPaste: (e: React.ClipboardEvent<HTMLInputElement>) =>
                        handlePasteTextOnly(e, 80),
                      inputMode: "text",
                    },
                    formHelperText: { sx: { minHeight: 15, m: 0, mt: 0.5 } },
                  }}
                  type="text"
                  fullWidth
                  size="small"
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      "&.Mui-focused fieldset": { borderWidth: 1 },
                    },
                    "& .MuiFormHelperText-root": { lineHeight: 1.2 },
                  }}
                />
              </div>

              {/* Phone */}
              <div>
                <h1 className="mb-1">Phone Number</h1>
                <TextField
                  name="phone"
                  value={formData.phone || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={!!touched.phone && !!errors.phone}
                  helperText={
                    touched.phone && errors.phone ? errors.phone : " "
                  }
                  slotProps={{
                    input: {
                      maxLength: 10,
                      onBeforeInput: handleBeforeInputDigits,
                      onPaste: (e: React.ClipboardEvent<HTMLInputElement>) =>
                        handlePasteDigitsOnly(e, 10),
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                      type: "tel",
                    },
                    formHelperText: { sx: { minHeight: 15, m: 0, mt: 0.5 } },
                  }}
                  type="tel"
                  fullWidth
                  size="small"
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      "&.Mui-focused fieldset": { borderWidth: 1 },
                    },
                    "& .MuiFormHelperText-root": { lineHeight: 1.2 },
                  }}
                />
              </div>

              {/* Experience */}
              <div>
                <h1 className="mb-1">Experience (years)</h1>
                <TextField
                  name="experience"
                  value={formData.experience ?? ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={!!touched.experience && !!errors.experience}
                  helperText={
                    touched.experience && errors.experience
                      ? errors.experience
                      : " "
                  }
                  slotProps={{
                    input: {
                      maxLength: 2, // 0–60 fits in 2 digits
                      // onBeforeInput: handleBeforeInputDigits,
                      onPaste: (e: React.ClipboardEvent<HTMLInputElement>) =>
                        handlePasteDigitsOnly(e, 2),
                      inputMode: "numeric",
                      pattern: "[0-9]*",
                      // type: "text",
                    },
                    formHelperText: { sx: { minHeight: 15, m: 0, mt: 0.5 } },
                  }}
                  type="text"
                  fullWidth
                  size="small"
                  variant="outlined"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "10px",
                      "&.Mui-focused fieldset": { borderWidth: 1 },
                    },
                    "& .MuiFormHelperText-root": { lineHeight: 1.2 },
                  }}
                />
              </div>
            </div>
          </DialogContent>

          {/* Actions */}
          <DialogActions
            sx={{
              justifyContent: "space-between",
              px: 4,
              borderTop: "1px solid #e5e7eb",
              backgroundColor: "var(--color-surface)",
            }}
          >
            <Button
              onClick={handleClose}
              sx={{
                textTransform: "none",
                borderRadius: "50px",
                px: 3,
                // py: 1,
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
              disabled={saving || !isFormValid(errors)}
              sx={{
                textTransform: "none",
                borderRadius: "50px",
                px: 3,
                // py: 1,
                fontWeight: 600,
                background: "var(--color-primary)",
                "&:hover": { opacity: "80%" },
                color: "white",
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
    </div>
  );
};

export default DoctorProfile;
