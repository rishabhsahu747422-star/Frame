import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreference] = useState(() => {
    return localStorage.getItem("frame-theme") || "system";
  });

  const [activeTheme, setActiveTheme] = useState("light");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const computeTheme = (pref) => {
      if (pref === "system") {
        return mediaQuery.matches ? "dark" : "light";
      }
      return pref;
    };

    const currentTheme = computeTheme(themePreference);
    setActiveTheme(currentTheme);
    document.documentElement.setAttribute("data-theme", currentTheme);
    localStorage.setItem("frame-theme", themePreference);

    const handleSystemChange = (e) => {
      if (themePreference === "system") {
        const newTheme = e.matches ? "dark" : "light";
        setActiveTheme(newTheme);
        document.documentElement.setAttribute("data-theme", newTheme);
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [themePreference]);

  const setTheme = (theme) => {
    if (["light", "dark", "system"].includes(theme)) {
      setThemePreference(theme);
    }
  };

  const toggleTheme = () => {
    setThemePreference((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ themePreference, activeTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
