"use client";

import * as React from "react";
import { MenuIcon, GlobeIcon } from "lucide-react";
import { useTranslations, useLocale } from 'next-intl';

interface AdminTopBarProps {
  onMenuClick: () => void;
  userEmail: string;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({ onMenuClick, userEmail }) => {
  const t = useTranslations();
  const locale = useLocale();
  const [currentDate, setCurrentDate] = React.useState("");

  React.useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const formatted = now.toLocaleDateString(
        locale === "ar" ? "ar-SA" : locale === "fr" ? "fr-FR" : "en-US",
        {
          weekday: "short",
          month: "short",
          day: "numeric",
        }
      );
      setCurrentDate(formatted);
    };
    updateDate();
    const timer = setInterval(updateDate, 60000);
    return () => clearInterval(timer);
  }, [locale]);

  return (
    <header className="sticky top-0 z-30 border-b border-[#E8D5C0] bg-white px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between">
        {/* Menu Button */}
        <button
          onClick={onMenuClick}
          className="-ml-2 cursor-pointer rounded-lg p-2 transition-colors hover:bg-[#F0E6D6]"
          aria-label="Open menu"
        >
          <MenuIcon className="h-5 w-5 text-[#2C1810]" />
        </button>

        {/* Date */}
        <span className="text-sm font-medium text-[#5C3D2E]">{currentDate}</span>
      </div>
    </header>
  );
};
