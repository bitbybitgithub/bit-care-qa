import React from "react";
import LabShift from "./LabShift";
import type { ShiftSlot } from "./LabProfile";

interface Props {
  day: any;
  shifts: ShiftSlot[];
  handleOperationDay: (
    lab_opt_id: number | string,
    labId: number | string,
    value: boolean
  ) => void;
  onShiftChange: (lab_opt_id: number | string, shifts: ShiftSlot[]) => void;
}

const LabScheduleDayWrapper: React.FC<Props> = ({
  day,
  shifts,
  handleOperationDay,
  onShiftChange,
}) => {
  return (
    <LabShift
      day={day.day}
      opShift={day}
      shifts={shifts}
      handleOperationDay={handleOperationDay}
      onShiftChange={onShiftChange}
    />
  );
};

export default React.memo(LabScheduleDayWrapper);
