import React, { useMemo } from 'react';
import DailySchedule from './DailySchedule';

// Assuming you have these interfaces available globally or pass them in
interface ShiftPayload {
    clinic_id: number | string;
    co_id: number | string;
    shift: number;
    shift_start: string;
    shift_end: string;
    is_active: number;
}
interface OperationalDay {
    co_id: number | string;
    clinic_id: number | string;
    day: string;
    is_active: number;
}

interface ScheduleDayWrapperProps {
    day: OperationalDay;
    initialAllShifts: ShiftPayload[];
    handleOperationDay: (coId: number | string, clinicId: number | string, value: boolean) => void;
    onShiftChange: (coId: number | string, formattedShifts: ShiftPayload[]) => void;
}

const ScheduleDayWrapper: React.FC<ScheduleDayWrapperProps> = ({
    day,
    initialAllShifts,
    handleOperationDay,
    onShiftChange,
}) => {
    // ✅ useMemo is now called correctly at the top level of this functional component
    const dayShifts = useMemo(() => 
        initialAllShifts
        .filter((s) => s.co_id === day.co_id)
        .map((s) => ({ start: s.shift_start, end: s.shift_end })),
    [initialAllShifts, day.co_id]);

    return (
        <DailySchedule
            key={day.co_id}
            day={day.day}
            opShift={day}
            handleOperationDay={handleOperationDay}
            onShiftChange={onShiftChange}
            initialShifts={dayShifts} // Stable array thanks to useMemo
        />
    );
};

// 🌟 IMPORTANT: Memoize the wrapper component!
export default React.memo(ScheduleDayWrapper);