import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import getAppTheme from "../theme/theme";
import api from "../api/api";

const ThemeContext = createContext({
  themeMode: "light",
  setThemeMode: () => {},
  isDark: false,
});

export const useColorMode = () => useContext(ThemeContext);

export function ColorModeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(() => {
    return localStorage.getItem("formify_theme") || "light";
  });

  const [systemIsDark, setSystemIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Listen to OS system color scheme preference changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e) => setSystemIsDark(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, []);

  // Fetch saved theme preference from database on load if user is logged in
  useEffect(() => {
    async function fetchSavedTheme() {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await api.get("/settings/");
        if (res.data?.preferences?.theme) {
          const dbTheme = res.data.preferences.theme;
          setThemeModeState(dbTheme);
          localStorage.setItem("formify_theme", dbTheme);
        }
      } catch {
        // Ignore fetch errors
      }
    }
    fetchSavedTheme();
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === "dark") return true;
    if (themeMode === "system") return systemIsDark;
    return false;
  }, [themeMode, systemIsDark]);

  // Update HTML element dark class & body styling
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      document.body.style.backgroundColor = "#0F172A";
      document.body.style.color = "#F8FAFC";
    } else {
      root.classList.remove("dark");
      document.body.style.backgroundColor = "#FAFAFA";
      document.body.style.color = "#0F172A";
    }
  }, [isDark]);

  // Set theme mode, update localStorage and database
  const setThemeMode = async (newMode) => {
    setThemeModeState(newMode);
    localStorage.setItem("formify_theme", newMode);

    const token = localStorage.getItem("token");
    if (token) {
      try {
        await api.put("/settings/preferences", { theme: newMode });
      } catch {
        // Ignore background save errors
      }
    }
  };

  const currentTheme = useMemo(() => getAppTheme(isDark ? "dark" : "light"), [isDark]);

  const value = useMemo(
    () => ({
      themeMode,
      setThemeMode,
      isDark,
    }),
    [themeMode, isDark]
  );

  return (
    <ThemeContext.Provider value={value}>
      <ThemeProvider theme={currentTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
