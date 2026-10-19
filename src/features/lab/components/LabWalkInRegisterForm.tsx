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
import { FaCalendarAlt, FaEnvelope, FaUsers, FaTimes } from "react-icons/fa";
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
    selectedTests.reduce((total, test) => total + Number(test.price || 0), 0) +
    selectedPackages.reduce(
      (total, pkg) => total + Number(pkg.package_price || 0),
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
          "Please check the form details",
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
          ? selectedTests.map((test) => ({
              test_id: Number(test.test_id),
              category_id: Number(test.category_id),
              test_price: Number(test.price),
            }))
          : null;

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
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-start justify-center overflow-y-auto bg-[var(--color-surface-alt)]/40 px-4 py-6 backdrop-blur-sm sm:py-8">
      <div className="relative my-auto w-full max-w-lg">
        {saving && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/50 rounded-[var(--radius-lg)]">
            <CircularProgress size={40} thickness={4} />
          </div>
        )}

        <form
          onClick={(e) => e.stopPropagation()}
          onSubmit={handleSubmit}
          className={`bg-[var(--color-surface)] border border-[var(--color-primary)] shadow-[var(--shadow-lg)] rounded-[var(--radius-lg)] w-full p-6 transform transition-all ${
            saving ? "pointer-events-none opacity-80" : ""
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
            <FormControl fullWidth>
              <TextField
                select
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
              >
                <MenuItem value="Preventive">Preventive</MenuItem>
                <MenuItem value="Prescribed">Prescribed</MenuItem>
              </TextField>
            </FormControl>

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
                  inputProps={{ max: maxDate, min: minDate }}
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
                  onChange={handleChange as any}
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

            {isPrescriptionRequired && (
              <>
                <FormControl fullWidth>
                  <TextField
                    name="doctor_name"
                    placeholder="Doctor Name"
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
                    helperText={errors.doctor_name || " "}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <TextField
                    name="doctor_mobile"
                    placeholder="Doctor Mobile Number"
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
                    helperText={errors.doctor_mobile || " "}
                    inputProps={{ maxLength: 10, inputMode: "tel" }}
                  />
                </FormControl>

                <FormControl fullWidth error={!!errors.prescription}>
                  <Button
                    variant="outlined"
                    component="label"
                    sx={{ justifyContent: "center" }}
                  >
                    {prescriptionFile
                      ? "Change Prescription"
                      : "Upload Prescription"}
                    <input
                      hidden
                      type="file"
                      accept=".pdf,image/png,image/jpeg,image/jpg"
                      onChange={handlePrescriptionFileChange}
                    />
                  </Button>
                  {prescriptionFile && (
                    <div className="mt-2 flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-primary)]">
                      <span className="truncate">{prescriptionFile.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setPrescriptionFile(null);
                          setErrors((prev) => ({
                            ...prev,
                            prescription: "Prescription is required",
                          }));
                        }}
                        className="ml-2 text-red-500"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  <span className="text-xs text-red-600">
                    {errors.prescription || " "}
                  </span>
                </FormControl>
              </>
            )}

            <FormControl fullWidth>
              <Button
                type="button"
                variant="outlined"
                onClick={() => setTestPopupOpen(true)}
              >
                {totalSelectionCount
                  ? `${totalSelectionCount} item${totalSelectionCount > 1 ? "s" : ""} selected`
                  : "Select Tests / Packages"}
              </Button>
            </FormControl>

            <div className="rounded-[var(--radius-md)] border border-[var(--color-primary)] bg-[var(--color-bg)]/40 p-3">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Selected Items</span>
                <span className="rounded-full bg-[var(--color-primary)] px-2.5 py-1 text-xs font-semibold text-white">
                  {totalSelectionCount} selected
                </span>
              </div>

              {selectionSummary.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectionSummary.map((item) => (
                    <span
                      key={`${item.type}-${item.id}`}
                      className="inline-flex max-w-full items-center gap-1 rounded-full border border-[var(--color-primary)] bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]"
                    >
                      <span className="truncate">{item.name}</span>
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
                          color: "var(--color-primary)",
                        }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Select at least one test or package to continue.
                </p>
              )}

              {errors.selection && (
                <p className="mt-2 text-xs text-red-600">{errors.selection}</p>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                <span className="font-semibold">Total Amount</span>
                <span className="text-lg font-bold text-[var(--color-primary)]">
                  ₹{totalAmount}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-6">
            <Button
              type="submit"
              disabled={saving || totalSelectionCount === 0}
              variant="contained"
              className="px-4 py-2 rounded-xl bg-[var(--color-success)] hover:bg-blue-700 text-white shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed normal-case"
            >
              Submit
            </Button>

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
