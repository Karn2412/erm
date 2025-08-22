import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaUsers,
  FaCalendarAlt,
  FaFileInvoiceDollar,
  FaRegFileAlt,
  FaCog,
  FaUserCircle,
} from "react-icons/fa";
import { MdDashboard } from "react-icons/md";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  role: "admin" | "staff"; // 👈 controlled by user role
}

const adminMenuItems = [
  { name: "Dashboard", icon: <MdDashboard />, path: "/dashboard" },
  { name: "Employees", icon: <FaUsers />, path: "/employees" },
  { name: "Attendance and Leave", icon: <FaCalendarAlt />, path: "/attendance" },
  { name: "Pay Runs", icon: <FaFileInvoiceDollar />, path: "/payruns" },
  { name: "Reimbursements", icon: <FaRegFileAlt />, path: "/reimbursements" },
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
  const menuItems = role === "admin" ? adminMenuItems : staffMenuItems;

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
        <h1 className="text-xl font-bold text-blue-600 mb-6">ScholarCred</h1>
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
