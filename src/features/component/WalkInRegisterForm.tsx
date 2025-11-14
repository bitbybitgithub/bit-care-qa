//-----------------------------------------------------------------------------------------

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
    <div className="fixed inset-0 bg-black/40 z-[9999] flex justify-center items-center p-4">
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="relative bg-white shadow-2xl rounded-2xl w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto z-[10000]"
      >
        {/* Back Button */}
        {/* <button
        type="button"
        // onClick={onBack}
        className="absolute top-0 left-0 flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium text-sm"
      >
        ← Back
      </button> */}

        <div className="flex justify-center">
          <h2 className="flex items-center gap-2 text-2xl font-semibold text-gray-800 mb-6">
            <FaUsers className="text-blue-600 text-3xl" />
            Walk-In Patient Registration
          </h2>
        </div>

        {/* Row 1: Full Name */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">
            Full Name
          </label>
          <div
            className={`flex items-center rounded-lg px-3 py-2 transition-all border ${
              errors.name
                ? "border-red-500 ring-1 ring-red-400"
                : "border-gray-300 hover:border-blue-400 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-400"
            }`}
          >
            <IoPerson className="text-gray-500 mr-2" />
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className="w-full outline-none text-gray-800"
            />
          </div>
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* DOB + Phone */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-1">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Date of Birth
            </label>
            <div
              className={`flex items-center rounded-lg px-3 py-2 transition-all border 
    ${
      errors.dob
        ? "border-red-500 ring-1 ring-red-400"
        : "border-gray-300 hover:border-blue-400 hover:shadow-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400"
    }`}
            >
              <FaCalendarAlt className="text-gray-500 mr-2" />

              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                className="w-full outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">Age</label>
            <div className="flex items-center rounded-lg px-3 py-2 border border-gray-300 bg-gray-50">
              <span className="text-gray-800">
                {formData.dob
                  ? Math.floor(
                      (new Date().getTime() -
                        new Date(formData.dob).getTime()) /
                        (365.25 * 24 * 60 * 60 * 1000)
                    )
                  : "--"}
              </span>
              <span className="ml-1 text-gray-500">years</span>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Gender
            </label>
            <div
              className={`flex items-center rounded-lg px-3 py-2 transition-all border ${
                errors.gender
                  ? "border-red-500 ring-1 ring-red-400"
                  : "border-gray-300 hover:border-blue-400 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-400"
              }`}
            >
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full outline-none bg-transparent"
              >
                <option value="">-- Select Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {errors.gender && (
              <p className="text-red-500 text-sm mt-1">{errors.gender}</p>
            )}
          </div>
        </div>

        {/* Row 3: Contact + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Contact Number
            </label>
            <div
              className={`flex items-center rounded-lg px-3 py-2 transition-all border ${
                errors.phone
                  ? "border-red-500 ring-1 ring-red-400"
                  : "border-gray-300 hover:border-blue-400 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-400"
              }`}
            >
              <IoCallOutline className="mr-2" />
              <input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                maxLength={10}
                inputMode="numeric"
                className="w-full outline-none"
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Email */}
        <div className="mb-2">
          <label className="block text-gray-700 font-medium mb-1">
            Email Address
          </label>
          <div
            className={`flex items-center rounded-lg px-3 py-2 transition-all border 
    ${
      errors.email
        ? "border-red-500 ring-1 ring-red-400"
        : "border-gray-300 hover:border-blue-400 hover:shadow-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400"
    }`}
          >
            <FaEnvelope
              className={`mr-2 ${
                errors.email ? "text-red-500" : "text-gray-500"
              }`}
            />
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="example@domain.com"
              className="w-full outline-none"
            />
          </div>
        </div>

        {/* Doctor */}
        <div className="mb-2">
          <label className="block text-gray-700 font-medium mb-1">
            Select Doctor
          </label>
          <div
            className={`flex items-center rounded-lg px-3 py-2 border border-gray-300 
    transition-all hover:border-blue-400 hover:shadow-md 
    focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400 focus-within:shadow-lg`}
          >
            {" "}
            <FaUserMd className="text-gray-500 mr-2" />
            <select
              name="doctor"
              value={formData.doctor}
              onChange={handleChange}
              className="w-full outline-none bg-transparent"
              disabled={doctorLoading}
            >
              <option value="">
                {doctorLoading ? "Loading doctors..." : "-- Select Doctor --"}
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
          <label className="block text-gray-700 font-medium mb-1">
            Reason for Visit
          </label>
          <div
            className={`flex items-center rounded-lg px-3 py-2 transition-all border 
    ${
      errors.email
        ? "border-red-500 ring-1 ring-red-400"
        : "border-gray-300 hover:border-blue-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400"
    }`}
          >
            {" "}
            <FaClipboardList className="text-gray-500 mr-2" />
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Describe reason for visit"
              rows={3}
              className="w-full outline-none resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-full transition disabled:opacity-60"
          >
            {loading ? "Saving..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-gray-300 hover:bg-gray-100 rounded-full py-2 font-medium transition"
          >
            Close
          </button>
        </div>
      </form>
    </div>
  );
};

export default WalkInRegisterForm;
