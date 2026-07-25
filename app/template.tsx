"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * Page transition template
 * Wraps all pages with Framer Motion transitions
 * Handles RTL direction changes
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const [dir, setDir] = useState("ltr");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Set initial direction based on localStorage
    const savedLocale = localStorage.getItem("locale") || "en";
    const newDir = savedLocale === "ar" ? "rtl" : "ltr";
    setDir(newDir);
    document.documentElement.dir = newDir;
    document.documentElement.lang = savedLocale;

    // Listen for locale changes
    const handleLocaleChange = (e: CustomEvent<string>) => {
      const newLocale = e.detail;
      const newDir = newLocale === "ar" ? "rtl" : "ltr";
      setDir(newDir);
      document.documentElement.dir = newDir;
      document.documentElement.lang = newLocale;
    };

    window.addEventListener("locale-change" as any, handleLocaleChange);
    return () => {
      window.removeEventListener("locale-change" as any, handleLocaleChange);
    };
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        transition={{ duration: 0.25 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.25 }}
      dir={dir}
    >
      {children}
    </motion.div>
  );
}
