import React, { useState } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { IconContext } from "react-icons";
import { FiUploadCloud, FiX } from "react-icons/fi";

/* ================= TYPES ================= */

interface UploadControlProps {
  controlName: string;
  file: File | null;
  onFileChange: (file: File | null) => void;

  /** NEW */
  onError?: (error: string | null) => void;
  acceptedFileTypes?: string; // ".jpg,.png"
  maxSizeMB?: number; // e.g. 5

  height?: string;
}

/* ================= HELPERS ================= */

const bytesFromMB = (mb: number) => mb * 1024 * 1024;

/* ================= COMPONENT ================= */

const UploadControl: React.FC<UploadControlProps> = ({
  controlName,
  file,
  onFileChange,
  onError,
  acceptedFileTypes,
  maxSizeMB = 5,
  height = "45px",
}) => {
  const [isDragging, setIsDragging] = useState(false);

  /* ================= VALIDATION ================= */

  const validateFile = (file: File): string | null => {
    // Size check
    if (file.size > bytesFromMB(maxSizeMB)) {
      return `File size must be less than ${maxSizeMB} MB`;
    }

    // Type check (if provided)
    if (acceptedFileTypes) {
      const allowed = acceptedFileTypes
        .split(",")
        .map((t) => t.trim().toLowerCase());

      const fileExt = "." + file.name.split(".").pop()?.toLowerCase();

      if (!allowed.includes(fileExt)) {
        return `Invalid file type. Allowed: ${allowed.join(", ")}`;
      }
    }

    return null;
  };

  /* ================= HANDLERS ================= */

  const processFile = (selectedFile: File) => {
    const error = validateFile(selectedFile);

    if (error) {
      onError?.(error);
      onFileChange(null);
      return;
    }

    onError?.(null);
    onFileChange(selectedFile);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  const handleRemoveFile = () => {
    onFileChange(null);
    onError?.(null);
  };

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const selectedFile = event.dataTransfer.files?.[0];
    if (selectedFile) processFile(selectedFile);
  };

  /* ================= UI ================= */

  return (
    <div className="w-full">
      {!file ? (
        <label
          className="flex items-center justify-center w-full px-4 transition bg-white border-2 border-dashed rounded-md cursor-pointer"
          style={{ height }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span
            className={`flex items-center space-x-2 ${
              isDragging ? "text-blue-500" : "text-gray-600"
            }`}
          >
            <IconContext.Provider value={{ className: "w-5 h-5" }}>
              <FiUploadCloud />
            </IconContext.Provider>
            <span className="font-medium text-sm">
              Drop files to attach, or browse
            </span>
          </span>

          <input
            type="file"
            name={controlName}
            className="hidden"
            onChange={handleFileChange}
            accept={acceptedFileTypes}
          />
        </label>
      ) : (
        <div
          className="flex items-center justify-between p-2 bg-gray-50 border rounded-md"
          style={{ height }}
        >
          <div className="flex items-center space-x-2 truncate">
            <IconContext.Provider
              value={{ className: "w-5 h-5 text-gray-600" }}
            >
              <FiUploadCloud />
            </IconContext.Provider>
            <span className="font-medium text-sm text-gray-700 truncate">
              {file.name}
            </span>
          </div>

          <button
            onClick={handleRemoveFile}
            className="p-1 hover:bg-gray-200 rounded-full"
            type="button"
          >
            <IconContext.Provider
              value={{ className: "w-5 h-5 text-gray-600" }}
            >
              <FiX />
            </IconContext.Provider>
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadControl;
