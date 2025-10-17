export function Base64ToImage(base64String: string, outputFormat: string = "image/png"): string | null {
  try {
    // Remove the data:image/<format>;base64, prefix if present
    const base64WithoutPrefix = base64String.replace(/^data:image\/\w+;base64,/, "");

    // Convert base64 to binary
    const binaryString = atob(base64WithoutPrefix);
    const length = binaryString.length;
    const uint8Array = new Uint8Array(length);

    for (let i = 0; i < length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i);
    }

    // Create a Blob from the binary data
    const blob = new Blob([uint8Array], { type: outputFormat });

    // Create a URL for the Blob and return it
    const imageUrl = URL.createObjectURL(blob);
    return imageUrl;
  } catch (error) {
    console.error("Error converting Base64 to image:", error);
    return null;
  }
}
