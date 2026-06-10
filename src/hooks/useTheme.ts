import { useState, useCallback, useEffect } from "react";

function getInitialTheme(): "light" | "dark" {
  const stored = localStorage.getItem("sudoku-theme");
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("sudoku-theme", next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
}
