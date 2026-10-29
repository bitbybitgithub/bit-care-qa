import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Checkbox,
  CircularProgress,
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
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { toast } from "react-toastify";
import {
  getLabPackageListApi,
  getLabTestListApi,
  saveAvailableLabApi,
} from "../../api/labApis/LabApi";
import type {
  LabCategory,
  LabTestItemRequest,
  LabWalkInPackage,
  LabWalkInTest,
  SelectedTest,
} from "../../types/labType/LabTestInterfaces";

const EMPTY_WALKIN_TESTS: LabWalkInTest[] = [];
const EMPTY_WALKIN_PACKAGES: LabWalkInPackage[] = [];

export type LabTestSelectionMode =
  | "service-management"
  | "walkin"
  | "processing"
  | "view"
  | "catalog";

export interface LabTestSelectionPopupProps {
  open: boolean;
  onClose: () => void;
  // Catalog / Service Management mode
  labTests?: LabCategory[];
  selectedTests?: SelectedTest[];
  labId: number | string;
  userId?: number | string;
  doorStepService?: boolean;
  onSaved?: () => Promise<void>;
  // Mode: service-management | walkin | processing | view
  mode?: LabTestSelectionMode;
  readOnlyPricing?: boolean;
  patientName?: string;
  selectedWalkInTests?: LabWalkInTest[];
  selectedWalkInPackages?: LabWalkInPackage[];
  onConfirmSelection?: (
    tests: LabWalkInTest[],
    packages: LabWalkInPackage[],
  ) => void | Promise<void>;
}

const LabTestSelectionPopup: React.FC<LabTestSelectionPopupProps> = ({
  open,
  onClose,
  labTests = [],
  selectedTests = [],
  labId,
  userId,
  onSaved,
  mode = "service-management",
  readOnlyPricing,
  patientName,
  selectedWalkInTests = EMPTY_WALKIN_TESTS,
  selectedWalkInPackages = EMPTY_WALKIN_PACKAGES,
  onConfirmSelection,
}) => {
  const isServiceManagement =
    mode === "service-management" || mode === "catalog" || !mode;
  const isWalkIn = mode === "walkin";
  const isProcessing = mode === "processing";
  const isView = mode === "view";
  const isSelectionMode = isWalkIn || isProcessing || isView;
  const isReadOnlyPricing =
    readOnlyPricing ?? (isWalkIn || isProcessing || isView);

  // Active top tab in walk-in mode: "tests" | "packages"
  const [activeTab, setActiveTab] = useState<"tests" | "packages">("tests");
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // Walk-In specific data fetched from APIs
  const [walkInCategories, setWalkInCategories] = useState<LabCategory[]>([]);
  const [walkInPackages, setWalkInPackages] = useState<LabWalkInPackage[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Selection states
  const [newSelectedTests, setNewSelectedTests] = useState<SelectedTest[]>([]);
  const [newSelectedPackages, setNewSelectedPackages] = useState<
    LabWalkInPackage[]
  >([]);

  // Mobile / Tablet Tab Switcher: "categories" | "tests" | "selected"
  const [mobileTab, setMobileTab] = useState<
    "categories" | "tests" | "selected"
  >("tests");

  // Load catalog data when opening in walk-in, processing, view, or service-management mode
  useEffect(() => {
    if (!open || !labId) return;

    let cancelled = false;
    const fetchWalkInData = async () => {
      setDataLoading(!isServiceManagement);
      try {
        const [testsRes, packagesRes] = await Promise.all([
          !isServiceManagement
            ? getLabTestListApi(Number(labId))
            : Promise.resolve(null),
          getLabPackageListApi(Number(labId)),
        ]);
        if (cancelled) return;

        // Group tests into LabCategory[] if loaded
        const rawTests =
          testsRes && Array.isArray((testsRes as any)?.data)
            ? (testsRes as any).data
            : [];

        if (rawTests.length > 0) {
          const grouped: Record<string, any[]> = {};
          rawTests.forEach((t: any) => {
            const catName = t.category_name?.trim() || "General Laboratory";
            if (!grouped[catName]) grouped[catName] = [];
            grouped[catName].push(t);
          });

          const formattedCategories: LabCategory[] = Object.entries(
            grouped,
          ).map(([categoryName, items]) => ({
            category: categoryName,
            tests: items.map((test: any) => ({
              id: String(test.test_id),
              name: test.test_name,
              categoryId: Number(test.category_id || 0),
              tatHours: Number(test.tat_hours || 0),
              homeService: test.home_service === "1",
              description: test.test_description,
              code: test.test_code || "",
              price:
                test.price !== null && test.price !== undefined
                  ? String(test.price)
                  : test.test_price !== null && test.test_price !== undefined
                    ? String(test.test_price)
                    : "",
              discountPrice:
                test.discount_price !== null &&
                test.discount_price !== undefined
                  ? String(test.discount_price)
                  : "",
              payableAmount:
                test.payable_amount !== null &&
                test.payable_amount !== undefined
                  ? String(test.payable_amount)
                  : "",
            })),
          }));

          setWalkInCategories(formattedCategories);

          // Enrich any pre-selected tests with master catalog category_name and price if missing
          setNewSelectedTests((prev) =>
            prev.map((item) => {
              const matched = rawTests.find(
                (rt: any) => String(rt.test_id) === String(item.testId),
              );
              if (!matched) return item;

              const masterCat =
                matched.category_name?.trim() ||
                item.category ||
                "General Laboratory";
              const masterPrice =
                item.price !== ""
                  ? item.price
                  : matched.price != null
                    ? String(matched.price)
                    : matched.test_price != null
                      ? String(matched.test_price)
                      : "0";
              const masterDiscount =
                item.discountPrice !== ""
                  ? item.discountPrice
                  : matched.discount_price != null
                    ? String(matched.discount_price)
                    : "0";
              const masterPayable =
                item.payableAmount !== ""
                  ? item.payableAmount
                  : String(
                      Math.max(0, Number(masterPrice) - Number(masterDiscount)),
                    );

              return {
                ...item,
                category: masterCat,
                categoryId: matched.category_id
                  ? Number(matched.category_id)
                  : item.categoryId,
                code: item.code || matched.test_code || "",
                price: masterPrice,
                discountPrice: masterDiscount,
                payableAmount: masterPayable,
              };
            }),
          );
        }

        // Map packages
        const rawPackages = Array.isArray((packagesRes as any)?.data)
          ? (packagesRes as any).data
          : [];

        const formattedPackages: LabWalkInPackage[] = rawPackages.map(
          (pkg: any) => ({
            package_id: Number(pkg.package_id),
            package_name: pkg.package_name,
            package_code: pkg.package_code,
            package_price: Number(pkg.package_price ?? pkg.packagePrice ?? 0),
            actual_price: Number(pkg.actual_price ?? pkg.actualPrice ?? 0),
            discount_amount: Number(
              pkg.discount_amount ?? pkg.discountAmount ?? 0,
            ),
            total_tests: Number(pkg.total_tests ?? pkg.tests?.length ?? 0),
            category_name: pkg.category_name || pkg.category || undefined,
            tests: Array.isArray(pkg.tests) ? pkg.tests : [],
          }),
        );

        setWalkInPackages(formattedPackages);
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load lab services for selection", err);
          toast.error("Failed to load laboratory catalog");
        }
      } finally {
        if (!cancelled) {
          setDataLoading(false);
        }
      }
    };

    void fetchWalkInData();

    return () => {
      cancelled = true;
    };
  }, [open, isServiceManagement, labId]);

  // Reset or pre-populate state when opening dialog
  useEffect(() => {
    if (!open) return;

    setSearch("");
    setActiveCategory(0);
    setMobileTab("tests");

    if (isSelectionMode) {
      // Pre-populate with existing walk-in / queue selections
      const initialTests: SelectedTest[] = selectedWalkInTests.map((t) => {
        const price = String(t.price ?? "");
        const discount =
          t.discount_price != null ? String(t.discount_price) : "";
        const payable =
          t.payable_amount != null
            ? String(t.payable_amount)
            : String(Math.max(0, Number(price || 0) - Number(discount || 0)));

        return {
          category: t.category_name || "General Laboratory",
          categoryId: t.category_id,
          testId: String(t.test_id),
          testName: t.test_name,
          code: t.test_code || "",
          price,
          priceError: "",
          discountPrice: discount,
          discountPriceError: "",
          payableAmount: payable,
        };
      });

      const initialPackages: LabWalkInPackage[] = selectedWalkInPackages.map(
        (p) => ({ ...p }),
      );

      setNewSelectedTests(initialTests);
      setNewSelectedPackages(initialPackages);

      if (initialPackages.length > 0 && initialTests.length === 0) {
        setActiveTab("packages");
      } else {
        setActiveTab("tests");
      }
    } else {
      // service-management mode
      setNewSelectedTests([]);
      setNewSelectedPackages([]);
      setActiveTab("tests");
    }
  }, [open, mode]);

  // Categories source
  const sourceCategories = isServiceManagement
    ? labTests && labTests.length > 0
      ? labTests
      : walkInCategories
    : walkInCategories;

  // Available categories
  const availableCategories = useMemo(() => {
    if (isView) {
      // In view mode:
      // Show ONLY categories that have at least one selected test.
      // Left categories list must contain only categories with at least one selected test,
      // with counts based on selected tests only.
      // The middle panel lists only the selected tests of the active category.
      const catMap = new Map<string, { category: string; tests: any[] }>();

      newSelectedTests.forEach((st) => {
        const catName = st.category?.trim() || "General Laboratory";
        if (!catMap.has(catName)) {
          catMap.set(catName, { category: catName, tests: [] });
        }
        catMap.get(catName)!.tests.push({
          id: String(st.testId),
          name: st.testName,
          categoryId: st.categoryId,
          code: st.code || "",
          price: st.price,
          discountPrice: st.discountPrice,
          payableAmount: st.payableAmount,
        });
      });

      return Array.from(catMap.values());
    }

    if (isWalkIn || isProcessing) {
      return sourceCategories.filter((cat) => cat.tests.length > 0);
    }

    // Default: service-management (catalog)
    return sourceCategories
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
  }, [
    isView,
    isWalkIn,
    isProcessing,
    sourceCategories,
    selectedTests,
    newSelectedTests,
  ]);

  const currentCategory = availableCategories[activeCategory];

  // Filtered tests in active category
  const filteredTests = useMemo(() => {
    if (!currentCategory) return [];
    const keyword = search.trim().toLowerCase();
    if (!keyword) return currentCategory.tests;
    return currentCategory.tests.filter(
      (test) =>
        test.name.toLowerCase().includes(keyword) ||
        test.code?.toLowerCase().includes(keyword),
    );
  }, [currentCategory, search]);

  // Filtered packages
  const filteredPackages = useMemo(() => {
    const basePackages = isView ? newSelectedPackages : walkInPackages;
    const keyword = search.trim().toLowerCase();
    if (!keyword) return basePackages;
    return basePackages.filter(
      (pkg) =>
        pkg.package_name.toLowerCase().includes(keyword) ||
        pkg.package_code?.toLowerCase().includes(keyword),
    );
  }, [search, walkInPackages, newSelectedPackages, isView]);

  useEffect(() => {
    if (availableCategories.length === 0) {
      setActiveCategory(0);
      return;
    }
    if (activeCategory >= availableCategories.length) {
      setActiveCategory(availableCategories.length - 1);
    }
  }, [availableCategories, activeCategory]);

  const isTestSelected = (testId: string) => {
    return newSelectedTests.some(
      (test) => String(test.testId) === String(testId),
    );
  };

  const isPackageSelected = (packageId: number) => {
    return newSelectedPackages.some((pkg) => pkg.package_id === packageId);
  };

  // Toggle Test Checkbox
  const handleToggleTest = (
    category: LabCategory,
    test: any,
    checked: boolean,
  ) => {
    if (isView) return;

    if (checked) {
      // In walk-in / processing registration, tests and packages are mutually exclusive
      if (isSelectionMode && newSelectedPackages.length > 0) {
        setNewSelectedPackages([]);
      }

      setNewSelectedTests((prev) => {
        const alreadyExists = prev.some(
          (item) => String(item.testId) === String(test.id),
        );
        if (alreadyExists) return prev;

        const defaultPrice = isServiceManagement
          ? test.price
            ? String(test.price)
            : ""
          : test.price !== undefined && test.price !== ""
            ? String(test.price)
            : test.test_price !== undefined && test.test_price !== ""
              ? String(test.test_price)
              : "0";
        const defaultDiscount = isServiceManagement
          ? test.discountPrice
            ? String(test.discountPrice)
            : ""
          : test.discountPrice !== undefined && test.discountPrice !== ""
            ? String(test.discountPrice)
            : test.discount_price !== undefined && test.discount_price !== ""
              ? String(test.discount_price)
              : "0";
        const defaultPayable =
          defaultPrice !== ""
            ? String(
                Math.max(
                  0,
                  Number(defaultPrice || 0) - Number(defaultDiscount || 0),
                ),
              )
            : "";

        return [
          ...prev,
          {
            category: category.category,
            categoryId: test.categoryId,
            testId: String(test.id),
            testName: test.name,
            code: test.code || "",
            price: defaultPrice,
            priceError: "",
            discountPrice: defaultDiscount,
            discountPriceError: "",
            payableAmount: defaultPayable,
          },
        ];
      });
    } else {
      setNewSelectedTests((prev) =>
        prev.filter((item) => String(item.testId) !== String(test.id)),
      );
    }
  };

  // Toggle Package Checkbox
  const handleTogglePackage = (pkg: LabWalkInPackage, checked: boolean) => {
    if (isView) return;

    if (checked) {
      // In walk-in / processing registration, selecting a package clears individual tests
      setNewSelectedTests([]);
      // Select single package (or add package)
      setNewSelectedPackages([pkg]);
    } else {
      setNewSelectedPackages((prev) =>
        prev.filter((p) => p.package_id !== pkg.package_id),
      );
    }
  };

  const isCategoryChecked = (category?: LabCategory) => {
    if (!category || category.tests.length === 0) return false;
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

  const handleSelectAllCategory = (category: LabCategory, checked: boolean) => {
    if (isView) return;

    if (checked) {
      if (isSelectionMode && newSelectedPackages.length > 0) {
        setNewSelectedPackages([]);
      }

      setNewSelectedTests((prev) => {
        const existingIds = new Set(prev.map((test) => String(test.testId)));

        const newTests = category.tests
          .filter((test) => !existingIds.has(String(test.id)))
          .map((test: any) => {
            const defaultPrice = isServiceManagement
              ? test.price
                ? String(test.price)
                : ""
              : test.price !== undefined && test.price !== ""
                ? String(test.price)
                : test.test_price !== undefined && test.test_price !== ""
                  ? String(test.test_price)
                  : "0";
            const defaultDiscount = isServiceManagement
              ? test.discountPrice
                ? String(test.discountPrice)
                : ""
              : test.discountPrice !== undefined && test.discountPrice !== ""
                ? String(test.discountPrice)
                : test.discount_price !== undefined &&
                    test.discount_price !== ""
                  ? String(test.discount_price)
                  : "0";
            const defaultPayable =
              defaultPrice !== ""
                ? String(
                    Math.max(
                      0,
                      Number(defaultPrice || 0) - Number(defaultDiscount || 0),
                    ),
                  )
                : "";

            return {
              category: category.category,
              categoryId: test.categoryId,
              testId: String(test.id),
              testName: test.name,
              code: test.code || "",
              price: defaultPrice,
              priceError: "",
              discountPrice: defaultDiscount,
              discountPriceError: "",
              payableAmount: defaultPayable,
            };
          });

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

  // Price validation and state update
  const handlePriceChange = (testId: string, value: string) => {
    if (value !== "" && !/^\d*(\.\d{0,2})?$/.test(value)) {
      return;
    }
    setNewSelectedTests((prev) =>
      prev.map((test) => {
        if (String(test.testId) !== String(testId)) return test;

        let priceError = "";
        if (value === "") {
          priceError = "Price required";
        } else {
          const price = Number(value);
          if (isNaN(price) || price < 0) {
            priceError = "Price must be non-negative";
          } else if (!isWalkIn && price < 5) {
            priceError = "Min ₹5";
          } else if (!isWalkIn && price > 10000) {
            priceError = "Max ₹10,000";
          }
        }

        let discountPriceError = test.discountPriceError;
        if (test.discountPrice !== "" && value !== "") {
          const discountPrice = Number(test.discountPrice);
          const price = Number(value);
          if (isNaN(discountPrice) || discountPrice < 0) {
            discountPriceError = "Discount must be non-negative";
          } else if (discountPrice > price) {
            discountPriceError = "Exceeds price";
          } else {
            discountPriceError = "";
          }
        }

        const payable =
          value !== ""
            ? String(
                Math.max(
                  0,
                  Number(value || 0) - Number(test.discountPrice || 0),
                ),
              )
            : "";

        return {
          ...test,
          price: value,
          priceError,
          discountPriceError,
          payableAmount: payable,
        };
      }),
    );
  };

  // Discount validation and state update
  const handleDiscountPriceChange = (testId: string, value: string) => {
    if (value !== "" && !/^\d*(\.\d{0,2})?$/.test(value)) {
      return;
    }
    setNewSelectedTests((prev) =>
      prev.map((test) => {
        if (String(test.testId) !== String(testId)) return test;

        let discountPriceError = "";
        if (value !== "" && Number(value) !== 0) {
          const discountPrice = Number(value);
          const price = Number(test.price || 0);
          if (isNaN(discountPrice) || discountPrice < 0) {
            discountPriceError = "Discount must be non-negative";
          } else if (discountPrice > price) {
            discountPriceError = "Exceeds price";
          }
        }

        const payable =
          test.price !== ""
            ? String(Math.max(0, Number(test.price || 0) - Number(value || 0)))
            : "";

        return {
          ...test,
          discountPrice: value,
          discountPriceError,
          payableAmount: payable,
        };
      }),
    );
  };

  // Confirm / Save Handler
  const handleConfirmOrSave = async () => {
    if (isView) {
      onClose();
      return;
    }

    // 1. Walk-In or Processing mode confirmation
    if (isWalkIn || isProcessing) {
      if (activeTab === "packages" || newSelectedPackages.length > 0) {
        if (newSelectedPackages.length === 0) {
          toast.error("Please select a package or choose tests");
          return;
        }
        try {
          setSaving(true);
          await onConfirmSelection?.([], [...newSelectedPackages]);
          onClose();
        } catch (err) {
          console.error("Selection confirm error:", err);
        } finally {
          setSaving(false);
        }
        return;
      }

      if (newSelectedTests.length === 0) {
        toast.error(
          "Please select at least one test. An appointment cannot have zero tests.",
        );
        return;
      }

      // In processing mode: check for duplicate IDs and unchanged list
      if (isProcessing) {
        const idSet = new Set<string>();
        for (const t of newSelectedTests) {
          if (idSet.has(String(t.testId))) {
            toast.error("Duplicate test IDs are not allowed");
            return;
          }
          idSet.add(String(t.testId));
        }

        const initialIds = (selectedWalkInTests || [])
          .map((t) => Number(t.test_id))
          .sort((a, b) => a - b);
        const currentIds = newSelectedTests
          .map((t) => Number(t.testId))
          .sort((a, b) => a - b);

        const isUnchanged =
          initialIds.length === currentIds.length &&
          initialIds.every((id, idx) => id === currentIds[idx]);

        if (isUnchanged) {
          toast.info("No changes were made to the patient's tests.");
          return;
        }
      }

      // Check for price errors (for walk-in or manual entry)
      if (!isProcessing) {
        const hasEmptyPrice = newSelectedTests.some(
          (test) => !test.price || test.price.trim() === "",
        );
        if (hasEmptyPrice) {
          toast.error("Please enter a valid price for all selected tests");
          return;
        }

        const hasInvalidPrice = newSelectedTests.some((test) => {
          const price = Number(test.price);
          return isNaN(price) || price < 0;
        });
        if (hasInvalidPrice) {
          toast.error("Price must be a valid non-negative number");
          return;
        }

        const hasInvalidDiscount = newSelectedTests.some((test) => {
          const discount = Number(test.discountPrice || 0);
          const price = Number(test.price || 0);
          return isNaN(discount) || discount < 0 || discount > price;
        });
        if (hasInvalidDiscount) {
          toast.error("Discount cannot exceed the test price");
          return;
        }
      }

      const confirmedTests: LabWalkInTest[] = newSelectedTests.map((t) => {
        const price = Number(t.price);
        const discount = Number(t.discountPrice || 0);
        const payable = Math.max(0, price - discount);
        return {
          test_id: Number(t.testId),
          category_id: Number(t.categoryId),
          test_name: t.testName,
          test_code: t.code,
          category_name: t.category,
          price,
          discount_price: discount,
          payable_amount: Number(payable.toFixed(2)),
        };
      });

      try {
        setSaving(true);
        await onConfirmSelection?.(confirmedTests, []);
        onClose();
      } catch (err) {
        console.error("Save processing tests failed:", err);
        // Do not close popup on error so user can adjust selections
      } finally {
        setSaving(false);
      }
      return;
    }

    // 2. Catalog mode save (Service Management)
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
            (Number(test.price) - Number(test.discountPrice || 0)).toFixed(2),
          ),
        })),
        created_by: Number(userId),
      };
      setSaving(true);

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
      await onSaved?.();
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

  const currentSelectionCount =
    isSelectionMode && activeTab === "packages"
      ? newSelectedPackages.length
      : newSelectedTests.length;

  const totalSelectionCount =
    newSelectedTests.length + newSelectedPackages.length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "92vh",
          height: "92vh",
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
          <div className="w-10 h-10 rounded-xl bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center border border-[var(--color-primary)]/20 shadow-2xs">
            {activeTab === "tests" ? (
              <ScienceOutlinedIcon sx={{ fontSize: 22 }} />
            ) : (
              <Inventory2OutlinedIcon sx={{ fontSize: 22 }} />
            )}
          </div>
          <div>
            <Typography variant="h6" fontWeight={700} fontSize={18}>
              {isView
                ? patientName
                  ? `View Details - ${patientName}`
                  : "View Tests & Packages Details"
                : isProcessing
                  ? patientName
                    ? `Manage Tests - ${patientName}`
                    : "Select & Manage Tests"
                  : isWalkIn
                    ? "Select Tests & Packages"
                    : "Add New Tests to Catalogue"}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontSize={13}>
              {isView
                ? "Read-only summary of tests and packages assigned to this patient"
                : isProcessing
                  ? "Select tests by category to update this patient's test order"
                  : isWalkIn
                    ? "Choose laboratory tests or full packages for walk-in patient registration"
                    : "Select tests from the master catalogue, set pricing, and publish them to your lab menu"}
            </Typography>
          </div>
        </div>

        <IconButton
          size="medium"
          onClick={onClose}
          sx={{
            color: "var(--color-disabled)",
            "&:hover": { color: "var(--color-text)" },
          }}
        >
          <CloseIcon sx={{ fontSize: 22 }} />
        </IconButton>
      </DialogTitle>

      {/* ================= TOP SEGMENTED BAR (WALK-IN / QUEUES) ================= */}
      {isSelectionMode && (
        <div className="bg-slate-100/90 border-b border-slate-200 px-4 py-2 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setActiveTab("tests");
                setSearch("");
                setMobileTab("tests");
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "tests"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <ScienceOutlinedIcon sx={{ fontSize: 17 }} />
              <span>Laboratory Tests</span>
              {newSelectedTests.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.2 rounded-full bg-white/20 text-white">
                  {newSelectedTests.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("packages");
                setSearch("");
                setMobileTab("tests");
              }}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === "packages"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
            >
              <Inventory2OutlinedIcon sx={{ fontSize: 17 }} />
              <span>Laboratory Packages</span>
              {newSelectedPackages.length > 0 && (
                <span className="text-xs font-bold px-2 py-0.2 rounded-full bg-white/20 text-white">
                  {newSelectedPackages.length}
                </span>
              )}
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-500">
            <span>
              Selected:{" "}
              <strong className="text-[var(--color-primary)] font-bold">
                {totalSelectionCount}
              </strong>{" "}
              {totalSelectionCount === 1 ? "item" : "items"}
            </span>
          </div>
        </div>
      )}

      {/* ================= MOBILE / TABLET NAVIGATION TABS ================= */}
      <div className="flex md:hidden border-b border-slate-200 bg-slate-50 p-1.5 gap-1 shrink-0">
        {activeTab === "tests" && (
          <button
            type="button"
            onClick={() => setMobileTab("categories")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              mobileTab === "categories"
                ? "bg-white text-[var(--color-primary)] shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Categories ({availableCategories.length})
          </button>
        )}
        <button
          type="button"
          onClick={() => setMobileTab("tests")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            mobileTab === "tests"
              ? "bg-white text-[var(--color-primary)] shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {activeTab === "tests"
            ? `Tests (${filteredTests.length})`
            : `Packages (${filteredPackages.length})`}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab("selected")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
            mobileTab === "selected"
              ? "bg-white text-[var(--color-primary)] shadow-xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Selected ({currentSelectionCount})
        </button>
      </div>

      {/* ================= CONTENT BODY ================= */}
      <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
        {dataLoading ? (
          <div className="h-full flex flex-col items-center justify-center p-8 gap-3">
            <CircularProgress
              size={36}
              sx={{ color: "var(--color-primary)" }}
            />
            <p className="text-sm font-semibold text-slate-700">
              Loading laboratory catalog...
            </p>
          </div>
        ) : activeTab === "tests" ? (
          availableCategories.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 border border-emerald-100">
                <CheckCircleOutlineIcon sx={{ fontSize: 32 }} />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {isWalkIn ? "No Tests Available" : "All Tests Already Added"}
              </h3>
              <p className="text-sm text-slate-500 max-w-sm mt-1">
                {isWalkIn
                  ? "No active tests were found for this laboratory."
                  : "Every test available in the master catalog has already been added to your laboratory."}
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
                <div className="h-14 px-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
                  <span className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                    Categories
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {availableCategories.length}
                  </span>
                </div>

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
                            ? "bg-white text-[var(--color-primary)] shadow-xs border border-[var(--color-primary)]/30 font-semibold"
                            : "text-slate-700 hover:bg-slate-200/70 hover:text-slate-900 border border-transparent"
                        }`}
                      >
                        <div className="truncate flex-1">
                          <div className="text-sm font-semibold truncate leading-tight">
                            {category.category}
                          </div>
                          <div className="text-xs text-slate-400 font-normal mt-0.5">
                            {isView
                              ? `${category.tests.length} ${category.tests.length === 1 ? "test" : "tests"}`
                              : `${category.tests.length} available tests`}
                          </div>
                        </div>

                        {isView || selectedInThisCategory > 0 ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)] shrink-0">
                            {isView
                              ? category.tests.length
                              : selectedInThisCategory}
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
                    <div className="relative w-44 sm:w-56">
                      <SearchIcon
                        sx={{ fontSize: 18 }}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />
                      <input
                        type="text"
                        placeholder="Search test name or code..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-white hover:bg-slate-50 focus:bg-white rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                      />
                    </div>

                    {!isView && (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isCategoryChecked(currentCategory)}
                            indeterminate={isCategoryIndeterminate(
                              currentCategory,
                            )}
                            onChange={(e) =>
                              handleSelectAllCategory(
                                currentCategory,
                                e.target.checked,
                              )
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
                    )}
                  </div>
                </div>

                {/* Tests List */}
                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-slate-50/30">
                  {filteredTests.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center">
                      <SearchIcon
                        sx={{
                          fontSize: 32,
                          mb: 1,
                          color: "var(--color-disabled)",
                        }}
                      />
                      <div className="font-semibold text-slate-600">
                        No tests found
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        No tests match your search query in this category.
                      </div>
                    </div>
                  ) : (
                    filteredTests.map((test) => {
                      const checked = isTestSelected(test.id);
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
                              ? "bg-[var(--color-surface)]/90 border-[var(--color-primary)] shadow-xs ring-1 ring-[var(--color-primary-light)]/50"
                              : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                          }`}
                        >
                          {/* Left: Checkbox / Badge + Name + Code */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {isView ? (
                              <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center shrink-0 border border-[var(--color-primary)]/20">
                                <ScienceOutlinedIcon sx={{ fontSize: 18 }} />
                              </div>
                            ) : (
                              <Checkbox
                                checked={checked}
                                onChange={(e) =>
                                  handleToggleTest(
                                    currentCategory,
                                    test,
                                    e.target.checked,
                                  )
                                }
                                sx={{ p: 0 }}
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm sm:text-[15px] font-semibold text-slate-800 truncate">
                                {test.name}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                {test.code && (
                                  <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                                    {test.code}
                                  </span>
                                )}
                                {currentCategory?.category && (
                                  <span className="text-[11px] font-medium text-slate-400">
                                    {currentCategory.category}
                                  </span>
                                )}
                              </div>
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
                                  disabled={isReadOnlyPricing}
                                  error={
                                    !isReadOnlyPricing &&
                                    Boolean(selected.priceError)
                                  }
                                  helperText={
                                    !isReadOnlyPricing
                                      ? selected.priceError
                                      : undefined
                                  }
                                  onChange={(e) =>
                                    !isReadOnlyPricing &&
                                    handlePriceChange(
                                      selected.testId,
                                      e.target.value,
                                    )
                                  }
                                  sx={{
                                    width: 105,
                                    "& .MuiOutlinedInput-root": {
                                      fontSize: 13,
                                      height: 36,
                                      backgroundColor: isReadOnlyPricing
                                        ? "var(--color-surface-alt, #f8fafc)"
                                        : "var(--color-bg)",
                                      borderRadius: 1.5,
                                    },
                                    "& .MuiInputBase-input.Mui-disabled": {
                                      WebkitTextFillColor:
                                        "var(--color-text, #1e293b)",
                                      cursor: "default",
                                    },
                                    "& .MuiFormHelperText-root": {
                                      fontSize: 10,
                                      marginLeft: 0,
                                      marginTop: 0.25,
                                    },
                                  }}
                                  slotProps={{
                                    input: {
                                      readOnly: isReadOnlyPricing,
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
                                  value={
                                    selected.discountPrice ||
                                    (isReadOnlyPricing ? "0" : "")
                                  }
                                  placeholder="e.g. 50"
                                  disabled={isReadOnlyPricing}
                                  error={
                                    !isReadOnlyPricing &&
                                    Boolean(selected.discountPriceError)
                                  }
                                  helperText={
                                    !isReadOnlyPricing
                                      ? selected.discountPriceError
                                      : undefined
                                  }
                                  onChange={(e) =>
                                    !isReadOnlyPricing &&
                                    handleDiscountPriceChange(
                                      selected.testId,
                                      e.target.value,
                                    )
                                  }
                                  sx={{
                                    width: 105,
                                    "& .MuiOutlinedInput-root": {
                                      fontSize: 13,
                                      height: 36,
                                      backgroundColor: isReadOnlyPricing
                                        ? "var(--color-surface-alt, #f8fafc)"
                                        : "var(--color-bg)",
                                      borderRadius: 1.5,
                                    },
                                    "& .MuiInputBase-input.Mui-disabled": {
                                      WebkitTextFillColor:
                                        "var(--color-text, #1e293b)",
                                      cursor: "default",
                                    },
                                    "& .MuiFormHelperText-root": {
                                      fontSize: 10,
                                      marginLeft: 0,
                                      marginTop: 0.25,
                                    },
                                  }}
                                  slotProps={{
                                    input: {
                                      readOnly: isReadOnlyPricing,
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
                                <span className="text-xs sm:text-sm font-bold px-2.5 py-1.5 rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] whitespace-nowrap border border-[var(--color-primary)]/20">
                                  = ₹{payable !== null ? payable : "0.00"}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="hidden lg:block text-right">
                              {!isView && (
                                <span className="text-xs text-slate-400 font-medium">
                                  {isReadOnlyPricing
                                    ? "Click checkbox to select test"
                                    : "Click checkbox to set test price"}
                                </span>
                              )}
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
                <div className="h-14 px-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
                  <span className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                    Selected Tests
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)]">
                    {newSelectedTests.length} Ready
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-slate-50/40">
                  {newSelectedTests.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                      <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                        <ScienceOutlinedIcon
                          sx={{ fontSize: 24, color: "var(--color-disabled)" }}
                        />
                      </div>
                      <div className="text-sm font-semibold text-slate-600">
                        No tests selected
                      </div>
                      <div className="text-xs text-slate-400 max-w-xs mt-1">
                        Check tests from the catalog to configure prices and add
                        them to your selection.
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
                              {test.code ? `${test.code} • ` : ""}
                              {test.category}
                            </div>
                          </div>

                          {!isView && (
                            <button
                              type="button"
                              onClick={() =>
                                setNewSelectedTests((prev) =>
                                  prev.filter(
                                    (item) =>
                                      String(item.testId) !==
                                      String(test.testId),
                                  ),
                                )
                              }
                              className="text-slate-400 hover:text-red-500 p-1 hover:bg-slate-100 rounded-md transition-colors"
                            >
                              <CloseOutlinedIcon sx={{ fontSize: 16 }} />
                            </button>
                          )}
                        </div>

                        <Divider sx={{ my: 0.5 }} />

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">
                            Test Price:
                          </span>
                          <span className="font-semibold text-slate-700">
                            {test.price ? `₹${test.price}` : "—"}
                          </span>
                        </div>

                        {Number(test.discountPrice || 0) > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-medium">
                              Discount Amount:
                            </span>
                            <span className="font-semibold text-emerald-600">
                              − ₹{test.discountPrice}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="font-bold text-slate-800 uppercase tracking-wide">
                            Payable Amount:
                          </span>
                          <span className="text-sm font-bold text-[var(--color-primary)]">
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
          )
        ) : (
          /* ================= PACKAGES TAB (WALK-IN ONLY) ================= */
          <div className="flex flex-col md:flex-row h-full overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {/* Packages Catalog */}
            <div
              className={`flex-1 flex-col h-full overflow-hidden bg-white ${
                mobileTab === "tests" ? "flex" : "hidden md:flex"
              }`}
            >
              <div className="h-14 px-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base font-bold text-slate-800">
                    Available Packages
                  </span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full shrink-0">
                    {filteredPackages.length} packages
                  </span>
                </div>

                <div className="relative w-56 sm:w-72">
                  <SearchIcon
                    sx={{ fontSize: 18 }}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Search packages by name or code..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs sm:text-sm bg-white hover:bg-slate-50 focus:bg-white rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition-all"
                  />
                </div>
              </div>

              {/* Packages Cards List */}
              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5 bg-slate-50/30">
                {filteredPackages.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 text-sm flex flex-col items-center justify-center">
                    <Inventory2OutlinedIcon
                      sx={{
                        fontSize: 32,
                        mb: 1,
                        color: "var(--color-disabled)",
                      }}
                    />
                    <div className="font-semibold text-slate-600">
                      No packages found
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      No packages match your search query.
                    </div>
                  </div>
                ) : (
                  filteredPackages.map((pkg) => {
                    const isChecked = isPackageSelected(pkg.package_id);
                    const actual = Number(pkg.actual_price ?? 0);
                    const discount = Number(pkg.discount_amount ?? 0);
                    const packagePrice = Number(pkg.package_price ?? 0);

                    return (
                      <div
                        key={`pkg-${pkg.package_id}`}
                        onClick={() =>
                          !isView && handleTogglePackage(pkg, !isChecked)
                        }
                        className={`p-3.5 rounded-xl border transition-all ${
                          isView ? "" : "cursor-pointer"
                        } flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isChecked
                            ? "bg-[var(--color-surface)]/90 border-[var(--color-primary)] shadow-xs ring-1 ring-[var(--color-primary-light)]/50"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {isView ? (
                            <div className="w-8 h-8 rounded-lg bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center shrink-0 border border-[var(--color-primary)]/20 mt-0.5">
                              <Inventory2OutlinedIcon sx={{ fontSize: 18 }} />
                            </div>
                          ) : (
                            <Checkbox
                              checked={isChecked}
                              onChange={(e) =>
                                handleTogglePackage(pkg, e.target.checked)
                              }
                              onClick={(e) => e.stopPropagation()}
                              sx={{ p: 0, mt: 0.25 }}
                            />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm sm:text-[15px] font-semibold text-slate-800 truncate">
                              {pkg.package_name}
                            </div>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {pkg.package_code && (
                                <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                                  {pkg.package_code}
                                </span>
                              )}
                              {pkg.total_tests ? (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                                  {pkg.total_tests} Tests Included
                                </span>
                              ) : null}
                            </div>
                            {Array.isArray(pkg.tests) &&
                              pkg.tests.length > 0 && (
                                <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                                  Includes:{" "}
                                  {pkg.tests
                                    .map(
                                      (t) =>
                                        t.test_name || `Test #${t.test_id}`,
                                    )
                                    .join(", ")}
                                </p>
                              )}
                          </div>
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 text-right pl-7 sm:pl-0">
                          <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                            {actual > packagePrice && (
                              <span className="text-xs text-slate-400">
                                Actual:{" "}
                                <span className="line-through">
                                  ₹{actual.toFixed(2)}
                                </span>
                              </span>
                            )}
                            {discount > 0 && (
                              <span className="text-xs text-emerald-600 font-medium">
                                Discount: −₹{discount.toFixed(2)}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-[var(--color-primary)] sm:mt-0.5">
                            Package Price: ₹{packagePrice.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected Packages Queue */}
            <div
              className={`w-full md:w-80 lg:w-88 shrink-0 bg-white flex-col h-full overflow-hidden ${
                mobileTab === "selected" ? "flex" : "hidden md:flex"
              }`}
            >
              <div className="h-14 px-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
                <span className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                  Selected Package
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)]">
                  {newSelectedPackages.length} Ready
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-slate-50/40">
                {newSelectedPackages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                      <Inventory2OutlinedIcon
                        sx={{ fontSize: 24, color: "var(--color-disabled)" }}
                      />
                    </div>
                    <div className="text-sm font-semibold text-slate-600">
                      No package selected
                    </div>
                    <div className="text-xs text-slate-400 max-w-xs mt-1">
                      Select a package from the catalogue to include in patient
                      registration.
                    </div>
                  </div>
                ) : (
                  newSelectedPackages.map((pkg) => (
                    <div
                      key={`selected-pkg-${pkg.package_id}`}
                      className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-800 truncate">
                            {pkg.package_name}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            {pkg.package_code ? `${pkg.package_code} • ` : ""}
                            {pkg.total_tests || pkg.tests?.length || 0} Tests
                          </div>
                        </div>

                        {!isView && (
                          <button
                            type="button"
                            onClick={() =>
                              setNewSelectedPackages((prev) =>
                                prev.filter(
                                  (item) => item.package_id !== pkg.package_id,
                                ),
                              )
                            }
                            className="text-slate-400 hover:text-red-500 p-1 hover:bg-slate-100 rounded-md transition-colors"
                          >
                            <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                          </button>
                        )}
                      </div>

                      <Divider sx={{ my: 0.5 }} />

                      {pkg.actual_price ? (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">
                            Actual Total:
                          </span>
                          <span className="font-semibold text-slate-700">
                            ₹{Number(pkg.actual_price).toFixed(2)}
                          </span>
                        </div>
                      ) : null}

                      {Number(pkg.discount_amount || 0) > 0 && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">
                            Package Discount:
                          </span>
                          <span className="font-semibold text-emerald-600">
                            − ₹{Number(pkg.discount_amount).toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="font-bold text-slate-800 uppercase tracking-wide">
                          Package Price:
                        </span>
                        <span className="text-sm font-bold text-[var(--color-primary)]">
                          ₹{Number(pkg.package_price).toFixed(2)}
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
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          bgcolor: "var(--color-bg)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div className="text-xs text-slate-500 font-medium">
          {totalSelectionCount > 0 ? (
            <span>
              <strong className="text-[var(--color-primary)] font-bold">
                {totalSelectionCount}
              </strong>{" "}
              {totalSelectionCount === 1 ? "item" : "items"}{" "}
              {isView ? "assigned" : "selected"}
            </span>
          ) : (
            <span>No items {isView ? "assigned" : "selected"}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isView ? (
            <Button
              size="medium"
              variant="contained"
              onClick={onClose}
              sx={{
                textTransform: "none",
                borderRadius: 2,
                px: 3.5,
                fontSize: 14,
                fontWeight: 600,
                bgcolor: "var(--color-primary)",
                "&:hover": { bgcolor: "var(--color-primary-dark)" },
              }}
            >
              Close
            </Button>
          ) : (
            <>
              <Button
                size="medium"
                variant="outlined"
                onClick={onClose}
                sx={{
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Cancel
              </Button>

              <Button
                size="medium"
                variant="contained"
                onClick={handleConfirmOrSave}
                disabled={
                  saving ||
                  totalSelectionCount === 0 ||
                  (!isReadOnlyPricing &&
                    newSelectedTests.some(
                      (test) =>
                        !test.price ||
                        Boolean(test.priceError) ||
                        Boolean(test.discountPriceError),
                    ))
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
                  : isProcessing
                    ? `Save Tests (${totalSelectionCount})`
                    : isWalkIn
                      ? `Confirm Selection (${totalSelectionCount})`
                      : newSelectedTests.length > 0
                        ? `Confirm & Add (${newSelectedTests.length})`
                        : "Confirm & Add"}
              </Button>
            </>
          )}
        </div>
      </DialogActions>
    </Dialog>
  );
};

export default LabTestSelectionPopup;
