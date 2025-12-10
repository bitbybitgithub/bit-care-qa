import axios from "axios";
import React, { useEffect, useState } from "react";
import SearchPatient from "../components/SearchPatient";
import UploadDocument from "../pages/UploadDocument";
import ExistingDocumentList from "../pages/ExistingDocumentList";

export default function PatientDocManagementPage() {
  const;
  return (
    <div className="flex flex-col justify-between gap-4">
      <div className="w-full h-32 bg-[var(--color-white)] shadow-md rounded-md p-4">
        <SearchPatient />
      </div>
      <div className="w-full h-54 bg-[var(--color-white)] shadow-md rounded-md p-4">
        <UploadDocument />
      </div>
      <div className="w-full h-72 bg-[var(--color-white)] shadow-md rounded-md p-4">
        <ExistingDocumentList />
      </div>
    </div>
  );
}
