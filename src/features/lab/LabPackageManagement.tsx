import React, { useMemo, useState } from "react";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import Loader from "../../components/shared/Loader/Loader";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import { getSessionItem } from "../../context/sessions/userSession";
import LabPackagePopUp from "./LabPackagePopUp";
import { toast } from "react-toastify";
import { deleteLabPackageApi, saveLabPackageApi } from "../../api";
import type { SaveLabPackageRequest } from "../../types/labType/LabTestInterfaces";

interface LabPackageManagementProps {
  packages: any[];
  loading?: boolean;
  savedLabTests: any[];
  onRefresh: () => Promise<void>;
}

const LabPackageManagement: React.FC<LabPackageManagementProps> = ({
  packages,
  savedLabTests,
  loading,
  onRefresh,
}) => {
  const userId = getSessionItem("user", "user_id");
  const labId = getSessionItem("user", "lab_id");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | false>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [packagePopupOpen, setPackagePopupOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (!pkg?.package_id || !pkg?.package_name) return false;
      const keyword = search.toLowerCase();

      return (
        pkg.package_name.toLowerCase().includes(keyword) ||
        pkg.package_code?.toLowerCase().includes(keyword)
      );
    });
  }, [packages, search]);

  const totalPackageTests = useMemo(() => {
    return packages.reduce((sum, p) => sum + Number(p.total_tests || 0), 0);
  }, [packages]);

  const toggleAccordion = (packageId: number) => {
    setExpanded((prev) => (prev === packageId ? false : packageId));
  };

  const handleEditPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setIsEditMode(true);
    setPackagePopupOpen(true);
  };

  const handleCreatePackage = () => {
    setSelectedPackage(null);
    setIsEditMode(false);
    setPackagePopupOpen(true);
  };

  const confirmDeletePackage = async () => {
    try {
      if (!selectedPackage) return;
      setDeleteLoading(true);
      const response = await deleteLabPackageApi(
        Number(selectedPackage.package_id),
        Number(userId),
      );
      if (!response.success) {
        toast.error(response.message);
        return;
      }
      toast.success(response.message);
      setDeleteDialogOpen(false);
      setSelectedPackage(null);
      await onRefresh();
    } catch (error) {
      console.error("Delete package failed:", error);
      toast.error("Failed to delete package");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleSavePackage = async (packageData: {
    packageName: string;
    description: string;
    packagePrice: number;
    selectedTests: any[];
    actualPrice: number;
    discountAmount: number;
    discountPercentage: number;
  }) => {
    try {
      if (!labId) {
        toast.error("Lab ID not found");
        return;
      }
      if (!userId) {
        toast.error("User ID not found");
        return;
      }
      const payload: SaveLabPackageRequest = {
        package_id: selectedPackage ? Number(selectedPackage.package_id) : 0,
        lab_id: Number(labId),
        package_name: packageData.packageName,
        description: packageData.description || "",
        actual_price: packageData.actualPrice,
        package_price: packageData.packagePrice,
        discount_amount: packageData.discountAmount,
        discount_percentage: packageData.discountPercentage,
        created_by: Number(userId),
        tests: packageData.selectedTests.map((test: any) => ({
          test_id: Number(test.test_id),
        })),
      };
      // CREATE
      if (!selectedPackage) {
        const response = await saveLabPackageApi(payload);
        if (!response.success) {
          const errorMsg =
            response.message ||
            (response.errors && response.errors.length > 0
              ? response.errors[0].message
              : "Failed to save package");
          toast.error(errorMsg);
          return;
        }
        toast.success(response.message || "Package saved successfully");
      }
      // UPDATE
      else {
        // Reserved for update API when available
      }
      setPackagePopupOpen(false);
      setSelectedPackage(null);
      setIsEditMode(false);
      await onRefresh();
    } catch (error) {
      console.error("Save package failed:", error);
      toast.error("Failed to save package");
    }
  };

  if (loading) return <Loader message="Loading laboratory packages..." />;

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 md:p-3.5 shadow-xs transition-all">
        {/* ================= HEADER BAR ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                Laboratory Packages
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                  <Inventory2OutlinedIcon sx={{ fontSize: 14 }} />
                  {packages.length} Packages
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                  <ScienceOutlinedIcon sx={{ fontSize: 14 }} />
                  {totalPackageTests} Tests Included
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Bundle diagnostic tests together to offer patients curated packages at special pricing.
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
                placeholder="Search package or code..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 hover:bg-slate-100/80 focus:bg-white rounded-lg border border-slate-200 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
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

            {/* Create Package */}
            <button
              type="button"
              onClick={handleCreatePackage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs hover:shadow transition-all duration-150 cursor-pointer active:scale-97 whitespace-nowrap"
            >
              <AddCircleOutlineIcon sx={{ fontSize: 16 }} />
              <span>Create Package</span>
            </button>
          </div>
        </div>

        {/* ================= PACKAGES LIST ================= */}
        <div className="mt-3 max-h-[calc(100vh-230px)] min-h-[300px] overflow-y-auto pr-1">
          {filteredPackages.length === 0 ? (
            <div className="py-14 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600 mb-3 border border-sky-100 shadow-xs">
                <Inventory2OutlinedIcon sx={{ fontSize: 30 }} />
              </div>
              <h3 className="text-base font-bold text-slate-800">
                {packages.length === 0
                  ? "No Packages Created Yet"
                  : "No Packages Found"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
                {packages.length === 0
                  ? "Group popular lab tests into affordable packages to attract more health checkup bookings."
                  : `No package matches "${search}".`}
              </p>
              {packages.length === 0 && (
                <button
                  type="button"
                  onClick={handleCreatePackage}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs hover:shadow transition-all duration-150 cursor-pointer active:scale-97"
                >
                  <AddCircleOutlineIcon sx={{ fontSize: 16 }} />
                  <span>Create Your First Package</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {filteredPackages.map((pkg) => {
                const isExpanded = expanded === pkg.package_id;
                const savings =
                  Number(pkg.actual_price || 0) - Number(pkg.package_price || 0);
                const savingsPercent =
                  Number(pkg.actual_price || 0) > 0
                    ? Math.round((savings / Number(pkg.actual_price)) * 100)
                    : 0;

                return (
                  <div
                    key={pkg.package_id}
                    className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                      isExpanded
                        ? "border-sky-300 shadow-xs ring-1 ring-sky-200/50"
                        : "border-slate-200/90 hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    {/* Package Header Row */}
                    <div
                      onClick={() => toggleAccordion(pkg.package_id)}
                      className="p-3 sm:px-4 sm:py-3 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Left Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm sm:text-base font-bold text-slate-800">
                            {pkg.package_name}
                          </h3>
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/60">
                            <ScienceOutlinedIcon sx={{ fontSize: 13 }} />
                            {pkg.total_tests} Tests
                          </span>
                          {pkg.package_code && (
                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {pkg.package_code}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {pkg.description || "No description provided."}
                        </p>
                      </div>

                      {/* Right Pricing & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                        {/* Price Badge */}
                        <div className="flex items-center gap-2 text-right">
                          {Number(pkg.actual_price || 0) >
                            Number(pkg.package_price || 0) && (
                            <div className="flex flex-col items-end">
                              <span className="text-[11px] text-slate-400 line-through">
                                ₹{pkg.actual_price}
                              </span>
                              {savingsPercent > 0 && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/50">
                                  <LocalOfferOutlinedIcon sx={{ fontSize: 10 }} />
                                  {savingsPercent}% OFF
                                </span>
                              )}
                            </div>
                          )}
                          <div className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200/60 text-right">
                            <span className="block text-[9px] uppercase font-bold text-sky-600 tracking-wider">
                              Package Price
                            </span>
                            <span className="text-sm sm:text-base font-bold text-sky-800">
                              ₹{pkg.package_price}
                            </span>
                          </div>
                        </div>

                        {/* Action Icons */}
                        <div
                          className="flex items-center gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Tooltip title="Edit Package" arrow>
                            <IconButton
                              size="small"
                              onClick={() => handleEditPackage(pkg)}
                              color="primary"
                            >
                              <EditOutlinedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete Package" arrow>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedPackage(pkg);
                                setDeleteDialogOpen(true);
                              }}
                              color="error"
                            >
                              <DeleteOutlineOutlinedIcon sx={{ fontSize: 17 }} />
                            </IconButton>
                          </Tooltip>

                          <IconButton
                            size="small"
                            onClick={() => toggleAccordion(pkg.package_id)}
                            sx={{
                              color: "var(--color-text-secondary)",
                              transform: isExpanded
                                ? "rotate(180deg)"
                                : "rotate(0deg)",
                              transition: "transform 0.2s ease",
                            }}
                          >
                            <ExpandMoreIcon sx={{ fontSize: 20 }} />
                          </IconButton>
                        </div>
                      </div>
                    </div>

                    {/* Expandable Test Breakdown */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="border-t border-slate-100 bg-slate-50/50"
                        >
                          <div className="p-3 sm:p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                Included Tests ({pkg.tests?.length || 0})
                              </span>
                            </div>

                            {/* Tests Table */}
                            <div className="overflow-x-auto rounded-lg border border-slate-200/80 bg-white">
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                                    <th className="py-2 px-3">Test Name</th>
                                    <th className="py-2 px-3 w-28">Test Code</th>
                                    <th className="py-2 px-3 w-36">Category</th>
                                    <th className="py-2 px-3 text-right w-24">
                                      Price
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {pkg.tests?.map((test: any, index: number) => (
                                    <tr
                                      key={test.package_test_id || index}
                                      className="hover:bg-slate-50/70 transition-colors"
                                    >
                                      <td className="py-2 px-3 font-medium text-slate-800">
                                        {test.test_name}
                                      </td>
                                      <td className="py-2 px-3">
                                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/50">
                                          {test.test_code || "—"}
                                        </span>
                                      </td>
                                      <td className="py-2 px-3 text-slate-600">
                                        {test.category_name}
                                      </td>
                                      <td className="py-2 px-3 text-right font-semibold text-slate-700">
                                        ₹{test.test_price}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Summary Financial Pills */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                              <div className="p-2.5 rounded-lg bg-white border border-slate-200/80 flex items-center justify-between">
                                <span className="text-[11px] text-slate-500 font-medium">
                                  Standard Total
                                </span>
                                <span className="text-xs font-bold text-slate-700">
                                  ₹{pkg.actual_price}
                                </span>
                              </div>

                              <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200/60 flex items-center justify-between">
                                <span className="text-[11px] text-emerald-700 font-medium">
                                  Total Savings
                                </span>
                                <span className="text-xs font-bold text-emerald-800">
                                  ₹{savings > 0 ? savings : 0} (
                                  {savingsPercent}%)
                                </span>
                              </div>

                              <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-between">
                                <span className="text-[11px] text-sky-700 font-bold uppercase tracking-wider">
                                  Final Package Price
                                </span>
                                <span className="text-sm font-bold text-sky-800">
                                  ₹{pkg.package_price}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= DELETE CONFIRMATION MODAL ================= */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, display: "flex", alignItems: "center", gap: 1 }}>
          <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <WarningAmberRoundedIcon sx={{ fontSize: 20 }} />
          </div>
          <Typography fontWeight={700} fontSize={16}>
            Delete Package
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete this package? This package will no
            longer be available for booking.
          </Typography>

          {selectedPackage && (
            <div className="mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Package Name:</span>
                <span className="font-semibold text-slate-800">
                  {selectedPackage.package_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tests Included:</span>
                <span className="font-semibold text-slate-800">
                  {selectedPackage.total_tests} Tests
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Package Price:</span>
                <span className="font-bold text-sky-700">
                  ₹{selectedPackage.package_price}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedPackage(null);
            }}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            size="small"
            variant="contained"
            color="error"
            onClick={confirmDeletePackage}
            disabled={deleteLoading}
            sx={{ textTransform: "none", borderRadius: 2 }}
          >
            {deleteLoading ? "Deleting..." : "Delete Package"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Package Create / Edit Modal */}
      <LabPackagePopUp
        open={packagePopupOpen}
        onClose={() => {
          setPackagePopupOpen(false);
          setSelectedPackage(null);
          setIsEditMode(false);
        }}
        isEditMode={isEditMode}
        savedLabTests={savedLabTests}
        selectedPackage={selectedPackage}
        loading={loading}
        onRefresh={onRefresh}
        onSavePackage={handleSavePackage}
      />
    </div>
  );
};

export default LabPackageManagement;
