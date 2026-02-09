import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import BusinessIcon from "@mui/icons-material/Business";

interface Pharma {
  id: string;
  name: string;
  orderCount: number;
  status: "Active" | "Inactive";
  icon: "single" | "group" | "building";
}


const PHARMAS: Pharma[] = [
  {
    id: "1",
    name: "PharmacyHai",
    orderCount: 320,
    status: "Active",
    icon: "single",
  },
  {
    id: "2",
    name: "MediCare Plus",
    orderCount: 210,
    status: "Active",
    icon: "group",
  },
  {
    id: "3",
    name: "HealthMart",
    orderCount: 180,
    status: "Inactive",
    icon: "building",
  },
];

const ViewPharma = () => {

  const renderIcon = (type: Pharma["icon"]) => {

    const className = "text-blue-500 text-[28px]";

    switch (type) {

      case "single":
        return <PersonIcon className={className} />;

      case "group":
        return <GroupsIcon className={className} />;

      case "building":
        return <BusinessIcon className={className} />;

      default:
        return null;
    }
  };


  return (
    <div className="p-6 bg-gray-50 min-h-screen">


      {/* Header */}
      <div className="mb-6">

        <h2 className="text-xl font-semibold text-gray-900">
          Registered Pharmacies
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          {PHARMAS.length} pharmacies connected to your clinic
        </p>

      </div>


      {/* Cards */}
      <div className="space-y-4">

        {PHARMAS.map((pharma) => (

          <div
            key={pharma.id}
            className="bg-white border border-blue-200 rounded-lg overflow-hidden shadow-sm"
          >

            {/* Icon Section */}
            <div className="h-24 bg-blue-50 flex items-center justify-center border-b border-blue-200">

              {renderIcon(pharma.icon)}

            </div>


            {/* Content */}
            <div className="p-4">

              <h3 className="font-medium text-gray-900">
                {pharma.name}
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                {pharma.orderCount} orders
              </p>


              {/* Status */}
              <div className="flex items-center gap-2 mt-2">

                <span className="w-2 h-2 rounded-full bg-blue-500" />

                <span className="text-sm text-blue-600 font-medium">
                  {pharma.status}
                </span>

              </div>

            </div>

          </div>
        ))}

      </div>

    </div>
  );
};

export default ViewPharma;
