import axios from "axios";

const BASE_URL = "http://localhost:8989/api/auth";

interface LoginFormData {
  userId: string;
  password: string;
  ip_address: string;
  platform: string;
}

export const loginApi = async (formData: LoginFormData) => {
  try {
    const apiPayload = {
      userId: formData.userId,
      password: formData.password,
      ip_address: formData.ip_address,
      platform: formData.platform,
    };

    console.log("Login data", apiPayload);

    const response = await axios.post(`${BASE_URL}/login`, apiPayload, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log("Login API Response", response.data);

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message ||
        error.message ||
        "Login failed"
    );
  }
};
