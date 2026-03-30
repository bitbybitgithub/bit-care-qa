import React, { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaEnvelope,
  FaUserMd,
  FaClipboardList,
  FaUsers,
  FaTimes,
} from "react-icons/fa";
import { IoCallOutline, IoPerson } from "react-icons/io5";
import { toast } from "react-toastify";
import {
  FormControl,
  TextField,
  MenuItem,
  InputAdornment,
  Button,
} from "@mui/material";
import CircularProgress from "@mui/material/CircularProgress";
import { savePatient } from "../../api/SavePatientApi";
import { saveAppointment } from "../../api/SaveAppointmentApi";
import { AppointmentStatus } from "../../context/constant/enum";
import { getSessionItem } from "../../context/sessions/userSession";
import type {
  WalkinFormData,
  WalkInRegisterFormProps,
} from "../../types/staffdashboardtype/StaffDashboardInterfaces";
import { getMappedDoctorApi, type MappedDoctor } from "../../api/clinic/ClinicDoctorApi";

const WalkInRegisterForm: React.FC<WalkInRegisterFormProps> = ({
  onClose,
  patientData,
  onSuccess,
  contact,
}) => {
  const [formData, setFormData] = useState<WalkinFormData>({
    name: "",
    dob: "",
    email: "",
    phone: "",
    doctor: "",
    reason: "",
    gender: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [doctors, setDoctors] = useState<MappedDoctor[]>([]);
  const [doctorLoading, setDoctorLoading] = useState(false);

  const now = new Date();
  const user_id = getSessionItem("user", "user_id");
  const clinic_id = getSessionItem("user", "clinic_id");

  const formatTime = (date: Date) => date.toTimeString().slice(0, 5);
  const endTime = new Date(now.getTime() + 15 * 60 * 1000);
  const NAME_REGEX = /^[A-Za-z\s.'-]{2,50}$/;
  const MOBILE_REGEX = /^[6-9]\d{9}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const REASON_REGEX = /^[A-Za-z0-9\s.,'-]{3,200}$/;
  const [age, setAge] = useState<number | "">("");
  const today = new Date();
  const maxDate = today.toISOString().split("T")[0];

  const minDateObj = new Date();
  minDateObj.setFullYear(today.getFullYear() - 120);
  const minDate = minDateObj.toISOString().split("T")[0];

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setDoctorLoading(true);
        const list = await getMappedDoctorApi(clinic_id)
        setDoctors(list as MappedDoctor[]);
      } catch (err) {
        console.error("Error fetching doctor list:", err);
        setDoctors([]);
      } finally {
        setDoctorLoading(false);
      }
    };
    fetchDoctors();
  }, []);
  useEffect(() => {
    if (!formData.dob) {
      setAge("");
      return;
    }

    const today = new Date();
    const birthDate = new Date(formData.dob);

    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }

    setAge(calculatedAge);
  }, [formData.dob]);

  useEffect(() => {
    if (patientData) {
      setFormData({
        name: patientData.patient_name || "",
        dob: patientData.date_of_birth
          ? new Date(patientData.date_of_birth).toISOString().split("T")[0]
          : "",
        email: patientData.email || "",
        phone: patientData.mobile_number || contact,
        doctor: "",
        reason: "",
        gender: patientData?.gender?.toString() || "",
      });
    } else {
      setFormData({
        name: "",
        dob: "",
        email: "",
        phone: contact,
        doctor: "",
        reason: "",
        gender: "",
      });
    }
  }, [patientData, contact]);

  const validate = (data: WalkinFormData) => {
    const newErrors: Record<string, string> = {};

    if (!data.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (!NAME_REGEX.test(data.name.trim())) {
      newErrors.name = "Name should contain only letters";
    }
    if (!data.dob) {
      newErrors.dob = "Date of birth is required";
    } else {
      const dob = new Date(data.dob);
      const today = new Date();

      const age =
        (today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

      if (age < 0) newErrors.dob = "DOB cannot be in the future";
      else if (age > 120) newErrors.dob = "Invalid date of birth";
    }
    if (!data.gender.trim()) {
      newErrors.gender = "Gender is required";
    }
    if (!data.phone.trim()) {
      newErrors.phone = "Mobile number is required";
    } else if (!MOBILE_REGEX.test(data.phone)) {
      newErrors.phone = "Enter valid Indian mobile number";
    }
    if (data.email.trim() && !EMAIL_REGEX.test(data.email.trim())) {
      newErrors.email = "Invalid email format";
    }
    if (!data.doctor.trim()) {
      newErrors.doctor = "Please select doctor";
    }
    if (!data.reason.trim()) {
      newErrors.reason = "Reason is required";
    } else if (!REASON_REGEX.test(data.reason.trim())) {
      newErrors.reason = "Invalid characters in reason";
    }

    return newErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;

    let newValue = value;
    if (name === "name") {
      newValue = value.replace(/[^A-Za-z\s.'-]/g, "");
    }
    if (name === "phone") {
      newValue = value.replace(/\D/g, "").slice(0, 10);
    }
    if (name === "reason") {
      newValue = value.slice(0, 200);
    }

    if (name === 'email') {
      setFormData((prev) => ({ ...prev, [name]: newValue.toLowerCase() }));
    }
    else {
      setFormData((prev) => ({ ...prev, [name]: newValue }));
    }

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    const reqBody = {
      patient_name: formData.name,
      gender: formData.gender,
      date_of_birth: formData.dob,
      email: formData.email,
      mobile_number: formData.phone,
    };

    try {
      setSaving(true);

      let patientId = patientData?.patient_id;

      if (!patientId) {
        const res: any = await savePatient(reqBody);
        if (!res || !res.patientId) {
          throw new Error(res?.message || "Failed to register patient.");
        }
        patientId = res.patientId;
      }

      const selectedDoctor = doctors.find((d) => d.doctor_name === formData.doctor);

      const appointmentData = {
        patient_id: patientId,
        doctor_id: selectedDoctor?.doctor_id || 0,
        clinic_id: Number(clinic_id),
        patient_name: formData.name,
        doctor_name: formData.doctor,
        gender: formData.gender,
        appointment_date: new Date().toISOString().split("T")[0],
        start_time: formatTime(now),
        end_time: formatTime(endTime),
        status: AppointmentStatus.Scheduled,
        source: "web",
        reason: formData.reason || "Regular checkup",
        date_of_birth: formData.dob,
        mobile_number: formData.phone || contact,
        user_id: Number(user_id),
      };

      await saveAppointment(appointmentData);

      toast.success("Patient and Appointment saved successfully!");

      setFormData({
        name: "",
        dob: "",
        email: "",
        phone: "",
        doctor: "",
        reason: "",
        gender: "",
      });
      setErrors({});
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error in save flow:", err);
      toast.error(err?.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex justify-center items-center bg-[var(--color-surface-alt)]/40 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4">

        {saving && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 rounded-[var(--radius-lg)]">
            <CircularProgress size={40} thickness={4} />
          </div>
        )}

        <form
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
          className={`bg-[var(--color-surface)] border border-[var(--color-primary)] shadow-[var(--shadow-lg)] rounded-[var(--radius-lg)] w-full p-6 transform transition-all ${saving ? "pointer-events-none opacity-80" : ""
            }`}
        >
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <FaUsers
                className="text-[var(--color-primary)]"
                style={{ fontSize: "var(--font-h2)" }}
              />
              <h3
                className="font-semibold text-[var(--color-primary)]"
                style={{ fontSize: "var(--font-h3)" }}
              >
                Walk-In Patient Registration
              </h3>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!saving) onClose();
              }}
              className="w-8 h-8 flex justify-center items-center rounded-[var(--radius-full)] cursor-pointer text-[var(--color-surface-alt)] bg-[var(--color-primary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-primary)] transition"
            >
              <FaTimes />
            </button>
          </div>
          <div className="flex flex-col gap-y-3">
            {/* Full Name */}
            <FormControl fullWidth>
              <TextField
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                size="small"
                error={!!errors.name}
                helperText={errors.name || " "}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <IoPerson className="text-[var(--color-text)]" />
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormControl fullWidth>
                <TextField
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  size="small"
                  error={!!errors.dob}
                  helperText={errors.dob || " "}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    max: maxDate,
                    min: minDate,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <FaCalendarAlt className="text-[var(--color-text)]" />
                      </InputAdornment>
                    ),
                  }}
                />
              </FormControl>

              <FormControl fullWidth>
                <TextField
                  value={age !== "" ? `${age} years` : ""}
                  placeholder="Age"
                  size="small"
                  InputProps={{ readOnly: true }}
                  helperText=" "
                />
              </FormControl>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormControl fullWidth>
                <TextField
                  name="phone"
                  placeholder="Contact Number"
                  value={formData.phone}
                  onChange={handleChange}
                  size="small"
                  error={!!errors.phone}
                  helperText={errors.phone || " "}
                  inputProps={{ maxLength: 10, inputMode: "tel" }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoCallOutline className="text-[var(--color-text)]" />
                      </InputAdornment>
                    ),
                  }}
                />
              </FormControl>

              <FormControl fullWidth error={!!errors.gender}>
                <TextField
                  select
                  name="gender"
                  value={formData.gender}
                  onChange={(e: React.ChangeEvent<any>) => handleChange(e as any)}
                  size="small"
                  helperText={errors.gender || " "}
                  error={!!errors.gender}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IoPerson className="text-[var(--color-text)]" />
                      </InputAdornment>
                    ),
                  }}
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected: any) =>
                      !selected ? (
                        <span style={{ color: "rgba(0,0,0,0.6)" }}>
                          Select Gender
                        </span>
                      ) : (
                        selected
                      ),
                  }}
                >
                  <MenuItem value="">
                    <em>Select Gender</em>
                  </MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </FormControl>
            </div>

            <FormControl fullWidth>
              <TextField
                type="email"
                name="email"
                placeholder="Email Id (Optional)"
                value={formData.email}
                onChange={handleChange}
                size="small"
                error={!!errors.email}
                helperText={errors.email || " "}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaEnvelope className="text-[var(--color-text)]" />
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>

            <FormControl fullWidth>
              <TextField
                select
                name="doctor"
                value={formData.doctor}
                onChange={(e: React.ChangeEvent<any>) => handleChange(e as any)}
                size="small"
                disabled={doctorLoading}
                error={!!errors.doctor}
                helperText={errors.doctor || " "}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaUserMd className="text-[var(--color-text)]" />
                    </InputAdornment>
                  ),
                }}
                SelectProps={{
                  displayEmpty: true,
                  renderValue: (selected: any) =>
                    !selected ? (
                      <span style={{ color: "rgba(0,0,0,0.6)" }}>
                        {doctorLoading ? "Loading..." : "Select Doctor"}
                      </span>
                    ) : (
                      selected
                    ),
                }}
              >
                <MenuItem value="">
                  <em>{doctorLoading ? "Loading..." : "Select Doctor"}</em>
                </MenuItem>
                {doctors.map((d) => (
                  <MenuItem key={d.doctor_id} value={d.doctor_name}>
                    {d.doctor_name}{d.specialized_in ? ` (${d.specialized_in})` : ""}
                  </MenuItem>
                ))}
              </TextField>
            </FormControl>

            <FormControl fullWidth>
              <TextField
                multiline
                rows={3}
                name="reason"
                placeholder="Reason for Visit"
                value={formData.reason}
                onChange={handleChange}
                size="small"
                error={!!errors.reason}
                helperText={errors.reason || " "}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <FaClipboardList className="text-[var(--color-text)]" />
                    </InputAdornment>
                  ),
                }}
              />
            </FormControl>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <Button
              type="submit"
              disabled={saving}
              variant="contained"
              className="px-4 py-2 rounded-xl bg-[var(--color-success)] hover:bg-blue-700 text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed normal-case"
            >
              Submit            </Button>

            <Button
              type="button"
              variant="outlined"
              onClick={onClose}
              className="px-4 py-2 rounded-xl normal-case"
            >
              Close
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WalkInRegisterForm;
