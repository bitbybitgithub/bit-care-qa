import React, { useEffect, useState } from "react";
import { ThemeProvider, CssBaseline, Tooltip } from "@mui/material";
import { muiTheme } from "./muiTheme";
import { Sun, Moon, Waves, HeartPulse } from "lucide-react";

const themes = ["light", "dark", "ocean", "green"] as const;
export type ThemeMode = (typeof themes)[number];

interface Props {
  children: React.ReactNode;
}

export const ThemeProviderWrapper: React.FC<Props> = ({ children }) => {
  const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme") as ThemeMode | null;
    return saved || (systemPrefersDark ? "dark" : "light");
  });

  const [theme, setTheme] = useState(() => muiTheme());
  const [open, setOpen] = useState(false);

  // ✅ Update <html data-theme> then recreate MUI theme after repaint
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("theme", mode);

    // Wait a tick so CSS variables apply before re-reading them
    requestAnimationFrame(() => setTheme(muiTheme()));
  }, [mode]);

  const icons = {
    light: <Sun className="w-5 h-5" />,
    dark: <Moon className="w-5 h-5" />,
    ocean: <Waves className="w-5 h-5" />,
    green: <HeartPulse className="w-5 h-5" />,
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors relative">
        {children}

        {/* Floating Theme Switcher */}
        <div
          className="fixed bottom-5 right-5 z-50"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <div className="absolute bottom-full right-0 w-16 h-6"></div>

          {open && (
            <div
              className="absolute bottom-16 right-0 flex flex-col items-stretch gap-2 
                         bg-[var(--color-surface)] rounded-2xl shadow-xl p-2 
                         border border-[var(--color-primary)]/10 
                         transition-all duration-200 origin-bottom-right"
            >
              {themes.map((t) => (
                <Tooltip key={t} title={`Switch to ${t} theme`} placement="left">
                  <button
                    onClick={() => setMode(t)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm 
                                whitespace-nowrap text-left transition-all ${
                                  mode === t
                                    ? "bg-[var(--color-primary)] text-[var(--color-bg)]"
                                    : "hover:bg-[var(--color-primary)]/10"
                                }`}
                  >
                    {icons[t]}
                    <span className="capitalize">{t}</span>
                  </button>
                </Tooltip>
              ))}
            </div>
          )}

          <button
            onClick={() => setOpen((prev) => !prev)}
            className="p-3 rounded-full shadow-lg bg-[var(--color-primary)] 
                       text-[var(--color-bg)] hover:scale-105 
                       transition-transform flex items-center justify-center"
          >
            {icons[mode]}
          </button>
        </div>
      </div>
    </ThemeProvider>
  );
};

// import React, { useEffect, useMemo, useState } from "react";
// import { ThemeProvider, CssBaseline, Tooltip } from "@mui/material";
// import { muiTheme } from "./muiTheme";
// import { Sun, Moon, Waves, HeartPulse } from "lucide-react";

// const themes = ["light", "dark", "ocean","green"] as const;
// export type ThemeMode = (typeof themes)[number];

// interface Props {
//   children: React.ReactNode;
// }

// export const ThemeProviderWrapper: React.FC<Props> = ({ children }) => {
//   // Detect system theme only for first-time visitors
//   const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

//   // Load saved mode from localStorage or fallback to system
//   const [mode, setMode] = useState<ThemeMode>(() => {
//     const saved = localStorage.getItem("theme") as ThemeMode | null;
//     return saved || (systemPrefersDark ? "dark" : "light");
//   });

//   const [open, setOpen] = useState(false);

//   // Persist theme + update <html data-theme="">
//   useEffect(() => {
//     localStorage.setItem("theme", mode);
//     document.documentElement.setAttribute("data-theme", mode);
//   }, [mode]);

//   // Memoize theme per mode
// //   const theme = useMemo(() => muiTheme(mode), [mode]);
//   const theme = useMemo(() => muiTheme(), [mode]);


//   const icons = {
//     light: <Sun className="w-5 h-5" />,
//     dark: <Moon className="w-5 h-5" />,
//     ocean: <Waves className="w-5 h-5" />,
//      green: <HeartPulse className="w-5 h-5" />,
//   };

//   return (
//     <ThemeProvider theme={theme}>
//       <CssBaseline />
//       <div
//         className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] transition-colors relative"
//       >
//         {children}

//         {/* Floating Theme Switcher */}
//         <div
//           className="fixed bottom-5 right-5 z-50"
//           onMouseEnter={() => setOpen(true)}
//           onMouseLeave={() => setOpen(false)}
//         >
//           {/* Invisible hover buffer to prevent flicker */}
//           <div className="absolute bottom-full right-0 w-16 h-6"></div>

//           {/* Theme menu */}
//           {open && (
//             <div
//               className="absolute bottom-16 right-0 flex flex-col items-stretch gap-2 
//                          bg-[var(--color-surface)] rounded-2xl shadow-xl p-2 
//                          border border-[var(--color-primary)]/10 
//                          transition-all duration-200 origin-bottom-right"
//             >
//               {themes.map((t) => (
//                 <Tooltip key={t} title={`Switch to ${t} theme`} placement="left">
//                   <button
//                     onClick={() => setMode(t)}
//                     className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm 
//                                 whitespace-nowrap text-left transition-all ${
//                                   mode === t
//                                     ? "bg-[var(--color-primary)] text-[var(--color-bg)]"
//                                     : "hover:bg-[var(--color-primary)]/10"
//                                 }`}
//                   >
//                     {icons[t]}
//                     <span className="capitalize">{t}</span>
//                   </button>
//                 </Tooltip>
//               ))}
//             </div>
//           )}

//           {/* Main toggle button */}
//           <button
//             onClick={() => setOpen((prev) => !prev)}
//             className="p-3 rounded-full shadow-lg bg-[var(--color-primary)] 
//                        text-[var(--color-bg)] hover:scale-105 
//                        transition-transform flex items-center justify-center"
//           >
//             {icons[mode]}
//           </button>
//         </div>
//       </div>
//     </ThemeProvider>
//   );
// };
