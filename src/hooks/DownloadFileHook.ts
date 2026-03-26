import axios from "axios";
import { BASE_URL } from "../services/EmrApi";

export const getPdfFromServer = async (
  filePath: string,
  fileName: string
): Promise<string> => {
  try {
    const response = await axios.post(
      `${BASE_URL}/common/downloadFile`,
      { filePath, fileName },
      {
        responseType: "blob", 
      }
    );

    const blob = new Blob([response.data], { type: "application/pdf" });

    return URL.createObjectURL(blob);
  } catch (error: any) {
    console.error("Download failed:", error?.response || error);
    throw new Error("Failed to download PDF");
  }
};
