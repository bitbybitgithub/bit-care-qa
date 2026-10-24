import React, { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
} from "lucide-react";
import { toast } from "react-toastify";

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
} from "../admin/blogUtils";

// ============================================================================
// Single Blog Card (Responsive & Role Aware)
// ============================================================================

interface BlogCardItemProps {
  blog: BlogFormData;
  index: number;
  canEdit: boolean;
  onRead: (id: number | string) => void;
  onEdit: (id: number | string) => void;
}

const BlogCardItem: React.FC<BlogCardItemProps> = ({
  blog,
  index,
  canEdit,
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
      default:
        return <Sparkles className="w-2.5 h-2.5" />;
    }
  };

  return (
    <article
      className="group relative flex flex-col bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:shadow-[var(--color-primary)]/10 hover:border-[var(--color-primary-light)] transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
      style={{
        animationDelay: `${Math.min(index * 50, 300)}ms`,
      }}
    >
      {/* ----------------- BANNER / IMAGE ----------------- */}
      <div
        className="relative aspect-[16/9] max-h-48 w-full overflow-hidden bg-slate-100 cursor-pointer"
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
          <FallbackBanner
            categoryId={blog.category_id}
            title={blog.title}
          />
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

        {/* Floating Top Right Read Time */}
        <div className="absolute top-2.5 right-2.5 z-10">
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
          <span className="text-emerald-600 font-medium">Verified Guide</span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onRead(blog.blog_id || "")}
          className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[var(--color-primary)] transition-colors line-clamp-2 leading-snug cursor-pointer mb-2"
        >
          {blog.title}
        </h3>

        {/* Short Description */}
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {blog.short_description}
        </p>

        {/* ----------------- FOOTER ACTIONS ----------------- */}
        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
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
// Main BlogsList Component
// ============================================================================

export const BlogsList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { blogId } = useParams<{ blogId?: string }>();

  // Role and route detection
  const sessionUser = getSession("user");
  const isClinicPath = location.pathname.startsWith("/clinic");
  const isClinicAdmin = Boolean(
    sessionUser?.user_id &&
      (sessionUser?.role?.toLowerCase() === "admin" || sessionUser?.clinic_id)
  );

  // STRICT EDITING CONDITION:
  // Only clinic admins accessing from within the clinic portal are allowed to edit!
  // Any public/general route (/blog, /bloglist, /blogs, /blog/:blogId) is STRICTLY VIEW-ONLY!
  const canEdit = isClinicPath && isClinicAdmin;

  const [blogs, setBlogs] = useState<BlogFormData[]>([]);
  const [blog, setBlog] = useState<BlogFormData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Search & Category Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<number | "all">("all");
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [detailImageFailed, setDetailImageFailed] = useState<boolean>(false);

  // Fetch blogs or single blog based on URL param
  useEffect(() => {
    let isMounted = true;

    const fetchContent = async () => {
      try {
        setLoading(true);
        setError("");

        if (blogId) {
          const response = await getBlogByIdApi(blogId);
          if (isMounted) {
            setBlog(response.data);
            setDetailImageFailed(false);
          }
        } else {
          const response = await getBlogListApi();
          if (isMounted) {
            setBlogs(response.data || []);
          }
        }
      } catch (err: any) {
        console.error("GET BLOG ERROR:", err);
        if (isMounted) {
          setError(
            err?.response?.data?.message ||
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
  }, [blogId]);

  // Filtered blogs list
  const filteredBlogs = useMemo(() => {
    return blogs.filter((item) => {
      const matchesCategory =
        selectedCategory === "all" ||
        Number(item.category_id) === Number(selectedCategory);

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.short_description?.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [blogs, selectedCategory, searchQuery]);

  // Counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: blogs.length };
    blogs.forEach((b) => {
      const catId = String(b.category_id);
      counts[catId] = (counts[catId] || 0) + 1;
    });
    return counts;
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
      navigate("/clinic/BlogTabs");
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
    return <Loader message={blogId ? "Loading article..." : "Loading articles..."} />;
  }

  // ==========================================================================
  // VIEW B: SINGLE BLOG ARTICLE DETAIL VIEW (Vibrant, Clean & Fully Responsive)
  // ==========================================================================
  if (blogId) {
    if (error || !blog) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-white via-slate-50/50 to-white flex items-center justify-center p-4">
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
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50/40 to-white py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <main className="w-full max-w-5xl mx-auto">
          {/* Top Bar: Back & Share (NO MENUS) */}
          <div className="flex items-center justify-between gap-2.5 mb-3.5 pb-2.5 border-b border-slate-200/80">
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
          <article className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-7 lg:p-10">
            {/* Split Header: Stack on mobile, Side-by-side on desktop */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start pb-5 sm:pb-6 border-b border-slate-100">
              <div className="lg:col-span-7 space-y-2.5 sm:space-y-3">
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
                <h1 className="text-xl sm:text-2xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {blog.title}
                </h1>

                {/* Excerpt / Summary */}
                {blog.short_description && (
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-[var(--color-surface)]/70 border-l-4 border-[var(--color-primary)] text-slate-700 text-xs sm:text-sm leading-relaxed font-medium">
                    {blog.short_description}
                  </div>
                )}

                {/* Byline */}
                <div className="flex items-center gap-2 pt-1 text-xs text-slate-500">
                  <div className="w-6 h-6 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)] flex items-center justify-center font-bold text-[10px] shrink-0">
                    BC
                  </div>
                  <span className="font-semibold text-slate-700">BitCare Medical Editorial</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
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
              className="pt-5 sm:pt-6 article-content"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />

            {/* Medical Disclaimer */}
            <div className="mt-8 sm:mt-10 p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs text-slate-500 leading-relaxed flex items-start gap-2.5">
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
            <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
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
    );
  }

  // ==========================================================================
  // VIEW A: BLOG CATALOG (ROLE-AWARE & FULLY RESPONSIVE)
  // ==========================================================================
  return (
    <div
      className={`w-full ${
        isClinicPath
          ? "space-y-3"
          : "min-h-screen bg-gradient-to-b from-white via-slate-50/40 to-white py-4 sm:py-6 px-3 sm:px-6 lg:px-8"
      }`}
    >
      <main className={`w-full ${isClinicPath ? "" : "max-w-7xl mx-auto"} space-y-3.5`}>
        {/* =====================================================
            GENERAL VIEW TITLE: ONLY SHOWN ON PUBLIC / GENERAL VIEW
            (Never duplicated in Clinic View where BlogTabs has its header!)
        ====================================================== */}
        {!isClinicPath && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Blogs
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Explore our latest health articles, wellness tips, and medical guides.
              </p>
            </div>
          </div>
        )}

        {/* =====================================================
            RESPONSIVE FITTED TOOLBAR: PILLS + SEARCH + COUNT
        ====================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-2.5 sm:px-4 sm:py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Left: Category Filter Pills (Horizontal swipe on mobile) */}
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

          {/* Right: Search Bar & Count (Responsive full-width on mobile) */}
          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-between md:justify-end">
            <div className="relative w-full sm:w-60">
              <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
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

            <span className="text-xs font-medium text-slate-400 whitespace-nowrap shrink-0">
              {filteredBlogs.length} {filteredBlogs.length === 1 ? "article" : "articles"}
            </span>
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
              No Articles Found
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {searchQuery
                ? `No articles match "${searchQuery}". Try a different keyword or reset filters.`
                : "There are currently no articles in this category."}
            </p>
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
          </div>
        )}

        {/* Blog Cards Grid (Responsive 1 col mobile, 2 cols tablet, 3 cols desktop) */}
        {!error && filteredBlogs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredBlogs.map((b, idx) => (
              <BlogCardItem
                key={b.blog_id ?? idx}
                blog={b}
                index={idx}
                canEdit={canEdit}
                onRead={handleReadBlog}
                onEdit={handleEditBlog}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default BlogsList;
