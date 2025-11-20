// src/theme/muiTheme.ts
import { createTheme } from "@mui/material";

/**
 * Safe helper — only access CSS variables after DOM is ready
 */
const getCssVar = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  const val = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return val || fallback;
};

/**
 * Dynamic MUI theme — auto-reads from token.css variables
 */
export const muiTheme = () =>
  createTheme({
    typography: {
      fontFamily: getCssVar("--font-family", "'Inter', sans-serif"),
      h1: {
        fontSize: getCssVar("--font-h1", "2rem"),
        fontWeight: 700,
        color: "var(--color-text)",
      },
      h2: {
        fontSize: getCssVar("--font-h2", "1.5rem"),
        fontWeight: 600,
        color: "var(--color-text)",
      },
      h3: {
        fontSize: getCssVar("--font-h3", "1.25rem"),
        fontWeight: 500,
        color: "var(--color-text)",
      },
      body1: { fontSize: getCssVar("--font-body", "1rem") },
      body2: { fontSize: getCssVar("--font-small", "0.875rem") },
    },

    palette: {
      primary: { main: getCssVar("--color-primary", "#2563eb") },
      secondary: { main: getCssVar("--color-secondary", "#16a34a") },
      success: { main: getCssVar("--color-success", "#10b981") },
      error: { main: getCssVar("--color-error", "#dc2626") },
      warning: { main: getCssVar("--color-warning", "#facc15") },
      info: { main: getCssVar("--color-info", "#0284c7") },
      background: {
        default: getCssVar("--color-bg", "#f9fafb"),
        paper: getCssVar("--color-surface", "#ffffff"),
      },
      text: {
        primary: getCssVar("--color-text", "#1f2937"),
        secondary: getCssVar("--color-text-secondary", "#4b5563"),
        disabled: getCssVar("--color-disabled", "#9ca3af"),
      },
      divider: getCssVar("--color-border", "#e5e7eb"),
    },

    shape: {
      borderRadius: parseInt(getCssVar("--radius-md", "8")) || 8,
    },

   shadows: [
  "none",
  getCssVar("--shadow-xs", "0 1px 2px rgba(0,0,0,0.05)"),
  getCssVar("--shadow-sm", "0 1px 3px rgba(0,0,0,0.08)"),
  getCssVar("--shadow-md", "0 4px 6px rgba(0,0,0,0.1)"),
  getCssVar("--shadow-lg", "0 10px 15px rgba(0,0,0,0.15)"),
  getCssVar("--shadow-xl", "0 20px 25px rgba(0,0,0,0.2)"),
  ...Array(19).fill("none"), // fill remaining 19 shadows to make total = 25
] as any,

    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: "var(--color-bg)",
            color: "var(--color-text)",
            fontFamily: "var(--font-family)",
            transition: "background var(--transition-normal), color var(--transition-normal)",
          },
        },
      },

      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "var(--radius-md)",
            textTransform: "none",
            transition: "all var(--transition-fast)",
            "&:hover": {
              opacity: "var(--opacity-hover)",
              boxShadow: "var(--shadow-sm)",
            },
            "&.Mui-disabled": {
              opacity: "var(--opacity-disabled)",
            },
          },
        },
      },

      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            backgroundColor: "var(--color-surface)",
            boxShadow: "var(--shadow-md)",
            color: "var(--color-text)",
            borderRadius: "var(--radius-md)",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--color-border)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--color-primary)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "var(--color-primary)"
            },
            transition: "all var(--transition-normal)",
          },
          input: {
            color: "var(--color-text)",
          },
        },
      },

      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: "var(--color-text-secondary)",
            "&.Mui-focused": {
              color: "var(--color-primary)",
            },
          },
        },
      },

      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: "var(--color-surface)",
            boxShadow: "var(--shadow-md)",
            borderRadius: "var(--radius-lg)",
            color: "var(--color-text)",
            transition: "background var(--transition-normal)",
          },
        },
      },
    },
  });
