"use client";

import { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("veritas-theme") as "dark" | "light" | null;
    const initial = stored ?? "light"; // default: light
    setTheme(initial);
    applyTheme(initial);
  }, []);

  function applyTheme(t: "dark" | "light") {
    if (t === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.remove("light");
    }
  }

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("veritas-theme", next);
    applyTheme(next);
  }

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <motion.button
      onClick={toggle}
      whileTap={{ scale: 0.88 }}
      className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-all"
      aria-label="Toggle theme"
    >
      <motion.div
        key={theme}
        initial={{ rotate: -30, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </motion.div>
    </motion.button>
  );
}
