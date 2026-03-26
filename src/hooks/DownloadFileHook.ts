import axios from "axios";

export const getPdfFromServer = async (
  filePath: string,
  fileName: string
): Promise<string> => {
  try {
    const response = await axios.post(
      "https://cliniccareapi.bitbybitsolutions.co.in/api/common/downloadFile",
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
