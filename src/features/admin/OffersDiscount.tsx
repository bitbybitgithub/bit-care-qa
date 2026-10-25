import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { toast } from "react-toastify";
import type {
  OfferForm,
  ValidationErrors,
  PromotionalOffer,
} from "../../types/types";
import { offersdiscountApi, uploadOfferImageApi } from "../../api";
import { getSession } from "../../context/sessions/userSession";
import { BASE_URL } from "../../services/EmrApi";

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

  useEffect(() => {
    if (!isEdit || !selectedOffer) return;

    setIsActive(Number(selectedOffer.is_active ?? 1));

    const parseToDateInput = (val?: string | null) => {
      if (!val) return "";
      try {
        const d = new Date(val);
        if (Number.isNaN(d.getTime())) return "";
        return d.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      } catch {
        return "";
      }
    };

    setFormData({
      offer_id: selectedOffer.offer_id,
      offer_title: selectedOffer.offer_title ?? "",
      offer_description: selectedOffer.offer_description ?? "",
      offer_image: null,
      offer_image_path: selectedOffer.offer_image_path ?? "",
      offer_image_guid: selectedOffer.offer_image_guid ?? "",
      offer_image_name: selectedOffer.offer_image_name ?? "",
      discount_percentage: selectedOffer.discount_percentage ?? "",
      coupon_code: selectedOffer.coupon_code ?? "",
      start_date: parseToDateInput(selectedOffer.start_date),
      end_date: parseToDateInput(selectedOffer.end_date),
      priority: selectedOffer.priority ?? 0,
      created_by: user?.user_id ?? 0,
    });

    if (selectedOffer.offer_image_guid) {
      setPreview(
        `${BASE_URL}/patient/patients/offer-images/${selectedOffer.offer_image_guid}`,
      );
    } else {
      setPreview("");
    }
  }, [isEdit, selectedOffer]);

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

    const discount = Number(formData.discount_percentage);
    if (
      formData.discount_percentage === "" ||
      discount <= 0 ||
      discount >= 100
    ) {
      newErrors.discount_percentage =
        "Discount must be greater than 0% and less than 100%.";
    }

    if (!formData.coupon_code.trim()) {
      newErrors.coupon_code = "Coupon Code is required.";
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

      const offerData = {
        ...formData,
        offer_id: isEdit ? selectedOffer!.offer_id : null,
        is_active: isEdit ? isActive : 1,
        center_id: centerId,
        entity_type: user?.entity_type,
        center_name: user?.full_name,
        center_type: user?.entity_name,
        created_by: user?.user_id ?? 0,
        modified_by: isEdit ? (user?.user_id ?? 0) : null,
        offer_image_path: imagePath,
        offer_image_guid: imageGuid,
        offer_image_name: imageName,
      };

      const res = await offersdiscountApi(offerData);
      toast.success(
        res?.message ||
          (isEdit
            ? "Offer updated successfully!"
            : "Offer created successfully!"),
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
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-800">
            {isEdit ? "Update Promotional Offer" : "Create Promotional Offer"}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
            <Sparkles className="w-2.5 h-2.5 text-[var(--color-primary)]" />
            {isEdit ? `ID #${selectedOffer?.offer_id}` : "Draft Campaign"}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Clean minimal Active/Inactive toggle switch */}
          {isEdit && (
            <button
              type="button"
              onClick={() => setIsActive((prev) => (prev === 1 ? 0 : 1))}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer select-none"
              title="Toggle active status">
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
                    : "text-slate-600"
                }>
                {isActive === 1 ? "Active" : "Inactive"}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={isEdit && onCancel ? onCancel : handleReset}
            disabled={loading}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer">
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>{isEdit ? "Discard" : "Reset"}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-lg shadow-2xs transition disabled:opacity-60 cursor-pointer">
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
        className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
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
                  className="block text-xs font-semibold text-slate-800">
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
                  className="block text-xs font-semibold text-slate-800">
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

          {/* Card 2: Discount & Redemption Code */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs sm:text-sm">
                <Tag className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                Discount & Coupon
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Discount Percentage */}
              <div>
                <label
                  htmlFor="discount_percentage"
                  className="block text-xs font-semibold text-slate-800 mb-1">
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
                  className="block text-xs font-semibold text-slate-800 mb-1">
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
                  className="block text-xs font-semibold text-slate-800 mb-1">
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
                  className="block text-xs font-semibold text-slate-800 mb-1">
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
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer">
                    <FolderOpen className="w-3 h-3" />
                    Replace
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer">
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
                }`}>
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
                  }}>
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
                <div className="text-xl sm:text-2xl font-extrabold text-amber-400 tracking-tight leading-tight">
                  {formData.discount_percentage
                    ? `${formData.discount_percentage}% OFF`
                    : "30% OFF"}
                </div>
                <p className="text-[11px] text-slate-200/85 line-clamp-2 leading-relaxed">
                  {formData.offer_description ||
                    "Get exclusive health and checkup discount benefits for your family."}
                </p>
              </div>

              {/* Card Footer: Coupon code box & Claim Now button */}
              <div className="relative z-10 flex items-center justify-between gap-2 pt-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-white/25 bg-black/40 backdrop-blur-sm text-[11px] font-bold text-white tracking-wider">
                  <Ticket className="w-3 h-3 text-amber-300" />
                  <span>{formData.coupon_code || "OFFER30"}</span>
                </div>

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
            className="w-full py-2 px-3 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60">
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
    </div>
  );
};

export default OffersDiscount;
