import { createContext, useContext } from "react";

export const THEME_MODES = [
  "ocean",
  "green",
  "light",
  "violet",
  "sunset",
  "teal",
  "slate",
] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

export const FONT_FAMILIES = [
  { id: "inter", name: "Inter", value: "'Inter', sans-serif" },
  { id: "jakarta", name: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif" },
  { id: "outfit", name: "Outfit", value: "'Outfit', sans-serif" },
  { id: "poppins", name: "Poppins", value: "'Poppins', sans-serif" },
  { id: "roboto", name: "Roboto", value: "'Roboto', sans-serif" },
] as const;
export type FontFamilyId = (typeof FONT_FAMILIES)[number]["id"];

export const FONT_SIZES = [
  { id: "compact", name: "Compact", scale: "93%" },
  { id: "normal", name: "Normal", scale: "100%" },
  { id: "spacious", name: "Spacious", scale: "107%" },
] as const;
export type FontSizeId = (typeof FONT_SIZES)[number]["id"];

export interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  font: FontFamilyId;
  setFont: (font: FontFamilyId) => void;
  fontSize: FontSizeId;
  setFontSize: (size: FontSizeId) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: "ocean",
  setMode: () => {},
  font: "inter",
  setFont: () => {},
  fontSize: "normal",
  setFontSize: () => {},
});

export const useAppTheme = (): ThemeContextType => useContext(ThemeContext);
