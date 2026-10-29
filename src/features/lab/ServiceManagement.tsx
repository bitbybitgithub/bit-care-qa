import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import {
  getLabPackageListApi,
  getLabTestListApi,
  getlabtestserviceApi,
} from "../../api/labApis/LabApi";
import type {
  LabCategory,
  SelectedTest,
  LabTestApiResponse,
} from "../../types/labType/LabTestInterfaces";
import { getSessionItem } from "../../context/sessions/userSession";
import { useLabOnboarding } from "../../context/LabOnboardingContext";
import LabTestManagement from "./LabTestManagement";
import LabPackageManagement from "./LabPackageManagement";
import LabTestSelectionPopup from "./LabTestSelectionPopup";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";

const ServiceManagement: React.FC = () => {
  const [labId] = useState(() => getSessionItem("user", "lab_id"));
  const [userId] = useState(() => getSessionItem("user", "user_id"));
  const { refreshOnboardingStatus } = useLabOnboarding();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tests" | "packages">("tests");
  // Test Management
  const [labTests, setLabTests] = useState<LabCategory[]>([]);
  const [savedLabTests, setSavedLabTests] = useState<any[]>([]);
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [addTestPopupOpen, setAddTestPopupOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [, setIsUpdateMode] = useState(false);
  const [isOn, setIsOn] = useState(false);
  // Package Management
  const [packages, setPackages] = useState<any[]>([]);

  const transformLabTests = (data: unknown): LabCategory[] => {
    if (Array.isArray(data)) {
      const arr = data as LabTestApiResponse[];
      const grouped: Record<string, LabTestApiResponse[]> = {};
      arr.forEach((t) => {
        const key = t.category_name || "Uncategorized";
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(t);
      });
      return Object.entries(grouped).map(([categoryName, tests]) => ({
        category: categoryName,
        tests: tests.map((test) => ({
          id: String(test.test_id),
          name: test.test_name,
          categoryId: Number(test.category_id),
          tatHours: test.tat_hours,
          homeService: test.home_service === "1",
          description: test.test_description,
          code: test.test_code,
        })),
      }));
    }

    // If it's already a mapping
    const obj = data as Record<string, LabTestApiResponse[]>;
    return Object.entries(obj || {}).map(([categoryName, tests]) => ({
      category: categoryName,
      tests: tests.map((test) => ({
        id: String(test.test_id),
        name: test.test_name,
        categoryId: Number(test.category_id),
        tatHours: test.tat_hours,
        homeService: test.home_service === "1",
        description: test.test_description,
        code: test.test_code,
      })),
    }));
  };

  const fetchLabServices = async () => {
    const response = await getlabtestserviceApi();
    const formattedData = transformLabTests(response);
    setLabTests(formattedData);
    return formattedData;
  };

  const fetchSavedTests = async (formattedData: LabCategory[]) => {
    if (!labId) {
      setSavedLabTests([]);
      setSelectedTests([]);
      return;
    }
    const response = await getLabTestListApi(Number(labId));
    const savedTests = (response as any)?.data || [];
    setSavedLabTests(savedTests);
    const selected: SelectedTest[] = [];
    formattedData.forEach((category) => {
      category.tests.forEach((test) => {
        const exists = savedTests.find(
          (savedTest: any) => String(savedTest.test_id) === test.id,
        );
        if (exists) {
          selected.push({
            category: category.category,
            categoryId: test.categoryId,
            testId: test.id,
            testName: test.name,
            code: test.code,
            price:
              exists.price !== null && exists.price !== undefined
                ? String(exists.price)
                : "",
            priceError: "",
            discountPrice:
              exists.discount_price !== null &&
              exists.discount_price !== undefined
                ? String(exists.discount_price)
                : "",
            discountPriceError: "",
            payableAmount:
              exists.payable_amount !== null &&
              exists.payable_amount !== undefined
                ? String(exists.payable_amount)
                : String(
                    Number(exists.price || 0) -
                      Number(exists.discount_price || 0),
                  ),
          });
        }
      });
    });
    setSelectedTests(selected);
    setIsUpdateMode(selected.length > 0);
    if (savedTests.length > 0) {
      setIsOn(savedTests[0].home_service === "1");
    }
  };

  const fetchPackages = async () => {
    if (!labId) {
      setPackages([]);
      return;
    }
    const response = await getLabPackageListApi(Number(labId));
    if (response.success) {
      setPackages(response.data || []);
    } else {
      setPackages([]);
    }
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      if (!labId) {
        setLabTests([]);
        setSavedLabTests([]);
        setSelectedTests([]);
        setPackages([]);
        return;
      }
      const formattedData = await fetchLabServices();
      await Promise.all([fetchSavedTests(formattedData), fetchPackages(), refreshOnboardingStatus()]);
    } catch (error) {
      console.error("Failed to load Service Management", error);
      toast.error("Failed to load Service Management");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [labId]);

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Modern Compact Segmented Header Bar */}
      <div className="bg-white border border-slate-200/90 rounded-xl px-4 py-2.5 shadow-xs flex items-center justify-between flex-wrap gap-3 transition-all">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab("tests")}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "tests"
                ? "bg-[var(--color-primary)] text-white shadow-sm ring-1 ring-[var(--color-primary)]/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
            }`}
          >
            <ScienceOutlinedIcon sx={{ fontSize: 18 }} />
            <span>Laboratory Tests</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${
                activeTab === "tests"
                  ? "bg-white/20 text-white border border-white/30"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {selectedTests.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("packages")}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer ${
              activeTab === "packages"
                ? "bg-[var(--color-primary)] text-white shadow-sm ring-1 ring-[var(--color-primary)]/50"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/70"
            }`}
          >
            <Inventory2OutlinedIcon sx={{ fontSize: 18 }} />
            <span>Laboratory Packages</span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full transition-colors ${
                activeTab === "packages"
                  ? "bg-white/20 text-white border border-white/30"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {packages.length}
            </span>
          </button>
        </div>

        {/* Quick summary status */}
        <div className="hidden sm:flex items-center gap-3 text-xs sm:text-sm text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Total Active Services:{" "}
              <strong className="text-slate-700">
                {selectedTests.length + packages.length}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Tab Panels with Smooth Animated Transition */}
      <AnimatePresence mode="wait">
        {activeTab === "tests" && (
          <motion.div
            key="tab-tests"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full"
          >
            <LabTestManagement
              data={{
                selectedTests,
                search,
              }}
              actions={{
                setSearch,
                setSelectedTests,
              }}
              labId={labId}
              userId={userId}
              onUpdated={fetchAll}
              loading={loading}
              onAddNewTest={() => {
                setAddTestPopupOpen(true);
              }}
            />
          </motion.div>
        )}

        {activeTab === "packages" && (
          <motion.div
            key="tab-packages"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full"
          >
            <LabPackageManagement
              packages={packages}
              savedLabTests={savedLabTests}
              loading={loading}
              onRefresh={fetchAll}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add New Test Dialog */}
      {addTestPopupOpen && (
        <LabTestSelectionPopup
          open={addTestPopupOpen}
          mode="service-management"
          onClose={() => setAddTestPopupOpen(false)}
          labTests={labTests}
          selectedTests={selectedTests}
          labId={labId}
          userId={userId}
          doorStepService={isOn}
          onSaved={fetchAll}
        />
      )}
    </div>
  );
};

export default ServiceManagement;
