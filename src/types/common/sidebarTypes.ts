import React from "react";

export interface MenuItem {
  title: string;
  link: string;
  icon: React.ComponentType<{ className?: string }>;
}


export interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  mobileOpen: boolean;
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}


export type Role = "Admin" | "Staff" | "Doctor";
