import React, { useState, useMemo } from "react";
import {
  Box,
  Card,
  Typography,
  TextField,
  Button,
  Divider,
  IconButton,
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  saveDoctorAvailabilityApi,
  deleteDoctorBlockApi,
} from "../../../api/AppoinmentApi/DoctorAvailibityApi";
import type { SummaryProps } from "../../../types/types";
import { getSessionItem } from "../../../context/sessions/userSession";

const ScheduleSummary: React.FC<SummaryProps> = ({
  selectedDate,
  daySchedule,
  addBlock,
  replaceFullDayBlock,
}) => {
  const [reason, setReason] = useState("");
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("22:00");
  const [loading, setLoading] = useState(false);

  const doctorId = getSessionItem("user","doctor_id")
  const clinicId = getSessionItem("user","clinic_id")

  const blocksForDate = useMemo(
    () => daySchedule?.breakTime || [],
    [daySchedule]
  );

  const handleSave = async () => {
    if (!reason.trim()) return toast.error("Please enter a reason");
    if (startTime >= endTime)
      return toast.error("Start time must be before end time");

    try {
      setLoading(true);
      const response = await saveDoctorAvailabilityApi(
        doctorId,
        reason,
        startTime,
        endTime,
        selectedDate.format("YYYY-MM-DD"),
        false,
        clinicId
      );
      toast.success(response?.message || "Saved successfully!");
      setReason("");

      addBlock({ start: startTime, end: endTime, reason });
    } catch (error: any) {
      toast.error(error.message || "Failed to save availability");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (da_id: number) => {
    if (!window.confirm("Are you sure you want to delete this block?")) return;

    try {
      setLoading(true);
      const response = await deleteDoctorBlockApi(da_id, doctorId, clinicId);
      toast.success(response?.message || "Deleted successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete block");
    } finally {
      setLoading(false);
    }
  };

  const handleFullDayBlock = async () => {
    try {
      setLoading(true);
      const response = await saveDoctorAvailabilityApi(
        doctorId,
        "Full Day Blocked",
        "00:00",
        "23:59",
        selectedDate.format("YYYY-MM-DD"),
        true,
        clinicId
      );
      toast.success(response?.message || "Full day blocked!");

      replaceFullDayBlock();
    } catch (error: any) {
      toast.error(error.message || "Failed to block full day");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-5 shadow-md rounded-2xl bg-[var(--color-surface-alt)]">
      <Typography variant="h6" className="font-semibold mb-3">
        Schedule Summary
      </Typography>

      <Typography variant="subtitle2" color="text.secondary" className="mb-4">
        Selected Date:{" "}
        <span className="text-blue-600 font-medium">
          {selectedDate.format("ddd, MMM D, YYYY")}
        </span>
      </Typography>

      <Box className="bg-gray-50 border border-gray-200 p-3 rounded-md mb-4">
        <Typography variant="body2" className="font-medium mb-2">
          Existing Blocked Times
        </Typography>
        {blocksForDate.length > 0 ? (
          blocksForDate.map((slot: any, idx: number) => (
            <Box
              key={idx}
              className="flex justify-between items-center text-sm text-gray-700 mb-1"
            >
              <Box>
                <span>
                  {slot.start_time} – {slot.end_time}
                </span>
                <span className="italic text-gray-500 ml-2">
                  ({slot.reason})
                </span>
              </Box>
              <IconButton
                size="small"
                color="error"
                onClick={() => handleDelete(slot.da_id)}
                disabled={loading}
              >
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          ))
        ) : (
          <Typography variant="body2" color="text.secondary">
            No unavailability added yet.
          </Typography>
        )}
      </Box>

      <Divider className="my-4" />

      <Typography variant="subtitle2" className="font-semibold mb-2">
        Add New Block
      </Typography>

      <TextField
        className="mb-4"
        placeholder="Reason"
        fullWidth
        size="small"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      <Box className="flex gap-3 mb-4 mt-3">
        <TextField
          label="Start Time"
          type="time"
          size="small"
          fullWidth
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="End Time"
          type="time"
          size="small"
          fullWidth
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Box>

      <Box className="flex gap-3">
        <Button
          fullWidth
          variant="contained"
          color="primary"
          size="small"
          className="rounded-lg text-xs py-1"
          onClick={handleSave}
          disabled={loading}
        >
          Save
        </Button>

        <Button
          fullWidth
          variant="outlined"
          color="error"
          size="small"
          className="rounded-lg text-xs py-1"
          onClick={handleFullDayBlock}
          disabled={loading}
        >
          Block Full Day
        </Button>
      </Box>
    </Card>
  );
};

export default ScheduleSummary;
