module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        secondary: "var(--color-secondary)",
        accent: "var(--color-accent)",
        success: "var(--color-success)",
        error: "var(--color-error)",
        warning: "var(--color-warning)",
        info: "var(--color-info)",
        bg: "var(--color-bg)",
        surface: "var(--color-surface)",
        "surface-alt": "var(--color-surface-alt)",
        border: "var(--color-border)",
        text: "var(--color-text)",
        "text-secondary": "var(--color-text-secondary)",
        disabled: "var(--color-disabled)",
      },

      boxShadow: {
        xs: "var(--shadow-xs)",
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },

      borderRadius: {
        sm1: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },

      fontFamily: {
        sans: "var(--font-family)",
      },

      fontSize: {
        h1: "var(--font-h1)",
        h2: "var(--font-h2)",
        h3: "var(--font-h3)",
        body: "var(--font-body)",
        small: "var(--font-small)",
        xs: "var(--font-xs)",
      },

      opacity: {
        disabled: "var(--opacity-disabled)",
        hover: "var(--opacity-hover)",
        focus: "var(--opacity-focus)",
      },

      transitionTimingFunction: {
        fast: "var(--transition-fast)",
        normal: "var(--transition-normal)",
        slow: "var(--transition-slow)",
      },

      zIndex: {
        header: "var(--z-header)",
        modal: "var(--z-modal)",
        overlay: "var(--z-overlay)",
        tooltip: "var(--z-tooltip)",
      },

        keyframes: {
        pulseAlert: {
          "0%, 100%": { opacity: 1, transform: "scale(1)" },
          "50%": { opacity: 0.4, transform: "scale(1.15)" },
        },
      },
      animation: {
        pulseAlert: "pulseAlert 1.2s ease-in-out infinite",
      },

    },
  },
  plugins: [],
};

