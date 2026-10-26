import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  FormControl,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  FaCalendarAlt,
  FaEnvelope,
  FaUsers,
  FaTimes,
  FaFileUpload,
  FaCheck,
  FaPlusCircle,
} from "react-icons/fa";
import { IoCallOutline, IoPerson } from "react-icons/io5";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "react-toastify";
import { savePatient } from "../../../api/SavePatientApi";
import { uploadPrescriptionFile } from "../../../api/CommonApi/uploadFileApi";
import {
  saveLabAppointmentApi,
  type SaveLabAppointmentPayload,
} from "../../../api/labApis/LabApi";
import { getSessionItem } from "../../../context/sessions/userSession";
import { useSocket } from "../../../context/SocketContext";
import type {
  WalkinFormData,
  WalkInRegisterFormProps,
} from "../../../types/staffdashboardtype/StaffDashboardInterfaces";
import LabWalkInTestSelectionPopup, {
  type LabWalkInPackage,
  type LabWalkInTest,
} from "./LabWalkInTestSelectionPopup";

type LabWalkInFormData = Omit<WalkinFormData, "doctor" | "reason">;
type VisitType = "Preventive" | "Prescribed";

const LabWalkInRegisterForm: React.FC<WalkInRegisterFormProps> = ({
  onClose,
  patientData,
  onSuccess,
  contact,
}) => {
  const [formData, setFormData] = useState<LabWalkInFormData>({
    name: "",
    dob: "",
    email: "",
    phone: "",
    gender: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [age, setAge] = useState<number | "">("");
  const [testPopupOpen, setTestPopupOpen] = useState(false);
  const [selectedTests, setSelectedTests] = useState<LabWalkInTest[]>([]);
  const [selectedPackages, setSelectedPackages] = useState<LabWalkInPackage[]>(
    [],
  );
  const [visitType, setVisitType] = useState<VisitType>("Preventive");
  const [doctorName, setDoctorName] = useState("");
  const [doctorMobile, setDoctorMobile] = useState("");
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null);

  const today = new Date();
  const labId = Number(getSessionItem("user", "lab_id"));
  const userId = Number(getSessionItem("user", "user_id"));
  const { socket } = useSocket();
  const NAME_REGEX = /^[A-Za-z\s.'-]{2,50}$/;
  const MOBILE_REGEX = /^[6-9]\d{9}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  const maxDate = today.toISOString().split("T")[0];
  const minDateObj = new Date();
  minDateObj.setFullYear(today.getFullYear() - 120);
  const minDate = minDateObj.toISOString().split("T")[0];

  const selectionSummary = useMemo(
    () => [
      ...selectedTests.map((test) => ({
        id: test.test_id,
        type: "test" as const,
        name: test.test_name,
      })),
      ...selectedPackages.map((pkg) => ({
        id: pkg.package_id,
        type: "package" as const,
        name: pkg.package_name,
      })),
    ],
    [selectedTests, selectedPackages],
  );

  const totalSelectionCount = selectionSummary.length;
  const totalAmount =
    selectedTests.reduce(
      (total, test) => total + Number(test.payable_amount ?? test.price ?? 0),
      0,
    ) +
    selectedPackages.reduce(
      (total, pkg) => total + Number(pkg.package_price ?? 0),
      0,
    );

  useEffect(() => {
    if (!formData.dob) {
      setAge("");
      return;
    }

    const birthDate = new Date(formData.dob);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
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
        gender: patientData?.gender?.toString() || "",
      });
      return;
    }

    setFormData({
      name: "",
      dob: "",
      email: "",
      phone: contact,
      gender: "",
    });
    setSelectedTests([]);
    setSelectedPackages([]);
    setVisitType("Preventive");
    setDoctorName("");
    setDoctorMobile("");
    setPrescriptionFile(null);
  }, [patientData, contact]);

  const validate = (data: LabWalkInFormData) => {
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
      const ageYears =
        (today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);

      if (ageYears < 0) newErrors.dob = "DOB cannot be in the future";
      else if (ageYears > 120) newErrors.dob = "Invalid date of birth";
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

    if (visitType === "Prescribed") {
      if (!doctorName.trim()) {
        newErrors.doctor_name = "Doctor name is required";
      } else if (!NAME_REGEX.test(doctorName.trim())) {
        newErrors.doctor_name = "Doctor name should contain only letters";
      }

      if (!doctorMobile.trim()) {
        newErrors.doctor_mobile = "Doctor mobile number is required";
      } else if (!MOBILE_REGEX.test(doctorMobile)) {
        newErrors.doctor_mobile = "Enter valid Indian mobile number";
      }

      if (!prescriptionFile) {
        newErrors.prescription = "Prescription is required";
      }
    }

    if (!selectedTests.length && !selectedPackages.length) {
      newErrors.selection = "Please select at least one test or package";
    }

    if (selectedTests.length > 0 && selectedPackages.length > 0) {
      newErrors.selection = "Please select either tests or packages, not both";
    }

    return newErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
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
    setFormData((prev) => ({
      ...prev,
      [name]: name === "email" ? newValue.toLowerCase() : newValue,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePrescriptionFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null;
    setPrescriptionFile(file);
    if (errors.prescription) {
      setErrors((prev) => ({ ...prev, prescription: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate(formData);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error(
        validationErrors.selection ||
          validationErrors.doctor_name ||
          validationErrors.doctor_mobile ||
          validationErrors.prescription ||
          "Please check all required fields",
      );
      return;
    }

    if (!labId || !userId) {
      toast.error("Lab or user details are missing");
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
      setSaving(true);

      let patientId = patientData?.patient_id;
      if (!patientId) {
        const res: any = await savePatient(reqBody);
        if (!res || !res.patientId) {
          throw new Error(res?.message || "Failed to register patient.");
        }
        patientId = res.patientId;
      }

      let prescriptionGuid: string | null = null;
      let prescriptionFileName: string | null = null;

      if (visitType === "Prescribed") {
        if (!prescriptionFile) {
          throw new Error("Prescription is required");
        }

        const uploadResponse = await uploadPrescriptionFile(
          prescriptionFile,
          "PRESCRIPTIONS_BITCARE",
        );
        prescriptionGuid = uploadResponse?.guid ?? null;
        prescriptionFileName =
          uploadResponse?.original_file_name || prescriptionFile.name || null;
      }

      const selectedPackage = selectedPackages[0] ?? null;
      const testDetails =
        selectedTests.length > 0
          ? selectedTests.map((test) => {
              const price = Number(test.price);
              const discount = Number(test.discount_price ?? 0);
              return {
                test_id: Number(test.test_id),
                category_id: Number(test.category_id),
                test_price: price,
                discount_price: discount,
                payable_amount: Number(
                  test.payable_amount ??
                    test.payable_amount ??
                    price - discount,
                ),
              };
            })
          : null;

      const totalAmount =
        selectedTests.reduce(
          (sum, t) =>
            sum +
            Number(
              t.payable_amount ??
                Number(t.price) - Number(t.discount_price ?? 0),
            ),
          0,
        ) +
        selectedPackages.reduce(
          (sum, p) => sum + Number(p.package_price || 0),
          0,
        );
      const payload: SaveLabAppointmentPayload = {
        lab_id: labId,
        patient_id: Number(patientId),
        test_details: testDetails,
        total_amount: totalAmount,
        appointment_date: new Date().toISOString().split("T")[0],
        appointment_type: "WALK_IN",
        booking_source: "LAB",
        source: "WEB",
        remarks: null,
        created_by: userId,
        is_package: Boolean(selectedPackage),
        package_id: selectedPackage ? Number(selectedPackage.package_id) : null,
        visit_type: visitType,
        doctor_name: visitType === "Prescribed" ? doctorName.trim() : null,
        doctor_mobile_number:
          visitType === "Prescribed" ? doctorMobile.trim() : null,
        prescription_guid_name: prescriptionGuid,
        prescription_file_name: prescriptionFileName,
      };
      const appointmentResponse = await saveLabAppointmentApi(payload);

      if (!(appointmentResponse as any)?.success) {
        throw new Error(
          (appointmentResponse as any)?.message ||
            "Failed to book lab appointment",
        );
      }

      toast.success("Lab appointment booked successfully");

      if (socket && labId) {
        socket.emit("newLabAppointment", {
          lab_id: Number(labId),
          appointment_id: (appointmentResponse as any)?.data?.appointment_id,
          lab_record_id: (appointmentResponse as any)?.data?.lab_record_id,
          patient_name: formData.name,
          appointment_type: "WALK_IN",
        });
      }

      setFormData({
        name: "",
        dob: "",
        email: "",
        phone: "",
        gender: "",
      });
      setSelectedTests([]);
      setSelectedPackages([]);
      setVisitType("Preventive");
      setDoctorName("");
      setDoctorMobile("");
      setPrescriptionFile(null);
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

  const isPrescriptionRequired = visitType === "Prescribed";

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[var(--color-surface)] border border-[var(--color-border)]/30 rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] p-4 sm:p-6 text-[var(--color-text)] overflow-hidden max-h-[92vh] flex flex-col">
        {saving && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[var(--color-surface)]/80 backdrop-blur-xs rounded-[var(--radius-xl)]">
            <CircularProgress
              size={36}
              sx={{ color: "var(--color-primary)" }}
            />
            <p className="mt-3 text-xs sm:text-sm font-semibold text-[var(--color-primary)]">
              Booking Appointment...
            </p>
          </div>
        )}

        <form
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 min-h-0"
        >
          {/* Header */}
          <div className="flex justify-between items-start pb-3 mb-3 border-b border-[var(--color-border)]/20 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center text-lg shrink-0">
                <FaUsers />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-[var(--color-text)]">
                  Walk-In Patient Registration
                </h3>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Fill in patient information and select tests or packages
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!saving) onClose();
              }}
              className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)] transition cursor-pointer"
              aria-label="Close"
            >
              <FaTimes />
            </button>
          </div>

          {/* Form Scrollable Body */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-3">
            {/* 2-Column Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Visit Type */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Visit Type
                </label>
                <TextField
                  select
                  fullWidth
                  value={visitType}
                  onChange={(event) => {
                    const nextType = event.target.value as VisitType;
                    setVisitType(nextType);
                    if (nextType === "Preventive") {
                      setDoctorName("");
                      setDoctorMobile("");
                      setPrescriptionFile(null);
                    }
                    setErrors((prev) => ({
                      ...prev,
                      doctor_name: "",
                      doctor_mobile: "",
                      prescription: "",
                      selection: "",
                    }));
                  }}
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: "var(--color-surface-alt)",
                      fontSize: "0.875rem",
                    },
                  }}
                >
                  <MenuItem value="Preventive">Preventive</MenuItem>
                  <MenuItem value="Prescribed">Prescribed</MenuItem>
                </TextField>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Full Name <span className="text-[var(--color-error)]">*</span>
                </label>
                <TextField
                  fullWidth
                  name="name"
                  placeholder="Patient Full Name"
                  value={formData.name}
                  onChange={handleChange}
                  size="small"
                  error={!!errors.name}
                  helperText={errors.name}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IoPerson className="text-[var(--color-primary)] text-sm" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: "var(--color-surface-alt)",
                      fontSize: "0.875rem",
                    },
                    "& .MuiFormHelperText-root": {
                      fontSize: "0.7rem",
                      mx: 0.5,
                      mt: 0.25,
                    },
                  }}
                />
              </div>

              {/* DOB */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Date of Birth{" "}
                  <span className="text-[var(--color-error)]">*</span>
                </label>
                <TextField
                  fullWidth
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  size="small"
                  error={!!errors.dob}
                  helperText={errors.dob}
                  inputProps={{ max: maxDate, min: minDate }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaCalendarAlt className="text-[var(--color-primary)] text-xs" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: "var(--color-surface-alt)",
                      fontSize: "0.875rem",
                    },
                    "& .MuiFormHelperText-root": {
                      fontSize: "0.7rem",
                      mx: 0.5,
                      mt: 0.25,
                    },
                  }}
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Age (Auto Calculated)
                </label>
                <TextField
                  fullWidth
                  value={age !== "" ? `${age} years` : ""}
                  placeholder="Calculated from DOB"
                  size="small"
                  slotProps={{
                    input: {
                      readOnly: true,
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: "var(--color-surface-alt)",
                      fontSize: "0.875rem",
                      opacity: 0.9,
                    },
                  }}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Contact Number{" "}
                  <span className="text-[var(--color-error)]">*</span>
                </label>
                <TextField
                  fullWidth
                  name="phone"
                  placeholder="10-digit number"
                  value={formData.phone}
                  onChange={handleChange}
                  size="small"
                  error={!!errors.phone}
                  helperText={errors.phone}
                  inputProps={{ maxLength: 10, inputMode: "tel" }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IoCallOutline className="text-[var(--color-primary)] text-sm" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: "var(--color-surface-alt)",
                      fontSize: "0.875rem",
                    },
                    "& .MuiFormHelperText-root": {
                      fontSize: "0.7rem",
                      mx: 0.5,
                      mt: 0.25,
                    },
                  }}
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Gender <span className="text-[var(--color-error)]">*</span>
                </label>
                <TextField
                  select
                  fullWidth
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange as any}
                  size="small"
                  error={!!errors.gender}
                  helperText={errors.gender}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IoPerson className="text-[var(--color-primary)] text-sm" />
                        </InputAdornment>
                      ),
                    },
                    select: {
                      displayEmpty: true,
                      renderValue: (selected: any) =>
                        !selected ? (
                          <span className="text-[var(--color-text-secondary)]">
                            Select Gender
                          </span>
                        ) : (
                          selected
                        ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: "var(--color-surface-alt)",
                      fontSize: "0.875rem",
                    },
                    "& .MuiFormHelperText-root": {
                      fontSize: "0.7rem",
                      mx: 0.5,
                      mt: 0.25,
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>Select Gender</em>
                  </MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </TextField>
              </div>

              {/* Email */}
              <div className={!isPrescriptionRequired ? "sm:col-span-2" : ""}>
                <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                  Email Address{" "}
                  <span className="text-[var(--color-text-secondary)] font-normal">
                    (Optional)
                  </span>
                </label>
                <TextField
                  fullWidth
                  type="email"
                  name="email"
                  placeholder="patient@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  size="small"
                  error={!!errors.email}
                  helperText={errors.email}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <FaEnvelope className="text-[var(--color-primary)] text-xs" />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "var(--radius-lg)",
                      backgroundColor: "var(--color-surface-alt)",
                      fontSize: "0.875rem",
                    },
                    "& .MuiFormHelperText-root": {
                      fontSize: "0.7rem",
                      mx: 0.5,
                      mt: 0.25,
                    },
                  }}
                />
              </div>

              {/* If Prescribed: Doctor Name */}
              {isPrescriptionRequired && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Doctor Name{" "}
                    <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <TextField
                    fullWidth
                    name="doctor_name"
                    placeholder="Referring Doctor Name"
                    value={doctorName}
                    onChange={(event) => {
                      const cleaned = event.target.value.replace(
                        /[^A-Za-z\s.'-]/g,
                        "",
                      );
                      setDoctorName(cleaned);
                      if (errors.doctor_name) {
                        setErrors((prev) => ({ ...prev, doctor_name: "" }));
                      }
                    }}
                    size="small"
                    error={!!errors.doctor_name}
                    helperText={errors.doctor_name}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: "var(--color-surface-alt)",
                        fontSize: "0.875rem",
                      },
                      "& .MuiFormHelperText-root": {
                        fontSize: "0.7rem",
                        mx: 0.5,
                        mt: 0.25,
                      },
                    }}
                  />
                </div>
              )}

              {/* If Prescribed: Doctor Mobile & Prescription */}
              {isPrescriptionRequired && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Doctor Mobile Number{" "}
                    <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <TextField
                    fullWidth
                    name="doctor_mobile"
                    placeholder="Doctor 10-digit Mobile"
                    value={doctorMobile}
                    onChange={(event) => {
                      const cleaned = event.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setDoctorMobile(cleaned);
                      if (errors.doctor_mobile) {
                        setErrors((prev) => ({ ...prev, doctor_mobile: "" }));
                      }
                    }}
                    size="small"
                    error={!!errors.doctor_mobile}
                    helperText={errors.doctor_mobile}
                    inputProps={{ maxLength: 10, inputMode: "tel" }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <IoCallOutline className="text-[var(--color-primary)] text-sm" />
                          </InputAdornment>
                        ),
                      },
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: "var(--radius-lg)",
                        backgroundColor: "var(--color-surface-alt)",
                        fontSize: "0.875rem",
                      },
                      "& .MuiFormHelperText-root": {
                        fontSize: "0.7rem",
                        mx: 0.5,
                        mt: 0.25,
                      },
                    }}
                  />
                </div>
              )}

              {isPrescriptionRequired && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Upload Prescription{" "}
                    <span className="text-[var(--color-error)]">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <Button
                      fullWidth
                      variant="outlined"
                      component="label"
                      size="small"
                      sx={{
                        py: 0.9,
                        textTransform: "none",
                        fontWeight: 600,
                        fontSize: "0.8125rem",
                        borderRadius: "var(--radius-lg)",
                        borderColor: errors.prescription
                          ? "var(--color-error)"
                          : "var(--color-primary)",
                        color: "var(--color-primary)",
                        "&:hover": {
                          borderColor: "var(--color-primary)",
                          backgroundColor: "var(--color-primary)/5",
                        },
                      }}
                    >
                      <FaFileUpload className="mr-1.5" />
                      {prescriptionFile
                        ? "Change Prescription"
                        : "Upload Prescription File"}
                      <input
                        hidden
                        type="file"
                        accept=".pdf,image/png,image/jpeg,image/jpg"
                        onChange={handlePrescriptionFileChange}
                      />
                    </Button>
                  </div>
                  {prescriptionFile && (
                    <div className="mt-1.5 flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border)]/40 bg-[var(--color-surface-alt)] px-2 py-1 text-xs">
                      <span className="truncate font-medium text-[var(--color-primary)]">
                        {prescriptionFile.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPrescriptionFile(null);
                          setErrors((prev) => ({
                            ...prev,
                            prescription: "Prescription is required",
                          }));
                        }}
                        className="ml-2 text-xs text-[var(--color-error)] hover:underline shrink-0"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {errors.prescription && (
                    <p className="text-[0.7rem] text-[var(--color-error)] mt-1">
                      {errors.prescription}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Selected Tests / Packages Summary Card */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)]/40 bg-[var(--color-surface-alt)] p-3.5 shadow-[var(--shadow-xs)]">
              <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[var(--color-border)]/20">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-[var(--color-text)]">
                    Selected Tests & Packages
                  </span>
                  <span className="rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20 px-2 py-0.5 text-xs font-bold">
                    {totalSelectionCount}
                  </span>
                </div>

                <Button
                  type="button"
                  variant="contained"
                  size="small"
                  onClick={() => setTestPopupOpen(true)}
                  sx={{
                    py: 0.5,
                    px: 1.5,
                    textTransform: "none",
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    borderRadius: "var(--radius-lg)",
                    backgroundColor: "var(--color-primary)",
                    color: "#ffffff",
                    boxShadow: "var(--shadow-xs)",
                    "&:hover": {
                      backgroundColor: "var(--color-primary)",
                      opacity: 0.9,
                    },
                  }}
                >
                  <FaPlusCircle className="mr-1 text-xs" />
                  {totalSelectionCount
                    ? "Edit Tests/Packages"
                    : "Select Tests/Packages"}
                </Button>
              </div>

              {selectionSummary.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 max-h-[85px] overflow-y-auto pr-1">
                  {selectionSummary.map((item) => (
                    <span
                      key={`${item.type}-${item.id}`}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text)]"
                    >
                      <span className="truncate max-w-[220px]">
                        {item.name}
                      </span>
                      <IconButton
                        type="button"
                        size="small"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => {
                          if (item.type === "test") {
                            setSelectedTests((current) =>
                              current.filter(
                                (selectedTest) =>
                                  selectedTest.test_id !== item.id,
                              ),
                            );
                            return;
                          }
                          setSelectedPackages((current) =>
                            current.filter(
                              (selectedPackage) =>
                                selectedPackage.package_id !== item.id,
                            ),
                          );
                        }}
                        sx={{
                          padding: 0,
                          color: "var(--color-text-secondary)",
                          "&:hover": { color: "var(--color-error)" },
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-secondary)] py-1">
                  No tests or packages selected. Click the button above to
                  choose tests.
                </p>
              )}

              {errors.selection && (
                <p className="mt-1.5 text-xs text-[var(--color-error)] font-medium">
                  {errors.selection}
                </p>
              )}

              <div className="mt-2.5 flex items-center justify-between border-t border-[var(--color-border)]/20 pt-2">
                <span className="text-xs sm:text-sm font-semibold text-[var(--color-text)]">
                  Total Payable Amount
                </span>
                <span className="text-base sm:text-lg font-bold text-[var(--color-primary)]">
                  ₹{totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 mt-2 border-t border-[var(--color-border)]/20 shrink-0">
            <Button
              type="button"
              variant="outlined"
              onClick={onClose}
              sx={{
                py: 0.8,
                px: 2.5,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8125rem",
                borderRadius: "var(--radius-lg)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
                "&:hover": {
                  borderColor: "var(--color-text)",
                  backgroundColor: "var(--color-bg)",
                },
              }}
            >
              Close
            </Button>

            <Button
              type="submit"
              disabled={saving || totalSelectionCount === 0}
              variant="contained"
              sx={{
                py: 0.8,
                px: 3,
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.8125rem",
                borderRadius: "var(--radius-lg)",
                backgroundColor: "var(--color-primary)",
                color: "#ffffff",
                boxShadow: "var(--shadow-md)",
                "&:hover": {
                  backgroundColor: "var(--color-primary)",
                  opacity: 0.9,
                },
                "&.Mui-disabled": {
                  backgroundColor: "var(--color-border)",
                  color: "var(--color-text-secondary)",
                  opacity: 0.6,
                },
              }}
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <CircularProgress size={16} sx={{ color: "#ffffff" }} />
                  Booking...
                </span>
              ) : (
                "Confirm & Book"
              )}
            </Button>
          </div>
        </form>
      </div>

      <LabWalkInTestSelectionPopup
        open={testPopupOpen}
        labId={labId}
        selectedTests={selectedTests}
        selectedPackages={selectedPackages}
        onClose={() => setTestPopupOpen(false)}
        onConfirm={(tests, packages) => {
          setSelectedTests(tests);
          setSelectedPackages(packages ?? []);
        }}
      />
    </div>
  );
};

export default LabWalkInRegisterForm;
