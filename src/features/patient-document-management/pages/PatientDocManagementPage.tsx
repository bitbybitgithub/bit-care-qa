import axios from "axios";
import React, { useEffect, useState } from "react";
import UploadDocument from "../pages/UploadDocument";

export default function PatientDocManagementPage() {
  const [resource, setResource] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    async function fetch() {
      try {
        const response = await axios.get("https://api.agify.io?name=meelad", {
          signal: controller.signal,
        });
        console.log(response.data);
      } catch (error) {
        console.log(controller.signal.aborted);
      }
    }
    fetch();
    return () => {
      controller.abort();
    };
  }, []);
  return (
    <div className="flex flex-col justify-between gap-4">
      <div className="w-full h-32 bg-[var(--color-white)] shadow-md rounded-md p-4">
        Select
      </div>
      <div className="w-full h-54 bg-[var(--color-white)] shadow-md rounded-md p-4">
        <UploadDocument />
      </div>
      <div className="w-full h-72 bg-[var(--color-white)] shadow-md rounded-md p-4">
        Existing Documents
      </div>
    </div>
  );
}
