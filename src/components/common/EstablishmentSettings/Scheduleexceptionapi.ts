import { emrAPI } from "../../../services/EmrApi";
import {
  ENTITY_TYPE_ID,
  type EstablishmentKind,
  type SaveExceptionInput,
  type ScheduleWindow,
} from "./Types";

type Envelope = { success: boolean; data: ScheduleWindow };

const base = (kind: EstablishmentKind, entityId: number | string) => ({
  entity_type: ENTITY_TYPE_ID[kind],
  entity_id: Number(entityId),
});

/** The next 15 days (today .. today+14, computed by the server in IST). */
export const getScheduleWindow = async (
  kind: EstablishmentKind,
  entityId: number | string,
): Promise<ScheduleWindow> => {
  const res = await emrAPI.post<Envelope>(
    "/schedule/get-schedule-window",
    base(kind, entityId),
  );
  return (res as any)?.data ?? res;
};

/** Create or update one date; returns the refreshed window. */
export const saveScheduleException = async (
  kind: EstablishmentKind,
  entityId: number | string,
  input: SaveExceptionInput,
): Promise<ScheduleWindow> => {
  const res = await emrAPI.post<Envelope>("/schedule/save-schedule-exception", {
    ...base(kind, entityId),
    ...input,
    modified_by: "Admin",
  });
  return (res as any)?.data ?? res;
};

/** Restore the regular schedule for one date; returns the refreshed window. */
export const deleteScheduleException = async (
  kind: EstablishmentKind,
  entityId: number | string,
  exceptionDate: string,
  expectedVersion: number,
): Promise<ScheduleWindow> => {
  const res = await emrAPI.post<Envelope>(
    "/schedule/delete-schedule-exception",
    {
      ...base(kind, entityId),
      exception_date: exceptionDate,
      expected_version: expectedVersion,
    },
  );
  return (res as any)?.data ?? res;
};