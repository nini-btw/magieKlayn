"use client";

import * as React from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";

interface AdminSidebarWrapperProps {
  userEmail: string;
}

export const AdminSidebarWrapper: React.FC<AdminSidebarWrapperProps> = ({ userEmail }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <>
      <AdminTopBar 
        onMenuClick={() => setIsSidebarOpen(true)} 
        userEmail={userEmail}
      />
      <AdminSidebar 
        userEmail={userEmail} 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </>
  );
};
