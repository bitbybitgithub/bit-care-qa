import React,{useState} from 'react';
import BlogForm from "../admin/Blogs.tsx";
import BlogsList from '../list-blogs/BlogsList.tsx';


// import React, { useState } from "react";
// import BlogForm from "./BlogForm";
// import BlogsList from "./BlogsList";

const Blogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"view" | "add">("view");

  return (
    <div className="w-full bg-[var(--color-surface-alt)] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)]">
      {/* VIEW / ADD TABS */}
      <div className="flex p-4 border-b border-b-[var(--color-primary)]">
        <div
          className="flex p-1 space-x-1 rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]"
          style={{ background: "var(--color-primary)" }}
        >
          {[
            { key: "view", label: "View" },
            { key: "add", label: "Add" },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={activeTab === t.key}
              onClick={() =>
                setActiveTab(t.key as "view" | "add")
              }
              className="px-4 py-1.5 text-sm font-semibold cursor-pointer rounded-[var(--radius-md)] transition border-2"
              style={{
                background:
                  activeTab === t.key
                    ? "var(--color-surface-alt)"
                    : "transparent",
                color:
                  activeTab === t.key
                    ? "var(--color-primary)"
                    : "var(--color-surface-alt)",
                borderColor:
                  activeTab === t.key
                    ? "var(--color-primary)"
                    : "transparent",
                transition: "var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                if (activeTab !== t.key) {
                  e.currentTarget.style.borderColor =
                    "var(--color-surface-alt)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== t.key) {
                  e.currentTarget.style.borderColor =
                    "transparent";
                }
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div>
        {activeTab === "view" && <BlogsList />}

        {activeTab === "add" && <BlogForm />}
      </div>
    </div>
  );
};

export default Blogs;

