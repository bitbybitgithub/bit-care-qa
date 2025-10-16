import React, { useEffect, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import AvailabilityCalendar from "./AvailabilityCalendar";
import ScheduleSummary from "./ScheduleSummary";
import { getDoctorAvailabilityApi } from "../../../api/AppoinmentApi/DoctorAvailibityApi";
import type { BlockedSlot, CalendarDay } from "../../../types/types";
import { Box, Card, Typography } from "@mui/material";

const ManageAvailability: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [schedule, setSchedule] = useState<CalendarDay[]>([]);



  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await getDoctorAvailabilityApi(38, 1, 10, 2025);
        console.log("getDocavailibity Res",res);
        if (res.success) setSchedule(res.data);
      } catch (error) {
        console.error("Failed to fetch availability:", error);
      }
    };
    fetchAvailability();
  }, []);

  const addBlock = (slot: BlockedSlot) => {
    const dateKey = selectedDate.format("YYYY-MM-DD");
    setSchedule((prev) =>
      prev.map((d) =>
        d.date === dateKey
          ? {
              ...d,
              breakTime: [
                ...d.breakTime,
                {
                  da_id: 0,
                  start_time: slot.start,
                  end_time: slot.end,
                  reason: slot.reason,
                  is_available: false,
                },
              ],
            }
          : d
      )
    );
  };

  const replaceFullDayBlock = () => {
    const dateKey = selectedDate.format("YYYY-MM-DD");
    setSchedule((prev) =>
      prev.map((d) =>
        d.date === dateKey
          ? {
              ...d,
              breakTime: [
                {
                  da_id: 0, 
                  start_time: "00:00",
                  end_time: "23:59",
                  reason: "Full Day Leave",
                  is_available: false,
                },
              ],
            }
          : d
      )
    );
  };

  const selectedDaySchedule =
    schedule.find((d) => d.date === selectedDate.format("YYYY-MM-DD")) || null;

  return (
    <>
      <Card className="mt-3 p-4 shadow-lg rounded-4xl">
        <div>
          <Typography variant="h6" className="mb-3 font-semibold">
            Manage My Availability
          </Typography>
          <Typography variant="body2" color="text.secondary" className="mb-4">
            Set your recurring weekly schedule and manage daily exceptions.
          </Typography>
        </div>

        <div className="flex gap-2">
          <AvailabilityCalendar
            schedule={schedule}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />

          <ScheduleSummary
            selectedDate={selectedDate}
            daySchedule={selectedDaySchedule}
            addBlock={addBlock}
            replaceFullDayBlock={replaceFullDayBlock}
          />
        </div>
      </Card>
    </>
  );
};

export default ManageAvailability;
