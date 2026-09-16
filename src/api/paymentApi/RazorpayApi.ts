import { emrAPI } from "../../services/EmrApi";
import type {
  CreateRazorpayOrderRequest,
  CreateRazorpayOrderResponse,
  VerifyRazorpayPaymentRequest,
  VerifyRazorpayPaymentResponse,
  RazorpayPublicKeyResponse,
} from "../../types/razorpayTypes";

export const getRazorpayPublicKey = async (): Promise<RazorpayPublicKeyResponse> => {
  try {
    const response = await emrAPI.get<RazorpayPublicKeyResponse>(
      "/razorpay/public-key"
    );
    return response;
  } catch (error: any) {
    throw new Error(error?.message || "Unable to fetch Razorpay public key");
  }
};

export const createRazorpayOrder = async (
  payload: CreateRazorpayOrderRequest
): Promise<CreateRazorpayOrderResponse> => {
  try {
    const response = await emrAPI.post<CreateRazorpayOrderResponse>(
      "/razorpay/create-order",
      payload
    );
    return response;
  } catch (error: any) {
    throw new Error(error?.message || "Unable to create Razorpay order");
  }
};

export const verifyRazorpayPayment = async (
  payload: VerifyRazorpayPaymentRequest
): Promise<VerifyRazorpayPaymentResponse> => {
  try {
    const response = await emrAPI.post<VerifyRazorpayPaymentResponse>(
      "/razorpay/verify-payment",
      payload
    );
    return response;
  } catch (error: any) {
    throw new Error(error?.message || "Unable to verify Razorpay payment");
  }
};
