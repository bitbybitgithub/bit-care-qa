import axios from "axios";

export const getPdfFromServer = async (
  filePath: string,
  fileName: string,
): Promise<string> => {
  try {
    console.log("get pdf from server", filePath, fileName);
    const response = await axios.post(
      "https://qacliniccareapi.bitbybitsolutions.co.in/api/common/downloadFile",
      { filePath, fileName },
      {
        responseType: "blob",
      },
    );
    console.log("Download response:", response);
    const blob = new Blob([response.data], { type: "application/pdf" });

    return URL.createObjectURL(blob);
  } catch (error: any) {
    console.error("Download failed:", error?.response || error);
    throw new Error("Failed to download PDF");
  }
};
