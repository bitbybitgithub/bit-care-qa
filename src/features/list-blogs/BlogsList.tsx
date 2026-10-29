import React, { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import {
  Search,
  X,
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  Edit3,
  Share2,
  Check,
  BookOpen,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Layers,
  Heart,
  Activity,
  Apple,
  Mail,
  PlusCircle,
  CheckCircle2,
  TrendingUp,
  Building2,
  LayoutGrid,
  List as ListIcon,
  HelpCircle,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
  Microscope,
  Pill,
  Baby,
  Bone,
  Brain,
  Shield,
} from "lucide-react";
import { toast } from "react-toastify";

import BitCareLogo from "../../assets/BitCareLogo.png";
import { getBlogListApi, getBlogByIdApi } from "../../api";
import type { BlogFormData } from "../../types/types";
import { getSession } from "../../context/sessions/userSession";
import Loader from "../../components/shared/Loader/Loader";
import {
  getBlogImageUrl,
  getCategoryMeta,
  calculateReadTime,
  formatBlogDate,
  FallbackBanner,
  BLOG_CATEGORIES,
  EntityAvatar,
  getAdminEntityInfo,
  getEntityTypeLabel,
  getEntityBadgeLabel,
  getEntityContactLabel,
} from "../admin/blogUtils";

// ============================================================================
// Patient View Top Navigation & Branding Header
// ============================================================================

const PatientNavbar: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 sm:h-20 flex items-center justify-between gap-4">
        {/* Left: BitCare Logo & Health Library Title (Enlarged & Prominent) */}
        <div
          onClick={() => navigate("/blog")}
          className="flex items-center gap-3.5 sm:gap-4 cursor-pointer group select-none"
          role="button"
          tabIndex={0}
        >
          <img
            src={BitCareLogo}
            alt="BitCare"
            className="h-11 sm:h-13 md:h-14 w-auto object-contain transition-transform group-hover:scale-102 drop-shadow-2xs"
          />
          <div className="hidden sm:flex flex-col border-l border-slate-200/90 pl-3.5 py-0.5">
            <span className="text-sm font-extrabold text-slate-900 tracking-tight leading-tight">
              Health Library
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Patient Education & Wellness
            </span>
          </div>
        </div>

        {/* Right: Medical Trust Badge & Portal Link */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Verified Medical Articles</span>
          </div>

          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span>Provider Portal</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
};

// ============================================================================
// Horizontal List Item (Modern Magazine Blog Layout)
// ============================================================================

interface BlogListItemProps {
  blog: BlogFormData;
  index: number;
  canEdit: boolean;
  isAdminView?: boolean;
  onRead: (id: number | string) => void;
  onEdit: (id: number | string) => void;
}

const BlogListItem: React.FC<BlogListItemProps> = ({
  blog,
  index,
  canEdit,
  isAdminView = false,
  onRead,
  onEdit,
}) => {
  const [imageFailed, setImageFailed] = useState<boolean>(false);
  const imageUrl = getBlogImageUrl(
    blog.featured_image_guid,
    blog.featured_image_path
  );
  const cat = getCategoryMeta(blog.category_id);
  const readTime = calculateReadTime(blog.content || blog.short_description);
  const formattedDate = formatBlogDate(blog.created_date);

  const getCategoryIcon = () => {
    switch (cat.iconType) {
      case "heart":
        return <Heart className="w-2.5 h-2.5" />;
      case "activity":
        return <Activity className="w-2.5 h-2.5" />;
      case "apple":
        return <Apple className="w-2.5 h-2.5" />;
      case "microscope":
        return <Microscope className="w-2.5 h-2.5" />;
      case "pill":
        return <Pill className="w-2.5 h-2.5" />;
      case "baby":
        return <Baby className="w-2.5 h-2.5" />;
      case "bone":
        return <Bone className="w-2.5 h-2.5" />;
      case "brain":
        return <Brain className="w-2.5 h-2.5" />;
      case "shield":
        return <Shield className="w-2.5 h-2.5" />;
      default:
        return <Sparkles className="w-2.5 h-2.5" />;
    }
  };

  const isPublished = blog.status === true || String(blog.status) === "1";

  return (
    <article
      onClick={() => onRead(blog.blog_id || "")}
      className="group relative flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-4 sm:gap-6 bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-4 sm:p-5 shadow-xs hover:shadow-xl hover:shadow-[var(--color-primary)]/10 hover:border-[var(--color-primary-light)] transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer overflow-hidden"
      style={{
        animationDelay: `${Math.min(index * 40, 300)}ms`,
      }}
    >
      {/* Left: Article Details */}
      <div className="flex flex-col justify-between flex-1 min-w-0">
        <div>
          {/* Top Author & Meta Row */}
          <div className="flex flex-wrap items-center gap-2 mb-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <EntityAvatar
                name={blog.entity_name}
                logo={blog.entity_logo}
                size="xs"
              />
              <span
                className="font-bold text-slate-800 hover:text-[var(--color-primary)] transition truncate max-w-[150px] sm:max-w-[200px]"
                title={blog.entity_name || "Healthcare Partner"}
              >
                {blog.entity_name || "Healthcare Partner"}
              </span>
              {blog.entity_type && (
                <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
                  {getEntityTypeLabel(blog.entity_type)}
                </span>
              )}
            </div>

            <span className="text-slate-300">•</span>

            <span className="text-[11px] text-slate-400 font-medium">
              {formattedDate}
            </span>

            <span className="text-slate-300">•</span>

            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-2.5 h-2.5" />
              {readTime}
            </span>

            {isAdminView && (
              <span
                className={`ml-auto inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                  isPublished
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {isPublished ? "Published" : "Draft"}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 leading-snug mb-2">
            {blog.title}
          </h3>

          {/* Excerpt */}
          <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 sm:line-clamp-3 leading-relaxed mb-4">
            {blog.short_description}
          </p>
        </div>

        {/* Bottom Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100/90 mt-auto">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${cat.badgeClass}`}
            >
              {getCategoryIcon()}
              {cat.name}
            </span>

            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
              <ShieldCheck className="w-3 h-3" />
              Verified Guide
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {blog.entity_email && (
              <span
                className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400"
                title={blog.entity_email}
              >
                <Mail className="w-2.5 h-2.5" />
                <span className="max-w-[150px] truncate">{blog.entity_email}</span>
              </span>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRead(blog.blog_id || "");
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition cursor-pointer"
            >
              <span>Read Article</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
            </button>

            {canEdit && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(blog.blog_id || "");
                }}
                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
                title="Edit article"
              >
                <Edit3 className="w-3 h-3 text-slate-500" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: Featured Thumbnail (Strictly uniform dimensions across all list items) */}
      <div className="relative w-full sm:w-56 md:w-64 h-48 sm:h-44 md:h-44 rounded-xl sm:rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80 shadow-2xs self-center">
        {!imageFailed && imageUrl ? (
          <img
            src={imageUrl}
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => setImageFailed(true)}
            loading="lazy"
          />
        ) : (
          <FallbackBanner categoryId={blog.category_id} title={blog.title} />
        )}
      </div>
    </article>
  );
};

// ============================================================================
// Single Blog Card (Grid Card Item for Admin View or Grid Switch)
// ============================================================================

interface BlogCardItemProps {
  blog: BlogFormData;
  index: number;
  canEdit: boolean;
  isAdminView?: boolean;
  onRead: (id: number | string) => void;
  onEdit: (id: number | string) => void;
}

const BlogCardItem: React.FC<BlogCardItemProps> = ({
  blog,
  index,
  canEdit,
  isAdminView = false,
  onRead,
  onEdit,
}) => {
  const [imageFailed, setImageFailed] = useState<boolean>(false);
  const imageUrl = getBlogImageUrl(
    blog.featured_image_guid,
    blog.featured_image_path
  );
  const cat = getCategoryMeta(blog.category_id);
  const readTime = calculateReadTime(blog.content || blog.short_description);
  const formattedDate = formatBlogDate(blog.created_date);

  const getCategoryIcon = () => {
    switch (cat.iconType) {
      case "heart":
        return <Heart className="w-2.5 h-2.5" />;
      case "activity":
        return <Activity className="w-2.5 h-2.5" />;
      case "apple":
        return <Apple className="w-2.5 h-2.5" />;
      case "microscope":
        return <Microscope className="w-2.5 h-2.5" />;
      case "pill":
        return <Pill className="w-2.5 h-2.5" />;
      case "baby":
        return <Baby className="w-2.5 h-2.5" />;
      case "bone":
        return <Bone className="w-2.5 h-2.5" />;
      case "brain":
        return <Brain className="w-2.5 h-2.5" />;
      case "shield":
        return <Shield className="w-2.5 h-2.5" />;
      default:
        return <Sparkles className="w-2.5 h-2.5" />;
    }
  };

  const isPublished = blog.status === true || String(blog.status) === "1";

  return (
    <article
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:shadow-[var(--color-primary)]/10 hover:border-[var(--color-primary-light)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
      style={{
        animationDelay: `${Math.min(index * 50, 300)}ms`,
      }}
    >
      {/* ----------------- BANNER / IMAGE ----------------- */}
      <div
        className="relative aspect-[16/10] h-48 w-full overflow-hidden bg-slate-100 cursor-pointer"
        onClick={() => onRead(blog.blog_id || "")}
      >
        {!imageFailed && imageUrl ? (
          <img
            src={imageUrl}
            alt={blog.title}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            onError={() => setImageFailed(true)}
            loading="lazy"
          />
        ) : (
          <FallbackBanner categoryId={blog.category_id} title={blog.title} />
        )}

        {/* Floating Top Left Category Pill */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-semibold rounded-full backdrop-blur-md shadow-2xs border ${cat.badgeClass} bg-white/95`}
          >
            {getCategoryIcon()}
            {cat.name}
          </span>
        </div>

        {/* Floating Top Right: Status or Read Time */}
        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5">
          {isAdminView && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold backdrop-blur-md rounded-full shadow-2xs border ${
                isPublished
                  ? "bg-emerald-500/90 text-white border-emerald-400/40"
                  : "bg-amber-500/90 text-white border-amber-400/40"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              {isPublished ? "Published" : "Draft"}
            </span>
          )}

          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-white bg-slate-900/75 backdrop-blur-md rounded-full shadow-2xs">
            <Clock className="w-2.5 h-2.5 text-slate-300" />
            {readTime}
          </span>
        </div>
      </div>

      {/* ----------------- CONTENT BODY ----------------- */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        {/* Date Row */}
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1.5">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span>{formattedDate}</span>
          <span>•</span>
          <span className="text-emerald-600 font-medium inline-flex items-center gap-0.5">
            <ShieldCheck className="w-3 h-3" />
            Verified Guide
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onRead(blog.blog_id || "")}
          className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 leading-snug cursor-pointer mb-2"
        >
          {blog.title}
        </h3>

        {/* Short Description */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-3.5">
          {blog.short_description}
        </p>

        {/* ----------------- ENTITY / AUTHOR SHOWCASE ----------------- */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <EntityAvatar
              name={blog.entity_name}
              logo={blog.entity_logo}
              size="sm"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-xs font-semibold text-slate-800 truncate block hover:text-[var(--color-primary)] transition"
                  title={blog.entity_name || "Healthcare Partner"}
                >
                  {blog.entity_name || "Healthcare Partner"}
                </span>
                {blog.entity_type && (
                  <span className="shrink-0 text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 capitalize">
                    {blog.entity_type}
                  </span>
                )}
              </div>
              {blog.entity_email ? (
                <span
                  className="text-[11px] text-slate-400 truncate flex items-center gap-1"
                  title={blog.entity_email}
                >
                  <Mail className="w-2.5 h-2.5 shrink-0 text-slate-400" />
                  <span className="truncate">{blog.entity_email}</span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 truncate block">
                  BitCare Medical Contributor
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ----------------- FOOTER ACTIONS ----------------- */}
        <div className="mt-3 pt-2.5 border-t border-slate-100/70 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => onRead(blog.blog_id || "")}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dark)] transition cursor-pointer group/link"
          >
            <span>Read Article</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/link:translate-x-1" />
          </button>

          {/* EDIT BUTTON: ONLY SHOWN TO CLINIC ADMINS IN CLINIC PATH */}
          {canEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(blog.blog_id || "");
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition cursor-pointer"
              title="Edit article"
            >
              <Edit3 className="w-3 h-3 text-slate-500" />
              <span>Edit</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};

// ============================================================================
// Modern Responsive Pagination Component
// ============================================================================

interface PaginationBarProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (newSize: number) => void;
}

const getPageNumbers = (current: number, total: number): (number | string)[] => {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }

  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }

  return [1, "...", current - 1, current, current + 1, "...", total];
};

const PaginationBar: React.FC<PaginationBarProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
}) => {
  if (totalItems === 0) return null;

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);
  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:px-4 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 select-none">
      {/* Left: Summary Count & Items Per Page Selector */}
      <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2.5 w-full sm:w-auto text-xs text-slate-500">
        <div>
          Showing <span className="font-bold text-slate-800">{startIndex}</span>–
          <span className="font-bold text-slate-800">{endIndex}</span> of{" "}
          <span className="font-bold text-slate-800">{totalItems}</span> articles
        </div>

        <div className="flex items-center gap-1.5 pl-2 sm:border-l sm:border-slate-200">
          <span className="hidden md:inline text-slate-400">Show:</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition cursor-pointer"
          >
            <option value={10}>10 / page</option>
            <option value={12}>12 / page</option>
            <option value={15}>15 / page</option>
            <option value={20}>20 / page</option>
          </select>
        </div>
      </div>

      {/* Right: Modern Fluid Pagination Buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
          {/* Previous Button */}
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {pages.map((p, idx) =>
              p === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-slate-400 text-xs font-medium"
                >
                  …
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => onPageChange(Number(p))}
                  className={`w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-xs font-bold rounded-xl transition cursor-pointer ${
                    currentPage === p
                      ? "bg-[var(--color-primary)] text-white shadow-xs scale-105"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent hover:border-slate-200"
                  }`}
                  aria-label={`Page ${p}`}
                  aria-current={currentPage === p ? "page" : undefined}
                >
                  {p}
                </button>
              )
            )}
          </div>

          {/* Next Button */}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer shadow-2xs"
            aria-label="Next Page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Main BlogsList Component
// ============================================================================

export interface BlogsListProps {
  adminView?: boolean;
  onCreateArticle?: () => void;
}

export const BlogsList: React.FC<BlogsListProps> = ({
  adminView = false,
  onCreateArticle,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { blogId } = useParams<{ blogId?: string }>();

  // Role and route detection
  const sessionUser = getSession("user");
  const isClinicPath = location.pathname.startsWith("/clinic") || adminView;
  const isClinicAdmin = Boolean(
    sessionUser?.user_id &&
      (sessionUser?.role?.toLowerCase() === "admin" ||
        sessionUser?.clinic_id ||
        sessionUser?.entity_id)
  );

  // Extract admin entity information (e.g. id=60, type="clinic")
  const adminEntity = useMemo(
    () => getAdminEntityInfo(sessionUser),
    [sessionUser]
  );

  // STRICT EDITING CONDITION:
  // Only clinic admins accessing from within the clinic portal are allowed to edit!
  // Any public/general route (/blog, /bloglist, /blogs, /blog/:blogId) is STRICTLY VIEW-ONLY!
  const canEdit = isClinicPath && isClinicAdmin;

  // View Mode: Patient view defaults to "list", Admin view defaults to "grid"
  const [viewMode, setViewMode] = useState<"list" | "grid">(
    isClinicPath ? "grid" : "list"
  );

  const [blogs, setBlogs] = useState<BlogFormData[]>([]);
  const [blog, setBlog] = useState<BlogFormData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [detailImageFailed, setDetailImageFailed] = useState<boolean>(false);

  // Fetch blogs or single blog based on URL param and current view mode
  useEffect(() => {
    let isMounted = true;

    const fetchContent = async () => {
      try {
        setLoading(true);
        setError("");

        if (blogId) {
          // Fetch single blog by ID
          const response = await getBlogByIdApi(blogId);
          if (isMounted) {
            setBlog(response.data);
            setDetailImageFailed(false);
          }
        } else {
          // Fetch blogs list
          // Admin view: strictly entity-isolated data query (?id=60&type=clinic)
          // Patient view: query without parameters (/blogs)
          let response;
          if (isClinicPath && adminEntity.id && adminEntity.type) {
            response = await getBlogListApi({
              id: adminEntity.id,
              type: adminEntity.type,
            });
          } else {
            response = await getBlogListApi();
          }

          if (isMounted) {
            setBlogs(response.data || []);
          }
        }
      } catch (err: any) {
        console.error("GET BLOG ERROR:", err);
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
              err?.message ||
              "Unable to load articles at this time. Please try again."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchContent();

    return () => {
      isMounted = false;
    };
  }, [blogId, isClinicPath, adminEntity.id, adminEntity.type]);

  // Filtered blogs list (Search + Category)
  const filteredBlogs = useMemo(() => {
    return blogs.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" ||
        Number(item.category_id) === Number(selectedCategory);

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.short_description?.toLowerCase().includes(query) ||
        item.entity_name?.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [blogs, selectedCategory, searchQuery]);

  // Pagination State (Default 10 items per page, configurable 10, 12, 15, 20)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const listTopRef = useRef<HTMLDivElement | null>(null);

  // Total pages
  const totalPages = Math.ceil(filteredBlogs.length / itemsPerPage) || 1;

  // Reset to page 1 whenever search, category, or itemsPerPage changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, itemsPerPage]);

  // Adjust if currentPage exceeds totalPages
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Paginated articles slice for current page
  const paginatedBlogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBlogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBlogs, currentPage, itemsPerPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    if (listTopRef.current) {
      listTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: blogs.length };
    blogs.forEach((b) => {
      const catId = String(b.category_id);
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
  }, [blogs]);

  // Distinct contributing clinics extracted from loaded blogs
  const contributingClinics = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        email?: string;
        logo?: string;
        type?: string;
        count: number;
      }
    >();

    blogs.forEach((b) => {
      if (!b.entity_name && !b.entity_id) return;
      const key = b.entity_name || String(b.entity_id);
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          name: b.entity_name || "Healthcare Provider",
          email: b.entity_email || undefined,
          logo: b.entity_logo || undefined,
          type: b.entity_type || "Provider",
          count: 1,
        });
      }
    });

    return Array.from(map.values()).slice(0, 5);
  }, [blogs]);

  // Top / trending articles for the sidebar widget
  const trendingArticles = useMemo(() => {
    return blogs.slice(0, 4);
  }, [blogs]);

  // Navigation handlers
  const handleReadBlog = (id: number | string) => {
    if (isClinicPath) {
      navigate(`/clinic/blog/${id}`);
    } else {
      navigate(`/blog/${id}`);
    }
  };

  const handleEditBlog = (id: number | string) => {
    if (!canEdit) {
      toast.warn("Editing is restricted to clinic administrators.");
      return;
    }
    navigate(`/clinic/BlogTabs/blog/edit/${id}`);
  };

  const handleBackToBlogs = () => {
    if (isClinicPath) {
      navigate("/clinic/BlogTabs?tab=view");
    } else {
      navigate("/blog");
    }
  };

  const handleShareLink = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      toast.success("Article link copied to clipboard!");
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.info("Link: " + window.location.href);
    }
  };

  // ==========================================================================
  // LOADING STATE (Using Project Default Loader)
  // ==========================================================================
  if (loading) {
    return (
      <Loader message={blogId ? "Loading article..." : "Loading articles..."} />
    );
  }

  // ==========================================================================
  // VIEW B: SINGLE BLOG ARTICLE DETAIL VIEW (HIGHLIGHTED ENTITY DETAILS)
  // ==========================================================================
  if (blogId) {
    if (error || !blog) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          {!isClinicPath && <PatientNavbar />}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full p-6 text-center bg-white rounded-2xl border border-rose-200 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">
                Article Not Found
              </h2>
              <p className="text-slate-600 mb-4 text-xs">
                {error ||
                  "The article you are looking for may have been removed or is temporarily unavailable."}
              </p>
              <button
                type="button"
                onClick={handleBackToBlogs}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Articles
              </button>
            </div>
          </div>
        </div>
      );
    }

    const cat = getCategoryMeta(blog.category_id);
    const readTime = calculateReadTime(blog.content || blog.short_description);
    const formattedDate = formatBlogDate(blog.created_date);
    const resolvedBannerUrl = getBlogImageUrl(
      blog.featured_image_guid,
      blog.featured_image_path
    );

    return (
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50/50 to-white flex flex-col">
        {/* Patient View Sticky Navbar with BitCare Branding */}
        {!isClinicPath && <PatientNavbar />}

        <div className="flex-1 py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
          <main className="w-full max-w-5xl mx-auto space-y-4">
            {/* Top Bar: Back & Share & Edit */}
            <div className="flex items-center justify-between gap-2.5 pb-2 border-b border-slate-200/80">
              <button
                type="button"
                onClick={handleBackToBlogs}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
                <span>Back to Blogs</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleShareLink}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs transition cursor-pointer"
                  title="Share article"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Share</span>
                    </>
                  )}
                </button>

                {/* EDIT ARTICLE BUTTON: ONLY SHOWN TO CLINIC ADMINS IN CLINIC PATH */}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleEditBlog(blog.blog_id || blogId)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] border border-[var(--color-primary)]/20 rounded-xl shadow-2xs transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Article</span>
                  </button>
                )}
              </div>
            </div>

            {/* Clean Magazine Reading Card (Fully Responsive) */}
            <article className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-7 lg:p-10 space-y-6">
              {/* Split Header: Stack on mobile, Side-by-side on desktop */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start pb-5 sm:pb-6 border-b border-slate-100">
                <div className="lg:col-span-7 space-y-3">
                  {/* Category & Meta Pills */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-full border ${cat.badgeClass}`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: cat.chipColor }}
                      />
                      {cat.name}
                    </span>

                    <span className="text-slate-300">•</span>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>{formattedDate}</span>
                    </div>

                    <span className="text-slate-300">•</span>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{readTime}</span>
                    </div>
                  </div>

                  {/* Article Headline */}
                  <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                    {blog.title}
                  </h1>

                  {/* Excerpt / Summary */}
                  {blog.short_description && (
                    <div className="p-3 sm:p-3.5 rounded-2xl bg-[var(--color-surface)]/70 border-l-4 border-[var(--color-primary)] text-slate-700 text-xs sm:text-sm leading-relaxed font-medium">
                      {blog.short_description}
                    </div>
                  )}

                  {/* =====================================================
                      PROMINENT CLINICAL ENTITY SHOWCASE (HIGHLIGHTED)
                  ====================================================== */}
                  <div className="relative overflow-hidden rounded-2xl p-3.5 sm:p-4 bg-gradient-to-r from-teal-50/90 via-sky-50/60 to-emerald-50/50 border-2 border-teal-200/90 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Avatar + Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <EntityAvatar
                            name={blog.entity_name}
                            logo={blog.entity_logo}
                            size="lg"
                            className="ring-3 ring-white shadow-xs"
                          />
                          <span
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white"
                            title="Verified Healthcare Provider"
                          >
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-teal-700 text-white shadow-2xs">
                              {getEntityBadgeLabel(blog.entity_type)}
                            </span>
                            {blog.entity_type && (
                              <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-white text-teal-800 border border-teal-200">
                                {getEntityTypeLabel(blog.entity_type)}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 mt-0.5 truncate">
                            {blog.entity_name || "Verified Healthcare Partner"}
                          </h4>

                          {blog.entity_email && (
                            <a
                              href={`mailto:${blog.entity_email}`}
                              className="inline-flex items-center gap-1 text-xs text-teal-700 hover:text-teal-900 font-medium transition truncate"
                              title={`Email ${blog.entity_name}`}
                            >
                              <Mail className="w-3 h-3 text-teal-600 shrink-0" />
                              <span className="truncate underline decoration-teal-300 underline-offset-2">
                                {blog.entity_email}
                              </span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Right: Verified Badge & Direct Inquire Action */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-teal-200/50">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white border border-teal-200/80 text-[11px] font-semibold text-teal-900 shadow-2xs">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Verified Partner</span>
                        </span>

                        {blog.entity_email && (
                          <a
                            href={`mailto:${blog.entity_email}?subject=Inquiry regarding article: ${encodeURIComponent(
                              blog.title || "Health Guide"
                            )}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 rounded-lg shadow-2xs transition"
                          >
                            <Mail className="w-3 h-3" />
                            <span>{getEntityContactLabel(blog.entity_type)}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Banner Image */}
                <div className="lg:col-span-5 w-full">
                  <div className="relative aspect-[16/10] sm:aspect-[16/9] max-h-56 sm:max-h-60 w-full rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-100 shadow-2xs">
                    {!detailImageFailed && resolvedBannerUrl ? (
                      <img
                        src={resolvedBannerUrl}
                        alt={blog.title}
                        className="w-full h-full object-cover"
                        onError={() => setDetailImageFailed(true)}
                      />
                    ) : (
                      <FallbackBanner
                        categoryId={blog.category_id}
                        title={blog.title}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Rendered Article Body Content */}
              <div
                className="pt-2 article-content"
                dangerouslySetInnerHTML={{ __html: blog.content || "" }}
              />

              {/* =====================================================
                  FEATURED "PUBLISHED BY" CARD (HIGHLIGHTED)
              ====================================================== */}
              <div className="mt-8 rounded-2xl sm:rounded-3xl border-2 border-teal-200 bg-gradient-to-br from-white via-teal-50/30 to-sky-50/40 p-5 sm:p-7 shadow-xs">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="relative shrink-0">
                      <EntityAvatar
                        name={blog.entity_name}
                        logo={blog.entity_logo}
                        size="xl"
                        className="w-16 h-16 sm:w-20 sm:h-20 ring-4 ring-white shadow-md"
                      />
                      <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-2xs">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] uppercase tracking-wider font-extrabold text-teal-900 bg-teal-100/90 px-2.5 py-0.5 rounded-full">
                          Published & Verified By
                        </span>
                        {blog.entity_type && (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                            {getEntityTypeLabel(blog.entity_type)}
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-1.5 truncate">
                        {blog.entity_name || "BitCare Healthcare Partner"}
                      </h3>

                      <p className="text-xs text-slate-600 mt-1 leading-relaxed max-w-xl">
                        This article was reviewed and verified by{" "}
                        <span className="font-semibold text-slate-800">
                          {blog.entity_name || "the healthcare provider"}
                        </span>{" "}
                        to promote evidence-based healthcare awareness and patient wellness.
                      </p>

                      {blog.entity_email && (
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-teal-100 text-xs">
                          <span className="font-semibold text-slate-500">
                            Contact / Inquiries:
                          </span>
                          <a
                            href={`mailto:${blog.entity_email}`}
                            className="inline-flex items-center gap-1 font-bold text-teal-700 hover:text-teal-900 transition truncate"
                          >
                            <Mail className="w-3.5 h-3.5 text-teal-600" />
                            <span>{blog.entity_email}</span>
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-teal-100 shrink-0">
                    <div className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl shadow-xs text-xs font-bold">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Authorized Partner</span>
                    </div>

                    {blog.entity_email && (
                      <a
                        href={`mailto:${blog.entity_email}?subject=Patient Inquiry: ${encodeURIComponent(
                          blog.title || "Health Guide"
                        )}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-teal-900 bg-white hover:bg-teal-50 border border-teal-300 rounded-xl shadow-2xs transition"
                      >
                        <Mail className="w-3.5 h-3.5 text-teal-600" />
                        <span>Send Inquiry</span>
                        <ArrowRight className="w-3 h-3 text-teal-600" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Medical Disclaimer */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs text-slate-500 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-700 inline">
                    Medical Disclaimer:{" "}
                  </span>
                  This publication is provided for general health literacy and
                  wellness education. Always consult your physician or healthcare
                  professional for individualized diagnosis or treatment.
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleBackToBlogs}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Blogs
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShareLink}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share Article
                  </button>

                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => handleEditBlog(blog.blog_id || blogId)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl shadow-2xs transition cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit Article
                    </button>
                  )}
                </div>
              </div>
            </article>
          </main>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // VIEW A: BLOG CATALOG (PATIENT LIST VIEW + EDITORIAL SIDEBAR / ADMIN ISOLATED)
  // ==========================================================================
  return (
    <div
      className={`w-full ${
        isClinicPath
          ? "space-y-3"
          : "min-h-screen bg-gradient-to-b from-white via-slate-50/40 to-white flex flex-col"
      }`}
    >
      {/* =====================================================
          PATIENT VIEW: STICKY TOP BRANDING NAVBAR
      ====================================================== */}
      {!isClinicPath && <PatientNavbar />}

      <div
        className={`w-full ${
          isClinicPath ? "" : "flex-1 py-4 sm:py-6 px-3 sm:px-6 lg:px-8"
        }`}
      >
        <main className={`w-full ${isClinicPath ? "" : "max-w-7xl mx-auto"} space-y-4`}>
          {/* =====================================================
              PATIENT VIEW: HERO BRANDING BANNER
          ====================================================== */}
          {!isClinicPath && (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-50/70 via-white to-[var(--color-surface)] border border-slate-200/80 px-4 py-3 sm:px-5 sm:py-3.5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    Health & Medical Blogs
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-[var(--color-primary)] border border-[var(--color-primary)]/20 shadow-2xs">
                    <Sparkles className="w-2.5 h-2.5 text-[var(--color-primary)]" />
                    Verified Knowledge
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-1">
                  Evidence-based health guides contributed by verified clinics, diagnostic labs, doctors, and pharmacies.
                </p>
              </div>

              <div className="hidden lg:flex items-center gap-3 text-[11px] font-medium text-slate-500 shrink-0 border-l border-slate-200/80 pl-4">
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Provider Verified
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 text-slate-600">
                  <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                  Free Patient Education
                </span>
              </div>
            </div>
          )}

          {/* =====================================================
              RESPONSIVE TOOLBAR: CATEGORY PILLS + SEARCH + VIEW TOGGLE
          ====================================================== */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-2.5 sm:px-4 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
            {/* Left: Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full md:w-auto flex-nowrap">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                  selectedCategory === "all"
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Topics</span>
                <span
                  className={`px-1.5 py-0.2 text-[11px] rounded-full ${
                    selectedCategory === "all"
                      ? "bg-slate-800 text-slate-200"
                      : "bg-slate-200/70 text-slate-600"
                  }`}
                >
                  {categoryCounts.all || 0}
                </span>
              </button>

              {Object.values(BLOG_CATEGORIES).map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const count = categoryCounts[String(cat.id)] || 0;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer whitespace-nowrap shrink-0 shadow-2xs ${
                      isSelected
                        ? "text-white shadow-2xs"
                        : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80"
                    }`}
                    style={{
                      backgroundColor: isSelected ? cat.chipColor : undefined,
                    }}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`px-1.5 py-0.2 text-[11px] rounded-full ${
                        isSelected
                          ? "bg-black/20 text-white"
                          : "bg-slate-200/70 text-slate-600"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Search Bar & Count & View Switch */}
            <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end">
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, providers, topics..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 bg-slate-50/70 hover:bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:border-[var(--color-primary)] transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* View Switch (List vs Grid) */}
              <div className="hidden sm:flex items-center p-0.5 bg-slate-100 border border-slate-200 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`p-1 rounded-md transition cursor-pointer ${
                    viewMode === "list"
                      ? "bg-white text-[var(--color-primary)] shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="List view"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`p-1 rounded-md transition cursor-pointer ${
                    viewMode === "grid"
                      ? "bg-white text-[var(--color-primary)] shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
              </div>

              <span className="text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
                {filteredBlogs.length} {filteredBlogs.length === 1 ? "article" : "articles"}
              </span>

              {isClinicPath && onCreateArticle && (
                <button
                  type="button"
                  onClick={onCreateArticle}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-lg shadow-2xs transition cursor-pointer shrink-0"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>New Article</span>
                </button>
              )}
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="max-w-md mx-auto p-6 bg-white rounded-2xl border border-rose-200 text-center shadow-2xs">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Unable to Load Articles
              </h3>
              <p className="text-xs text-slate-600 mb-3">{error}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-xl transition cursor-pointer"
              >
                Retry
              </button>
            </div>
          )}

          {/* Empty State */}
          {!error && filteredBlogs.length === 0 && (
            <div className="max-w-md mx-auto py-12 px-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {isClinicPath
                  ? "No Articles Found for Your Account"
                  : "No Articles Found"}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                {searchQuery
                  ? `No articles match "${searchQuery}". Try a different keyword or reset filters.`
                  : isClinicPath
                  ? "You have not published any articles yet. Create and publish your first article for patients."
                  : "There are currently no articles in this category. Check back soon for new health updates."}
              </p>

              <div className="flex items-center justify-center gap-2">
                {(searchQuery || selectedCategory !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-[var(--color-primary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-alt)] border border-[var(--color-primary)]/20 rounded-lg transition cursor-pointer"
                  >
                    Clear Filters
                  </button>
                )}

                {isClinicPath && onCreateArticle && (
                  <button
                    type="button"
                    onClick={onCreateArticle}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] rounded-lg shadow-2xs transition cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Create Your First Article</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* =====================================================
              MAIN CONTENT AREA: LIST VIEW + EDITORIAL SIDEBAR
          ====================================================== */}
          {!error && filteredBlogs.length > 0 && (
            <div
              className={`grid grid-cols-1 ${
                !isClinicPath
                  ? "lg:grid-cols-12 gap-6 lg:gap-8 items-start"
                  : ""
              }`}
            >
              {/* Left Column: Articles Feed */}
              <div
                ref={listTopRef}
                className={!isClinicPath ? "lg:col-span-8 space-y-4" : "space-y-4"}
              >
                {viewMode === "list" ? (
                  // List Layout (Horizontal Magazine Cards)
                  <div className="space-y-4">
                    {paginatedBlogs.map((b, idx) => (
                      <BlogListItem
                        key={b.blog_id ?? idx}
                        blog={b}
                        index={idx}
                        canEdit={canEdit}
                        isAdminView={isClinicPath}
                        onRead={handleReadBlog}
                        onEdit={handleEditBlog}
                      />
                    ))}
                  </div>
                ) : (
                  // Grid Layout
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {paginatedBlogs.map((b, idx) => (
                      <BlogCardItem
                        key={b.blog_id ?? idx}
                        blog={b}
                        index={idx}
                        canEdit={canEdit}
                        isAdminView={isClinicPath}
                        onRead={handleReadBlog}
                        onEdit={handleEditBlog}
                      />
                    ))}
                  </div>
                )}

                {/* Pagination Controls */}
                <PaginationBar
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredBlogs.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={handlePageChange}
                  onItemsPerPageChange={(newSize) => {
                    setItemsPerPage(newSize);
                    handlePageChange(1);
                  }}
                />
              </div>

              {/* =====================================================
                  RIGHT SIDEBAR: PATIENT VIEW EDITORIAL & TRUST WIDGETS
                  (Transforms the whitespace into rich medical library UI)
              ====================================================== */}
              {!isClinicPath && (
                <aside className="lg:col-span-4 space-y-5 lg:sticky lg:top-20">
                  {/* WIDGET 1: BitCare Medical Editorial Mission */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-slate-900">
                      <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-200/70">
                        <ShieldCheck className="w-4 h-4 text-teal-600" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold leading-tight">
                          Medical Review Standards
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium">
                          Medical Integrity & Accuracy
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Every article in the BitCare Health Library is authored or curated by licensed medical professionals, accredited clinics, diagnostic laboratories, and pharmacies to provide clear, actionable health education.
                    </p>

                    <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Verified Healthcare Author Credentials</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Clinical Peer Review Prior to Publish</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Free Access for Patients & Caregivers</span>
                      </div>
                    </div>
                  </div>

                  {/* WIDGET 2: Featured Clinical Authors & Centers */}
                  {contributingClinics.length > 0 && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[var(--color-primary)]" />
                          <h4 className="text-sm font-bold text-slate-900">
                            Top Healthcare Providers
                          </h4>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {contributingClinics.length} Providers
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {contributingClinics.map((clinic, i) => (
                          <div
                            key={i}
                            onClick={() => setSearchQuery(clinic.name)}
                            className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200/80 transition cursor-pointer group"
                            title={`Click to filter articles by ${clinic.name}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <EntityAvatar
                                name={clinic.name}
                                logo={clinic.logo}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-800 group-hover:text-[var(--color-primary)] transition truncate block">
                                  {clinic.name}
                                </span>
                                <span className="text-[10px] text-slate-400 truncate block">
                                  {getEntityTypeLabel(clinic.type)} • {clinic.count} {clinic.count === 1 ? "article" : "articles"}
                                </span>
                              </div>
                            </div>

                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-[var(--color-primary)] group-hover:text-white transition shrink-0">
                              {clinic.count} {clinic.count === 1 ? "article" : "articles"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* WIDGET 3: Trending / Featured Medical Guides */}
                  {trendingArticles.length > 0 && (
                    <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 p-5 shadow-xs space-y-3.5">
                      <div className="flex items-center gap-2 text-slate-900">
                        <TrendingUp className="w-4 h-4 text-rose-500" />
                        <h4 className="text-sm font-bold leading-tight">
                          Featured Health Guides
                        </h4>
                      </div>

                      <div className="space-y-3">
                        {trendingArticles.map((tBlog, tIdx) => {
                          const tCat = getCategoryMeta(tBlog.category_id);
                          const tImg = getBlogImageUrl(
                            tBlog.featured_image_guid,
                            tBlog.featured_image_path
                          );
                          const tTime = calculateReadTime(
                            tBlog.content || tBlog.short_description
                          );

                          return (
                            <div
                              key={tBlog.blog_id ?? tIdx}
                              onClick={() => handleReadBlog(tBlog.blog_id || "")}
                              className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50 transition cursor-pointer group"
                            >
                              <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/80">
                                {tImg ? (
                                  <img
                                    src={tImg}
                                    alt={tBlog.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                ) : (
                                  <FallbackBanner
                                    categoryId={tBlog.category_id}
                                    title={tBlog.title}
                                    className="text-[8px] p-1"
                                  />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 mb-0.5">
                                  <span style={{ color: tCat.chipColor }}>
                                    {tCat.name}
                                  </span>
                                  <span>•</span>
                                  <span>{tTime}</span>
                                </div>
                                <h5 className="text-xs font-bold text-slate-900 group-hover:text-[var(--color-primary)] transition line-clamp-2 leading-tight">
                                  {tBlog.title}
                                </h5>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* WIDGET 4: Connect with Verified Clinics / Need Care */}
                  <div className="rounded-2xl sm:rounded-3xl border border-teal-200/80 bg-gradient-to-br from-teal-50/80 via-white to-sky-50/60 p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-4 h-4 text-teal-700" />
                      <h4 className="text-sm font-bold text-teal-950">
                        Looking for Healthcare Services?
                      </h4>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Connect with accredited clinics, diagnostic labs, doctors, and pharmacies across the BitCare network.
                    </p>

                    <Link
                      to="/login"
                      className="inline-flex items-center justify-between w-full px-3.5 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 rounded-xl shadow-2xs transition"
                    >
                      <span>Access Provider Portal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {/* WIDGET 5: Patient Emergency Disclaimer Notice */}
                  <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Medical Disclaimer: </span>
                      BitCare Health Library provides evidence-based guides for health literacy. For urgent symptoms or medical emergencies, please call your local healthcare emergency hotline immediately.
                    </div>
                  </div>
                </aside>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default BlogsList;
