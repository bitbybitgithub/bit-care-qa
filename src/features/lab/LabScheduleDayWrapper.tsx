import React, { useMemo } from "react";
import LabShift from "./LabShift";

interface Props {
  day: {
    lab_opt_id: number | string;
    lab_id: number | string;
    day: string;
    is_active: boolean;
  };
  initialAllShifts: any[];
  handleOperationDay: (
    lab_opt_id: number | string,
    labId: number | string,
    value: boolean
  ) => void;
  onShiftChange: (lab_opt_id: number | string, shifts: any[]) => void;
}

const LabScheduleDayWrapper: React.FC<Props> = ({
  day,
  initialAllShifts,
  handleOperationDay,
  onShiftChange,
}) => {
  // 👇 future proof (when shift API comes)
  const dayShifts = useMemo(
    () =>
      initialAllShifts
        .filter((s) => s.lab_opt_id === day.lab_opt_id)
        .map((s) => ({ start: s.shift_start, end: s.shift_end })),
    [initialAllShifts, day.lab_opt_id]
  );

  return (
    <LabShift
      day={day.day}
      opShift={day}
      handleOperationDay={handleOperationDay}
      onShiftChange={onShiftChange}
      initialShifts={dayShifts}
    />
  );
};

export default React.memo(LabScheduleDayWrapper);
