import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, Tab, Paper } from "@mui/material";
import { toast } from "react-toastify";
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
import LabTestManagement from "./LabTestManagement";
import LabPackageManagement from "./LabPackageManagement";
import LabTestSelectionPopup from "./LabTestSelectionPopup";
const ServiceManagement: React.FC = () => {
  const [labId] = useState(() => getSessionItem("user", "lab_id"));
  const [userId] = useState(() => getSessionItem("user", "user_id"));
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"tests" | "packages">("tests");
  // Test Management
  const [labTests, setLabTests] = useState<LabCategory[]>([]);
  const [savedLabTests, setSavedLabTests] = useState<any[]>([]);
  const [selectedTests, setSelectedTests] = useState<SelectedTest[]>([]);
  const [addTestPopupOpen, setAddTestPopupOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [isOn, setIsOn] = useState(false);
  // Package Management
  const [packages, setPackages] = useState<any[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  // Dialogs
  // Loading

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
    console.log("getLabTestListApi response:", response);
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
    console.log("lab package response", response);
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
      await Promise.all([fetchSavedTests(formattedData), fetchPackages()]);
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

  useEffect(() => {
    console.log("ServiceManagement MOUNT");
    return () => {
      console.log("ServiceManagement UNMOUNT");
    };
  }, []);

  return (
    <div className="h-auto md:mt-1">
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          borderRadius: 1,
          border: "1px solid #e5e7eb",
          backgroundColor: "white",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          sx={{
            px: 2,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              minHeight: 58,
            },
          }}
        >
          <Tab value="tests" label="Laboratory Tests" />
          <Tab value="packages" label="Laboratory Packages" />
        </Tabs>
      </Paper>

      {activeTab === "tests" && (
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
      )}
      {addTestPopupOpen && (
        <LabTestSelectionPopup
          open={addTestPopupOpen}
          onClose={() => setAddTestPopupOpen(false)}
          labTests={labTests}
          selectedTests={selectedTests}
          labId={labId}
          userId={userId}
          doorStepService={isOn}
          onSaved={fetchAll}
        />
      )}
      {activeTab === "packages" && (
        <LabPackageManagement
          packages={packages}
          savedLabTests={savedLabTests}
          loading={loading}
          onRefresh={fetchAll}
        />
      )}
    </div>
  );
};

export default ServiceManagement;
