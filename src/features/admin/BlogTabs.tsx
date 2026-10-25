import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BookOpen,
  PlusCircle,
  Sparkles,
  Layers,
} from "lucide-react";

import BlogForm from "./BlogForm";
import BlogsList from "../list-blogs/BlogsList";

export const BlogTabs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial tab from search params or default to "add"
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"view" | "add">(
    tabParam === "view" ? "view" : "add"
  );

  // Sync tab with URL search param
  const handleTabChange = (tab: "view" | "add") => {
    setActiveTab(tab);
    setSearchParams(tab === "view" ? { tab: "view" } : {});
  };

  return (
    <div className="w-full min-h-[calc(100vh-80px)] space-y-3">
      {/* =====================================================
          CLINIC ADMIN HEADER & TAB CONTROLS (RESPONSIVE)
      ====================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          {/* Left: Branding & Title */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-primary)] text-white flex items-center justify-center shadow-xs shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-none">
                  Blogs & Patient Education
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)] border border-[var(--color-primary)]/20">
                  <Sparkles className="w-2.5 h-2.5 text-[var(--color-primary)]" />
                  Editorial Portal
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-tight mt-0.5">
                Curate and publish evidence-based medical articles for patients and visitors.
              </p>
            </div>
          </div>

          {/* Right: Modern Responsive Segmented Tabs (Add first, View second) */}
          <div className="grid grid-cols-2 sm:flex items-center p-1 bg-slate-100/90 rounded-xl border border-slate-200/80 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "add"}
              onClick={() => handleTabChange("add")}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === "add"
                  ? "bg-white text-[var(--color-primary)] shadow-2xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/40"
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>Create Article</span>
            </button>

            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "view"}
              onClick={() => handleTabChange("view")}
              className={`flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                activeTab === "view"
                  ? "bg-white text-[var(--color-primary)] shadow-2xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/40"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span>View Articles</span>
            </button>
          </div>
        </div>
      </div>

      {/* =====================================================
          TAB CONTENT PANEL
      ====================================================== */}
      <div className="transition-all duration-200">
        {activeTab === "view" && <BlogsList />}

        {activeTab === "add" && (
          <BlogForm
            onSuccess={() => handleTabChange("view")}
            onCancel={() => handleTabChange("view")}
          />
        )}
      </div>
    </div>
  );
};

export default BlogTabs;
