import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CheckOutlinedIcon from "@mui/icons-material/CheckOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import Loader from "../../components/shared/Loader/Loader";
import { updateAvailableLabTestApi } from "../../api/labApis/LabApi";
import type {
  LabTestManagementProps,
  LabTestUpdateItem,
  SelectedTest,
  UpdateLabTestItemRequest,
} from "../../types/labType/LabTestInterfaces";

const LabTestManagement: React.FC<LabTestManagementProps> = ({
  data,
  loading = false,
  actions,
  labId,
  userId,
  onUpdated,
  onAddNewTest,
}) => {
  const { selectedTests, search } = data;
  const { setSearch, setSelectedTests } = actions;
  const [updateLoading, setUpdateLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);
  const [testToDelete, setTestToDelete] = useState<SelectedTest | null>(null);
  const [baselineTests, setBaselineTests] = useState<SelectedTest[]>([]);

  useEffect(() => {
    const currentIds = selectedTests
      .map((test) => String(test.testId))
      .sort()
      .join(",");
    const baselineIds = baselineTests
      .map((test) => String(test.testId))
      .sort()
      .join(",");

    if (currentIds !== baselineIds) {
      setBaselineTests(selectedTests.map((test) => ({ ...test })));
    }
  }, [selectedTests, baselineTests]);

  const categories = useMemo(() => {
    const categoryMap = new Map<
      number,
      {
        categoryId: number;
        category: string;
      }
    >();
    selectedTests.forEach((test) => {
      if (!categoryMap.has(test.categoryId)) {
        categoryMap.set(test.categoryId, {
          categoryId: Number(test.categoryId),
          category: test.category,
        });
      }
    });
    return Array.from(categoryMap.values());
  }, [selectedTests]);

  const currentCategory = categories[activeCategory];

  const filteredTests = useMemo(() => {
    if (!currentCategory) {
      return [];
    }
    const keyword = search.trim().toLowerCase();
    return selectedTests.filter((test) => {
      const matchesCategory =
        Number(test.categoryId) === Number(currentCategory.categoryId);
      const matchesSearch =
        !keyword ||
        test.testName.toLowerCase().includes(keyword) ||
        test.code?.toLowerCase().includes(keyword);

      return matchesCategory && matchesSearch;
    });
  }, [selectedTests, currentCategory, search]);

  useEffect(() => {
    if (activeCategory >= categories.length) {
      setActiveCategory(Math.max(0, categories.length - 1));
    }
  }, [categories.length, activeCategory]);

  const handlePriceChange = (testId: string, value: string) => {
    if (value !== "" && !/^\d*\.?\d{0,2}$/.test(value)) {
      return;
    }
    setSelectedTests((prev) =>
      prev.map((test) => {
        if (String(test.testId) !== String(testId)) {
          return test;
        }
        let priceError = "";
        if (value === "") {
          priceError = "Price is required";
        } else {
          const price = Number(value);
          if (price < 5) {
            priceError = "Minimum price is ₹5";
          } else if (price > 10000) {
            priceError = "Maximum price is ₹10,000";
          }
        }
        let discountPriceError = test.discountPriceError;
        if (test.discountPrice !== "" && value !== "") {
          const discountPrice = Number(test.discountPrice);
          if (discountPrice !== 0 && discountPrice < 5) {
            discountPriceError = "Minimum discount price is ₹5";
          } else if (discountPrice > 10000) {
            discountPriceError = "Maximum discount price is ₹10,000";
          } else if (discountPrice > Number(value)) {
            discountPriceError = "Discount price cannot exceed test price";
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
    setSelectedTests((prev) =>
      prev.map((test) => {
        if (String(test.testId) !== String(testId)) {
          return test;
        }
        let discountPriceError = "";
        if (value === "" || Number(value) === 0) {
          discountPriceError = "";
        } else {
          const discountPrice = Number(value);
          if (discountPrice < 5) {
            discountPriceError = "Minimum discount price is ₹5";
          } else if (discountPrice > 10000) {
            discountPriceError = "Maximum discount price is ₹10,000";
          } else if (discountPrice > Number(test.price)) {
            discountPriceError = "Discount price cannot exceed test price";
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

  const handleDeleteTest = (testId: string) => {
    const test = selectedTests.find(
      (item) => String(item.testId) === String(testId),
    );
    if (test) {
      setTestToDelete(test);
    }
  };

  const getErrorMessage = (error: any, fallback: string) =>
    error?.response?.data?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    fallback;

  const submitLabTestChange = async (
    operationType: "U" | "D",
    testsToSubmit: SelectedTest[],
  ): Promise<boolean> => {
    if (!labId || !userId) {
      toast.error("Lab ID or user ID not found");
      return false;
    }

    if (testsToSubmit.length === 0) {
      toast.error("Please select at least one test");
      return false;
    }

    let payload: UpdateLabTestItemRequest;

    if (operationType === "D") {
      payload = {
        lab_id: Number(labId),
        operation_type: "D",
        tests: testsToSubmit.map((test) => ({
          test_id: Number(test.testId),
        })),
        modified_by: Number(userId),
      };
    } else {
      const tests: LabTestUpdateItem[] = testsToSubmit.map((test) => {
        const price = Number(test.price || 0);
        const discountPrice = Number(test.discountPrice || 0);

        return {
          test_id: Number(test.testId),
          category_id: Number(test.categoryId),
          price,
          discount_price: discountPrice,
          payable_amount: Number((price - discountPrice).toFixed(2)),
        };
      });

      // Client-side validation (mirrors the backend validator)
      for (const t of tests) {
        if (
          [t.test_id, t.category_id, t.price, t.discount_price].some(
            Number.isNaN,
          )
        ) {
          toast.error("Invalid test data");
          return false;
        }
        if (t.price < 5 || t.price > 10000) {
          toast.error("Price must be between 5 and 10000");
          return false;
        }
        if (t.discount_price < 0 || t.discount_price > t.price) {
          toast.error("Discount cannot be negative or exceed the price");
          return false;
        }
      }

      payload = {
        lab_id: Number(labId),
        operation_type: "U",
        tests,
        modified_by: Number(userId),
      };
    }

    try {
      const result: any = await updateAvailableLabTestApi(payload);

      const isSuccess =
        result?.success === true ||
        result?.success === "true" ||
        result?.success === 1 ||
        result?.success === "1";

      if (!isSuccess) {
        toast.error(result?.message || "Failed to update laboratory tests");
        return false;
      }

      toast.success(
        result?.message ||
          (operationType === "U"
            ? "Lab tests updated successfully"
            : "Lab test deleted successfully"),
      );
      return true;
    } catch (error: any) {
      console.error("Lab test change failed:", error);
      toast.error(
        getErrorMessage(
          error,
          operationType === "U"
            ? "Failed to update laboratory tests"
            : "Failed to delete laboratory test",
        ),
      );
      return false;
    }
  };

  const confirmDeleteTest = async () => {
    if (!testToDelete || !labId || !userId) {
      return;
    }

    try {
      setDeleteLoading(true);

      const success = await submitLabTestChange("D", [testToDelete]);
      if (!success) {
        return; // error toast already shown
      }

      const removedId = String(testToDelete.testId);
      setSelectedTests((prev) =>
        prev.filter((test) => String(test.testId) !== removedId),
      );
      setBaselineTests((prev) =>
        prev.filter((test) => String(test.testId) !== removedId),
      );
      setTestToDelete(null);
      setEditingTestId(null);

      await onUpdated();
    } catch (error) {
      // Only reached if onUpdated() or the state updates throw
      console.error("Delete laboratory test failed:", error);
      toast.error("Test deleted, but the list could not be refreshed");
    } finally {
      setDeleteLoading(false);
    }
  };

  const hasUnsavedChanges = useMemo(() => {
    return selectedTests.some((test) => {
      const original = baselineTests.find(
        (item) => String(item.testId) === String(test.testId),
      );
      if (!original) return true;
      return (
        String(original.price ?? "") !== String(test.price ?? "") ||
        String(original.discountPrice ?? "") !==
          String(test.discountPrice ?? "") ||
        Number(original.categoryId) !== Number(test.categoryId) ||
        original.testName !== test.testName
      );
    });
  }, [selectedTests, baselineTests]);

  const handleUpdateTests = async () => {
    try {
      if (!labId) {
        toast.error("Lab ID not found");
        return;
      }
      if (!userId) {
        toast.error("User ID not found");
        return;
      }
      if (selectedTests.length === 0) {
        toast.error("No laboratory tests configured");
        return;
      }
      const dirtyTests = selectedTests.filter((test) => {
        const original = baselineTests.find(
          (item) => String(item.testId) === String(test.testId),
        );
        if (!original) {
          return true;
        }
        return (
          String(original.price ?? "") !== String(test.price ?? "") ||
          String(original.discountPrice ?? "") !==
            String(test.discountPrice ?? "") ||
          Number(original.categoryId) !== Number(test.categoryId) ||
          original.testName !== test.testName
        );
      });
      if (dirtyTests.length === 0) {
        toast.info("No test changes to save");
        setEditingTestId(null);
        return;
      }
      const hasEmptyPrice = dirtyTests.some(
        (test) => !test.price || test.price.trim() === "",
      );
      if (hasEmptyPrice) {
        toast.error("Please enter price for all edited tests");
        return;
      }
      const hasInvalidPrice = dirtyTests.some((test) => {
        const price = Number(test.price);
        return isNaN(price) || price < 5 || price > 10000;
      });
      if (hasInvalidPrice) {
        toast.error("Price for edited tests must be between ₹5 and ₹10,000");
        return;
      }
      const hasInvalidDiscountPrice = dirtyTests.some((test) => {
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
          "Discount Amount for edited tests must be ₹0 or between ₹5 and its test price",
        );
        return;
      }
      setUpdateLoading(true);
      const success = await submitLabTestChange("U", dirtyTests);
      if (!success) {
        return;
      }
      setEditingTestId(null);
      await onUpdated();
      setBaselineTests(selectedTests.map((test) => ({ ...test })));
      setSearch("");
    } catch (error) {
      console.error("Update laboratory tests failed:", error);
      toast.error("Failed to update laboratory tests");
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancelEdits = () => {
    setSelectedTests(baselineTests.map((t) => ({ ...t })));
    setEditingTestId(null);
  };

  if (loading) {
    return <Loader message="Loading laboratory services..." />;
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 md:p-3.5 shadow-xs transition-all">
        {/* ================= HEADER BAR ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Laboratory Tests
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                  <ScienceOutlinedIcon sx={{ fontSize: 14 }} />
                  {selectedTests.length} Tests
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                  {categories.length} Categories
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage test pricing and discounts available in your laboratory.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <SearchIcon
                sx={{ fontSize: 18 }}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search test or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-lg border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <CloseOutlinedIcon sx={{ fontSize: 14 }} />
                </button>
              )}
            </div>

            {/* Add New Test */}
            <button
              type="button"
              onClick={onAddNewTest}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary)] hover:opacity-90 text-white shadow-xs hover:shadow transition-all duration-150 cursor-pointer active:scale-97 whitespace-nowrap"
            >
              <AddOutlinedIcon sx={{ fontSize: 16 }} />
              <span>Add New Test</span>
            </button>
          </div>
        </div>

        {/* ================= CATEGORY FILTER PILLS ================= */}
        {categories.length > 0 ? (
          <>
            <div className="flex items-center gap-1.5 py-2 overflow-x-auto no-scrollbar scroll-smooth">
              {categories.map((category, idx) => {
                const count = selectedTests.filter(
                  (test) =>
                    Number(test.categoryId) === Number(category.categoryId),
                ).length;
                const isActive = activeCategory === idx;

                return (
                  <button
                    key={category.categoryId}
                    type="button"
                    onClick={() => setActiveCategory(idx)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 ${
                      isActive
                        ? "bg-[var(--color-primary)] text-white font-semibold shadow-xs"
                        : "bg-slate-100/90 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/50"
                    }`}
                  >
                    <span>{category.category}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? "bg-[var(--color-primary-dark)] text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* ================= TESTS GRID ================= */}
            <div className="mt-1 max-h-[calc(100vh-250px)] min-h-[300px] overflow-y-auto pr-1">
              {filteredTests.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <SearchIcon sx={{ fontSize: 24 }} />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-700">
                    No tests found
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    No test matches &ldquo;{search}&rdquo; in this category.
                  </p>
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="mt-2 text-xs text-[var(--color-primary)] font-semibold hover:underline"
                    >
                      Clear search
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5">
                  {filteredTests.map((test) => {
                    const isEditing = editingTestId === test.testId;
                    const payable = (
                      Number(test.price || 0) - Number(test.discountPrice || 0)
                    ).toFixed(2);
                    const hasDiscount =
                      test.discountPrice !== "" &&
                      Number(test.discountPrice) > 0;

                    return (
                      <motion.div
                        key={test.testId}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.15 }}
                        className={`bg-white rounded-xl border p-3 flex flex-col justify-between transition-all duration-200 group relative ${
                          isEditing
                            ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20 shadow-sm"
                            : "border-slate-200/90 hover:border-[var(--color-primary)]/40 hover:shadow-xs"
                        }`}
                      >
                        {/* Card Header */}
                        <div>
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex-1 min-w-0 pr-1">
                              <h3
                                className="text-xs sm:text-sm font-semibold text-slate-800 line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors"
                                title={test.testName}
                              >
                                {test.testName}
                              </h3>
                              {test.code && (
                                <span className="inline-block mt-0.5 text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200/50">
                                  {test.code}
                                </span>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-0.5 shrink-0 -mt-1 -mr-1">
                              <Tooltip
                                title={
                                  isEditing ? "Close Edit" : "Edit Pricing"
                                }
                                arrow
                              >
                                <IconButton
                                  size="small"
                                  color={isEditing ? "primary" : "default"}
                                  onClick={() =>
                                    setEditingTestId(
                                      isEditing ? null : test.testId,
                                    )
                                  }
                                >
                                  {isEditing ? (
                                    <CloseOutlinedIcon sx={{ fontSize: 16 }} />
                                  ) : (
                                    <EditOutlinedIcon sx={{ fontSize: 16 }} />
                                  )}
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Delete Test" arrow>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDeleteTest(test.testId)}
                                >
                                  <DeleteOutlineOutlinedIcon
                                    sx={{ fontSize: 16 }}
                                  />
                                </IconButton>
                              </Tooltip>
                            </div>
                          </div>
                        </div>

                        {/* Pricing Details */}
                        <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                          {isEditing ? (
                            <div className="flex flex-col gap-2">
                              {/* Edit Price */}
                              <div>
                                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                                  Test Price
                                </label>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={test.price}
                                  onChange={(e) =>
                                    handlePriceChange(
                                      test.testId,
                                      e.target.value,
                                    )
                                  }
                                  error={Boolean(test.priceError)}
                                  helperText={test.priceError}
                                  sx={{
                                    "& .MuiOutlinedInput-root": {
                                      fontSize: 12,
                                      height: 32,
                                      backgroundColor: "var(--color-bg)",
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
                                          sx={{ mr: 0.5 }}
                                        >
                                          <span className="text-xs text-slate-500 font-semibold">
                                            ₹
                                          </span>
                                        </InputAdornment>
                                      ),
                                    },
                                  }}
                                />
                              </div>

                              {/* Edit Discount */}
                              <div>
                                <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                                  Discount Amount
                                </label>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={test.discountPrice}
                                  onChange={(e) =>
                                    handleDiscountPriceChange(
                                      test.testId,
                                      e.target.value,
                                    )
                                  }
                                  error={Boolean(test.discountPriceError)}
                                  helperText={test.discountPriceError}
                                  sx={{
                                    "& .MuiOutlinedInput-root": {
                                      fontSize: 12,
                                      height: 32,
                                      backgroundColor: "var(--color-bg)",
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
                                          sx={{ mr: 0.5 }}
                                        >
                                          <span className="text-xs text-slate-500 font-semibold">
                                            ₹
                                          </span>
                                        </InputAdornment>
                                      ),
                                    },
                                  }}
                                />
                              </div>

                              <div className="flex items-center justify-between pt-1 text-xs">
                                <span className="text-[11px] text-slate-500 font-medium">
                                  Net Payable:
                                </span>
                                <span className="font-bold text-[var(--color-primary)]">
                                  ₹{payable}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">
                                  Test Price
                                </span>
                                <span className="font-semibold text-slate-700">
                                  ₹{test.price || "0.00"}
                                </span>
                              </div>

                              {hasDiscount && (
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-500">
                                    Discount
                                  </span>
                                  <span className="font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded text-[11px]">
                                    − ₹{test.discountPrice}
                                  </span>
                                </div>
                              )}

                              {/* Payable Banner */}
                              <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-[var(--color-surface)] border border-[var(--color-primary)]/20 mt-1">
                                <span className="text-[11px] font-semibold text-[var(--color-primary-dark)] uppercase tracking-wide">
                                  Payable
                                </span>
                                <span className="text-xs sm:text-sm font-bold text-[var(--color-primary)]">
                                  ₹{payable}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          /* ================= NO TESTS CONFIGURED ================= */
          <div className="py-14 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center text-[var(--color-primary)] mb-3 border border-[var(--color-primary)]/20 shadow-xs">
              <ScienceOutlinedIcon sx={{ fontSize: 30 }} />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              No Laboratory Tests Configured
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              Get started by adding test services from the master catalog to
              make them available in your lab.
            </p>
            <button
              type="button"
              onClick={onAddNewTest}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-primary)] hover:opacity-90 text-white shadow-xs hover:shadow transition-all duration-150 cursor-pointer active:scale-97"
            >
              <AddOutlinedIcon sx={{ fontSize: 16 }} />
              <span>Add Your First Test</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= FLOATING SAVE / REVERT BAR ================= */}
      <AnimatePresence>
        {(editingTestId !== null || hasUnsavedChanges) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-4 right-4 sm:right-8 z-40 bg-white/95 backdrop-blur-md border border-slate-300/80 shadow-xl rounded-xl px-4 py-2.5 flex items-center gap-3 transition-all"
          >
            <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>Unsaved pricing modifications</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdits}
                disabled={updateLoading}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateTests}
                disabled={updateLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary)] hover:opacity-90 text-white shadow-xs hover:shadow transition-all duration-150 cursor-pointer active:scale-97 disabled:opacity-50"
              >
                <CheckOutlinedIcon sx={{ fontSize: 16 }} />
                <span>{updateLoading ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <Dialog
        open={Boolean(testToDelete)}
        onClose={() => setTestToDelete(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogTitle
          sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1 }}
        >
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />
          </div>
          <Typography fontWeight={700} fontSize={16}>
            Delete Test Service
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to remove this test from your laboratory
            catalogue?
          </Typography>
          {testToDelete && (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
              <div className="font-semibold text-xs text-slate-800">
                {testToDelete.testName}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Category: {testToDelete.category} • Price: ₹{testToDelete.price}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => setTestToDelete(null)}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={confirmDeleteTest}
            disabled={deleteLoading}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {deleteLoading ? "Deleting..." : "Delete Test"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default LabTestManagement;
