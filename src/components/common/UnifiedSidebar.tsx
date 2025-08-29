import React, { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaUsers,
  FaCalendarAlt,
  
  FaRegFileAlt,
  FaCog,
  FaUserCircle,
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";
import { useUser } from "../../context/UserContext";
import { supabase } from "../../supabaseClient";
// 👈 make sure you have supabase client

interface Props {
  isOpen: boolean;
  onClose: () => void;
  role: "admin" | "staff";
}

const adminMenuItems = [
  { name: "Dashboard", icon: <MdDashboard />, path: "/dashboard" },
  { name: "Employees", icon: <FaUsers />, path: "/employees" },
  { name: "Attendance and Leave", icon: <FaCalendarAlt />, path: "/attendance" },
  { name: "Pay Runs", icon: <FaFileInvoiceDollar />, path: "/payruns" },
  { name: "Reimbursements", icon: <FaMoneyCheckAlt />, path: "/reimbursements" },
  { name: "Templates", icon: <FaRegFileAlt />, path: "/templates" },
  { name: "Settings", icon: <FaCog />, path: "/settings" },
];

const staffMenuItems = [
  { name: "Dashboard", icon: <MdDashboard />, path: "/staff/dashboard" },
  { name: "Personal Details", icon: <FaUserCircle />, path: "/staff/personal-details" },
  { name: "Attendance and Leave", icon: <FaCalendarAlt />, path: "/staff/attendance" },
  { name: "Pay Slips", icon: <FaFileInvoiceDollar />, path: "/staff/pay-slips" },
  { name: "Reimbursements", icon: <FaRegFileAlt />, path: "/staff/reimbursements" },
];

const UnifiedSidebar: React.FC<Props> = ({ isOpen, onClose, role }) => {
  const location = useLocation();
  const { userData } = useUser();
  const menuItems = role === "admin" ? adminMenuItems : staffMenuItems;

  // 👇 state for company details
  const [company, setCompany] = useState<{ name: string; logo_url?: string } | null>(null);

  // 👇 fetch company whenever userData changes
  useEffect(() => {
    const fetchCompany = async () => {
      if (!userData?.company_id) return;

      const { data, error } = await supabase
        .from("companies")
        .select("name, logo_url")
        .eq("id", userData.company_id)
        .single();

      if (!error && data) {
        setCompany(data);
      }
    };

    fetchCompany();
  }, [userData?.company_id]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black bg-opacity-30 md:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed z-40 top-0 left-0 h-full w-72 bg-white p-4 border-r-gray-200 transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:static md:block`}
      >
        {/* 👇 Dynamic company info */}
        <div className="flex items-center space-x-3 mb-6">
          {company?.logo_url && (
            <img
              src={company.logo_url}
              alt="Company Logo"
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <h1 className="text-xl font-bold text-blue-600">
            {company?.name || "Loading..."}
          </h1>
        </div>

        <ul className="space-y-4">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path);

            return (
              <li key={item.name}>
                <NavLink
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-2 rounded-xl font-medium ${
                    isActive
                      ? "text-white bg-gradient-to-r from-cyan-500 to-blue-400 shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default UnifiedSidebar;
