// import { useEffect, useState } from "react";

// import AddPharma from "../../features/pharma/AddPharma";
// import ViewPharma from "../../features/pharma/ViewPharma";
// import { getSession } from "../../context/sessions/userSession";

// import { getActivePharmaListApi } from "../../api/pharmacyApi/PharmacyApi";

// export interface PharmaApiItem {
//   pharma_id: number;
//   pharma_name: string;
//   pharma_logo?: string;

//   email?: string;
//   mobile?: string;
//   address?: string;

//   status: "Active" | "Inactive";
// }

// const session = getSession("user");
// const clinicId = session?.clinic_id ?? null;

// const PharmaEmpanelment = () => {
//   const [activeTab, setActiveTab] =
//     useState<"view" | "add">("view");

//   const [pharmas, setPharmas] = useState<PharmaApiItem[]>([]);
//   const [loading, setLoading] = useState(false);

//   const fetchPharmas = async () => {
//     try {
//       setLoading(true);

//       const res = await getActivePharmaListApi();

//       // Adjust if API wraps data
//       setPharmas(res.data);

//     } catch (err) {
//       console.error("Pharma list error", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchPharmas();
//   }, []);

//   const handleAddPharma = (newPharmas: PharmaApiItem[]) => {
//     setPharmas((prev) => [...prev, ...newPharmas]);

//     setActiveTab("view");
//   };

//   return (
//     <div className="w-full bg-white rounded-md shadow">

//       {/* Tabs */}
//       <div className="flex border-b">

//         <button
//           onClick={() => setActiveTab("view")}
//           className={`px-4 py-2 border-b-2
//             ${
//               activeTab === "view"
//                 ? "border-blue-500 text-blue-600"
//                 : "border-transparent text-gray-500"
//             }`}
//         >
//           View Pharma
//         </button>

//         <button
//           onClick={() => setActiveTab("add")}
//           className={`px-4 py-2 border-b-2
//             ${
//               activeTab === "add"
//                 ? "border-blue-500 text-blue-600"
//                 : "border-transparent text-gray-500"
//             }`}
//         >
//           Add Pharma
//         </button>

//       </div>

//       {/* Loading */}
//       {loading && (
//         <div className="p-3 text-sm text-blue-600">
//           Loading...
//         </div>
//       )}

//       {/* Content */}
//       <div>

//         {activeTab === "view" && (
//           <ViewPharma pharmas={pharmas} />
//         )}



//         {activeTab === "add" && (
//           <AddPharma
//             pharmas={pharmas}
//             onAdd={handleAddPharma}
//           />
//         )}

//       </div>

//     </div>
//   );
// };

// export default PharmaEmpanelment;

import { useEffect, useState } from "react";

import AddPartnerUI from "../../features/component/AddPartnerUI";
import ViewPartnerUI from "../../features/component/ViewPartnerUI";

import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";

import { getSession } from "../../context/sessions/userSession";

import { getActivePharmaListApi } from "../../api/pharmacyApi/PharmacyApi";
import { mapClinicPartnersApi } from "../../api/CommonApi/SaveLabAndPharmaApi";


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
   Session
======================= */

const session = getSession("user");
const clinicId = session?.clinic_id ?? null;


/* =======================
   Component
======================= */

const PharmaEmpanelment = () => {

  const [activeTab, setActiveTab] =
    useState<"view" | "add">("view");

  const [pharmas, setPharmas] =
    useState<PharmaApiItem[]>([]);

  const [loading, setLoading] =
    useState(false);


  /* =======================
     Fetch
  ======================= */

  const fetchPharmas = async () => {

    try {
      setLoading(true);

      const res = await getActivePharmaListApi();

      // Keep res naming
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
     After Add
  ======================= */

  const handleAddPharma = (
    newPharmas: PharmaApiItem[]
  ) => {

    setPharmas((prev) => [
      ...prev,
      ...newPharmas,
    ]);

    setActiveTab("view");
  };


  /* =======================
     Submit Handler
  ======================= */

  const handleSubmitPharma = async (
    ids: number[]
  ) => {

    if (!clinicId) {
      alert("Session expired. Please login again.");
      return;
    }

    const res = await mapClinicPartnersApi({
      clinic_id: clinicId,
      lab_ids: [],
      pharmacy_ids: ids,
    });

    if (!res.success) {
      throw new Error(
        res.message || "Failed to map pharmacy"
      );
    }

    const selected = pharmas.filter((p) =>
      ids.includes(p.pharma_id)
    );

    handleAddPharma(selected);
  };


  /* =======================
     Render
  ======================= */

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


      {/* Loading */}
      {loading && (
        <div className="p-3 text-sm text-blue-600">
          Loading...
        </div>
      )}


      {/* Content */}
      <div>


        {/* View */}
        {activeTab === "view" && (

          <ViewPartnerUI

            title="Registered Pharmacies"

            countLabel="pharmacies connected to your clinic"

            emptyText="No pharmacies mapped yet."

            clinicId={clinicId}

           data={pharmas.map((p) => ({
  id: p.pharma_id,
  name: p.pharma_name,

  logo: p.pharma_logo,
  phone: p.mobile,
  email: p.email,
  address: p.address,

  
}))}


          />

        )}


        {/* Add */}
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
