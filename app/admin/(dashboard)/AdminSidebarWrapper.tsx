"use client";

import * as React from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";

const COLLAPSE_STORAGE_KEY = "magieklayn-admin-sidebar-collapsed";

interface AdminSidebarWrapperProps {
  userEmail: string;
  children: React.ReactNode;
}

// Also renders <main> (not just the sidebar) so the content area's left
// margin can react to the desktop collapse state below — layout.tsx (a
// server component) has no channel to that client-only state otherwise.
export const AdminSidebarWrapper: React.FC<AdminSidebarWrapperProps> = ({
  userEmail,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  // Starts expanded on the server render; the real (possibly collapsed)
  // preference is read from localStorage after mount, since a client-only
  // preference has no server-side signal. Trades a brief expand->collapse
  // flash on first paint (if previously collapsed) for avoiding a hydration
  // mismatch — acceptable for an internal admin tool.
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  React.useEffect(() => {
    try {
      setIsCollapsed(localStorage.getItem(COLLAPSE_STORAGE_KEY) === "1");
    } catch {
      // localStorage unavailable (e.g. private browsing) — stay expanded.
    }
  }, []);

  function toggleCollapsed() {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore — collapse still works for this session, just not remembered
      }
      return next;
    });
  }

  return (
    <>
      <AdminTopBar onMenuClick={() => setIsSidebarOpen(true)} userEmail={userEmail} />
      <AdminSidebar
        userEmail={userEmail}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={toggleCollapsed}
      />
      <main
        className={`min-h-screen transition-[margin] duration-200 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </>
  );
};
