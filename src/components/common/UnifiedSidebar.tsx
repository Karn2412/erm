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

// redux imports
import { useAppSelector } from "../../redux/store";

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

// ... keep your imports

const UnifiedSidebar: React.FC<Props> = ({ isOpen, onClose, role }) => {
  const location = useLocation();
  const { userData } = useUser();
  const companyData = useAppSelector((state) => state.company);
  console.log("Company data from Redux:", companyData);
  
  const menuItems = role === "admin" ? adminMenuItems : staffMenuItems;

  const [company, setCompany] = useState<{ name: string; logo_url?: string } | null>(null);
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [reimbursementCount, setReimbursementCount] = useState(0);

useEffect(() => {
  if (companyData.id) {
    setCompany({
      name: companyData.name,
      logo_url: companyData.logo_url || undefined,
    });
  }
}, [companyData]);

// Fetch company + listen for realtime updates
useEffect(() => {
  if (!userData?.company_id) return;

  const fetchCompany = async () => {
    const { data } = await supabase
      .from("companies")
      .select("name, logo_url")
      .eq("id", userData.company_id)
      .single();
    if (data) setCompany(data);
  };

  fetchCompany();

  // ✅ Subscribe to changes on this company's row
  const channel = supabase
    .channel("company-updates")
    .on(
      "postgres_changes",
      {
        event: "*",            // INSERT | UPDATE | DELETE
        schema: "public",
        table: "companies",
        filter: `id=eq.${userData.company_id}`,
      },
      (payload) => {
        console.log("Company updated:", payload);
        fetchCompany(); // re-fetch latest logo + name
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userData?.company_id]);


  // ✅ Fetch request counts
  useEffect(() => {
    if (!userData?.company_id) return;

    const fetchRequests = async () => {
      try {
        if (userData?.role?.toLowerCase() === "admin") {
          const { count: attCount } = await supabase
            .from("attendance_requests")
            .select("*", { count: "exact", head: true })
            .eq("company_id", userData.company_id)
            .eq("status", "PENDING");

          const { count: reimbCount } = await supabase
            .from("reimbursements")
            .select("*", { count: "exact", head: true })
            .eq("company_id", userData.company_id)
            .eq("status", "PENDING");

          setAttendanceCount(attCount || 0);
          setReimbursementCount(reimbCount || 0);
        }
      } catch (err) {
        console.error("Error fetching requests count:", err);
      }
    };

    fetchRequests();

    // ✅ Listen for changes to requests
    const channel = supabase
      .channel("sidebar-requests")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_requests" },
        () => fetchRequests()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "reimbursements" },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userData?.company_id, userData?.role]);

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
        {/* Company */}
        <div className="flex items-center space-x-3 mb-6">
          {company?.logo_url && (
            <img
              src={company.logo_url}
              alt="Company Logo"
              className="w-10 h-10 rounded-full object-cover"
            />
          )}
          <h1 className="text-xl font-bold text-blue-600">
            {company?.name || ""}
          </h1>
        </div>

        {/* Menu */}
        <ul className="space-y-4">
          {menuItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path);

            const badgeCount =
              item.name === "Attendance and Leave"
                ? attendanceCount
                : item.name === "Reimbursements"
                ? reimbursementCount
                : 0;

            return (
              <li key={item.name} className="relative">
                <NavLink
                  to={item.path}
                  className={`flex items-center justify-between px-4 py-2 rounded-xl font-medium ${
                    isActive
                      ? "text-white bg-gradient-to-r from-cyan-500 to-blue-400 shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>

                  {badgeCount > 0 && (
                    <span className="ml-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {badgeCount}
                    </span>
                  )}
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