import { emrAPI } from "../../services/EmrApi";

import type {
  MapPartnersPayload,
  MapPartnersResponse,
} from "../../types/pharmacyType/pharmacyInterfaceType";


export async function mapClinicPartnersApi(
  payload: MapPartnersPayload
): Promise<MapPartnersResponse> {
  const response = await emrAPI.post<MapPartnersResponse>(
    "/clinics/map-partners",
    payload
  );

  return response;
}
