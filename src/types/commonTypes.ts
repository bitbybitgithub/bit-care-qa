import type { JSX, ReactNode } from "react";

export interface DashboardCard {
  id: number;
  title: string;
  description?: string;
  key: string;
  value: number;
  icon?: JSX.Element;
}
