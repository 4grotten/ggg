import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Hook to dynamically update the theme-color meta tag
 * based on the current theme (light/dark)
 */
export const useThemeColor = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (metaThemeColor) {
      // Light theme = white status bar, Dark theme = black status bar
      const color = resolvedTheme === "dark" ? "#121212" : "#ffffff";
      metaThemeColor.setAttribute("content", color);
    }
  }, [resolvedTheme]);
};
