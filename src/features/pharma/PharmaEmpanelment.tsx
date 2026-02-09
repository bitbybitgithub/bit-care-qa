import { useEffect, useState } from "react";

import AddPharma from "../../features/pharma/AddPharma";
import ViewPharma from "../../features/pharma/ViewPharma";

import { getActivePharmaListApi } from "../../api/pharmacyApi/PharmacyApi";

/* =======================
   Types
======================= */

export interface PharmaApiItem {
  pharma_id: number;
  pharma_name: string;
  pharma_logo?: string;

  email?: string;
  mobile?: string;
  address?: string;

  status: "Active" | "Inactive";
}

/* =======================
   Component
======================= */

const PharmaEmpanelment = () => {
  const [activeTab, setActiveTab] =
    useState<"view" | "add">("view");

  const [pharmas, setPharmas] = useState<PharmaApiItem[]>([]);
  const [loading, setLoading] = useState(false);

  /* =======================
     Fetch Pharma List
  ======================= */

  const fetchPharmas = async () => {
    try {
      setLoading(true);

      const res = await getActivePharmaListApi();

      // Adjust if API wraps data
      setPharmas(res.data);

    } catch (err) {
      console.error("Pharma list error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPharmas();
  }, []);

  /* =======================
     Add Handler
  ======================= */

  const handleAddPharma = (newPharmas: PharmaApiItem[]) => {
    setPharmas((prev) => [...prev, ...newPharmas]);

    setActiveTab("view");
  };

  /* =======================
     UI
  ======================= */

  return (
    <div className="w-full bg-white rounded-md shadow">

      {/* Tabs */}
      <div className="flex border-b">

        <button
          onClick={() => setActiveTab("view")}
          className={`px-4 py-2 border-b-2
            ${
              activeTab === "view"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500"
            }`}
        >
          View Pharma
        </button>

        <button
          onClick={() => setActiveTab("add")}
          className={`px-4 py-2 border-b-2
            ${
              activeTab === "add"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500"
            }`}
        >
          Add Pharma
        </button>

      </div>

      {/* Loading */}
      {loading && (
        <div className="p-3 text-sm text-blue-600">
          Loading...
        </div>
      )}

      {/* Content */}
      <div>

        {activeTab === "view" && (
          <ViewPharma pharmas={pharmas} />
        )}

        {activeTab === "add" && (
          <AddPharma
            pharmas={pharmas}
            onAdd={handleAddPharma}
          />
        )}

      </div>

    </div>
  );
};

export default PharmaEmpanelment;
