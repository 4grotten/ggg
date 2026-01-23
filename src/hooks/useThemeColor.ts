import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Hook to dynamically update the theme-color meta tag
 * based on the current theme (light/dark)
 * 
 * Note: theme-color meta tag does NOT support transparency/alpha channel.
 * Browsers ignore alpha values in hex colors for status bar.
 * We use solid colors that match the background.
 */
export const useThemeColor = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (metaThemeColor) {
      // Solid colors matching app background
      // Dark theme = dark background (#121212), Light theme = white (#ffffff)
      const color = resolvedTheme === "dark" ? "#121212" : "#ffffff";
      metaThemeColor.setAttribute("content", color);
    }
  }, [resolvedTheme]);
};
