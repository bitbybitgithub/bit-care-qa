import { useEffect, useState } from "react";
import AddPartnerUI from "../../features/component/AddPartnerUI";
import ViewPartnerUI from "../../features/component/ViewPartnerUI";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import { getSession } from "../../context/sessions/userSession";
import { getActivePharmaListApi, getMappedPharmaciesApi } from "../../api/pharmacyApi/PharmacyApi";
import { mapClinicPartnersApi } from "../../api/CommonApi/SaveLabAndPharmaApi";
import type { PharmaApiItem } from "../../types/pharmacyType/pharmacyInterfaceType";
import { toast } from "react-toastify";

const session = getSession("user");
const clinicId = session?.clinic_id ?? null;

const PharmaEmpanelment = () => {

  const [activeTab, setActiveTab] =
    useState<"view" | "add">("view");

  const [pharmas, setPharmas] =
    useState<PharmaApiItem[]>([]);

  const [mappedPharmas, setMappedPharmas] =
    useState<PharmaApiItem[]>([]);

  const [loading, setLoading] =
    useState(false);

  const fetchPharmas = async () => {

    try {
      setLoading(true);

      const res = await getActivePharmaListApi();


      setPharmas(res.data);

    } catch (err) {

      console.error("Pharma list error", err);

    } finally {

      setLoading(false);

    }
  };

  const fetchPharmaByClinicId = async () => {
    try {
      const res = await getMappedPharmaciesApi(clinicId);
      setMappedPharmas(res.data);
    } catch (error) {
      console.error(error);
    }
  }


  useEffect(() => {
    fetchPharmaByClinicId();
  }, [clinicId]);

  useEffect(() => {
    fetchPharmas();
  }, []);

  // const handleSubmitPharma = async (ids: number[]) => {

  //   if (!clinicId) {
  //     alert("Session expired");
  //     return;
  //   }

  //   try {

  //     await mapClinicPartnersApi({
  //       clinic_id: clinicId,
  //       lab_ids: [],
  //       pharmacy_ids: ids,
  //     });

  //     await fetchPharmas();

  //     setActiveTab("view");

  //   } catch (err) {

  //     console.error(err);
  //     alert("Failed to map pharmacy");

  //   }
  // };

  const handleSubmitPharma = async (ids: number[]) => {
    if (!clinicId) {
      toast.error("Session expired. Please login again.");
      return;
    }

    try {
      await mapClinicPartnersApi({
        clinic_id: clinicId,
        lab_ids: [],
        pharmacy_ids: ids,
      });

      toast.success("Pharmacy Added Successfully.");

      await fetchPharmaByClinicId();

      setActiveTab("view");

    } catch (err) {
      console.error(err);
      toast.error("Failed to map pharmacy.");
    }
  };


  const viewItems = mappedPharmas?.map((p) => ({
    id: p.pharma_id,
    name: p.pharma_name,

    logo: p.pharma_logo,
    phone: p.mobile,
    email: p.email,
    address: p.address,


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
          View Pharma
        </button>

        <button
          onClick={() => setActiveTab("add")}
          className={`px-4 py-2 border-b-2
            ${activeTab === "add"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500"
            }`}
        >
          Add Pharma
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

            title="Registered Pharmacies"

            countLabel="pharmacies connected to your clinic"

            emptyText="No pharmacies mapped yet."

            clinicId={clinicId}

            data={viewItems}


          />

        )}

        {activeTab === "add" && (

          <AddPartnerUI

            data={pharmas.map((p) => ({
              id: p.pharma_id,
              name: p.pharma_name,
              logo: p.pharma_logo,

              email: p.email,
              mobile: p.mobile,
              address: p.address,
            }))}

            icon={
              <LocalPharmacyIcon className="text-blue-500" />
            }

            placeholder="Search pharmacy..."

            buttonText="Add Selected Pharmacy"

            onSubmit={handleSubmitPharma}

          />

        )}

      </div>

    </div>
  );
};

export default PharmaEmpanelment;
