import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Divider,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Switch,
  TextField,
} from "@mui/material";
import DailySchedule from "./DailySchedule";
import UploadControl from "../../../components/common/UploadControl";
import axios from "axios";
import { toast } from "react-toastify";
import { Base64ToImage } from "../../../utils/converter";


interface ShiftPayload {
    clinic_id: number | string;
    co_id: number | string;
    shift: number;
    shift_start: string;
    shift_end: string;
    is_active: number;
}
const Profile: React.FC = () => {
  const [clinicType, setClinicType] = useState("Full-time");
  const [patientDemand, setPatientDemand] = useState("Heavy");
  const [sendReminders, setSendReminders] = useState(true);
  const [clinicLogo, setClinicLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [logoImg, setLogoImg] = useState<string | null>(null);
  const [operationalDays, setOperationalDays] = useState([]);
  const [shiftDetails, setShiftDetails] = useState<ShiftPayload[]>([]);
  const [initialAllShifts, setInitialAllShifts] = useState<ShiftPayload[]>([]);
  const [updatedShiftDetails, setUpdatedShiftDetails] = useState<
    ShiftPayload[]
  >([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clinicId = 5;

  useEffect(() => {
    getClinicProfileDetails();
  }, []);

  const handleShiftChange = (coId: number, formattedShifts: ShiftPayload[]) => {
    setShiftDetails((prev) => {
      const others = prev.filter((p) => p.co_id !== coId);
      return [...others, ...formattedShifts];
    });

    const originalDayShifts = initialAllShifts.filter((s) => s.co_id === coId);

    const newlyAddedShifts = formattedShifts.filter((newShift) => {
      const isOriginal = originalDayShifts.some(
        (originalShift) =>
          originalShift.shift_start === newShift.shift_start &&
          originalShift.shift_end === newShift.shift_end
      );
      return !isOriginal;
    });

    setUpdatedShiftDetails((prev) => {
      const others = prev.filter((p) => p.co_id !== coId);
      return [...others, ...newlyAddedShifts];
    });
  };

  console.log({ updatedShiftDetails });

  //Called when user toggles active/inactive day
  const handleOperationDay = (
    coId: number | string,
    clinicId: number | string,
    value: boolean
  ) => {
    setOperationalDays((prevData) =>
      prevData.map((dayItem) =>
        dayItem.co_id === coId ? { ...dayItem, is_active: value } : dayItem
      )
    );
    debouncedUpdateClinicOperationStatus(coId, clinicId, value);
  };

  console.log({ operationalDays });
  console.log({ shiftDetails });

  const getClinicProfileDetails = () => {
    const req = { clinic_id: clinicId };
    axios
      .post("http://localhost:8989/api/clinics/get-clinic-profile", req)
      .then((res) => {
        console.log(res);
        const response = res.data;
        setClinicType(response.operational_hrs);
        setPatientDemand(response.patient_demand);
        setSendReminders(response.patient_reminder == 1 ? true : false);
        setLogoImg(Base64ToImage(response.logo));
        setOperationalDays(response.operational_days);
        setShiftDetails(response.shifts);
        setInitialAllShifts(response.shifts);
      })
      .catch((err) => toast.error(err.message));
  };
  const handleFileChange = (file: File | null) => {
    if (file) {
      setClinicLogo(file);
      setPreview(URL.createObjectURL(file)); 
    } else {
      setClinicLogo(null);
      setPreview(null); 
    }
  };

  const handleSave = async () => {
    if (!clinicLogo) {
      toast.error("Please select a logo");
      return;
    }

    const formData = new FormData();
    formData.append("clinic_logo", clinicLogo); 
    formData.append("clinic_id", clinicId.toString());
    formData.append("operational_hrs", clinicType);
    formData.append("patient_demand", patientDemand);
    formData.append("patient_reminder", sendReminders ? "1" : "0");

    // console.log(formData);
    await saveProfileSettingDetails(formData);
    if (updatedShiftDetails.length > 0) {
      await saveCilnicShifts();
    }
  };

  const saveProfileSettingDetails = (formData) => {
    axios
      .post(
        "http://localhost:8989/api/clinics/update-clinic-profile",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      )
      .then((res) => toast.success(res.data.message))
      .catch((err) => toast.error(err.message));
  };

  const saveCilnicShifts = () => {
    axios
      .post(
        "http://localhost:8989/api/clinics/save-clinic-shifts",
        updatedShiftDetails
      )
      .then((res) => {
        console.log(res.data);
        toast.success(res.data.message);
      });
  };

  const debouncedUpdateClinicOperationStatus = (
    coId: number | string,
    clinicId: number | string,
    value: boolean
  ) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const req = {
          co_id: coId,
          clinic_id: clinicId,
          is_active: value ? "1" : "0",
          modified_by: "Internal Admin",
        };
        await axios.post(
          "http://localhost:8989/api/clinics/update-clinic-operation-status",
          req
        );
      } catch (err: any) {
        toast.error(err.message || "Failed to update status");
      }
    }, 2500);
  };

  return (
    <div className=" mx-6 m-4 px-6 py-4  bg-white shadow-lg rounded-2xl">
      {/* Branding */}
      <section className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Clinic Branding
        </h3>

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Logo Preview */}
          <div className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-100 text-gray-500 overflow-hidden">
            {preview || logoImg ? (
              <img
                src={logoImg ?? preview}
                alt="Clinic Logo"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-sm font-medium">Logo</span>
            )}
          </div>

          {/* Upload Control */}
          {!logoImg && (
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Upload Clinic Logo
              </label>
              <UploadControl
                controlName="clinicLogo"
                file={clinicLogo}
                onFileChange={handleFileChange}
                acceptedFileTypes=".jpg,.jpeg,.png,.svg"
                height="50px"
              />
            </div>
          )}
        </div>
      </section>

      {/* Operational Hours */}
      <section className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Operational Hours & Patient Demand
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-2">
          <FormControl>
            <FormLabel className="!text-gray-800 font-medium mb-1">
              Is this a full-time or part-time clinic?
            </FormLabel>
            <RadioGroup
              value={clinicType}
              onChange={(e) => setClinicType(e.target.value)}
              row>
              <FormControlLabel
                value="Full-time"
                control={<Radio />}
                label="Full-time"
              />
              <FormControlLabel
                value="Part-time"
                control={<Radio />}
                label="Part-time"
              />
            </RadioGroup>
          </FormControl>
          <FormControl>
            <FormLabel className="!text-gray-800 font-medium mb-1">
              Patient demand profile
            </FormLabel>
            <RadioGroup
              value={patientDemand}
              onChange={(e) => setPatientDemand(e.target.value)}
              row>
              <FormControlLabel
                value="Heavy"
                control={<Radio />}
                label="Heavy"
              />
              <FormControlLabel
                value="Medium to Light"
                control={<Radio />}
                label="Medium to Light"
              />
            </RadioGroup>
          </FormControl>
        </div>
      </section>

      {/* Communication */}
      <section className="mb-4">
        <div className="flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition rounded-xl px-4 py-2 border">
          <span className="font-medium text-gray-700">
            Send follow-ups and reminders?
          </span>
          <Switch
            checked={sendReminders}
            onChange={(e) => setSendReminders(e.target.checked)}
          />
        </div>
      </section>
      <section className="mb-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Daily Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {operationalDays.map((day) => {
            const dayShifts = initialAllShifts
              .filter((s) => s.co_id === day.co_id)
              .map((s) => ({ start: s.shift_start, end: s.shift_end }));

            return (
              <DailySchedule
                key={day.co_id}
                day={day.day}
                opShift={day}
                handleOperationDay={handleOperationDay}
                onShiftChange={handleShiftChange}
                initialShifts={dayShifts}
              />
            );
          })}
        </div>
      </section>

      {/* Save */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleSave}
        className="rounded-xl py-3 text-lg font-semibold shadow-md hover:shadow-lg transition">
        Save & Complete
      </Button>
    </div>
  );
};

export default Profile;
