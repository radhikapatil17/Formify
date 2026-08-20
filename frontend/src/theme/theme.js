import { createTheme } from "@mui/material/styles";

export function getAppTheme(mode = "light") {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: isDark
        ? {
            main: "#6366F1",
            light: "#818CF8",
            dark: "#4F46E5",
            contrastText: "#FFFFFF",
          }
        : {
            main: "#0F172A",
            light: "#1E293B",
            dark: "#020617",
            contrastText: "#FFFFFF",
          },
      secondary: {
        main: "#4F46E5",
        light: "#6366F1",
        dark: "#4338CA",
        contrastText: "#FFFFFF",
      },
      success: {
        main: "#10B981",
        light: "#34D399",
        dark: "#059669",
        contrastText: "#FFFFFF",
      },
      warning: {
        main: "#F59E0B",
        light: "#FBBF24",
        dark: "#D97706",
        contrastText: "#FFFFFF",
      },
      error: {
        main: "#EF4444",
        light: "#F87171",
        dark: "#DC2626",
        contrastText: "#FFFFFF",
      },
      background: {
        default: isDark ? "#0F172A" : "#FAFAFA",
        paper: isDark ? "#1E293B" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#F8FAFC" : "#0F172A",
        secondary: isDark ? "#94A3B8" : "#64748B",
        disabled: isDark ? "#64748B" : "#94A3B8",
      },
      divider: isDark ? "#334155" : "#E2E8F0",
    },
    typography: {
      fontFamily: '"Inter", "system-ui", "-apple-system", BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontSize: "2.25rem",
        fontWeight: 800,
        letterSpacing: "-0.035em",
        color: isDark ? "#F8FAFC" : "#0F172A",
      },
      h2: {
        fontSize: "1.875rem",
        fontWeight: 800,
        letterSpacing: "-0.03em",
        color: isDark ? "#F8FAFC" : "#0F172A",
      },
      h3: {
        fontSize: "1.5rem",
        fontWeight: 800,
        letterSpacing: "-0.025em",
        color: isDark ? "#F8FAFC" : "#0F172A",
      },
      h4: {
        fontSize: "1.25rem",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        color: isDark ? "#F8FAFC" : "#0F172A",
      },
      h5: {
        fontSize: "1.125rem",
        fontWeight: 700,
        letterSpacing: "-0.015em",
        color: isDark ? "#F8FAFC" : "#0F172A",
      },
      h6: {
        fontSize: "0.95rem",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        color: isDark ? "#F8FAFC" : "#0F172A",
      },
      body1: {
        fontSize: "0.875rem",
        lineHeight: 1.5,
        color: isDark ? "#F8FAFC" : "#0F172A",
      },
      body2: {
        fontSize: "0.8125rem",
        lineHeight: 1.5,
        color: isDark ? "#94A3B8" : "#64748B",
      },
      button: {
        fontSize: "0.8125rem",
        fontWeight: 600,
        textTransform: "none",
        letterSpacing: "0.01em",
      },
    },
    shape: {
      borderRadius: 10,
    },
    shadows: [
      "none",
      "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
      "0 1px 3px 0 rgba(15, 23, 42, 0.05), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
      "0 4px 6px -1px rgba(15, 23, 42, 0.04), 0 2px 4px -2px rgba(15, 23, 42, 0.03)",
      "0 10px 15px -3px rgba(15, 23, 42, 0.05), 0 4px 6px -4px rgba(15, 23, 42, 0.03)",
      "0 20px 25px -5px rgba(15, 23, 42, 0.06), 0 10px 10px -5px rgba(15, 23, 42, 0.04)",
      ...Array(19).fill("none"),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? "#0F172A" : "#FAFAFA",
            color: isDark ? "#F8FAFC" : "#0F172A",
            fontFamily: '"Inter", sans-serif',
            textRendering: "optimizeLegibility",
            WebkitFontSmoothing: "antialiased",
          },
        },
      },
      MuiPaper: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: isDark ? "1px solid #334155" : "1px solid #E2E8F0",
            boxShadow: isDark
              ? "0 4px 20px -2px rgba(0, 0, 0, 0.3)"
              : "0 1px 3px 0 rgba(15, 23, 42, 0.02)",
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            color: isDark ? "#F8FAFC" : "#0F172A",
          },
        },
      },
      MuiCard: {
        defaultProps: {
          elevation: 0,
        },
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: isDark ? "1px solid #334155" : "1px solid #E2E8F0",
            boxShadow: isDark
              ? "0 4px 20px -2px rgba(0, 0, 0, 0.3)"
              : "0 1px 3px 0 rgba(15, 23, 42, 0.02)",
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            color: isDark ? "#F8FAFC" : "#0F172A",
          },
        },
      },
      MuiButton: {
        defaultProps: {
          disableElevation: true,
        },
        styleOverrides: {
          root: {
            borderRadius: 8,
            padding: "8px 16px",
            fontWeight: 600,
            border: "1px solid transparent",
            transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
          },
          containedPrimary: {
            backgroundColor: isDark ? "#6366F1" : "#0F172A",
            color: "#FFFFFF",
            borderColor: isDark ? "#4F46E5" : "#1E293B",
            "&:hover": {
              backgroundColor: isDark ? "#4F46E5" : "#1E293B",
            },
          },
          containedSecondary: {
            backgroundColor: "#4F46E5",
            color: "#FFFFFF",
            borderColor: "#4338CA",
            "&:hover": {
              backgroundColor: "#4338CA",
            },
          },
          outlinedPrimary: {
            borderColor: isDark ? "#334155" : "#E2E8F0",
            color: isDark ? "#F8FAFC" : "#0F172A",
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            boxShadow: "0 1px 2px 0 rgba(15, 23, 42, 0.02)",
            "&:hover": {
              backgroundColor: isDark ? "#334155" : "#F8FAFC",
              borderColor: isDark ? "#475569" : "#CBD5E1",
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
          size: "small",
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: isDark ? "#0F172A" : "#FFFFFF",
            color: isDark ? "#F8FAFC" : "#0F172A",
            transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "#334155" : "#E2E8F0",
              borderWidth: "1px",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "#475569" : "#CBD5E1",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "#6366F1",
              borderWidth: "1px",
            },
            "&.Mui-focused": {
              boxShadow: "0 0 0 3px rgba(99, 102, 241, 0.18)",
            },
          },
          input: {
            padding: "9px 12px",
            fontSize: "0.8125rem",
            color: isDark ? "#F8FAFC" : "#0F172A",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 600,
            fontSize: "0.75rem",
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: "0.8125rem",
            color: isDark ? "#94A3B8" : "#64748B",
            "&.Mui-focused": {
              color: "#6366F1",
            },
          },
        },
      },
    },
  });
}

export default getAppTheme;