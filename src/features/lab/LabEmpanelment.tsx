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

  // const handleSubmitLabs = async (ids: number[]) => {

  //   if (!clinicId) {
  //     alert("Session expired");
  //     return;
  //   }

  //   try {

  //     await mapClinicPartnersApi({
  //       clinic_id: clinicId,
  //       lab_ids: ids,
  //       pharmacy_ids: [],
  //     });

  //     await fetchLabs();

  //     setActiveTab("view");

  //   } catch (err) {

  //     console.error(err);
  //     alert("Failed to map labs");

  //   }
  // };

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


