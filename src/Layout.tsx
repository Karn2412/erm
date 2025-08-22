import React, { useState } from "react";
import { useUser } from "./context/UserContext";
import UnifiedSidebar from "./components/common/UnifiedSidebar";
import Header from "./components/common/Header";


const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { userData } = useUser(); // 👈 get role from user context

  // fallback role (if userData.role not ready yet)
  const role = userData?.role === "admin" ? "admin" : "staff";

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <UnifiedSidebar isOpen={isOpen} onClose={() => setIsOpen(false)} role={role} />

      {/* Main Section */}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 bg-gray-50">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
