import React, { useState, DragEvent, ChangeEvent } from "react";
import { IconContext } from "react-icons";
import { FiUploadCloud, FiX } from "react-icons/fi";

interface UploadControlProps {
  controlName: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  acceptedFileTypes?: string;
  height?: string; 
}

const UploadControl: React.FC<UploadControlProps> = ({
  controlName,
  file,
  onFileChange,
  acceptedFileTypes,
  height = "45px",
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    onFileChange(null);
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
    if (selectedFile) {
      onFileChange(selectedFile);
    }
  };

  return (
    <div className="w-full">
      {!file ? (
        <label
          className={`flex items-center justify-center w-full px-4 transition bg-white border-2 border-dashed rounded-md appearance-none cursor-pointer focus:outline-none`}
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
              Drop files to Attach, or browse
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
            <IconContext.Provider value={{ className: "w-5 h-5 text-gray-600" }}>
              <FiUploadCloud />
            </IconContext.Provider>
            <span className="font-medium text-sm text-gray-700 truncate">
              {file.name}
            </span>
          </div>
          <button
            onClick={handleRemoveFile}
            className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-full"
            type="button"
          >
            <IconContext.Provider value={{ className: "w-5 h-5 text-gray-600" }}>
              <FiX />
            </IconContext.Provider>
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadControl;
