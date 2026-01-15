import React from "react";
import { Switch, TextField, Typography } from "@mui/material";
import type { ShiftSlot } from "./LabProfile";

interface Props {
  day: string;
  opShift: any;
  shifts: ShiftSlot[];
  handleOperationDay: (
    lab_opt_id: number | string,
    lab_id: number | string,
    value: boolean
  ) => void;
  onShiftChange: (lab_opt_id: number | string, shifts: ShiftSlot[]) => void;
}

const LabShift: React.FC<Props> = ({
  day,
  opShift,
  shifts,
  handleOperationDay,
  onShiftChange,
}) => {
  const updateShift = (idx: number, field: "start" | "end", value: string) => {
    const updated = [...shifts];
    updated[idx] = { ...updated[idx], [field]: value };
    onShiftChange(opShift.lab_opt_id, updated);
  };

  return (
    <div className="rounded-lg p-4 mb-4 border-2 border-[var(--color-primary)]">
      <div className="flex justify-between items-center mb-3">
        <Typography variant="h6">{day}</Typography>

        <div className="flex items-center gap-2">
          <Typography variant="body2">Holiday:</Typography>
          <Switch
            checked={!opShift.is_active}
            onChange={(e) =>
              handleOperationDay(
                opShift.lab_opt_id,
                opShift.lab_id,
                !e.target.checked
              )
            }
          />
        </div>
      </div>

      {opShift.is_active &&
        (shifts.length ? shifts : [{ start: "", end: "" }]).map(
          (shift, idx) => (
            <div key={idx} className="flex gap-4 mb-3">
              <TextField
                type="time"
                label="Start"
                value={shift.start}
                onChange={(e) => updateShift(idx, "start", e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                type="time"
                label="End"
                value={shift.end}
                onChange={(e) => updateShift(idx, "end", e.target.value)}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </div>
          )
        )}
    </div>
  );
};

export default React.memo(LabShift);
