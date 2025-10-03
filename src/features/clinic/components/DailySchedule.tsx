import React, { useState } from "react";
import {
  Switch,
  TextField,
  Button,
  IconButton,
  Typography,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";

interface BreakSlot {
  start: string;
  end: string;
}

interface DailyScheduleProps {
  day: string;
}

const DailySchedule: React.FC<DailyScheduleProps> = ({ day }) => {
  const [isHoliday, setIsHoliday] = useState(false);
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("17:00");
  const [breaks, setBreaks] = useState<BreakSlot[]>([]);

  const addBreak = () => {
    setBreaks([...breaks, { start: "", end: "" }]);
  };

  const removeBreak = (index: number) => {
    setBreaks(breaks.filter((_, i) => i !== index));
  };

  const updateBreak = (index: number, field: keyof BreakSlot, value: string) => {
    const updated = [...breaks];
    updated[index][field] = value;
    setBreaks(updated);
  };

  return (
    <div className="bg-white shadow rounded-2xl p-4 mb-4">
      <div className="flex justify-between items-center mb-3">
        <Typography variant="h6">{day}</Typography>
        <div className="flex items-center gap-2">
          <Typography variant="body2">Holiday:</Typography>
          <Switch
            checked={isHoliday}
            onChange={(e) => setIsHoliday(e.target.checked)}
          />
        </div>
      </div>

      {!isHoliday && (
        <div className="grid grid-cols-2 gap-4 mb-3">
          <TextField
            label="Open"
            type="time"
            value={openTime}
            onChange={(e) => setOpenTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
          <TextField
            label="Close"
            type="time"
            value={closeTime}
            onChange={(e) => setCloseTime(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />
        </div>
      )}

      {!isHoliday && (
        <>
          <div className="space-y-3">
            {breaks.map((brk, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-3 items-center">
                <TextField
                  label="Start"
                  type="time"
                  value={brk.start}
                  onChange={(e) => updateBreak(idx, "start", e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <div className="flex gap-2 items-center">
                  <TextField
                    label="End"
                    type="time"
                    value={brk.end}
                    onChange={(e) => updateBreak(idx, "end", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                  />
                  <IconButton color="error" onClick={() => removeBreak(idx)}>
                    <Remove />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
          <Button
            startIcon={<Add />}
            onClick={addBreak}
            className="mt-3"
            variant="outlined"
          >
            Add Break
          </Button>
        </>
      )}
    </div>
  );
};

export default DailySchedule;
