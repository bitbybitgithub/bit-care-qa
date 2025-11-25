import React, { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaEnvelope,
  FaUserMd,
  FaClipboardList,
} from "react-icons/fa";
import { MdPhoneInTalk } from "react-icons/md";
import { savePatient } from "../../api/SavePatientApi";
import { saveAppointment } from "../../api/SaveAppointmentApi";
import { getDoctorList, type Doctor } from "../../api/DocListApi";
import { toast } from "react-toastify";
import {
  IoCallOutline,
  IoCalendarOutline,
  IoMailOutline,
  IoPerson,
} from "react-icons/io5";
import { FaUsers } from "react-icons/fa";
import { AppointmentStatus } from "../../context/constant/enum";
import { getSessionItem } from "../../context/sessions/userSession";
import { FaPeopleLine } from "react-icons/fa6";

type WalkinFormData = {
  name: string;
  dob: string;
  email: string;
  phone: string;
  doctor: string;
  reason: string;
  patient_id?: number;
  gender: string;
};

type WalkInRegisterFormProps = {
  onClose: () => void;
  patientData?: any;
  onSuccess: () => void;
  contact: string;
};

const WalkInRegisterForm: React.FC<WalkInRegisterFormProps> = ({
  onClose,
  patientData,
  onSuccess,
  contact,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    email: "",
    phone: "",
    doctor: "",
    reason: "",
    gender: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  // Get current time
  const now = new Date();
  const user_id = getSessionItem("user", "user_id");
  const clinic_id = getSessionItem("user", "clinic_id");
  // Format function for HH:mm
  const formatTime = (date: Date) => date.toTimeString().slice(0, 5);

  // Calculate end time (15 minutes later)
  const endTime = new Date(now.getTime() + 15 * 60 * 1000);

  //  Fetch doctors list on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setDoctorLoading(true);
        const list = await getDoctorList(clinic_id);
        setDoctors(list);
      } catch (err) {
        console.error("Error fetching doctor list:", err);
        setDoctors([]);
      } finally {
        setDoctorLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  //  Prefill if patientData exists
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
  }, [patientData]);

  //  Simple inline validation
  const validate = (data: WalkinFormData) => {
    const newErrors: Record<string, string> = {};
    if (!data.name.trim()) newErrors.name = "Full name is required";
    if (!data.dob) newErrors.dob = "Date of birth is required";
    if (!data.gender.trim()) newErrors.gender = "Gender is required";

    if (!data.phone.trim()) newErrors.phone = "Mobile number is required";
    else if (!/^\d{10}$/.test(data.phone))
      newErrors.phone = "Enter valid 10-digit mobile";
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email))
      newErrors.email = "Invalid email format";
    return newErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  //  Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log(" Submit clicked");

    const validationErrors = validate(formData);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      console.warn("Validation failed:", validationErrors);
      return;
    }

    const reqBody = {
      patient_name: formData.name,
      gender: formData.gender,
      date_of_birth: formData.dob,
      email: formData.email,
      mobile_number: formData.phone,
    };

    try {
      setLoading(true);

      let patientId = patientData?.patient_id; // existing patient check

      if (!patientId) {
        console.log("Calling savePatient with:", reqBody);
        const res: any = await savePatient(reqBody);
        console.log("Patient API Response:", res);

        if (!res || !res.patientId) {
          throw new Error(res?.message || "Failed to register patient.");
        }

        patientId = res.patientId;
        console.log("Patient created with ID:", patientId);
      } else {
        console.log("Existing patient found with ID:", patientId);
      }

      // Find doctor info
      const selectedDoctor = doctors.find((d) => d.name === formData.doctor);

      const appointmentData = {
        patient_id: patientId,
        doctor_id: selectedDoctor?.id || 0,
        patient_name: formData.name,
        doctor_name: formData.doctor,
        gender: formData.gender,
        appointment_date: new Date().toISOString().split("T")[0],
        start_time: formatTime(now),
        end_time: formatTime(endTime),
        status: AppointmentStatus.Scheduled,
        source: "walk_in",
        reason: formData.reason || "Regular checkup",
        date_of_birth: formData.dob,
        mobile_number: formData.phone || contact,
        user_id: Number(user_id),
      };

      console.log("Calling saveAppointment with:", appointmentData);
      const appointmentRes = await saveAppointment(appointmentData);
      console.log("Appointment API Response:", appointmentRes);

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
      onSuccess();
      setErrors({});
      onClose();
    } catch (err: any) {
      console.error("Error in save flow:", err);
      alert(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[var(--z-modal)] flex justify-center items-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6 rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] transition-all"
        style={{
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text)",
        }}
      >
        {/* Header */}
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

        {/* Full Name */}
        <div className="mb-4">
          <label
            className="block font-medium mb-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Full Name
          </label>
          <div
            className={`flex items-center px-3 py-2 rounded-[var(--radius-lg)] transition-all border`}
            style={{
              borderColor: errors.name
                ? "var(--color-error)"
                : "var(--color-border)",
              boxShadow: errors.name ? "0 0 0 2px var(--color-error)" : "none",
            }}
          >
            <IoPerson
              className="mr-2"
              style={{ color: "var(--color-text-secondary)" }}
            />
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className="w-full outline-none bg-transparent"
              style={{ color: "var(--color-text)" }}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm" style={{ color: "var(--color-error)" }}>
              {errors.name}
            </p>
          )}
        </div>

        {/* DOB + Age + Gender */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-1">
          {/* DOB */}
          <div>
            <label
              className="block font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Date of Birth
            </label>
            <div
              className="flex items-center px-3 py-2 rounded-[var(--radius-lg)] border transition-all"
              style={{
                borderColor: errors.dob
                  ? "var(--color-error)"
                  : "var(--color-border)",
              }}
            >
              <FaCalendarAlt
                className="mr-2"
                style={{ color: "var(--color-text-secondary)" }}
              />
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full outline-none bg-transparent"
                style={{ color: "var(--color-text)" }}
              />
            </div>
          </div>

          {/* Age */}
          <div>
            <label
              className="block font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Age
            </label>
            <div
              className="flex items-center px-3 py-2 rounded-[var(--radius-lg)] border"
              style={{
                borderColor: "var(--color-border)",
                backgroundColor: "var(--color-surface-alt)",
              }}
            >
              <span style={{ color: "var(--color-text)" }}>
                {formData.dob
                  ? Math.floor(
                      (new Date().getTime() -
                        new Date(formData.dob).getTime()) /
                        (365.25 * 24 * 60 * 60 * 1000)
                    )
                  : "--"}
              </span>
              <span
                className="ml-1"
                style={{ color: "var(--color-text-secondary)" }}
              >
                years
              </span>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label
              className="block font-medium mb-1"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Gender
            </label>
            <div
              className="flex items-center px-3 py-2 rounded-[var(--radius-lg)] border transition-all"
              style={{
                borderColor: errors.gender
                  ? "var(--color-error)"
                  : "var(--color-border)",
              }}
            >
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full outline-none bg-transparent"
                style={{
                  color: "var(--color-text)",
                }}
              >
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="mb-4">
          <label
            className="block font-medium mb-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Contact Number
          </label>
          <div
            className="flex items-center px-3 py-2 rounded-[var(--radius-lg)] border transition-all"
            style={{
              borderColor: errors.phone
                ? "var(--color-error)"
                : "var(--color-border)",
            }}
          >
            <IoCallOutline
              className="mr-2"
              style={{ color: "var(--color-text-secondary)" }}
            />
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="10-digit mobile number"
              className="w-full outline-none bg-transparent"
              maxLength={10}
              inputMode="numeric"
            />
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label
            className="block font-medium mb-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Email Address
          </label>
          <div
            className="flex items-center px-3 py-2 rounded-[var(--radius-lg)] border transition-all"
            style={{
              borderColor: errors.email
                ? "var(--color-error)"
                : "var(--color-border)",
            }}
          >
            <FaEnvelope
              className="mr-2"
              style={{
                color: errors.email
                  ? "var(--color-error)"
                  : "var(--color-text-secondary)",
              }}
            />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@domain.com"
              className="w-full outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Doctor */}
        <div className="mb-4">
          <label
            className="block font-medium mb-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Select Doctor
          </label>
          <div
            className="flex items-center px-3 py-2 rounded-[var(--radius-lg)] border transition-all"
            style={{
              borderColor: "var(--color-border)",
            }}
          >
            <FaUserMd
              className="mr-2"
              style={{ color: "var(--color-text-secondary)" }}
            />
            <select
              name="doctor"
              value={formData.doctor}
              onChange={handleChange}
              className="w-full outline-none bg-transparent"
              disabled={doctorLoading}
              style={{ color: "var(--color-text)" }}
            >
              <option value="">
                {doctorLoading ? "Loading..." : "-- Select Doctor --"}
              </option>
              {doctors.map((d) => (
                <option key={d.id} value={d.name}>
                  {`${d.name} (${d.specialist})`}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <label
            className="block font-medium mb-1"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Reason for Visit
          </label>
          <div
            className="flex items-start px-3 py-2 rounded-[var(--radius-lg)] border transition-all"
            style={{
              borderColor: errors.reason
                ? "var(--color-error)"
                : "var(--color-border)",
            }}
          >
            <FaClipboardList
              className="mr-2 mt-1"
              style={{ color: "var(--color-text-secondary)" }}
            />
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Describe reason for visit"
              rows={3}
              className="w-full outline-none bg-transparent resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 font-semibold py-2 rounded-[var(--radius-full)] transition disabled:opacity-[var(--opacity-disabled)]"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "var(--color-white)",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {loading ? "Saving..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 font-medium py-2 rounded-[var(--radius-full)] border transition"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text)",
              backgroundColor: "var(--color-surface-alt)",
            }}
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
};

export default WalkInRegisterForm;
