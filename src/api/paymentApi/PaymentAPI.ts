import { emrAPI } from "../../services/EmrApi";
import type { SavePaymentRequest, SavePaymentResponse } from "../../types/paymentTypes";


export const savePayment = async (
  payload: SavePaymentRequest
): Promise<SavePaymentResponse> => {
  try {
    const response = await emrAPI.post<SavePaymentResponse>(
      "/payments/save",
      payload
    );

    const resData = response?.data || response;

    const isSuccess = resData?.success || resData?.sucess;

    if (!isSuccess) {
      throw new Error(resData?.message || "Payment failed");
    }

    return resData;
  } catch (error: any) {
    throw new Error(error?.message || "Payment failed");
  }
};