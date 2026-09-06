import { createTheme } from "@mui/material/styles";

export function getAppTheme(mode = "light") {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: {
        main: isDark ? "#6366F1" : "#4F46E5",
        light: "#818CF8",
        dark: "#4338CA",
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: "#0F172A",
        light: "#1E293B",
        dark: "#020617",
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
      info: {
        main: "#3B82F6",
        light: "#60A5FA",
        dark: "#2563EB",
        contrastText: "#FFFFFF",
      },
      background: {
        default: isDark ? "#0F172A" : "#F8FAFC",
        paper: isDark ? "#1E293B" : "#FFFFFF",
      },
      text: {
        primary: isDark ? "#F1F5F9" : "#0F172A",
        secondary: isDark ? "#94A3B8" : "#64748B",
        disabled: isDark ? "#475569" : "#94A3B8",
      },
      divider: isDark ? "#334155" : "#E2E8F0",
      action: {
        hover: isDark ? "rgba(99, 102, 241, 0.08)" : "rgba(79, 70, 229, 0.04)",
        selected: isDark ? "rgba(99, 102, 241, 0.16)" : "rgba(79, 70, 229, 0.08)",
      },
    },
    typography: {
      fontFamily:
        '"Inter", "system-ui", "-apple-system", BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h1: {
        fontSize: "2.25rem",
        fontWeight: 800,
        letterSpacing: "-0.035em",
        lineHeight: 1.2,
      },
      h2: {
        fontSize: "1.875rem",
        fontWeight: 800,
        letterSpacing: "-0.03em",
        lineHeight: 1.2,
      },
      h3: {
        fontSize: "1.5rem",
        fontWeight: 800,
        letterSpacing: "-0.025em",
        lineHeight: 1.25,
      },
      h4: {
        fontSize: "1.25rem",
        fontWeight: 700,
        letterSpacing: "-0.02em",
        lineHeight: 1.3,
      },
      h5: {
        fontSize: "1.125rem",
        fontWeight: 700,
        letterSpacing: "-0.015em",
        lineHeight: 1.35,
      },
      h6: {
        fontSize: "1rem",
        fontWeight: 700,
        letterSpacing: "-0.01em",
        lineHeight: 1.4,
      },
      body1: {
        fontSize: "0.875rem",
        lineHeight: 1.6,
      },
      body2: {
        fontSize: "0.8125rem",
        lineHeight: 1.55,
      },
      caption: {
        fontSize: "0.75rem",
        lineHeight: 1.4,
      },
      button: {
        fontSize: "0.8125rem",
        fontWeight: 600,
        textTransform: "none",
        letterSpacing: "0",
      },
      overline: {
        fontSize: "0.6875rem",
        fontWeight: 700,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      },
    },
    shape: {
      borderRadius: 10,
    },
    shadows: [
      "none",
      "0 1px 2px 0 rgba(15, 23, 42, 0.04)",
      "0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
      "0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.04)",
      "0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.04)",
      "0 20px 25px -5px rgba(15, 23, 42, 0.07), 0 10px 10px -5px rgba(15, 23, 42, 0.04)",
      "0 25px 50px -12px rgba(15, 23, 42, 0.1)",
      ...Array(18).fill("none"),
    ],
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          "*, *::before, *::after": {
            boxSizing: "border-box",
          },
          html: {
            scrollBehavior: "smooth",
          },
          body: {
            backgroundColor: isDark ? "#0F172A" : "#F8FAFC",
            color: isDark ? "#F1F5F9" : "#0F172A",
            fontFamily: '"Inter", sans-serif',
            textRendering: "optimizeLegibility",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
          },
          "::-webkit-scrollbar": {
            width: "6px",
            height: "6px",
          },
          "::-webkit-scrollbar-track": {
            background: "transparent",
          },
          "::-webkit-scrollbar-thumb": {
            background: isDark ? "#334155" : "#CBD5E1",
            borderRadius: "3px",
          },
          "::-webkit-scrollbar-thumb:hover": {
            background: isDark ? "#475569" : "#94A3B8",
          },
          "::selection": {
            backgroundColor: isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(79, 70, 229, 0.15)",
            color: isDark ? "#E0E7FF" : "#3730A3",
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
            border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            color: isDark ? "#F1F5F9" : "#0F172A",
            backgroundImage: "none",
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
            border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            color: isDark ? "#F1F5F9" : "#0F172A",
            backgroundImage: "none",
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
            padding: "8px 18px",
            fontWeight: 600,
            fontSize: "0.8125rem",
            textTransform: "none",
            letterSpacing: "0",
            transition: "all 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
            "&:focus-visible": {
              outline: `2px solid ${isDark ? "#6366F1" : "#4F46E5"}`,
              outlineOffset: "2px",
            },
          },
          containedPrimary: {
            backgroundColor: isDark ? "#6366F1" : "#4F46E5",
            color: "#FFFFFF",
            boxShadow: "0 1px 3px rgba(79, 70, 229, 0.2)",
            "&:hover": {
              backgroundColor: isDark ? "#4F46E5" : "#4338CA",
              boxShadow: "0 4px 12px rgba(79, 70, 229, 0.3)",
            },
            "&:active": {
              backgroundColor: "#3730A3",
            },
          },
          containedSecondary: {
            backgroundColor: isDark ? "#1E293B" : "#0F172A",
            color: "#FFFFFF",
            "&:hover": {
              backgroundColor: isDark ? "#334155" : "#1E293B",
            },
          },
          outlinedPrimary: {
            borderColor: isDark ? "#4F46E5" : "#C7D2FE",
            color: isDark ? "#818CF8" : "#4F46E5",
            backgroundColor: isDark ? "rgba(79, 70, 229, 0.05)" : "rgba(79, 70, 229, 0.02)",
            "&:hover": {
              backgroundColor: isDark ? "rgba(99, 102, 241, 0.1)" : "rgba(79, 70, 229, 0.06)",
              borderColor: isDark ? "#6366F1" : "#4F46E5",
            },
          },
          outlinedSecondary: {
            borderColor: isDark ? "#334155" : "#E2E8F0",
            color: isDark ? "#F1F5F9" : "#0F172A",
            backgroundColor: isDark ? "#1E293B" : "#FFFFFF",
            "&:hover": {
              backgroundColor: isDark ? "#334155" : "#F8FAFC",
              borderColor: isDark ? "#475569" : "#CBD5E1",
            },
          },
          text: {
            "&:hover": {
              backgroundColor: isDark ? "rgba(99, 102, 241, 0.08)" : "rgba(79, 70, 229, 0.04)",
            },
          },
          sizeLarge: {
            padding: "10px 22px",
            fontSize: "0.875rem",
          },
          sizeSmall: {
            padding: "5px 12px",
            fontSize: "0.75rem",
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
            backgroundColor: isDark ? "rgba(15, 23, 42, 0.5)" : "#FFFFFF",
            color: isDark ? "#F1F5F9" : "#0F172A",
            fontSize: "0.8125rem",
            transition: "all 0.15s ease",
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "#334155" : "#E2E8F0",
              borderWidth: "1px",
              transition: "border-color 0.15s ease",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "#475569" : "#CBD5E1",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: isDark ? "#6366F1" : "#4F46E5",
              borderWidth: "1.5px",
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${isDark ? "rgba(99, 102, 241, 0.2)" : "rgba(79, 70, 229, 0.12)"}`,
            },
            "&.Mui-error .MuiOutlinedInput-notchedOutline": {
              borderColor: "#EF4444",
            },
            "&.Mui-error.Mui-focused": {
              boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.12)",
            },
          },
          input: {
            padding: "9px 12px",
            fontSize: "0.8125rem",
            "&::placeholder": {
              color: isDark ? "#475569" : "#94A3B8",
              opacity: 1,
            },
          },
          multiline: {
            padding: 0,
          },
          inputMultiline: {
            padding: "9px 12px",
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            fontSize: "0.8125rem",
            color: isDark ? "#94A3B8" : "#64748B",
            "&.Mui-focused": {
              color: isDark ? "#818CF8" : "#4F46E5",
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          select: {
            fontSize: "0.8125rem",
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 6,
            fontWeight: 600,
            fontSize: "0.75rem",
            height: 26,
          },
          sizeSmall: {
            height: 22,
            fontSize: "0.6875rem",
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            fontSize: "1rem",
            fontWeight: 700,
            padding: "20px 24px 12px",
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: "8px 24px 20px",
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: "12px 24px 20px",
            gap: "8px",
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            boxShadow: isDark
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              : "0 25px 50px -12px rgba(15, 23, 42, 0.15)",
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            "& .MuiTableCell-root": {
              backgroundColor: isDark ? "#0F172A" : "#FAFAFA",
              color: isDark ? "#94A3B8" : "#64748B",
              fontWeight: 700,
              fontSize: "0.7rem",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              borderBottom: `1px solid ${isDark ? "#1E293B" : "#F1F5F9"}`,
            },
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: isDark ? "#1E293B" : "#F1F5F9",
            padding: "12px 16px",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            "&:last-child td": {
              borderBottom: "none",
            },
          },
          hover: {
            "&:hover": {
              backgroundColor: isDark ? "rgba(79, 70, 229, 0.05)" : "rgba(79, 70, 229, 0.02)",
            },
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            "&.Mui-selected": {
              backgroundColor: isDark ? "rgba(99, 102, 241, 0.15)" : "#EEF2FF",
              color: isDark ? "#818CF8" : "#4F46E5",
              "&:hover": {
                backgroundColor: isDark ? "rgba(99, 102, 241, 0.2)" : "#E0E7FF",
              },
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? "#334155" : "#0F172A",
            color: "#F8FAFC",
            fontSize: "0.75rem",
            fontWeight: 600,
            borderRadius: 6,
            padding: "5px 10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          },
          arrow: {
            color: isDark ? "#334155" : "#0F172A",
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            border: "1px solid",
            fontSize: "0.8125rem",
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            "& .MuiSwitch-switchBase.Mui-checked": {
              color: isDark ? "#6366F1" : "#4F46E5",
              "& + .MuiSwitch-track": {
                backgroundColor: isDark ? "#6366F1" : "#4F46E5",
                opacity: 0.8,
              },
            },
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            "&.Mui-checked": {
              color: isDark ? "#6366F1" : "#4F46E5",
            },
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            "&.Mui-checked": {
              color: isDark ? "#6366F1" : "#4F46E5",
            },
          },
        },
      },
      MuiPagination: {
        styleOverrides: {
          root: {
            "& .MuiPaginationItem-root.Mui-selected": {
              backgroundColor: isDark ? "#4F46E5" : "#4F46E5",
              color: "#FFFFFF",
              "&:hover": {
                backgroundColor: "#4338CA",
              },
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: isDark ? "#6366F1" : "#4F46E5",
            height: "2px",
            borderRadius: "2px",
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            fontWeight: 600,
            fontSize: "0.8125rem",
            textTransform: "none",
            "&.Mui-selected": {
              color: isDark ? "#818CF8" : "#4F46E5",
            },
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            borderRadius: 4,
            backgroundColor: isDark ? "#334155" : "#E2E8F0",
          },
          bar: {
            borderRadius: 4,
          },
        },
      },
      MuiCircularProgress: {
        defaultProps: {
          size: 24,
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: isDark ? "#1E293B" : "#F1F5F9",
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            transition: "all 0.15s ease",
            "&:focus-visible": {
              outline: `2px solid ${isDark ? "#6366F1" : "#4F46E5"}`,
              outlineOffset: "2px",
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 10,
            border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
            boxShadow: isDark
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.4)"
              : "0 10px 25px -5px rgba(15, 23, 42, 0.1)",
            minWidth: 180,
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            fontSize: "0.8125rem",
            fontWeight: 500,
            borderRadius: 6,
            margin: "2px 6px",
            padding: "7px 10px",
            "&:hover": {
              backgroundColor: isDark ? "rgba(99, 102, 241, 0.1)" : "rgba(79, 70, 229, 0.06)",
            },
            "&.Mui-selected": {
              backgroundColor: isDark ? "rgba(99, 102, 241, 0.15)" : "#EEF2FF",
              color: isDark ? "#818CF8" : "#4F46E5",
            },
          },
        },
      },
      MuiPopover: {
        styleOverrides: {
          paper: {
            borderRadius: 12,
            border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
            boxShadow: isDark
              ? "0 20px 40px -8px rgba(0, 0, 0, 0.5)"
              : "0 20px 40px -8px rgba(15, 23, 42, 0.12)",
          },
        },
      },
      MuiSnackbar: {
        defaultProps: {
          anchorOrigin: { vertical: "top", horizontal: "right" },
        },
      },
      MuiBadge: {
        styleOverrides: {
          badge: {
            fontWeight: 700,
            fontSize: "0.65rem",
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            fontSize: "0.75rem",
            marginLeft: 0,
            marginTop: "4px",
          },
        },
      },
    },
  });
}

export default getAppTheme;