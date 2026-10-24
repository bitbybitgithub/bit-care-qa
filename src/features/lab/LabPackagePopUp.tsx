import React, { useEffect, useMemo, useState, type JSX } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import BloodtypeOutlinedIcon from "@mui/icons-material/BloodtypeOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import BiotechOutlinedIcon from "@mui/icons-material/BiotechOutlined";
import HealthAndSafetyOutlinedIcon from "@mui/icons-material/HealthAndSafetyOutlined";
import MedicationOutlinedIcon from "@mui/icons-material/MedicationOutlined";
import WaterDropOutlinedIcon from "@mui/icons-material/WaterDropOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import type { SelectedPackageTest } from "../../types/labType/LabTestInterfaces";
import Loader from "../../components/shared/Loader/Loader";

type LabPackageDisplayTest = {
  test_id: number;
  test_code: string | null;
  test_name: string;
  price: number;
  category_id: number;
  category_name: string;
  tat_hours?: number;
  home_service?: boolean;
  test_description?: string | null;
};

interface LabPackagePopUpProps {
  open: boolean;
  onClose: () => void;
  savedLabTests: any[];
  isEditMode: boolean;
  selectedPackage: any;
  loading?: boolean;
  onRefresh: () => Promise<void>;
  onSavePackage: (packageData: {
    packageName: string;
    description: string;
    packagePrice: number;
    selectedTests: any[];
    actualPrice: number;
    discountAmount: number;
    discountPercentage: number;
  }) => Promise<void>;
}

const LabPackagePopUp: React.FC<LabPackagePopUpProps> = ({
  open,
  onClose,
  savedLabTests,
  isEditMode,
  selectedPackage,
  loading,
  onSavePackage,
}) => {
  const [packageName, setPackageName] = useState("");
  const [packagePrice, setPackagePrice] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [packageNameError, setPackageNameError] = useState("");
  const [packagePriceError, setPackagePriceError] = useState("");
  const [selectedTestError, setSelectedTestError] = useState("");
  const [description, setDescription] = useState("");
  const [selectedTests, setSelectedTests] = useState<SelectedPackageTest[]>([]);
  // Mobile/Tablet tab switcher: "categories" | "tests" | "builder"
  const [mobileTab, setMobileTab] = useState<"categories" | "tests" | "builder">("tests");

  const packageAmount = Number(packagePrice || 0);

  const resetForm = () => {
    setPackageName("");
    setPackagePrice("");
    setDescription("");
    setSearch("");
    setActiveCategory("");
    setPackageNameError("");
    setPackagePriceError("");
    setSelectedTestError("");
    setSelectedTests([]);
    setMobileTab("tests");
  };

  useEffect(() => {
    if (!open) return;
    if (isEditMode && selectedPackage) {
      setPackageName(selectedPackage.package_name || "");
      setPackagePrice(
        selectedPackage.package_price
          ? String(Number(selectedPackage.package_price))
          : "",
      );
      setDescription(selectedPackage.description || "");
      const packageTests: SelectedPackageTest[] = (
        selectedPackage.tests || []
      ).map((test: any) => ({
        test_id: Number(test.test_id),
        test_code: test.test_code,
        test_name: test.test_name,
        test_price: Number(test.test_price ?? test.price ?? 0),
        price: Number(test.price ?? test.test_price ?? 0),
        category_id: Number(test.category_id),
        category_name: test.category_name,
      }));
      setSelectedTests(packageTests);
    } else if (!isEditMode) {
      resetForm();
    }
  }, [open, isEditMode, selectedPackage]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const categoryIcons: Record<string, JSX.Element> = {
    Hematology: <BloodtypeOutlinedIcon sx={{ color: "var(--color-primary)", fontSize: 20 }} />,
    Biochemistry: <ScienceOutlinedIcon sx={{ color: "var(--color-success)", fontSize: 20 }} />,
    Microbiology: <BiotechOutlinedIcon sx={{ color: "var(--color-secondary)", fontSize: 20 }} />,
    Immunology: <HealthAndSafetyOutlinedIcon sx={{ color: "var(--color-warning)", fontSize: 20 }} />,
    Hormones: <MedicationOutlinedIcon sx={{ color: "var(--color-error)", fontSize: 20 }} />,
    "Urine & Stool": <WaterDropOutlinedIcon sx={{ color: "var(--color-warning)", fontSize: 20 }} />,
    Others: <CategoryOutlinedIcon sx={{ color: "var(--color-disabled)", fontSize: 20 }} />,
  };

  const totalTestPrice = useMemo(() => {
    return selectedTests.reduce(
      (total, test) => total + Number(test.price || 0),
      0,
    );
  }, [selectedTests]);

  const discount = useMemo(() => {
    return Math.max(totalTestPrice - packageAmount, 0);
  }, [totalTestPrice, packageAmount]);

  const savingPercentage = useMemo(() => {
    if (totalTestPrice === 0) return 0;
    return Math.round((discount / totalTestPrice) * 100);
  }, [discount, totalTestPrice]);

  const packageDisplayTests = useMemo<LabPackageDisplayTest[]>(() => {
    if (isEditMode && selectedPackage?.tests?.length) {
      return (selectedPackage.tests || []).map((test: any) => ({
        test_id: Number(test.test_id),
        test_code: test.test_code,
        test_name: test.test_name,
        price: Number(test.test_price ?? test.price ?? 0),
        category_id: Number(test.category_id),
        category_name: test.category_name,
        tat_hours: test.tat_hours ?? 0,
        home_service: test.home_service ?? false,
        test_description: test.test_description ?? null,
      }));
    }

    return savedLabTests as LabPackageDisplayTest[];
  }, [savedLabTests, isEditMode, selectedPackage]);

  const categories = useMemo<string[]>(() => {
    return Array.from(
      new Set(packageDisplayTests.map((item) => item.category_name)),
    );
  }, [packageDisplayTests]);

  useEffect(() => {
    if (!activeCategory && categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const filteredTests = useMemo(() => {
    return packageDisplayTests.filter(
      (x) =>
        x.category_name === activeCategory &&
        (x.test_name.toLowerCase().includes(search.toLowerCase()) ||
          (x.test_code && x.test_code.toLowerCase().includes(search.toLowerCase()))),
    );
  }, [packageDisplayTests, activeCategory, search]);

  const normalizeToSelectedTest = (test: any): SelectedPackageTest => ({
    test_id: Number(test.test_id),
    test_code: test.test_code,
    test_name: test.test_name,
    price: Number(test.price ?? test.test_price ?? 0),
    category_id: Number(test.category_id),
    category_name: test.category_name,
    tat_hours: test.tat_hours ?? 0,
    home_service: test.home_service ?? false,
    test_description: test.test_description ?? null,
  });

  const handleToggle = (test: any) => {
    setSelectedTests((prev) => {
      const exists = prev.some(
        (item) => Number(item.test_id) === Number(test.test_id),
      );
      if (exists) {
        return prev.filter(
          (item) => Number(item.test_id) !== Number(test.test_id),
        );
      }
      return [...prev, normalizeToSelectedTest(test)];
    });
  };

  const isChecked = (testId: number) => {
    return selectedTests.some(
      (test) => Number(test.test_id) === Number(testId),
    );
  };

  const currentCategoryTests = useMemo(
    () => packageDisplayTests.filter((x) => x.category_name === activeCategory),
    [packageDisplayTests, activeCategory],
  );

  const isAllSelected =
    currentCategoryTests.length > 0 &&
    currentCategoryTests.every((test) =>
      selectedTests.some((selected) => selected.test_id === test.test_id),
    );

  const isIndeterminate =
    selectedTests.some((selected) =>
      currentCategoryTests.some((test) => test.test_id === selected.test_id),
    ) && !isAllSelected;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTests((prev) => {
        const existingIds = new Set(prev.map((x) => x.test_id));
        const newTests = currentCategoryTests
          .filter((test) => !existingIds.has(test.test_id))
          .map((test) => normalizeToSelectedTest(test));
        return [...prev, ...newTests];
      });
    } else {
      setSelectedTests((prev) =>
        prev.filter(
          (selected) =>
            !currentCategoryTests.some(
              (test) => test.test_id === selected.test_id,
            ),
        ),
      );
    }
  };

  const validatePackage = () => {
    let valid = true;
    setPackageNameError("");
    setPackagePriceError("");
    setSelectedTestError("");
    if (!packageName.trim()) {
      setPackageNameError("Package name is required.");
      valid = false;
    }
    if (!packagePrice) {
      setPackagePriceError("Package price is required.");
      valid = false;
    } else if (Number(packagePrice) <= 0) {
      setPackagePriceError("Package price must be greater than zero.");
      valid = false;
    }
    if (selectedTests.length < 2) {
      setSelectedTestError("Select at least 2 tests to create a package.");
      valid = false;
    }
    if (Number(packagePrice) > totalTestPrice) {
      setPackagePriceError("Package price cannot exceed total test price.");
      valid = false;
    }
    return valid;
  };

  const handleSave = async () => {
    if (!validatePackage()) return;
    await onSavePackage({
      packageName,
      description,
      packagePrice: Number(packagePrice),
      selectedTests,
      actualPrice: totalTestPrice,
      discountAmount: discount,
      discountPercentage: savingPercentage,
    });
  };

  if (loading) {
    return <Loader message="Loading laboratory services..." />;
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
          height: "90vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
    >
      {/* ================= MAIN DIALOG TITLE BAR ================= */}
      <DialogTitle
        sx={{
          py: 2,
          px: 3,
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          bgcolor: "var(--color-bg)",
        }}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100 shadow-2xs">
            <Inventory2OutlinedIcon sx={{ fontSize: 22 }} />
          </div>
          <div>
            <Typography variant="h6" fontWeight={700} fontSize={18}>
              {isEditMode ? "Edit Laboratory Package" : "Create New Laboratory Package"}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontSize={13}>
              Bundle multiple laboratory tests with custom discounted package pricing
            </Typography>
          </div>
        </div>

        <IconButton
          size="medium"
          onClick={() => {
            resetForm();
            onClose();
          }}
          sx={{ color: "var(--color-disabled)", "&:hover": { color: "var(--color-text)" } }}
        >
          <CloseIcon sx={{ fontSize: 22 }} />
        </IconButton>
      </DialogTitle>

      {/* ================= MOBILE / TABLET NAVIGATION TABS ================= */}
      <div className="flex md:hidden border-b border-slate-200 bg-slate-50 p-1.5 gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab("categories")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            mobileTab === "categories"
              ? "bg-white text-sky-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("tests")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            mobileTab === "tests"
              ? "bg-white text-sky-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Tests ({currentCategoryTests.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("builder")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            mobileTab === "builder"
              ? "bg-white text-sky-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Builder ({selectedTests.length})
        </button>
      </div>

      {/* ================= MAIN 3-COLUMN CONTENT BODY ================= */}
      <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
        <div className="flex flex-col md:flex-row h-full overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200">
          {/* ================= COLUMN 1: CATEGORIES ================= */}
          <div
            className={`w-full md:w-64 lg:w-72 shrink-0 bg-slate-50/50 flex-col h-full overflow-hidden ${
              mobileTab === "categories" ? "flex" : "hidden md:flex"
            }`}
          >
            {/* Synchronized Header: Height 56px */}
            <div className="h-14 px-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
              <span className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                Categories
              </span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                {categories.length}
              </span>
            </div>

            {/* Category List */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
              {categories.map((category) => {
                const totalTests = packageDisplayTests.filter(
                  (item) => item.category_name === category,
                ).length;
                const selectedCount = selectedTests.filter(
                  (item) => item.category_name === category,
                ).length;
                const isActive = activeCategory === category;
                const isFullySelected =
                  selectedCount === totalTests && totalTests > 0;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category);
                      if (window.innerWidth < 768) setMobileTab("tests");
                    }}
                    className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                      isActive
                        ? "bg-white text-sky-800 shadow-xs border border-sky-300 font-semibold"
                        : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="shrink-0">
                        {categoryIcons[category] ?? (
                          <CategoryOutlinedIcon sx={{ fontSize: 20, color: "var(--color-disabled)" }} />
                        )}
                      </span>
                      <div className="truncate">
                        <div className="text-sm font-semibold truncate leading-tight">
                          {category}
                        </div>
                        <div className="text-xs text-slate-400 font-normal mt-0.5">
                          {totalTests} available tests
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        isFullySelected
                          ? "bg-emerald-100 text-emerald-800"
                          : selectedCount > 0
                            ? "bg-sky-100 text-sky-800"
                            : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {selectedCount}/{totalTests}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ================= COLUMN 2: AVAILABLE TESTS ================= */}
          <div
            className={`flex-1 flex-col h-full overflow-hidden bg-white ${
              mobileTab === "tests" ? "flex" : "hidden md:flex"
            }`}
          >
            {/* Synchronized Header: Height 56px */}
            <div className="h-14 px-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-base font-bold text-slate-800 truncate">
                  {activeCategory || "Select Category"}
                </span>
                <span className="text-xs font-medium text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full shrink-0">
                  {currentCategoryTests.length} tests
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="relative w-48 sm:w-60">
                  <SearchIcon
                    sx={{ fontSize: 18 }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search test name or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-white hover:bg-slate-50 focus:bg-white rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isIndeterminate}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      sx={{ p: 0.5 }}
                    />
                  }
                  label={
                    <span className="text-sm font-semibold text-slate-700 select-none">
                      Select All
                    </span>
                  }
                  sx={{ mr: 0, m: 0 }}
                />
              </div>
            </div>

            {/* Test Cards List */}
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-slate-50/30">
              {filteredTests.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center">
                  <SearchIcon sx={{ fontSize: 32, mb: 1, color: "var(--color-disabled)" }} />
                  <div className="font-semibold text-slate-600">No tests found</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Try adjusting your search query.
                  </div>
                </div>
              ) : (
                filteredTests.map((test) => {
                  const checked = isChecked(test.test_id);

                  return (
                    <div
                      key={test.test_id}
                      onClick={() => handleToggle(test)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        checked
                          ? "bg-sky-50/90 border-sky-400 shadow-xs ring-1 ring-sky-200"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Checkbox
                          checked={checked}
                          onChange={() => {}}
                          sx={{ p: 0 }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm sm:text-[15px] font-semibold text-slate-800 truncate">
                            {test.test_name}
                          </div>
                          {test.test_code && (
                            <span className="inline-block mt-0.5 text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                              {test.test_code}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs text-slate-400 block font-medium">Standard Price</span>
                        <span className="text-sm sm:text-base font-bold text-slate-800">
                          ₹{test.price}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ================= COLUMN 3: PACKAGE BUILDER ================= */}
          <div
            className={`w-full md:w-80 lg:w-96 shrink-0 bg-white flex-col h-full overflow-hidden ${
              mobileTab === "builder" ? "flex" : "hidden md:flex"
            }`}
          >
            {/* Synchronized Header: Height 56px */}
            <div className="h-14 px-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
              <span className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                Package Builder
              </span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                {selectedTests.length} Selected
              </span>
            </div>

            {/* Package Configuration Form */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5">
              {/* Package Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Package Name *
                </label>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. Comprehensive Health Checkup"
                  value={packageName}
                  error={Boolean(packageNameError)}
                  helperText={packageNameError}
                  onChange={(e) => {
                    setPackageName(e.target.value);
                    if (packageNameError) setPackageNameError("");
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      fontSize: 14,
                      height: 40,
                      backgroundColor: "var(--color-bg)",
                      borderRadius: 2,
                    },
                    "& .MuiFormHelperText-root": {
                      fontSize: 11,
                      marginLeft: 0,
                    },
                  }}
                />
              </div>

              {/* Package Price */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Package Price (₹) *
                </label>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="e.g. 999"
                  value={packagePrice}
                  error={Boolean(packagePriceError)}
                  helperText={packagePriceError}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (/^\d*$/.test(value)) {
                      setPackagePrice(value);
                      if (packagePriceError) setPackagePriceError("");
                    }
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      fontSize: 14,
                      height: 40,
                      backgroundColor: "var(--color-bg)",
                      borderRadius: 2,
                    },
                    "& .MuiFormHelperText-root": {
                      fontSize: 11,
                      marginLeft: 0,
                    },
                  }}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start" sx={{ mr: 0.5 }}>
                          <span className="text-sm font-bold text-slate-600">
                            ₹
                          </span>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Brief note about who this package is for..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 hover:bg-slate-100/70 focus:bg-white rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                />
              </div>

              {/* Pricing Breakdown Summary */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Package Summary
                </span>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Selected Tests:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedTests.length} tests
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Total Standard Value:</span>
                  <span className="font-semibold text-slate-700">
                    ₹{totalTestPrice}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Patient Savings:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-emerald-700">
                      ₹{discount}
                    </span>
                    {discount > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        <LocalOfferOutlinedIcon sx={{ fontSize: 11 }} />
                        {savingPercentage}% OFF
                      </span>
                    )}
                  </div>
                </div>

                <Divider sx={{ my: 0.5 }} />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-800">
                    Final Package Price:
                  </span>
                  <span className="text-lg font-bold text-sky-700">
                    ₹{packageAmount}
                  </span>
                </div>
              </div>

              {/* Selected Tests Pill Box */}
              <div className="flex-1 flex flex-col min-h-[110px] border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Included Tests ({selectedTests.length})
                  </span>
                  {selectedTestError && (
                    <span className="text-xs text-red-600 font-semibold">
                      {selectedTestError}
                    </span>
                  )}
                </div>

                {selectedTests.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-xs text-slate-400 text-center py-4">
                    Select tests from the middle pane to add them to this package.
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto max-h-36 flex flex-wrap gap-1.5 pr-1">
                    {selectedTests.map((test) => (
                      <span
                        key={test.test_id}
                        className="inline-flex items-center gap-1.5 text-xs font-medium bg-white text-slate-800 border border-slate-200 px-2.5 py-1 rounded-full shadow-2xs group"
                      >
                        <span className="truncate max-w-[140px]">
                          {test.test_name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedTests((prev) =>
                              prev.filter(
                                (item) => item.test_id !== test.test_id,
                              ),
                            )
                          }
                          className="text-slate-400 hover:text-red-500 cursor-pointer"
                        >
                          <CloseOutlinedIcon sx={{ fontSize: 13 }} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 px-4 border-t border-slate-200 bg-white flex items-center gap-3 shrink-0">
              <Button
                fullWidth
                size="medium"
                variant="outlined"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                sx={{ textTransform: "none", borderRadius: 2, py: 1, fontSize: 14, fontWeight: 600 }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                size="medium"
                variant="contained"
                onClick={handleSave}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  py: 1,
                  fontSize: 14,
                  fontWeight: 600,
                  bgcolor: "var(--color-primary)",
                  "&:hover": { bgcolor: "var(--color-primary-dark)" },
                }}
              >
                {isEditMode ? "Update Package" : "Create Package"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LabPackagePopUp;
