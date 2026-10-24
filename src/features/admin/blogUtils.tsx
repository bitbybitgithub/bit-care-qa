import React from "react";
import { BASE_URL } from "../../services/EmrApi";

// ============================================================================
// Types & Categories
// ============================================================================

export interface BlogCategoryMeta {
  id: number;
  name: string;
  slug: string;
  badgeClass: string;
  chipColor: string;
  iconType: "heart" | "activity" | "apple" | "sparkles";
  accentGradient: string;
  description: string;
}

export const BLOG_CATEGORIES: Record<number, BlogCategoryMeta> = {
  1: {
    id: 1,
    name: "Diabetes",
    slug: "diabetes",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200/80 ring-emerald-500/10",
    chipColor: "#059669",
    iconType: "activity",
    accentGradient: "from-emerald-500/15 via-teal-500/10 to-emerald-600/20",
    description: "Blood sugar management, lifestyle tips & clinical endocrinology updates",
  },
  2: {
    id: 2,
    name: "Cardiology",
    slug: "cardiology",
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200/80 ring-rose-500/10",
    chipColor: "#e11d48",
    iconType: "heart",
    accentGradient: "from-rose-500/15 via-pink-500/10 to-red-600/20",
    description: "Heart health, hypertension prevention & cardiovascular wellness",
  },
  3: {
    id: 3,
    name: "Nutrition",
    slug: "nutrition",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200/80 ring-amber-500/10",
    chipColor: "#d97706",
    iconType: "apple",
    accentGradient: "from-amber-500/15 via-orange-500/10 to-yellow-600/20",
    description: "Macro & micro nutrients, dietary planning & evidence-based wellness",
  },
};

export const DEFAULT_CATEGORY: BlogCategoryMeta = {
  id: 0,
  name: "General Wellness",
  slug: "general-wellness",
  badgeClass: "bg-sky-50 text-sky-700 border-sky-200/80 ring-sky-500/10",
  chipColor: "#0284c7",
  iconType: "sparkles",
  accentGradient: "from-sky-500/15 via-blue-500/10 to-cyan-600/20",
  description: "Preventive medicine, self-care guidance & healthcare updates",
};

export const getCategoryMeta = (categoryId?: number | string | null): BlogCategoryMeta => {
  if (!categoryId) return DEFAULT_CATEGORY;
  const num = Number(categoryId);
  return BLOG_CATEGORIES[num] || DEFAULT_CATEGORY;
};

// ============================================================================
// Image URL Resolver & Helpers
// ============================================================================

/**
 * Resolves blog image URL reliably across local and production environments,
 * fixing legacy hardcoded localhost:8989 URLs to use BASE_URL.
 */
export const getBlogImageUrl = (
  guid?: string | null,
  path?: string | null
): string => {
  const raw = (guid || path || "").trim();
  if (!raw) return "";

  // If already absolute URL
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    if (raw.includes("localhost:8989/api")) {
      return raw.replace("http://localhost:8989/api", BASE_URL);
    }
    if (raw.includes("localhost:8989")) {
      return raw.replace("http://localhost:8989", BASE_URL.replace(/\/api$/, ""));
    }
    return raw;
  }

  // Extract clean file name (strip Windows/Unix paths)
  const fileName = raw.split(/[\\/]/).pop() || "";
  if (!fileName) return "";

  return `${BASE_URL}/blog-images/${encodeURIComponent(fileName)}`;
};

// ============================================================================
// Text & Date Utilities
// ============================================================================

export const calculateReadTime = (htmlOrText?: string | null): string => {
  if (!htmlOrText) return "1 min read";
  const plainText = htmlOrText.replace(/<[^>]*>/g, " ").trim();
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(wordCount / 200));
  return `${minutes} min read`;
};

export const formatBlogDate = (dateStr?: string | null): string => {
  if (!dateStr) return "Recently published";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Recently published";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recently published";
  }
};

// ============================================================================
// Elegant Fallback Banner Component
// ============================================================================

interface FallbackBannerProps {
  categoryId?: number | string | null;
  title?: string;
  className?: string;
}

export const FallbackBanner: React.FC<FallbackBannerProps> = ({
  categoryId,
  title,
  className = "w-full h-full",
}) => {
  const cat = getCategoryMeta(categoryId);

  return (
    <div
      className={`relative w-full h-full flex flex-col justify-between p-6 bg-gradient-to-br ${cat.accentGradient} overflow-hidden select-none ${className}`}
      style={{
        background: `linear-gradient(135deg, ${cat.chipColor}12 0%, #ffffff 50%, ${cat.chipColor}18 100%)`,
      }}
    >
      {/* Decorative background grid and watermark icon */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none dot-grid" />
      <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full opacity-10 flex items-center justify-center pointer-events-none">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="w-full h-full"
          style={{ color: cat.chipColor }}
        >
          {cat.iconType === "heart" && (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
            />
          )}
          {cat.iconType === "activity" && (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12h3.75l2.25-6 4.5 12 3-7.5h6"
            />
          )}
          {cat.iconType === "apple" && (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 3v3m0 0a6 6 0 100 12 6 6 0 000-12zm-3-3a3 3 0 013 3"
            />
          )}
          {cat.iconType === "sparkles" && (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          )}
        </svg>
      </div>

      {/* Top pill */}
      <div className="relative z-10 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full shadow-sm"
          style={{
            backgroundColor: `${cat.chipColor}18`,
            color: cat.chipColor,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: cat.chipColor }}
          />
          {cat.name}
        </span>
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          BitCare Health
        </span>
      </div>

      {/* Center Title or Icon */}
      <div className="relative z-10 my-auto py-2">
        {title ? (
          <h4 className="text-slate-800 font-bold text-base md:text-lg line-clamp-2 leading-tight">
            {title}
          </h4>
        ) : (
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <span>Health & Wellness Article</span>
          </div>
        )}
      </div>

      {/* Bottom meta */}
      <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-200/50">
        <span>Verified Medical Insights</span>
        <span>•</span>
        <span>Care Guide</span>
      </div>
    </div>
  );
};

