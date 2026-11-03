import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  Tag,
  Percent,
  Calendar,
  Ticket,
  UploadCloud,
  CheckCircle2,
  Trash2,
  FolderOpen,
  FileText,
  Sparkles,
  Save,
  RotateCcw,
  AlertCircle,
  Eye,
  FlaskConical,
  PlusCircle,
  Edit2,
} from "lucide-react";
import LabTestSelectionPopup from "../lab/LabTestSelectionPopup";
import type { LabWalkInTest } from "../../types/labType/LabTestInterfaces";
import { toast } from "react-toastify";
import type {
  OfferForm,
  ValidationErrors,
  PromotionalOffer,
  AvailableOfferTest,
} from "../../types/types";
import { offersdiscountApi, uploadOfferImageApi } from "../../api";
import { getSession } from "../../context/sessions/userSession";
import { BASE_URL } from "../../services/EmrApi";

export const toLocalDateInputValue = (val?: string | null): string => {
  if (!val) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return "";
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export interface MappedOfferState {
  formData: OfferForm;
  selectedTests: LabWalkInTest[];
  isActive: number;
  isTestBased: boolean;
  hasConflictingPercentage: boolean;
}

export const mapOfferToFormState = (
  offer: PromotionalOffer,
  currentUserId: number,
): MappedOfferState => {
  const isTestSpecific =
    String((offer as any).is_test_specific) === "1" ||
    (Array.isArray(offer.tests) && offer.tests.length > 0) ||
    (Array.isArray((offer as any).available_offers) &&
      (offer as any).available_offers.length > 0);

  const rawTests: any[] =
    Array.isArray(offer.tests) && offer.tests.length > 0
      ? offer.tests
      : Array.isArray((offer as any).available_offers) &&
          (offer as any).available_offers.length > 0
        ? (offer as any).available_offers
        : [];

  const selectedTests: LabWalkInTest[] = rawTests.map((t: any) => {
    const offerAmount = Number(t.offer_price ?? t.offer_amount ?? 0);
    const price = Number(t.test_price ?? t.price ?? 0);
    return {
      test_id: Number(t.test_id),
      category_id: Number(t.category_id || 0),
      category_name: t.category_name || "General Laboratory",
      test_name: t.test_name || `Test #${t.test_id}`,
      test_code: t.test_code || "",
      price,
      discount_price: offerAmount,
      offer_amount: offerAmount,
    };
  });

  const isTestBased = isTestSpecific && selectedTests.length > 0;

  const hasConflictingPercentage =
    isTestBased &&
    offer.discount_percentage !== null &&
    offer.discount_percentage !== undefined &&
    offer.discount_percentage !== "" &&
    Number(offer.discount_percentage) > 0;

  const discountPercentage = isTestBased
    ? ""
    : offer.discount_percentage !== null &&
        offer.discount_percentage !== undefined &&
        offer.discount_percentage !== ""
      ? Number(offer.discount_percentage)
      : "";

  const formData: OfferForm = {
    offer_id: offer.offer_id != null ? Number(offer.offer_id) : null,
    is_active: Number(offer.is_active ?? 1) === 1 ? 1 : 0,
    center_id: offer.center_id != null ? Number(offer.center_id) : undefined,
    entity_type: offer.entity_type != null ? Number(offer.entity_type) : 2,
    center_name: offer.center_name || "",
    offer_title: offer.offer_title || "",
    offer_description: offer.offer_description || "",
    offer_image: null,
    offer_image_path: offer.offer_image_path || "",
    offer_image_guid: offer.offer_image_guid || "",
    offer_image_name: offer.offer_image_name || "",
    discount_percentage: discountPercentage,
    coupon_code: offer.coupon_code || "",
    start_date: toLocalDateInputValue(offer.start_date),
    end_date: toLocalDateInputValue(offer.end_date),
    priority: offer.priority != null ? Number(offer.priority) : 0,
    created_by: currentUserId,
    modified_by: currentUserId,
    available_offers: isTestBased
      ? selectedTests.map((t) => ({
          test_id: t.test_id,
          offer_amount: Number(t.offer_amount ?? 0),
        }))
      : null,
  };

  return {
    formData,
    selectedTests,
    isActive: Number(offer.is_active ?? 1) === 1 ? 1 : 0,
    isTestBased,
    hasConflictingPercentage,
  };
};

interface OffersDiscountProps {
  initialOffer?: PromotionalOffer | null;
  isEditMode?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const OffersDiscount: React.FC<OffersDiscountProps> = ({
  initialOffer,
  isEditMode,
  onSuccess,
  onCancel,
}) => {
  const today = new Date().toISOString().split("T")[0];
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const navigationState = location.state as {
    offer?: PromotionalOffer;
    isEdit?: boolean;
  } | null;

  const selectedOffer = initialOffer ?? navigationState?.offer;
  const isEdit = isEditMode ?? navigationState?.isEdit === true;

  const user = getSession("user");

  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState("");
  const [isActive, setIsActive] = useState<number>(1);
  const [isDragging, setIsDragging] = useState(false);
  const [hasConflictingPercentage, setHasConflictingPercentage] =
    useState(false);
  const initialSnapshotRef = useRef<string>("");

  const [formData, setFormData] = useState<OfferForm>({
    offer_title: "",
    offer_description: "",
    offer_image: null,
    offer_image_path: "",
    offer_image_guid: "",
    offer_image_name: "",
    discount_percentage: "",
    coupon_code: "",
    start_date: "",
    end_date: "",
    priority: 0,
    created_by: user?.user_id ?? 0,
  });

  const [errors, setErrors] = useState<ValidationErrors<OfferForm>>({
    offer_title: "",
    offer_description: "",
    offer_image: "",
    discount_percentage: "",
    coupon_code: "",
    start_date: "",
    end_date: "",
    priority: "",
  });

  const [isTestSelectionOpen, setIsTestSelectionOpen] = useState(false);
  const [selectedOfferTests, setSelectedOfferTests] = useState<LabWalkInTest[]>(
    [],
  );
  const [discountType, setDiscountType] = useState<"percentage" | "tests">(
    "percentage",
  );
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);
  const tooltipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const handleTooltipMouseEnter = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
      tooltipTimeoutRef.current = null;
    }
    setIsTooltipOpen(true);
  };

  const handleTooltipMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    tooltipTimeoutRef.current = setTimeout(() => {
      setIsTooltipOpen(false);
    }, 200);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        setIsTooltipOpen(false);
      }
    };
    if (isTooltipOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, [isTooltipOpen]);

  const centerId =
    user?.entity_type === 1
      ? user?.clinic_id
      : user?.entity_type === 2
        ? user?.lab_id
        : user?.clinic_id || user?.lab_id;

  const isLab = Number(user?.entity_type ?? formData.entity_type) === 2;

  const activeLabId = Number(user?.lab_id || centerId || 1);

  const hasPercentage =
    formData.discount_percentage !== "" &&
    Number(formData.discount_percentage) > 0;
  const hasSelectedTests = selectedOfferTests.length > 0;

  const totalTests = selectedOfferTests.length;
  const totalTestPrice = selectedOfferTests.reduce(
    (sum, t) => sum + Number(t.price || 0),
    0,
  );
  const totalOfferAmount = selectedOfferTests.reduce(
    (sum, t) => sum + Number(t.offer_amount ?? t.discount_price ?? 0),
    0,
  );

  const testsByCategory = useMemo(() => {
    const map = new Map<string, LabWalkInTest[]>();
    selectedOfferTests.forEach((test) => {
      const cat = test.category_name?.trim() || "General Laboratory";
      if (!map.has(cat)) {
        map.set(cat, []);
      }
      map.get(cat)!.push(test);
    });
    return Array.from(map.entries());
  }, [selectedOfferTests]);

  const handleConfirmOfferTests = (tests: LabWalkInTest[]) => {
    setSelectedOfferTests(tests);
    if (tests.length > 0) {
      setDiscountType("tests");
      setFormData((prev) => ({
        ...prev,
        discount_percentage: "",
        coupon_code: "",
      }));
      setErrors((prev) => ({
        ...prev,
        discount_percentage: "",
        coupon_code: "",
      }));
    }
  };

  const handleDiscountTypeChange = (type: "percentage" | "tests") => {
    if (type === discountType) return;
    setDiscountType(type);
    if (type === "percentage") {
      setSelectedOfferTests([]);
      setErrors((prev) => ({
        ...prev,
        discount_percentage: "",
        coupon_code: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        discount_percentage: "",
        coupon_code: "",
      }));
      setErrors((prev) => ({
        ...prev,
        discount_percentage: "",
        coupon_code: "",
      }));
    }
  };

  const loadExistingOfferImage = async (
    imageGuid: string,
    imagePath?: string,
  ): Promise<string> => {
    try {
      const response = await fetch(
        `${BASE_URL}/common/downloadFile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            filePath: imagePath || "E:\\DEV\\documents\\offers",
            fileName: imageGuid,
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to load offer image");
      }

      const imageBlob = await response.blob();
      return URL.createObjectURL(imageBlob);
    } catch (error) {
      console.error("Failed to load existing offer image:", error);
      return "";
    }
  };

  useEffect(() => {
    if (!isEdit || !selectedOffer) {
      handleReset();
      initialSnapshotRef.current = "";
      return;
    }

    const mapped = mapOfferToFormState(selectedOffer, user?.user_id ?? 0);
    setFormData(mapped.formData);
    setSelectedOfferTests(mapped.selectedTests);
    setIsActive(mapped.isActive);
    setHasConflictingPercentage(mapped.hasConflictingPercentage);
    const initialDiscountType: "percentage" | "tests" =
      isLab && mapped.selectedTests.length > 0 ? "tests" : "percentage";
    setDiscountType(initialDiscountType);

    if (mapped.formData.offer_image_guid) {
      loadExistingOfferImage(
        mapped.formData.offer_image_guid,
        mapped.formData.offer_image_path,
      ).then((url) => {
        if (url) {
          setPreview(url);
        } else {
          setPreview("");
        }
      });
    } else {
      setPreview("");
    }

    initialSnapshotRef.current = JSON.stringify({
      formData: mapped.formData,
      selectedTests: mapped.selectedTests,
      isActive: mapped.isActive,
      discountType: initialDiscountType,
    });
  }, [isEdit, selectedOffer]);

  const checkIfDirty = () => {
    if (!initialSnapshotRef.current) return false;
    const currentSnapshot = JSON.stringify({
      formData,
      selectedTests: selectedOfferTests,
      isActive,
      discountType,
    });
    return currentSnapshot !== initialSnapshotRef.current;
  };

  const handleCancelEdit = () => {
    if (checkIfDirty()) {
      if (
        !window.confirm(
          "You have unsaved changes. Discard changes and return to View offers?",
        )
      ) {
        return;
      }
    }
    handleReset();
    if (onCancel) {
      onCancel();
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const processImageFile = (file: File) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        offer_image: "Only JPG, PNG, or WEBP images are supported.",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        offer_image: "Image size must not exceed 5 MB.",
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      offer_image: file,
      offer_image_name: file.name,
    }));
    setPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, offer_image: "" }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImageFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processImageFile(file);
  };

  const handleRemoveImage = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFormData((prev) => ({
      ...prev,
      offer_image: null,
      offer_image_path: "",
      offer_image_guid: "",
      offer_image_name: "",
    }));
    setPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const target = e.target as HTMLInputElement;
    const { name, value } = target;

    if (name === "discount_percentage") {
      const regex = /^\d{0,2}(\.\d{0,2})?$/;
      const discount = Number(value);
      if (value !== "" && (!regex.test(value) || discount >= 100)) {
        return;
      }
    }

    if (name === "coupon_code") {
      const cleanCode = value.replace(/[^A-Za-z0-9_-]/g, "").toUpperCase();
      setFormData((prev) => ({ ...prev, coupon_code: cleanCode }));
      setErrors((prev) => ({ ...prev, coupon_code: "" }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name as keyof OfferForm]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: ValidationErrors<OfferForm> = {
      offer_title: "",
      offer_description: "",
      offer_image: "",
      discount_percentage: "",
      coupon_code: "",
      start_date: "",
      end_date: "",
      priority: "",
    };

    if (!formData.offer_title.trim()) {
      newErrors.offer_title = "Offer Title is required.";
    }

    if (!formData.offer_description.trim()) {
      newErrors.offer_description = "Offer Description is required.";
    }

    if (!formData.offer_image && !(isEdit && formData.offer_image_guid)) {
      newErrors.offer_image = "Please upload an offer banner image.";
    }

    if (!isLab || discountType === "percentage") {
      const discount = Number(formData.discount_percentage);
      if (
        formData.discount_percentage === "" ||
        formData.discount_percentage === null ||
        formData.discount_percentage === undefined ||
        isNaN(discount) ||
        discount <= 0 ||
        discount >= 100
      ) {
        newErrors.discount_percentage =
          "Discount must be greater than 0% and less than 100%.";
      }

      if (!formData.coupon_code.trim()) {
        newErrors.coupon_code = "Coupon Code is required.";
      }
    } else {
      // Specific Tests Offer
      if (selectedOfferTests.length === 0) {
        newErrors.discount_percentage =
          "Please select at least one test for the offer.";
      } else {
        const hasInvalidTest = selectedOfferTests.some((t) => {
          const offer = Number(t.offer_amount ?? t.discount_price ?? 0);
          const price = Number(t.price ?? 0);
          return (
            isNaN(offer) ||
            offer <= 0 ||
            isNaN(price) ||
            price <= 0 ||
            offer > price
          );
        });
        if (hasInvalidTest) {
          newErrors.discount_percentage =
            "All selected tests must have a valid Offer Amount (> ₹0 and ≤ Test Price).";
        }
      }
    }

    if (
      formData.priority === ("" as any) ||
      formData.priority === null ||
      formData.priority === undefined ||
      isNaN(Number(formData.priority)) ||
      Number(formData.priority) < 0
    ) {
      newErrors.priority = "Priority must be a non-negative number.";
    }

    if (!formData.start_date) {
      newErrors.start_date = "Start Date is required.";
    }

    if (!formData.end_date) {
      newErrors.end_date = "End Date is required.";
    } else if (
      formData.start_date &&
      formData.end_date &&
      new Date(formData.end_date) < new Date(formData.start_date)
    ) {
      newErrors.end_date = "End Date cannot be earlier than Start Date.";
    }

    setErrors(newErrors);
    return Object.values(newErrors).every((x) => x === "");
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    debugger;
    if (e) e.preventDefault();

    if (loading || !validateForm()) {
      toast.error("Please fill in all required fields properly.");
      return;
    }

    const centerId =
      user?.entity_type === 1
        ? user?.clinic_id
        : user?.entity_type === 2
          ? user?.lab_id
          : user?.clinic_id || user?.lab_id;

    if (!centerId) {
      toast.error("A valid clinic or lab session is required.");
      return;
    }

    if (isEdit && !selectedOffer?.offer_id) {
      toast.error(
        "Offer ID is missing. Please reopen the offer and try again.",
      );
      return;
    }

    setLoading(true);

    try {
      let imagePath = formData.offer_image_path;
      let imageGuid = formData.offer_image_guid;
      let imageName = formData.offer_image_name;

      if (formData.offer_image) {
        const uploadResponse = await uploadOfferImageApi(formData.offer_image);
        const uploadedFile = uploadResponse?.files?.[0];

        if (!uploadedFile) {
          throw new Error("Offer image upload returned no file.");
        }

        imagePath = uploadedFile.path;
        imageGuid = uploadedFile.guid_name;
        imageName = uploadedFile.file_name;
      }

      const isTestOffer = isLab && discountType === "tests";

      const availableOffersPayload: AvailableOfferTest[] | null =
        isTestOffer && selectedOfferTests.length > 0
          ? selectedOfferTests.map((t) => ({
              test_id: Number(t.test_id),
              offer_amount: Number(t.offer_amount ?? t.discount_price ?? 0),
            }))
          : null;

      const offerData: OfferForm = {
        ...formData,
        discount_percentage: isTestOffer
          ? ""
          : formData.discount_percentage !== "" &&
              formData.discount_percentage !== null
            ? Number(formData.discount_percentage)
            : "",
        coupon_code: isTestOffer
          ? ""
          : formData.coupon_code
            ? formData.coupon_code.trim()
            : "",
        offer_id: isEdit
          ? Number(formData.offer_id ?? selectedOffer!.offer_id)
          : null,
        is_active: isEdit ? isActive : 1,
        center_id: Number(centerId),
        entity_type: Number(user?.entity_type || formData.entity_type || 2),
        center_name: String(user?.full_name || formData.center_name || ""),
        center_type: String(
          user?.entity_name ||
            (user?.entity_type === 2 ? "lab" : "clinic") ||
            "lab",
        ),
        priority: Number(formData.priority ?? 0),
        created_by: Number(user?.user_id ?? 0),
        modified_by: isEdit ? Number(user?.user_id ?? 0) : null,
        offer_image_path: imagePath,
        offer_image_guid: imageGuid,
        offer_image_name: imageName,
        available_offers: availableOffersPayload,
      };

      const res = await offersdiscountApi(offerData);
      toast.success(
        isEdit ? "Offer updated successfully!" : "Offer created successfully!",
      );

      handleReset();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to save offer.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      offer_title: "",
      offer_description: "",
      offer_image: null,
      offer_image_path: "",
      offer_image_guid: "",
      offer_image_name: "",
      discount_percentage: "",
      coupon_code: "",
      start_date: "",
      end_date: "",
      priority: 0,
      created_by: user?.user_id ?? 0,
    });
    setPreview("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setErrors({
      offer_title: "",
      offer_description: "",
      offer_image: "",
      discount_percentage: "",
      coupon_code: "",
      start_date: "",
      end_date: "",
      priority: "",
    });
    setSelectedOfferTests([]);
    setDiscountType("percentage");
  };

  const formatPreviewDate = (dateStr?: string) => {
    if (!dateStr) return "28 Oct 2026";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="w-full space-y-3">
      {/* =====================================================
          SLIM ACTION BAR (COMPACT & FITTED - MATCHING BLOG FORM)
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">
              {isEdit ? "Edit Promotional Offer" : "Create Promotional Offer"}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold ${
                isEdit
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-primary)]/20"
              }`}
            >
              <Sparkles
                className={`w-2.5 h-2.5 ${isEdit ? "text-amber-600" : "text-[var(--color-primary)]"}`}
              />
              {isEdit ? "Editing" : "Draft Campaign"}
            </span>
          </div>
          {isEdit && selectedOffer && (
            <span className="text-[11px] text-slate-500 truncate max-w-sm">
              {selectedOffer.offer_title ||
                `Offer ID #${selectedOffer.offer_id}`}
            </span>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Offer Status toggle in EDIT mode */}
          {isEdit && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 select-none">
              <span className="text-slate-600">Offer Status:</span>
              <button
                type="button"
                onClick={() => setIsActive((prev) => (prev === 1 ? 0 : 1))}
                className="inline-flex items-center gap-1.5 cursor-pointer focus:outline-none"
                title="Toggle active status"
              >
                <span
                  className={`w-2 h-2 rounded-full transition-colors ${
                    isActive === 1
                      ? "bg-emerald-500 ring-2 ring-emerald-200"
                      : "bg-slate-400"
                  }`}
                />
                <span
                  className={
                    isActive === 1
                      ? "text-emerald-700 font-bold"
                      : "text-slate-600 font-medium"
                  }
                >
                  {isActive === 1 ? "Active" : "Inactive"}
                </span>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={isEdit ? handleCancelEdit : handleReset}
            disabled={loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>{isEdit ? "Cancel Edit" : "Reset"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-lg shadow-2xs transition disabled:opacity-60 cursor-pointer"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{isEdit ? "Update Offer" : "Publish Offer"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =====================================================
          TWO-COLUMN FITTED FORM LAYOUT (CLEAN & APPROACHABLE)
      ====================================================== */}
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start"
      >
        {/* ===================================================
            LEFT COLUMN (7 COLS): Offer Essentials, Discount, Dates
        ==================================================== */}
        <div className="lg:col-span-7 space-y-3.5">
          {/* Card 1: Offer Essentials */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs sm:text-sm">
                <FileText className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Offer Details
              </span>
              <span className="text-[11px] text-slate-400">* Required</span>
            </div>

            {/* Offer Title */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="offer_title"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Offer Title <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {formData.offer_title.length} chars
                </span>
              </div>
              <input
                id="offer_title"
                name="offer_title"
                type="text"
                value={formData.offer_title}
                onChange={handleChange}
                placeholder="e.g. Monsoon Health Checkup 30% Off"
                className={`w-full px-3 py-2 rounded-xl border text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm transition focus:outline-none focus:ring-2 ${
                  errors.offer_title
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20"
                    : "border-slate-300 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/15 bg-white"
                }`}
              />
              {errors.offer_title && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.offer_title}
                </p>
              )}
            </div>

            {/* Offer Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="offer_description"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Offer Description <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {formData.offer_description.length} chars
                </span>
              </div>
              <textarea
                id="offer_description"
                name="offer_description"
                rows={3}
                value={formData.offer_description}
                onChange={handleChange}
                placeholder="Detail the package inclusions, applicability, terms, or lab tests covered..."
                className={`w-full px-3 py-2 rounded-xl border text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm leading-relaxed transition focus:outline-none focus:ring-2 resize-y ${
                  errors.offer_description
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20"
                    : "border-slate-300 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/15 bg-white"
                }`}
              />
              {errors.offer_description && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.offer_description}
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Discount & Offer Configuration */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs sm:text-sm shrink-0">
                <Tag className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Discount & Coupon
              </span>

              {/* Offer Type Tabs on Header (Visible ONLY when entity_type === 2 i.e. Lab) */}
              {isLab && (
                <div className="grid grid-cols-2 sm:flex sm:inline-flex p-0.5 bg-slate-100/90 rounded-xl border border-slate-200/70 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => handleDiscountTypeChange("percentage")}
                    className={`flex items-center justify-center gap-1.5 py-1 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                      discountType === "percentage"
                        ? "bg-white text-[var(--color-primary)] shadow-2xs font-bold border border-slate-200/60"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <Percent className="w-3 h-3 shrink-0" />
                    <span className="truncate">Percentage Discount</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDiscountTypeChange("tests")}
                    className={`flex items-center justify-center gap-1.5 py-1 px-2.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-semibold transition cursor-pointer ${
                      discountType === "tests"
                        ? "bg-white text-[var(--color-primary)] shadow-2xs font-bold border border-slate-200/60"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <FlaskConical className="w-3 h-3 shrink-0" />
                    <span className="truncate">Specific Tests Offer</span>
                    {hasSelectedTests && discountType === "tests" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[var(--color-surface,#f5f3ff)] text-[var(--color-primary)]">
                        {totalTests}
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* VIEW 1: Discount Percentage & Coupon Code (Shown for non-lab OR when percentage is active) */}
            {(!isLab || discountType === "percentage") && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Discount Percentage */}
                  <div>
                    <label
                      htmlFor="discount_percentage"
                      className="block text-xs font-semibold text-slate-800 mb-1"
                    >
                      Discount Percentage (%){" "}
                      <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs font-bold text-slate-400 pointer-events-none">
                        %
                      </span>
                      <input
                        id="discount_percentage"
                        name="discount_percentage"
                        type="number"
                        min="1"
                        max="99"
                        step="any"
                        value={formData.discount_percentage}
                        onChange={handleChange}
                        placeholder="eg. 30"
                        className={`w-full pl-7 pr-3 py-2 rounded-xl border text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm transition focus:outline-none focus:ring-2 ${
                          errors.discount_percentage
                            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20"
                            : "border-slate-300 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/15 bg-white"
                        }`}
                      />
                    </div>
                    {errors.discount_percentage && (
                      <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        {errors.discount_percentage}
                      </p>
                    )}
                  </div>

                  {/* Coupon Code */}
                  <div>
                    <label
                      htmlFor="coupon_code"
                      className="block text-xs font-semibold text-slate-800 mb-1"
                    >
                      Coupon Code <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Ticket className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                      <input
                        id="coupon_code"
                        name="coupon_code"
                        type="text"
                        maxLength={16}
                        value={formData.coupon_code}
                        onChange={handleChange}
                        placeholder="eg. MONSOON30"
                        className={`w-full pl-8 pr-3 py-2 border rounded-xl uppercase font-semibold tracking-wider text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm transition focus:outline-none focus:ring-2 ${
                          errors.coupon_code
                            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20"
                            : "border-slate-300 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/15 bg-white"
                        }`}
                      />
                    </div>
                    {errors.coupon_code && (
                      <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3" />
                        {errors.coupon_code}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: Specific Tests Offer Action Card (Visible ONLY for Lab: entity_type === 2) */}
            {isLab && discountType === "tests" && (
              <div className="space-y-2.5 animate-in fade-in duration-150">
                {hasConflictingPercentage && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      This is a test-based offer. The saved percentage will not
                      be used.
                    </span>
                  </div>
                )}

                <div className="p-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="space-y-0.5">
                    <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 flex-wrap">
                      <FlaskConical className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                      <span>Select Tests for Offer</span>

                      {/* Icon for view added tests (with hover tooltip on top) */}
                      {hasSelectedTests && (
                        <div
                          ref={tooltipRef}
                          className="relative inline-flex items-center"
                          onMouseEnter={handleTooltipMouseEnter}
                          onMouseLeave={handleTooltipMouseLeave}
                        >
                          <button
                            type="button"
                            onClick={() => setIsTooltipOpen((prev) => !prev)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--color-surface,#f5f3ff)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/15 border border-[var(--color-primary)]/25 text-[11px] font-semibold transition cursor-pointer shadow-2xs"
                            title="View added tests"
                            aria-label="View added tests"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>
                              {totalTests} {totalTests === 1 ? "Test" : "Tests"}
                            </span>
                          </button>

                          {/* Tooltip view on hover/click */}
                          {isTooltipOpen && (
                            <div
                              role="tooltip"
                              className="absolute left-0 bottom-full mb-2.5 w-80 sm:w-96 md:w-[420px] max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200/90 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 before:content-[''] before:absolute before:-bottom-3 before:left-0 before:right-0 before:h-3"
                              onMouseEnter={handleTooltipMouseEnter}
                              onMouseLeave={handleTooltipMouseLeave}
                            >
                              {/* Pointer Triangle */}
                              <div className="absolute -bottom-1.5 left-5 w-3 h-3 bg-white border-b border-r border-slate-200 rotate-45" />

                              {/* Tooltip Header */}
                              <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-100 relative">
                                <div className="flex items-center gap-1.5">
                                  <FlaskConical className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                                    Selected Tests
                                  </span>
                                </div>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-surface,#f5f3ff)] text-[var(--color-primary)]">
                                  {totalTests}{" "}
                                  {totalTests === 1 ? "Test" : "Tests"}
                                </span>
                              </div>

                              {/* Tests Grouped by Category */}
                              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                {testsByCategory.map(([categoryName, tests]) => (
                                  <div
                                    key={categoryName}
                                    className="rounded-xl border border-slate-200 bg-slate-50/50 p-2 space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between px-1">
                                      <span className="text-[11px] font-bold text-slate-700">
                                        {categoryName}
                                      </span>
                                      <span className="text-[10px] font-medium text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                        {tests.length}{" "}
                                        {tests.length === 1 ? "test" : "tests"}
                                      </span>
                                    </div>

                                    <div className="space-y-1">
                                      {tests.map((test) => {
                                        const currentOffer =
                                          test.offer_amount ??
                                          test.discount_price ??
                                          0;

                                        return (
                                          <div
                                            key={test.test_id}
                                            className="p-2 rounded-lg bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2.5"
                                          >
                                            <div className="min-w-0 flex-1">
                                              <div
                                                className="text-xs font-semibold text-slate-800 truncate"
                                                title={test.test_name}
                                              >
                                                {test.test_name}
                                              </div>
                                              {test.test_code && (
                                                <span className="text-[10px] font-mono text-slate-400">
                                                  {test.test_code}
                                                </span>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-3 shrink-0 text-right">
                                              <div>
                                                <div className="text-[9px] text-slate-400 font-medium uppercase">
                                                  Test Price
                                                </div>
                                                <div className="text-xs font-semibold text-slate-700">
                                                  ₹
                                                  {Number(test.price).toFixed(
                                                    2,
                                                  )}
                                                </div>
                                              </div>

                                              <div>
                                                <div className="text-[9px] text-emerald-600 font-medium uppercase">
                                                  Offer Amount
                                                </div>
                                                <div className="text-xs font-bold text-emerald-600">
                                                  ₹
                                                  {Number(currentOffer).toFixed(
                                                    2,
                                                  )}
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Summary Totals */}
                              <div className="pt-2.5 mt-2.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200/60 shadow-2xs">
                                  <div className="text-[9px] text-slate-400 font-semibold uppercase">
                                    Total Tests
                                  </div>
                                  <div className="text-xs font-bold text-slate-800 mt-0.5">
                                    {totalTests}
                                  </div>
                                </div>

                                <div className="p-1.5 bg-slate-50 rounded-lg border border-slate-200/60 shadow-2xs">
                                  <div className="text-[9px] text-slate-400 font-semibold uppercase">
                                    Total Test Price
                                  </div>
                                  <div className="text-xs font-bold text-slate-700 mt-0.5">
                                    ₹{totalTestPrice.toFixed(2)}
                                  </div>
                                </div>

                                <div className="p-1.5 bg-emerald-50/60 rounded-lg border border-emerald-200/60 shadow-2xs">
                                  <div className="text-[9px] text-emerald-600 font-semibold uppercase">
                                    Total Offer
                                  </div>
                                  <div className="text-xs font-bold text-emerald-600 mt-0.5">
                                    {totalOfferAmount > 0
                                      ? `₹${totalOfferAmount.toFixed(2)}`
                                      : "₹0.00"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Offer specific tests with a custom offer amount
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTestSelectionOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] transition shadow-2xs cursor-pointer shrink-0"
                  >
                    {hasSelectedTests ? (
                      <>
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit Selection</span>
                      </>
                    ) : (
                      <>
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Select Tests for Offer</span>
                      </>
                    )}
                  </button>
                </div>

                {errors.discount_percentage && (
                  <p className="text-xs text-rose-600 flex items-center gap-1 font-medium bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errors.discount_percentage}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Card 3: Campaign Validity Period */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs sm:text-sm">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Validity Schedule
              </span>
              {isEdit && (
                <span className="text-[11px] text-emerald-600 font-medium">
                  Modifying live campaign dates
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Campaign Start Date */}
              <div>
                <label
                  htmlFor="start_date"
                  className="block text-xs font-semibold text-slate-800 mb-1"
                >
                  Start Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="start_date"
                  name="start_date"
                  type="date"
                  min={isEdit ? undefined : today}
                  value={formData.start_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-xl border text-slate-900 text-xs sm:text-sm transition focus:outline-none focus:ring-2 ${
                    errors.start_date
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20"
                      : "border-slate-300 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/15 bg-white"
                  }`}
                />
                {errors.start_date && (
                  <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {errors.start_date}
                  </p>
                )}
              </div>

              {/* Campaign End Date */}
              <div>
                <label
                  htmlFor="end_date"
                  className="block text-xs font-semibold text-slate-800 mb-1"
                >
                  End Date <span className="text-rose-500">*</span>
                </label>
                <input
                  id="end_date"
                  name="end_date"
                  type="date"
                  min={formData.start_date || (isEdit ? undefined : today)}
                  value={formData.end_date}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-xl border text-slate-900 text-xs sm:text-sm transition focus:outline-none focus:ring-2 ${
                    errors.end_date
                      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20"
                      : "border-slate-300 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/15 bg-white"
                  }`}
                />
                {errors.end_date && (
                  <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3" />
                    {errors.end_date}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===================================================
            RIGHT COLUMN (5 COLS): Banner Image & Live Patient Voucher Preview
        ==================================================== */}
        <div className="lg:col-span-5 space-y-3.5">
          {/* Card 4: Offer Banner Image (Dropzone & Preview) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                <UploadCloud className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Offer Banner <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400">16:9 • Max 5MB</span>
            </div>

            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/jpg"
              className="hidden"
              onChange={handleImageChange}
            />

            {/* Preview or Dropzone */}
            {preview ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <div className="aspect-video max-h-40 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                  <img
                    src={preview}
                    alt="Offer banner preview"
                    className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                  />
                </div>

                {/* Overlay actions on hover */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <FolderOpen className="w-3 h-3" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>

                <div className="p-2 bg-white border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-medium text-slate-700 truncate max-w-[170px]">
                    {formData.offer_image_name || "Banner image"}
                  </span>
                  <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    Ready
                  </span>
                </div>
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5 ${
                  isDragging
                    ? "border-[var(--color-primary)] bg-[var(--color-surface)]/60"
                    : errors.offer_image
                      ? "border-rose-300 bg-rose-50/20"
                      : "border-slate-200 bg-slate-50/50 hover:border-[var(--color-primary)] hover:bg-[var(--color-surface)]/20"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  Click or drag banner here
                </p>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold text-[var(--color-primary)] bg-white border border-[var(--color-primary)]/30 rounded-md shadow-2xs">
                  Browse
                </span>
              </div>
            )}

            {errors.offer_image && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                {errors.offer_image}
              </p>
            )}
          </div>

          {/* Card 5: Live Patient Voucher Preview (What the patient will see - Exactly matching Image 2) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                <Eye className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Patient Voucher Preview
              </span>
              <span className="text-[10px] text-slate-400">Live preview</span>
            </div>

            {/* Patient Voucher Card Representation */}
            <div className="relative rounded-2xl overflow-hidden min-h-[190px] p-4 flex flex-col justify-between bg-slate-900 border border-slate-800 shadow-md">
              {/* Background Image / Overlay */}
              {preview ? (
                <div
                  className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                  style={{
                    backgroundImage: `url(${preview})`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-900/60" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900">
                  <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[var(--color-primary)]/15 blur-xl" />
                </div>
              )}

              {/* Card Header Row: Center Pill & Validity */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-medium text-white tracking-wide truncate max-w-[150px]">
                  {user?.full_name || "Medical Center"}
                </span>
                <span className="text-[11px] text-white/80 font-medium shrink-0">
                  Valid till: {formatPreviewDate(formData.end_date)}
                </span>
              </div>

              {/* Card Middle: Title, Big Yellow Discount, Description */}
              <div className="relative z-10 my-2 space-y-0.5">
                <h3 className="text-sm sm:text-base font-bold text-white tracking-tight line-clamp-1">
                  {formData.offer_title || "Special Promotional Offer"}
                </h3>
                {isLab && discountType === "tests" ? (
                  <div className="text-lg sm:text-xl font-extrabold text-amber-400 tracking-tight leading-tight">
                    {hasSelectedTests
                      ? `Offer on ${totalTests} ${totalTests === 1 ? "test" : "tests"}`
                      : "Special Lab Tests Offer"}
                  </div>
                ) : (
                  <div className="text-xl sm:text-2xl font-extrabold text-amber-400 tracking-tight leading-tight">
                    {formData.discount_percentage
                      ? `${formData.discount_percentage}% OFF`
                      : "30% OFF"}
                  </div>
                )}
                <p className="text-[11px] text-slate-200/85 line-clamp-2 leading-relaxed">
                  {formData.offer_description ||
                    "Get exclusive health and checkup discount benefits for your family."}
                </p>
              </div>

              {/* Card Footer: Coupon code box & Claim Now button */}
              <div className="relative z-10 flex items-center justify-between gap-2 pt-1">
                {isLab && discountType === "tests" ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-white/25 bg-black/40 backdrop-blur-sm text-[11px] font-bold text-amber-300 tracking-wider">
                    <FlaskConical className="w-3 h-3 text-amber-300" />
                    <span>Lab Test Offer</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-white/25 bg-black/40 backdrop-blur-sm text-[11px] font-bold text-white tracking-wider">
                    <Ticket className="w-3 h-3 text-amber-300" />
                    <span>{formData.coupon_code || "OFFER30"}</span>
                  </div>
                )}

                <span className="px-3 py-1 rounded-full bg-white text-slate-900 font-bold text-[11px] shadow-sm select-none">
                  Claim Now
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 text-center pt-1">
              This is the exact voucher card design displayed to patients on the
              booking portal.
            </p>
          </div>

          {/* Quick Submit Button in Sidebar */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="w-full py-2 px-3 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Offer...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>
                  {isEdit
                    ? "Update Promotional Offer"
                    : "Publish Promotional Offer"}
                </span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Test Selection Dialog (mode="offer") */}
      {isLab && isTestSelectionOpen && (
        <LabTestSelectionPopup
          open={isTestSelectionOpen}
          mode="offer"
          onClose={() => setIsTestSelectionOpen(false)}
          labId={activeLabId}
          selectedWalkInTests={selectedOfferTests}
          onConfirmSelection={(tests) => {
            handleConfirmOfferTests(tests);
          }}
        />
      )}
    </div>
  );
};

export default OffersDiscount;
