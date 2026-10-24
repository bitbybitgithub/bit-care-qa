import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
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
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { toast } from "react-toastify";
import { saveAvailableLabApi } from "../../api/labApis/LabApi";
import type {
  LabCategory,
  LabTestItemRequest,
  SelectedTest,
} from "../../types/labType/LabTestInterfaces";

interface LabTestSelectionPopupProps {
  open: boolean;
  onClose: () => void;
  labTests: LabCategory[];
  selectedTests: SelectedTest[];
  labId: number | string;
  userId: number | string;
  doorStepService: boolean;
  onSaved: () => Promise<void>;
}

const LabTestSelectionPopup: React.FC<LabTestSelectionPopupProps> = ({
  open,
  onClose,
  labTests,
  selectedTests,
  labId,
  userId,
  onSaved,
}) => {
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState("");
  const [newSelectedTests, setNewSelectedTests] = useState<SelectedTest[]>([]);
  const [saving, setSaving] = useState(false);
  // Mobile / Tablet Tab Switcher: "categories" | "tests" | "selected"
  const [mobileTab, setMobileTab] = useState<"categories" | "tests" | "selected">("tests");

  useEffect(() => {
    if (open) {
      setNewSelectedTests([]);
      setSearch("");
      setActiveCategory(0);
      setMobileTab("tests");
    }
  }, [open]);

  const availableCategories = useMemo(() => {
    return labTests
      .map((category) => {
        const availableTests = category.tests.filter(
          (test) =>
            !selectedTests.some(
              (selected) => String(selected.testId) === String(test.id),
            ),
        );

        return {
          ...category,
          tests: availableTests,
        };
      })
      .filter((category) => category.tests.length > 0);
  }, [labTests, selectedTests]);

  const currentCategory = availableCategories[activeCategory];

  const filteredTests = useMemo(() => {
    if (!currentCategory) {
      return [];
    }
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return currentCategory.tests;
    }
    return currentCategory.tests.filter(
      (test) =>
        test.name.toLowerCase().includes(keyword) ||
        test.code?.toLowerCase().includes(keyword),
    );
  }, [currentCategory, search]);

  useEffect(() => {
    if (availableCategories.length === 0) {
      setActiveCategory(0);
      return;
    }
    if (activeCategory >= availableCategories.length) {
      setActiveCategory(availableCategories.length - 1);
    }
  }, [availableCategories, activeCategory]);

  const isSelected = (testId: string) => {
    return newSelectedTests.some(
      (test) => String(test.testId) === String(testId),
    );
  };

  const handleToggle = (category: LabCategory, test: any, checked: boolean) => {
    if (checked) {
      setNewSelectedTests((prev) => {
        const alreadyExists = prev.some(
          (item) => String(item.testId) === String(test.id),
        );
        if (alreadyExists) {
          return prev;
        }
        return [
          ...prev,
          {
            category: category.category,
            categoryId: test.categoryId,
            testId: test.id,
            testName: test.name,
            code: test.code,
            price: "",
            priceError: "",
            discountPrice: "",
            discountPriceError: "",
          },
        ];
      });
    } else {
      setNewSelectedTests((prev) =>
        prev.filter((item) => String(item.testId) !== String(test.id)),
      );
    }
  };

  const isCategoryChecked = (category?: LabCategory) => {
    if (!category || category.tests.length === 0) {
      return false;
    }
    return category.tests.every((test) =>
      newSelectedTests.some(
        (selected) => String(selected.testId) === String(test.id),
      ),
    );
  };

  const isCategoryIndeterminate = (category?: LabCategory) => {
    if (!category || category.tests.length === 0) return false;
    const hasSome = category.tests.some((test) =>
      newSelectedTests.some(
        (selected) => String(selected.testId) === String(test.id),
      ),
    );
    return hasSome && !isCategoryChecked(category);
  };

  const handleSelectAll = (category: LabCategory, checked: boolean) => {
    if (checked) {
      setNewSelectedTests((prev) => {
        const existingIds = new Set(prev.map((test) => String(test.testId)));

        const newTests = category.tests
          .filter((test) => !existingIds.has(String(test.id)))
          .map((test) => ({
            category: category.category,
            categoryId: test.categoryId,
            testId: test.id,
            testName: test.name,
            code: test.code,
            price: "",
            priceError: "",
            discountPrice: "",
            discountPriceError: "",
          }));

        return [...prev, ...newTests];
      });
    } else {
      const categoryIds = new Set(
        category.tests.map((test) => String(test.id)),
      );

      setNewSelectedTests((prev) =>
        prev.filter((test) => !categoryIds.has(String(test.testId))),
      );
    }
  };

  const handlePriceChange = (testId: string, value: string) => {
    if (value !== "" && !/^\d*(\.\d{0,2})?$/.test(value)) {
      return;
    }
    setNewSelectedTests((prev) =>
      prev.map((test) => {
        if (String(test.testId) !== String(testId)) {
          return test;
        }
        let priceError = "";
        if (value === "") {
          priceError = "Price required";
        } else {
          const price = Number(value);
          if (price < 5) {
            priceError = "Min ₹5";
          } else if (price > 10000) {
            priceError = "Max ₹10,000";
          }
        }
        let discountPriceError = test.discountPriceError;
        if (test.discountPrice !== "" && value !== "") {
          const discountPrice = Number(test.discountPrice);
          if (discountPrice !== 0 && discountPrice < 5) {
            discountPriceError = "Min ₹5";
          } else if (discountPrice > 10000) {
            discountPriceError = "Max ₹10,000";
          } else if (discountPrice > Number(value)) {
            discountPriceError = "Exceeds price";
          } else {
            discountPriceError = "";
          }
        }
        return {
          ...test,
          price: value,
          priceError,
          discountPriceError,
        };
      }),
    );
  };

  const handleDiscountPriceChange = (testId: string, value: string) => {
    if (value !== "" && !/^\d*(\.\d{0,2})?$/.test(value)) {
      return;
    }
    setNewSelectedTests((prev) =>
      prev.map((test) => {
        if (String(test.testId) !== String(testId)) {
          return test;
        }
        let discountPriceError = "";
        if (value === "" || Number(value) === 0) {
          discountPriceError = "";
        } else {
          const discountPrice = Number(value);
          if (discountPrice !== 0 && discountPrice < 5) {
            discountPriceError = "Min ₹5";
          } else if (discountPrice > 10000) {
            discountPriceError = "Max ₹10,000";
          } else if (discountPrice > Number(test.price)) {
            discountPriceError = "Exceeds price";
          }
        }
        return {
          ...test,
          discountPrice: value,
          discountPriceError,
        };
      }),
    );
  };

  const handleSaveNewTests = async () => {
    try {
      if (!labId) {
        toast.error("Lab ID not found");
        return;
      }
      if (!userId) {
        toast.error("User ID not found");
        return;
      }
      if (newSelectedTests.length === 0) {
        toast.error("Please select at least one test");
        return;
      }
      const hasEmptyPrice = newSelectedTests.some(
        (test) => !test.price || test.price.trim() === "",
      );
      if (hasEmptyPrice) {
        toast.error("Please enter price for all selected tests");
        return;
      }
      const hasInvalidPrice = newSelectedTests.some((test) => {
        const price = Number(test.price);
        return isNaN(price) || price < 5 || price > 10000;
      });
      if (hasInvalidPrice) {
        toast.error("Price for every test must be between ₹5 and ₹10,000");
        return;
      }
      const hasInvalidDiscountPrice = newSelectedTests.some((test) => {
        const discountPrice = Number(test.discountPrice);
        return (
          isNaN(discountPrice) ||
          (discountPrice !== 0 && discountPrice < 5) ||
          discountPrice > 10000 ||
          discountPrice > Number(test.price)
        );
      });
      if (hasInvalidDiscountPrice) {
        toast.error(
          "Discount price must be ₹0 or between ₹5 and its test price",
        );
        return;
      }
      const payload: LabTestItemRequest = {
        lab_id: Number(labId),
        tests: newSelectedTests.map((test) => ({
          test_id: Number(test.testId),
          category_id: Number(test.categoryId),
          price: Number(test.price),
          discount_price: Number(test.discountPrice || 0),
          payable_amount: Number(
            (
              Number(test.price) -
              Number(test.discountPrice || 0)
            ).toFixed(2),
          ),
        })),
        created_by: Number(userId),
      };
      setSaving(true);

      console.log("saveAvailableLabApi payload:", payload);
      const response = await saveAvailableLabApi(payload);
      if (
        !response.success ||
        response.success === "false" ||
        response.success === "0"
      ) {
        toast.error(response.message || "Failed to save laboratory tests");
        return;
      }
      toast.success(response.message || "Laboratory tests saved successfully");
      await onSaved();
      setNewSelectedTests([]);
      setSearch("");
      onClose();
    } catch (error) {
      console.error("Save new tests failed:", error);
      toast.error("Failed to save new laboratory tests");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
      {/* ================= MAIN TITLE BAR ================= */}
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
            <ScienceOutlinedIcon sx={{ fontSize: 22 }} />
          </div>
          <div>
            <Typography variant="h6" fontWeight={700} fontSize={18}>
              Add New Tests to Catalogue
            </Typography>
            <Typography variant="body2" color="text.secondary" fontSize={13}>
              Select tests from the master catalogue, set pricing, and publish them to your lab menu
            </Typography>
          </div>
        </div>

        <IconButton
          size="medium"
          onClick={onClose}
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
          Categories ({availableCategories.length})
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
          Tests ({filteredTests.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("selected")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            mobileTab === "selected"
              ? "bg-white text-sky-700 shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Selected ({newSelectedTests.length})
        </button>
      </div>

      {/* ================= CONTENT BODY ================= */}
      <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
        {availableCategories.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
              <CheckCircleOutlineIcon sx={{ fontSize: 32 }} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              All Tests Already Added
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mt-1">
              Every test available in the master catalog has already been added to
              your laboratory.
            </p>
          </div>
        ) : (
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
                  {availableCategories.length}
                </span>
              </div>

              {/* Category Items */}
              <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
                {availableCategories.map((category, index) => {
                  const isActive = activeCategory === index;
                  const selectedInThisCategory = newSelectedTests.filter(
                    (item) =>
                      category.tests.some(
                        (t) => String(t.id) === String(item.testId),
                      ),
                  ).length;

                  return (
                    <button
                      key={category.category}
                      type="button"
                      onClick={() => {
                        setActiveCategory(index);
                        if (window.innerWidth < 768) setMobileTab("tests");
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all flex items-center justify-between gap-2 cursor-pointer ${
                        isActive
                          ? "bg-white text-sky-800 shadow-xs border border-sky-300 font-semibold"
                          : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900 border border-transparent"
                      }`}
                    >
                      <div className="truncate flex-1">
                        <div className="text-sm font-semibold truncate leading-tight">
                          {category.category}
                        </div>
                        <div className="text-xs text-slate-400 font-normal mt-0.5">
                          {category.tests.length} available tests
                        </div>
                      </div>

                      {selectedInThisCategory > 0 ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 shrink-0">
                          {selectedInThisCategory}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-full shrink-0">
                          {category.tests.length}
                        </span>
                      )}
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
                    {currentCategory?.category}
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full shrink-0">
                    {filteredTests.length} tests available
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
                        checked={isCategoryChecked(currentCategory)}
                        indeterminate={isCategoryIndeterminate(currentCategory)}
                        onChange={(e) =>
                          handleSelectAll(currentCategory, e.target.checked)
                        }
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

              {/* Tests List */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-slate-50/30">
                {filteredTests.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center">
                    <SearchIcon sx={{ fontSize: 32, mb: 1, color: "var(--color-disabled)" }} />
                    <div className="font-semibold text-slate-600">No tests found</div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      No tests match your search query in this category.
                    </div>
                  </div>
                ) : (
                  filteredTests.map((test) => {
                    const checked = isSelected(test.id);
                    const selected = newSelectedTests.find(
                      (item) => String(item.testId) === String(test.id),
                    );
                    const payable =
                      selected && selected.price
                        ? (
                            Number(selected.price) -
                            Number(selected.discountPrice || 0)
                          ).toFixed(2)
                        : null;

                    return (
                      <div
                        key={test.id}
                        className={`p-3 rounded-xl border transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${
                          checked
                            ? "bg-sky-50/90 border-sky-400 shadow-xs ring-1 ring-sky-200"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        {/* Left: Checkbox + Name + Code */}
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Checkbox
                            checked={checked}
                            onChange={(e) =>
                              handleToggle(
                                currentCategory,
                                test,
                                e.target.checked,
                              )
                            }
                            sx={{ p: 0 }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm sm:text-[15px] font-semibold text-slate-800 truncate">
                              {test.name}
                            </div>
                            {test.code && (
                              <span className="inline-block mt-0.5 text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                                {test.code}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Inputs when checked OR prompt when unselected */}
                        {selected ? (
                          <div className="flex items-center gap-2 shrink-0 self-end lg:self-center pl-8 lg:pl-0">
                            {/* Price */}
                            <div className="flex flex-col">
                              <label className="text-[11px] font-semibold text-slate-600 mb-0.5">
                                Price *
                              </label>
                              <TextField
                                size="small"
                                value={selected.price}
                                placeholder="e.g. 500"
                                error={Boolean(selected.priceError)}
                                helperText={selected.priceError}
                                onChange={(e) =>
                                  handlePriceChange(
                                    selected.testId,
                                    e.target.value,
                                  )
                                }
                                sx={{
                                  width: 110,
                                  "& .MuiOutlinedInput-root": {
                                    fontSize: 13,
                                    height: 36,
                                    backgroundColor: "var(--color-bg)",
                                    borderRadius: 1.5,
                                  },
                                  "& .MuiFormHelperText-root": {
                                    fontSize: 10,
                                    marginLeft: 0,
                                    marginTop: 0.25,
                                  },
                                }}
                                slotProps={{
                                  input: {
                                    startAdornment: (
                                      <InputAdornment
                                        position="start"
                                        sx={{ mr: 0.25 }}
                                      >
                                        <span className="text-xs font-bold text-slate-500">
                                          ₹
                                        </span>
                                      </InputAdornment>
                                    ),
                                  },
                                }}
                              />
                            </div>

                            <span className="text-base text-slate-400 font-bold self-center mt-3">
                              −
                            </span>

                            {/* Discount */}
                            <div className="flex flex-col">
                              <label className="text-[11px] font-semibold text-slate-600 mb-0.5">
                                Discount
                              </label>
                              <TextField
                                size="small"
                                value={selected.discountPrice}
                                placeholder="e.g. 50"
                                error={Boolean(selected.discountPriceError)}
                                helperText={selected.discountPriceError}
                                onChange={(e) =>
                                  handleDiscountPriceChange(
                                    selected.testId,
                                    e.target.value,
                                  )
                                }
                                sx={{
                                  width: 110,
                                  "& .MuiOutlinedInput-root": {
                                    fontSize: 13,
                                    height: 36,
                                    backgroundColor: "var(--color-bg)",
                                    borderRadius: 1.5,
                                  },
                                  "& .MuiFormHelperText-root": {
                                    fontSize: 10,
                                    marginLeft: 0,
                                    marginTop: 0.25,
                                  },
                                }}
                                slotProps={{
                                  input: {
                                    startAdornment: (
                                      <InputAdornment
                                        position="start"
                                        sx={{ mr: 0.25 }}
                                      >
                                        <span className="text-xs font-bold text-slate-500">
                                          ₹
                                        </span>
                                      </InputAdornment>
                                    ),
                                  },
                                }}
                              />
                            </div>

                            {/* Net Payable Badge */}
                            <div className="flex flex-col items-end self-center mt-3 ml-1">
                              <span className="text-xs sm:text-sm font-bold px-2.5 py-1.5 rounded-lg bg-sky-100 text-sky-800 whitespace-nowrap border border-sky-200/80">
                                = ₹{payable !== null ? payable : "0.00"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="hidden lg:block text-right">
                            <span className="text-xs text-slate-400 font-medium">
                              Click checkbox to set test price
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ================= COLUMN 3: SELECTED TESTS QUEUE ================= */}
            <div
              className={`w-full md:w-80 lg:w-88 shrink-0 bg-white flex-col h-full overflow-hidden ${
                mobileTab === "selected" ? "flex" : "hidden md:flex"
              }`}
            >
              {/* Synchronized Header: Height 56px */}
              <div className="h-14 px-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
                <span className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                  Selected Tests
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800">
                  {newSelectedTests.length} Ready
                </span>
              </div>

              {/* Scrollable Selected Tests Cards */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-slate-50/40">
                {newSelectedTests.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                      <ScienceOutlinedIcon sx={{ fontSize: 24, color: "var(--color-disabled)" }} />
                    </div>
                    <div className="text-sm font-semibold text-slate-600">
                      No tests selected
                    </div>
                    <div className="text-xs text-slate-400 max-w-xs mt-1">
                      Check tests from the catalog to configure prices and add them to your laboratory menu.
                    </div>
                  </div>
                ) : (
                  newSelectedTests.map((test) => (
                    <div
                      key={test.testId}
                      className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-800 truncate">
                            {test.testName}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {test.code ? `${test.code} • ` : ""}{test.category}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setNewSelectedTests((prev) =>
                              prev.filter(
                                (item) =>
                                  String(item.testId) !== String(test.testId),
                              ),
                            )
                          }
                          className="text-slate-400 hover:text-red-500 p-1 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <CloseOutlinedIcon sx={{ fontSize: 16 }} />
                        </button>
                      </div>

                      <Divider sx={{ my: 0.5 }} />

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Test Price:</span>
                        <span className="font-semibold text-slate-700">
                          {test.price ? `₹${test.price}` : "—"}
                        </span>
                      </div>

                      {Number(test.discountPrice || 0) > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Discount Amount:</span>
                          <span className="font-semibold text-emerald-600">
                            − ₹{test.discountPrice}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="font-bold text-sky-900 uppercase tracking-wide">
                          Payable Amount:
                        </span>
                        <span className="text-sm font-bold text-sky-700">
                          {test.price
                            ? `₹${(
                                Number(test.price) -
                                Number(test.discountPrice || 0)
                              ).toFixed(2)}`
                            : "—"}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>

      {/* ================= FOOTER ================= */}
      <Divider />
      <DialogActions sx={{ px: 3, py: 2, bgcolor: "var(--color-bg)" }}>
        <Button
          size="medium"
          variant="outlined"
          onClick={onClose}
          sx={{ textTransform: "none", borderRadius: 2, px: 3, fontSize: 14, fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Button
          size="medium"
          variant="contained"
          onClick={handleSaveNewTests}
          disabled={
            saving ||
            newSelectedTests.length === 0 ||
            newSelectedTests.some(
              (test) =>
                !test.price ||
                Boolean(test.priceError) ||
                Boolean(test.discountPriceError),
            )
          }
          sx={{
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            fontSize: 14,
            fontWeight: 600,
            bgcolor: "var(--color-primary)",
            "&:hover": { bgcolor: "var(--color-primary-dark)" },
          }}
        >
          {saving
            ? "Saving..."
            : newSelectedTests.length > 0
              ? `Confirm & Add (${newSelectedTests.length})`
              : "Confirm & Add"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LabTestSelectionPopup;
