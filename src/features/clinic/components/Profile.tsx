import React, { useState } from "react";
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

const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const Profile: React.FC = () => {
  const [clinicType, setClinicType] = useState("Full-time");
  const [patientDemand, setPatientDemand] = useState("Heavy");
  const [sendReminders, setSendReminders] = useState(true);
  const [appointmentLength, setAppointmentLength] = useState(15);

  const [clinicLogo, setClinicLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (file: File | null) => {
    if (file) {
      setClinicLogo(file);
      setPreview(URL.createObjectURL(file)); // create preview instantly
    } else {
      setClinicLogo(null);
      setPreview(null); // clear preview when removed
    }
  };

  const handleSave = () => {
    if (!clinicLogo) {
      toast.error("Please select a logo");
      return;
    }

    const formData = new FormData();
    formData.append("clinic_logo", clinicLogo); // file
    formData.append("clinic_id", "1"); // text fields must be string
    formData.append("operational_hrs", clinicType);
    formData.append("patient_demand", patientDemand);
    formData.append("patient_reminder", sendReminders ? "1" : "0");

    console.log(formData)
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
            {preview ? (
              <img
                src={preview}
                alt="Clinic Logo"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <span className="text-sm font-medium">Logo</span>
            )}
          </div>

          {/* Upload Control */}
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

      {/* Appointment length */}
      <section className="mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Appointment & Break Scheduling
        </h3>
        <TextField
          type="number"
          label="Default Appointment Length (minutes)"
          value={appointmentLength}
          onChange={(e) => setAppointmentLength(Number(e.target.value))}
          fullWidth
          className="mt-3"
        />
      </section>

      {/* Daily Schedules */}
      <section className="mb-5">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Daily Schedule
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* {daysOfWeek.map((day) => (
            <DailySchedule key={day} day={day} />
          ))} */}
          Comming Soon...
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
