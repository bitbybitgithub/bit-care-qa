// import { useEffect, useState } from "react";

// import AddLabs from "../../features/lab/AddLabs";
// import ViewLabs from "../../features/lab/ViewLabs";
// import { getSession } from "../../context/sessions/userSession";
// import { getActiveLabListApi } from "../../api/labApis/LabApi";

// export interface LabApiItem {
//   lab_id: number;
//   lab_name: string;
//   lab_logo?: string;

//   email?: string;
//   mobile?: string;
//   address?: string;

//   status: "Active" | "Inactive";
// }

// const session = getSession("user");
// const clinicId = session?.clinic_id ?? null;

// const LabEmpanelment = () => {
//   const [activeTab, setActiveTab] =
//     useState<"view" | "add">("view");

//   const [labs, setLabs] = useState<LabApiItem[]>([]);
//   const [loading, setLoading] = useState(false);

//   const fetchLabs = async () => {
//     try {
//       setLoading(true);

//       const res = await getActiveLabListApi();
//       setLabs(res.data);

//     } catch (err) {
//       console.error("Lab list error", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchLabs();
//   }, []);

//   const handleAddLabs = (newLabs: LabApiItem[]) => {
//     setLabs((prev) => [...prev, ...newLabs]);
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
//           View Labs
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
//           Add Labs
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
//           <ViewLabs labs={labs} />
//         )}

//         {activeTab === "add" && (
//           <AddLabs
//             labs={labs}
//             onAdd={handleAddLabs}
//           />
//         )}

//       </div>

//     </div>
//   );
// };

// export default LabEmpanelment;

import { useEffect, useState } from "react";

import AddPartnerUI from "../../features/component/AddPartnerUI";
import ViewPartnerUI from "../../features/component/ViewPartnerUI";

import ScienceIcon from "@mui/icons-material/Science";

import { getSession } from "../../context/sessions/userSession";

import { getActiveLabListApi } from "../../api/labApis/LabApi";
import { mapClinicPartnersApi } from "../../api/CommonApi/SaveLabAndPharmaApi";


/* =======================
   Types
======================= */

export interface LabApiItem {
  lab_id: number;
  lab_name: string;
  lab_logo?: string;

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

const LabEmpanelment = () => {

  const [activeTab, setActiveTab] =
    useState<"view" | "add">("view");

  const [labs, setLabs] =
    useState<LabApiItem[]>([]);

  const [loading, setLoading] =
    useState(false);


  /* =======================
     Fetch
  ======================= */

  const fetchLabs = async () => {

    try {
      setLoading(true);

      const res = await getActiveLabListApi();

      // Keep res naming
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


  /* =======================
     After Add
  ======================= */

  const handleAddLabs = (
    newLabs: LabApiItem[]
  ) => {

    setLabs((prev) => [
      ...prev,
      ...newLabs,
    ]);

    setActiveTab("view");
  };


  /* =======================
     Submit Handler
  ======================= */

  const handleSubmitLabs = async (
    ids: number[]
  ) => {

    if (!clinicId) {
      alert("Session expired. Please login again.");
      return;
    }

    const res = await mapClinicPartnersApi({
      clinic_id: clinicId,
      lab_ids: ids,
      pharmacy_ids: [],
    });

    if (!res.success) {
      throw new Error(
        res.message || "Failed to map labs"
      );
    }

    const selected = labs.filter((l) =>
      ids.includes(l.lab_id)
    );

    handleAddLabs(selected);
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
            ${
              activeTab === "view"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500"
            }`}
        >
          View Labs
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


        {/* View */}
        {activeTab === "view" && (

          <ViewPartnerUI

            title="Registered Labs"

            countLabel="labs connected to your clinic"

            emptyText="No labs mapped yet."

            clinicId={clinicId}

            data={labs.map((l) => ({
  id: l.lab_id,
  name: l.lab_name,

  logo: l.lab_logo,
  phone: l.phone,
  email: l.email,
  address: l.address,

  status: l.status,
}))}

          />

        )}


        {/* Add */}
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
 

