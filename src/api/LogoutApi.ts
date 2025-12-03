import { emrAPI } from "../services/EmrApi";

export const logoutApi = async () => {
  try {
    const response = await emrAPI.get<{ success: boolean; error?: string }>("/auth/logout");

    // Here we check the response body, not the HTTP status
    if (!response.success) {
      return {
        success: false,
        error: response.error || "Logout failed",
      };
    }

    return response; // success
  } catch (error: any) {
    console.error("Logout API error:", error);
    return {
      success: false,
      error: error.message || "Logout failed",
    };
  }
};

