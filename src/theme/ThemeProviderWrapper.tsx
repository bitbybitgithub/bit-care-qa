import React, { useEffect, useState } from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { muiTheme } from "./muiTheme";
import {
  ThemeContext,
  THEME_MODES,
  FONT_FAMILIES,
  FONT_SIZES,
  type ThemeMode,
  type FontFamilyId,
  type FontSizeId,
} from "./ThemeContext";

interface Props {
  children: React.ReactNode;
}

export const ThemeProviderWrapper: React.FC<Props> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme") as ThemeMode | null;
    return saved && THEME_MODES.includes(saved) ? saved : "ocean";
  });

  const [font, setFontState] = useState<FontFamilyId>(() => {
    const saved = localStorage.getItem("app_font") as FontFamilyId | null;
    return saved && FONT_FAMILIES.some((f) => f.id === saved) ? saved : "inter";
  });

  const [fontSize, setFontSizeState] = useState<FontSizeId>(() => {
    const saved = localStorage.getItem("app_font_size") as FontSizeId | null;
    return saved && FONT_SIZES.some((s) => s.id === saved) ? saved : "normal";
  });

  const [theme, setTheme] = useState(() => muiTheme());

  const applyTheme = (
    currentMode: ThemeMode,
    currentFont: FontFamilyId,
    currentSize: FontSizeId
  ) => {
    document.documentElement.setAttribute("data-theme", currentMode);

    const fontObj = FONT_FAMILIES.find((f) => f.id === currentFont);
    if (fontObj) {
      document.documentElement.style.setProperty("--font-family", fontObj.value);
    }

    const sizeObj = FONT_SIZES.find((s) => s.id === currentSize);
    if (sizeObj) {
      document.documentElement.style.fontSize = sizeObj.scale;
    }

    requestAnimationFrame(() => setTheme(muiTheme()));
  };

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem("theme", newMode);
    applyTheme(newMode, font, fontSize);
  };

  const setFont = (newFont: FontFamilyId) => {
    setFontState(newFont);
    localStorage.setItem("app_font", newFont);
    applyTheme(mode, newFont, fontSize);
  };

  const setFontSize = (newSize: FontSizeId) => {
    setFontSizeState(newSize);
    localStorage.setItem("app_font_size", newSize);
    applyTheme(mode, font, newSize);
  };

  useEffect(() => {
    applyTheme(mode, font, fontSize);
  }, [mode, font, fontSize]);

  return (
    <ThemeContext.Provider
      value={{
        mode,
        setMode,
        font,
        setFont,
        fontSize,
        setFontSize,
      }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
