import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { toast } from "react-toastify";
import {
  UploadCloud,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  ArrowLeft,
  FileText,
  Sparkles,
  Clock,
  Trash2,
  FolderOpen,
} from "lucide-react";

import type { BlogFormData } from "../../types/types";
import { getSession } from "../../context/sessions/userSession";
import Loader from "../../components/shared/Loader/Loader";
import {
  createBlogApi,
  uploadBlogImageApi,
  getBlogByIdApi,
  updateBlogApi,
} from "../../api";
import {
  BLOG_CATEGORIES,
  calculateReadTime,
  getBlogImageUrl,
} from "./blogUtils";

// React 19 JSX typing compatibility wrapper for react-quill-new
const QuillEditor: any = ReactQuill;

interface BlogFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const BlogForm: React.FC<BlogFormProps> = ({ onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const { blogId } = useParams<{ blogId: string }>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    short_description: "",
    content: "",
    featured_image: null,
    featured_image_path: "",
    featured_image_guid: "",
    featured_image_name: "",
    category_id: "",
    status: true,
    clinic_id: 58,
    created_by: 160,
    modified_by: null,
  });

  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadingBlog, setLoadingBlog] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // ---------------------------------------------------------
  // Session & Load Blog for Editing
  // ---------------------------------------------------------
  useEffect(() => {
    const sessionUser = getSession("user");

    if (sessionUser) {
      setFormData((prev) => ({
        ...prev,
        clinic_id: sessionUser.clinic_id ?? 58,
        created_by: sessionUser.user_id ?? 160,
        modified_by: sessionUser.user_id ?? null,
      }));
    }

    const loadBlog = async () => {
      if (!blogId) return;

      try {
        setLoadingBlog(true);
        const response = await getBlogByIdApi(blogId);
        const blog = response.data;

        if (!blog) {
          toast.error("Blog details not found.");
          return;
        }

        setFormData((prev) => ({
          ...prev,
          title: blog.title ?? "",
          short_description: blog.short_description ?? "",
          content: blog.content ?? "",
          category_id: blog.category_id ? Number(blog.category_id) : "",
          status: blog.status ?? true,
          clinic_id: blog.clinic_id ? Number(blog.clinic_id) : prev.clinic_id,
          created_by: blog.created_by ? Number(blog.created_by) : prev.created_by,
          modified_by: sessionUser?.user_id ?? null,
          featured_image_path: blog.featured_image_path ?? "",
          featured_image_guid: blog.featured_image_guid ?? "",
          featured_image_name: blog.featured_image_name ?? "",
        }));

        const resolvedUrl = getBlogImageUrl(
          blog.featured_image_guid,
          blog.featured_image_path
        );
        setImagePreview(resolvedUrl);
        setFeaturedImage(null);
      } catch (error) {
        console.error("Failed to load blog:", error);
        toast.error("Failed to load blog details.");
      } finally {
        setLoadingBlog(false);
      }
    };

    loadBlog();
  }, [blogId]);

  // ---------------------------------------------------------
  // Quill Configuration
  // ---------------------------------------------------------
  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["blockquote", "link", "image"],
      ["clean"],
    ],
  };

  const quillFormats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "align",
    "blockquote",
    "link",
    "image",
  ];

  // ---------------------------------------------------------
  // Input Handlers
  // ---------------------------------------------------------
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : "";
    setFormData((prev) => ({
      ...prev,
      category_id: val,
    }));
    if (errors.category_id) {
      setErrors((prev) => ({ ...prev, category_id: "" }));
    }
  };

  const handleContentChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      content: value,
    }));
    if (errors.content) {
      setErrors((prev) => ({ ...prev, content: "" }));
    }
  };

  // ---------------------------------------------------------
  // Image Upload & Drag/Drop
  // ---------------------------------------------------------
  const processImageFile = (file: File) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        featured_image: "Only JPG, PNG, WEBP, or GIF images are allowed.",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        featured_image: "Image size must not exceed 5 MB.",
      }));
      return;
    }

    setFeaturedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setFormData((prev) => ({
      ...prev,
      featured_image: file,
      featured_image_name: file.name,
    }));
    setErrors((prev) => ({ ...prev, featured_image: "" }));
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

  const handleRemoveImage = () => {
    setFeaturedImage(null);
    setImagePreview("");
    setFormData((prev) => ({
      ...prev,
      featured_image: null,
      featured_image_guid: "",
      featured_image_path: "",
      featured_image_name: "",
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ---------------------------------------------------------
  // Validation
  // ---------------------------------------------------------
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Blog title is required.";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Title should be at least 5 characters.";
    }

    if (!formData.short_description.trim()) {
      newErrors.short_description = "A short summary is required.";
    }

    const plainContent = formData.content.replace(/<(.|\n)*?>/g, "").trim();
    if (!plainContent) {
      newErrors.content = "Blog content is required.";
    }

    if (!formData.category_id) {
      newErrors.category_id = "Please select a category.";
    }

    if (!formData.clinic_id) {
      newErrors.clinic_id = "Clinic identification is missing.";
    }

    if (!formData.created_by) {
      newErrors.created_by = "User session is missing.";
    }

    if (!featuredImage && !formData.featured_image_guid) {
      newErrors.featured_image = "A blog banner image is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------------------------------------
  // Submit Form
  // ---------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    try {
      setIsSubmitting(true);

      let blogPayload = {
        ...formData,
        status: true,
      };

      if (featuredImage) {
        const uploadResponse = await uploadBlogImageApi(featuredImage);

        if (!uploadResponse.files || uploadResponse.files.length === 0) {
          throw new Error("Image upload returned an empty file list.");
        }

        const uploadedFile = uploadResponse.files[0];
        blogPayload = {
          ...blogPayload,
          featured_image_path: `${uploadedFile.path}\\${uploadedFile.guid_name}`,
          featured_image_guid: uploadedFile.guid_name,
          featured_image_name: uploadedFile.file_name,
        };
      }

      const res = blogId
        ? await updateBlogApi(blogId, blogPayload)
        : await createBlogApi(blogPayload);

      toast.success(
        res?.data?.message ||
          (blogId
            ? "Blog updated successfully!"
            : "Blog published successfully!")
      );

      handleReset();

      if (onSuccess) {
        onSuccess();
      } else {
        navigate("/clinic/BlogTabs");
      }
    } catch (error: any) {
      console.error("BLOG SAVE ERROR:", error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Something went wrong while saving the blog.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // Reset Form
  // ---------------------------------------------------------
  const handleReset = () => {
    const sessionUser = getSession("user");
    setFormData({
      title: "",
      short_description: "",
      content: "",
      featured_image: null,
      featured_image_path: "",
      featured_image_guid: "",
      featured_image_name: "",
      category_id: "",
      status: true,
      clinic_id: sessionUser?.clinic_id ?? 58,
      created_by: sessionUser?.user_id ?? 160,
      modified_by: null,
    });
    setFeaturedImage(null);
    setImagePreview("");
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const readTimeEstimate = calculateReadTime(formData.content);

  const sessionUser = getSession("user");
  const isAuthorized = Boolean(
    sessionUser?.user_id &&
      (sessionUser?.role?.toLowerCase() === "admin" || sessionUser?.clinic_id)
  );

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-8 p-6 text-center bg-white rounded-2xl border border-rose-200 shadow-2xs">
        <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2.5">
          <AlertCircle className="w-5 h-5" />
        </div>
        <h2 className="text-base font-bold text-slate-900 mb-1">
          Admin Authorization Required
        </h2>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Creating and editing articles is restricted to clinic administrators.
          Please log in with an authorized clinic account.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Link
            to="/blog"
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
          >
            View Articles
          </Link>
          <Link
            to="/login"
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (loadingBlog) {
    return <Loader message="Loading article details..." />;
  }

  return (
    <div className="w-full space-y-3">
      {/* =====================================================
          SLIM ACTION BAR (COMPACT & FITTED)
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {blogId && (
            <Link
              to="/clinic/BlogTabs"
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700 transition mr-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </Link>
          )}
          <span className="text-sm font-bold text-slate-800">
            {blogId ? "Edit Article" : "Create New Article"}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium bg-sky-50 text-sky-700 border border-sky-100">
            <Sparkles className="w-2.5 h-2.5 text-sky-500" />
            {blogId ? "Editing" : "Draft"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel || handleReset}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg shadow-2xs transition disabled:opacity-50 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-slate-500" />
            <span>{blogId ? "Discard" : "Reset"}</span>
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 active:from-sky-700 active:to-sky-800 rounded-lg shadow-2xs transition disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{blogId ? "Update Article" : "Publish Article"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* =====================================================
          TWO-COLUMN FITTED EDITORIAL FORM
      ====================================================== */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* ===================================================
            LEFT COLUMN (8 COLS): Title, Summary, Body Content
        ==================================================== */}
        <div className="lg:col-span-8 space-y-3.5">
          {/* Card 1: Article Essentials */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="flex items-center gap-1.5 text-slate-800 font-semibold text-xs sm:text-sm">
                <FileText className="w-3.5 h-3.5 text-sky-600" />
                Article Essentials
              </span>
              <span className="text-[11px] text-slate-400">* Required</span>
            </div>

            {/* Title Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="blog-title"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Article Title <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {formData.title.length} chars
                </span>
              </div>
              <input
                id="blog-title"
                name="title"
                type="text"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. Essential Guidelines for Managing Type 2 Diabetes"
                className={`w-full px-3 py-2 rounded-xl border text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm transition focus:outline-none focus:ring-2 ${
                  errors.title
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20"
                    : "border-slate-300 focus:border-sky-500 focus:ring-sky-500/15 bg-white"
                }`}
              />
              {errors.title && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.title}
                </p>
              )}
            </div>

            {/* Short Description Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="short_description"
                  className="block text-xs font-semibold text-slate-800"
                >
                  Short Summary / Excerpt <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400">
                  {formData.short_description.length} chars
                </span>
              </div>
              <textarea
                id="short_description"
                name="short_description"
                rows={2}
                value={formData.short_description}
                onChange={handleChange}
                placeholder="Write a clear 1-2 sentence overview for cards and search snippets..."
                className={`w-full px-3 py-2 rounded-xl border text-slate-900 placeholder:text-slate-400 text-xs sm:text-sm leading-relaxed transition focus:outline-none focus:ring-2 resize-y ${
                  errors.short_description
                    ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20"
                    : "border-slate-300 focus:border-sky-500 focus:ring-sky-500/15 bg-white"
                }`}
              />
              {errors.short_description && (
                <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.short_description}
                </p>
              )}
            </div>
          </div>

          {/* Card 2: Rich Article Content (ReactQuill) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 space-y-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-semibold text-slate-800 text-xs sm:text-sm">
                Article Body Content <span className="text-rose-500">*</span>
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Est. {readTimeEstimate}</span>
              </div>
            </div>

            <div
              className={`rounded-xl overflow-hidden border transition ${
                errors.content
                  ? "border-rose-400 ring-2 ring-rose-500/15"
                  : "border-slate-200 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/15"
              }`}
            >
              <div className="bg-white">
                <QuillEditor
                  theme="snow"
                  value={formData.content}
                  onChange={handleContentChange}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="Draft your full medical article here. Format with headings, quotes, bullet points..."
                  className="article-quill-editor"
                />
              </div>
            </div>

            {errors.content && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                {errors.content}
              </p>
            )}
          </div>
        </div>

        {/* ===================================================
            RIGHT COLUMN (4 COLS): Banner, Taxonomy, Publishing
        ==================================================== */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Card 3: Featured Banner Image */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2.5">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                Banner Image <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400">16:9 • Max 5MB</span>
            </div>

            {/* Hidden Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleImageChange}
            />

            {/* Preview or Dropzone */}
            {imagePreview ? (
              <div className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
                <div className="aspect-video max-h-36 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Featured preview"
                    className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                  />
                </div>

                {/* Overlay actions on hover */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg shadow-2xs flex items-center gap-1 cursor-pointer"
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
                  <span className="font-medium text-slate-700 truncate max-w-[140px]">
                    {formData.featured_image_name || "Banner image"}
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
                    ? "border-sky-500 bg-sky-50/60"
                    : errors.featured_image
                    ? "border-rose-300 bg-rose-50/20"
                    : "border-slate-200 bg-slate-50/50 hover:border-sky-400 hover:bg-sky-50/20"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-sky-100/70 text-sky-600 flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-800">
                  Click or drag banner here
                </p>
                <span className="px-2.5 py-0.5 text-[11px] font-semibold text-sky-700 bg-white border border-sky-200 rounded-md shadow-2xs">
                  Browse
                </span>
              </div>
            )}

            {errors.featured_image && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                {errors.featured_image}
              </p>
            )}
          </div>

          {/* Card 4: Taxonomy & Category */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="font-semibold text-slate-800 text-xs">
                Category Specialty <span className="text-rose-500">*</span>
              </span>
            </div>

            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleCategoryChange}
              className={`w-full px-3 py-2 rounded-xl border text-xs text-slate-900 bg-white transition focus:outline-none focus:ring-2 ${
                errors.category_id
                  ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15"
                  : "border-slate-300 focus:border-sky-500 focus:ring-sky-500/15"
              }`}
            >
              <option value="">-- Select Category --</option>
              {Object.values(BLOG_CATEGORIES).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {errors.category_id && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                {errors.category_id}
              </p>
            )}

            {formData.category_id && (
              <p className="text-[11px] text-slate-500 pt-0.5">
                {BLOG_CATEGORIES[Number(formData.category_id)]?.description}
              </p>
            )}
          </div>

          {/* Card 5: Publishing & Metadata */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="font-semibold text-slate-800 text-xs">Publishing Details</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Public
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="block text-[10px] text-slate-400">Clinic ID</span>
                <span className="font-semibold text-slate-700">{formData.clinic_id || 58}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                <span className="block text-[10px] text-slate-400">Author ID</span>
                <span className="font-semibold text-slate-700">{formData.created_by || 160}</span>
              </div>
            </div>

            {/* Quick Submit inside Sidebar too */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-sky-700 hover:from-sky-500 hover:to-sky-600 active:from-sky-700 active:to-sky-800 rounded-xl shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>{blogId ? "Update Article" : "Publish Article"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default BlogForm;
