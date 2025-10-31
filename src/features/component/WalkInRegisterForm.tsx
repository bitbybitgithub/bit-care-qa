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

type WalkinFormData = {
  name: string;
  dob: string;
  email: string;
  phone: string;
  doctor: string;
  reason: string;
  patient_id?: number;
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
  const [formData, setFormData] = useState<WalkinFormData>({
    name: "",
    dob: "",
    email: "",
    phone: contact,
    doctor: "",
    reason: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [doctorLoading, setDoctorLoading] = useState(false);
  // Get current time
  const now = new Date();

  // Format function for HH:mm
  const formatTime = (date: Date) => date.toTimeString().slice(0, 5);

  // Calculate end time (15 minutes later)
  const endTime = new Date(now.getTime() + 15 * 60 * 1000);

  //  Fetch doctors list on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setDoctorLoading(true);
        const list = await getDoctorList();
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
      });
    } else {
      setFormData({
        name: "",
        dob: "",
        email: "",
        phone:contact,
        doctor: "",
        reason: "",
      });
    }
  }, [patientData]);

  //  Simple inline validation
  const validate = (data: WalkinFormData) => {
    const newErrors: Record<string, string> = {};
    if (!data.name.trim()) newErrors.name = "Full name is required";
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
      gender: 1,
      date_of_birth: formData.dob,
      email: formData.email,
      mobile_number: formData.phone,
    };

    try {
      setLoading(true);

      let patientId = patientData?.patientId; // existing patient check

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
        appointment_date: new Date().toISOString().split("T")[0],
        start_time: formatTime(now),
        end_time: formatTime(endTime),
        status: "scheduled",
        source: "walk_in",
        reason: formData.reason || "Regular checkup",
        user_id: 2,
      };

      console.log("Calling saveAppointment with:", appointmentData);
      const appointmentRes = await saveAppointment(appointmentData);
      console.log("Appointment API Response:", appointmentRes);

      alert("Patient and Appointment saved successfully!");

      setFormData({
        name: "",
        dob: "",
        email: "",
        phone: "",
        doctor: "",
        reason: "",
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
        className="relative bg-white shadow-2xl rounded-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl p-6 sm:p-4 max-h-[85vh] overflow-y-auto z-[10000]"
      >
        <h2 className="text-2xl font-semibold text-center mb-4 text-gray-800">
          Walk-In Patient Registration
        </h2>

        {/* Name */}
        <div className="mb-2">
          <label className="block text-gray-700 font-medium mb-1">
            Full Name
          </label>
          <div
            className={`flex items-center rounded-lg px-3 py-2 transition-all border 
    ${
      errors.name
        ? "border-red-500 ring-1 ring-red-400"
        : "border-gray-300 hover:border-blue-400 hover:shadow-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400"
    }`}
          >
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter full name"
              className="w-full outline-none"
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
            <label className="block text-gray-700 font-medium mb-1">
              Contact Number
            </label>
            <div
              className={`flex items-center rounded-lg px-3 py-2 transition-all border 
    ${
      errors.phone
        ? "border-red-500 ring-1 ring-red-400"
        : "border-gray-300 hover:border-blue-400 hover:shadow-md focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-400"
    }`}
            >
              <MdPhoneInTalk
                className={`mr-2 ${
                  errors.phone ? "text-red-500" : "text-gray-500"
                }`}
              />
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
