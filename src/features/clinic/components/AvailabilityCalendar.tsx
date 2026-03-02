import React, { useMemo } from "react";
import {
  Calendar,
  dayjsLocalizer,
  type Event,
  type SlotInfo,
  type ToolbarProps,
} from "react-big-calendar";
import dayjs  from "dayjs";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { ChevronLeft, ChevronRight } from "lucide-react"; 
import type { AvailabilityProps } from "../../../types/types";

const AvailabilityCalendar: React.FC<
  Pick<AvailabilityProps, "schedule" | "selectedDate" | "setSelectedDate">
> = ({ schedule, selectedDate, setSelectedDate }) => {
  const reasonColors: Record<string, string> = {
    Lunch: "#facc15", 
    Meeting: "#5e5e5fff", 
    Training: "#a855f7", 
    Leave: "#700202ff", 
    Default: "#045df7ff", 
  };

  const localizer = dayjsLocalizer(dayjs);

  const events = useMemo(() => {
    return schedule.flatMap((d) => {
      const date = dayjs(d.date);
      return d.breakTime.map((b: any) => ({
        title: b.reason,
        start: date.toDate(),
        end: date.add(1, "hour").toDate(),
        allDay: true,
        color: reasonColors[b.reason] || reasonColors.Default,
      })) as Event[];
    });
  }, [schedule]);

  const eventPropGetter = (event: any) => ({
    style: {
      backgroundColor: event.color,
      borderRadius: "6px",
      color: "white",
      border: "none",
      padding: "2px 4px",
      fontSize: "0.8rem",
    },
  });

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const clickedDate = dayjs(slotInfo.start);
    setSelectedDate(clickedDate);
  };

  const dayPropGetter = (date: Date) => {
    const isSelected = dayjs(date).isSame(selectedDate, "day");
    return {
      style: {
        backgroundColor: isSelected ? "#60a5fa" : "transparent", 
        borderRadius: isSelected ? "8px" : "0px",
        color: isSelected ? "white" : "inherit",
        transition: "background-color 0.2s ease",
      },
    };
  };

  const CustomToolbar: React.FC<ToolbarProps> = ({ label, onNavigate }) => (
    <div className="flex justify-between items-center mb-2 px-4 py-1">
      <button
        onClick={() => onNavigate("PREV")}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <ChevronLeft className="w-5 h-5 text-gray-700" />
      </button>

      <span className="text-gray-800 font-semibold text-lg">{label}</span>

      <button
        onClick={() => onNavigate("NEXT")}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <ChevronRight className="w-5 h-5 text-gray-700" />
      </button>
    </div>
  );

  return (
    <div className="rounded-lg w-2/4 border border-gray-200 bg-[var(--color-surface-alt)] shadow-sm p-4">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectSlot={handleSelectSlot}
        defaultView="month"
        views={["month"]} 
        eventPropGetter={eventPropGetter}
        date={selectedDate.toDate()}
        onNavigate={(newDate) => setSelectedDate(dayjs(newDate))}
        dayPropGetter={dayPropGetter}
        components={{
          toolbar: CustomToolbar, 
        }}
      />
    </div>
  );
};

export default AvailabilityCalendar;
