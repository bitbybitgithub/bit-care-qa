import { useEffect, useState } from "react";
import AddPartnerUI from "../../features/component/AddPartnerUI";
import ViewPartnerUI from "../../features/component/ViewPartnerUI";
import ScienceIcon from "@mui/icons-material/Science";
import { getSession } from "../../context/sessions/userSession";
import { getActiveLabListApi, getMappedLabsApi } from "../../api/labApis/LabApi";
import { mapClinicPartnersApi } from "../../api/CommonApi/SaveLabAndPharmaApi";
import type { LabApiItem } from "../../types/labType/LabTestInterfaces";
import { toast } from "react-toastify";

const session = getSession("user");
const clinicId = session?.clinic_id ?? null;

const LabEmpanelment = () => {

  const [activeTab, setActiveTab] =
    useState<"view" | "add">("view");

  const [labs, setLabs] =
    useState<LabApiItem[]>([]);
  const [mappedLabs, setMappedLabs] =
    useState<LabApiItem[]>([]);

  const [loading, setLoading] =
    useState(false);


  const fetchLabs = async () => {

    try {
      setLoading(true);

      const res = await getActiveLabListApi();

      setLabs(res.data);

    } catch (err) {

      console.error("Lab list error", err);

    } finally {

      setLoading(false);

    }
  };

  const fetchMappedLabByClinicId = async () => {

    try {
      setLoading(true);

      const res = await getMappedLabsApi(clinicId);

      setMappedLabs(res.data);

    } catch (err) {

      console.error("Lab list error", err);

    } finally {

      setLoading(false);

    }
  };


  useEffect(() => {
    fetchLabs();
  }, []);

  useEffect(() => {
    fetchMappedLabByClinicId();
  }, [clinicId]);

  const handleSubmitLabs = async (ids: number[]) => {
    if (!clinicId) {
      toast.error("Session expired. Please login again.");
      return;
    }

    try {
      await mapClinicPartnersApi({
        clinic_id: clinicId,
        lab_ids: ids,
        pharmacy_ids: [],
      });

      toast.success("Lab Added Successfully.");

      await fetchMappedLabByClinicId();

      setActiveTab("view");

    } catch (err) {
      console.error(err);
      toast.error("Failed to map labs.");
    }
  };


  const viewItems = mappedLabs?.map((l) => ({
    id: l.lab_id,
    name: l.lab_name,

    logo: l.lab_logo,
    phone: l.phone,
    email: l.email,
    address: l.address,

    status: l.status,
  }))

  return (
    <div className="w-full bg-white rounded-md shadow">

      {/* <div className="flex border-b">

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

      </div> */}
      <div className="p-4 ">
        <div className="inline-flex bg-gray-100 rounded-xl p-1 w-fit shadow-inner">

          <button
            onClick={() => setActiveTab("view")}
            className={`relative px-6 py-2 text-sm font-medium rounded-full transition-all duration-200
        ${activeTab === "view"
                ? "bg-white shadow text-black"
                : "text-gray-500 hover:text-black"
              }`}
          >
            View {/** Change label accordingly in each file */}

            {/* Optional Count Badge */}
            {/* {activeTab === "view" && (
        <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
          {viewItems?.length ?? 0}
        </span>
      )} */}
          </button>

          <button
            onClick={() => setActiveTab("add")}
            className={`px-6 py-2 text-sm font-medium rounded-full transition-all duration-200
        ${activeTab === "add"
                ? "bg-white shadow text-black"
                : "text-gray-500 hover:text-black"
              }`}
          >
            Add
          </button>

        </div>
      </div>


      {loading && (
        <div className="p-3 text-sm text-blue-600">
          Loading...
        </div>
      )}

      <div>


        {activeTab === "view" && (

          <ViewPartnerUI

            title="Registered Labs"

            countLabel="labs connected to your clinic"

            emptyText="No labs mapped yet."

            clinicId={clinicId}

            data={viewItems}

          />

        )}

        {activeTab === "add" && (

          <AddPartnerUI

            data={labs.map((l) => ({
              id: l.lab_id,
              name: l.lab_name,
              logo: l.lab_logo,

              email: l.email,
              mobile: l.mobile,
              address: l.address,
            }))}

            icon={
              <ScienceIcon className="text-blue-500" />
            }

            placeholder="Search labs..."

            buttonText="Add Selected Labs"

            onSubmit={handleSubmitLabs}

          />

        )}

      </div>

    </div>
  );
};

export default LabEmpanelment;


