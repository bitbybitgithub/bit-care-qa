export const getPdfFromServer = async (filePath: string, fileName: string) => {
    console.log(filePath)
    console.log(fileName)
  const response = await fetch(
    "http://localhost:8989/api/common/downloadFile",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ filePath, fileName }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to download PDF");
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

