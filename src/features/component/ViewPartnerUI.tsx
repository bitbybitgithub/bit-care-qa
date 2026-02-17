import { RiContactsFill } from "react-icons/ri";
import { IoMail } from "react-icons/io5";
import SidebarBg from "../../assets/SidebarBg.png";

interface PartnerItem {
  id: number;
  name: string;
  logo?: string;
  phone?: string;
  email?: string;
  address?: string;
  // status: "Active" | "Inactive";
}

interface Props {
  title: string;
  countLabel: string;
  emptyText: string;
  clinicId: number | null;
  data: PartnerItem[];
}

const ViewPartnerUI = ({
  title,
  countLabel,
  emptyText,
  clinicId,
  data,
}: Props) => {
  return (
    <div className="p-6 bg-gray-50 min-h-screen">

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {title}
        </h2>

        {clinicId && (
          <p className="text-xs text-gray-400 mt-1">
            Clinic ID: {clinicId}
          </p>
        )}

        <p className="text-sm text-gray-500 mt-1">
          {data?.length} {countLabel}
        </p>
      </div>

      {!data?.length && (
        <p className="text-gray-500 text-sm">
          {emptyText}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {data?.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-sm transition"
          >

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-3">

                <div className="w-12 h-12 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">

                  <img
                    src={SidebarBg}
                    alt="Partner"
                    className="w-full h-full object-cover"
                  />

                  {/*
  OLD LOGO LOGIC (KEEP FOR LATER)

  {item.logo ? (
    <img
      src={item.logo}
      alt={item.name}
      className="w-full h-full object-cover"
    />
  ) : (
    <BusinessIcon className="text-gray-500" />
  )}
  */}

                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {item.name}
                  </h3>

                  {item.address && (
                    <p className="text-xs text-gray-500">
                      {item.address}
                    </p>
                  )}
                </div>
              </div>


              <div className="flex items-center gap-2">
                {/* 
                
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                    }`}
                >
                  {item.status === "Active" ? "Operational" : "Inactive"}
                </span>
 */}

              </div>
            </div>

            <div className="mt-3 space-y-2 text-xs text-gray-600">

              {item.phone && (
                <div className="flex items-center gap-2">
                  <RiContactsFill className="text-gray-400 text-sm" />
                  <a
                    href={`tel:${item.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-blue-600 transition"
                  >
                    {item.phone}
                  </a>
                </div>
              )}

              {item.email && (
                <div className="flex items-center gap-2">
                  <IoMail className="text-gray-400 text-sm" />
                  <a
                    href={`mailto:${item.email}`}
                    onClick={(e) => e.stopPropagation()}
                    className="truncate hover:text-blue-600 transition"
                  >
                    {item.email}
                  </a>
                </div>
              )}

            </div>

          </div>
        ))}


      </div>
    </div>
  );
};

export default ViewPartnerUI;
