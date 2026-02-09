import { useEffect, useState } from "react";

import AddLabs from "../../features/lab/AddLabs";
import ViewLabs from "../../features/lab/ViewLabs";
import { getActiveLabListApi } from "../../api/labApis/LabApi";

export interface LabApiItem {
  lab_id: number;
  lab_name: string;
  lab_logo?: string;

  email?: string;
  mobile?: string;
  address?: string;

  status: "Active" | "Inactive";
}

const LabEmpanelment = () => {
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");
  const [labs, setLabs] = useState<LabApiItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLabs = async () => {
    try {
      setLoading(true);

      const res = await getActiveLabListApi();

      // IMPORTANT: adjust if API wraps in data.data
      setLabs(res.data);

    } catch (err) {
      console.error("Lab list error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabs();
  }, []);

  const handleAddLabs = (newLabs: LabApiItem[]) => {
    setLabs((prev) => [...prev, ...newLabs]);

    setActiveTab("view");
  };

  return (
    <div className="w-full bg-white rounded-md shadow">

      {/* Tabs */}
      <div className="flex border-b">

        <button
          onClick={() => setActiveTab("view")}
          className={`px-4 py-2 border-b-2
            ${activeTab === "view"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500"
            }`}
        >
          View Labs
        </button>

        <button
          onClick={() => setActiveTab("add")}
          className={`px-4 py-2 border-b-2
            ${activeTab === "add"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500"
            }`}
        >
          Add Labs
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
          <ViewLabs labs={labs} />
        )}

        {activeTab === "add" && (
          <AddLabs
            labs={labs}
            onAdd={handleAddLabs}
          />
        )}

      </div>

    </div>
  );
};

export default LabEmpanelment;
