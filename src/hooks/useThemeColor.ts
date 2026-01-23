import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * Hook to dynamically update the theme-color meta tag
 * based on the current theme (light/dark)
 * Uses semi-transparent colors to match app header style
 */
export const useThemeColor = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (metaThemeColor) {
      // Semi-transparent colors matching bg-background/95 from MobileLayout header
      // Light theme = slightly transparent white, Dark theme = slightly transparent dark
      const color = resolvedTheme === "dark" ? "#121212f2" : "#fffffff2";
      metaThemeColor.setAttribute("content", color);
    }
  }, [resolvedTheme]);
};
