import PersonIcon from "@mui/icons-material/Person";
import GroupsIcon from "@mui/icons-material/Groups";
import BusinessIcon from "@mui/icons-material/Business";

/* ============================
   Types
============================ */

interface Lab {
  id: string;
  name: string;
  testCount: number;
  status: "Active" | "Inactive";
  icon: "single" | "group" | "building";
}

/* ============================
   Dummy Data
============================ */

const LABS: Lab[] = [
  {
    id: "1",
    name: "SureCheck Labs",
    testCount: 150,
    status: "Active",
    icon: "single",
  },
  {
    id: "2",
    name: "DiagnoHub",
    testCount: 200,
    status: "Active",
    icon: "group",
  },
  {
    id: "3",
    name: "BioTest Plus",
    testCount: 175,
    status: "Active",
    icon: "building",
  },
];

/* ============================
   Component
============================ */

const ViewLabs = () => {
  const renderIcon = (type: Lab["icon"]) => {
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
          Registered Labs
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          {LABS.length} labs connected to your clinic
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-4">

        {LABS.map((lab) => (
          <div
            key={lab.id}
            className="bg-white border border-blue-200 rounded-lg overflow-hidden shadow-sm"
          >

            {/* Icon Section */}
            <div className="h-24 bg-blue-50 flex items-center justify-center border-b border-blue-200">
              {renderIcon(lab.icon)}
            </div>

            {/* Content */}
            <div className="p-4">

              <h3 className="font-medium text-gray-900">
                {lab.name}
              </h3>

              <p className="text-sm text-gray-500 mt-1">
                {lab.testCount} tests
              </p>

              {/* Status */}
              <div className="flex items-center gap-2 mt-2">

                <span className="w-2 h-2 rounded-full bg-blue-500" />

                <span className="text-sm text-blue-600 font-medium">
                  {lab.status}
                </span>

              </div>

            </div>

          </div>
        ))}

      </div>
    </div>
  );
};

export default ViewLabs;
