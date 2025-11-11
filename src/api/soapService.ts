import type { SaveSOAPRequest, SaveSOAPResponse } from "../types/soap";
import { emrAPI } from "./EmrApi";

export const saveSOAPDetails = async (
  payload: SaveSOAPRequest
): Promise<SaveSOAPResponse> => {
  try {
    const response = await emrAPI.post<SaveSOAPResponse>(
      "/appointments/save-soap",
      payload
    );

    // Always return the data property, not the full Axios response
    return response;
  } catch (err: any) {
    console.error("Error saving SOAP details:", err);
    return {
      isSaved: false,
      message: "Something went wrong while saving SOAP details",
    };
  }
};
