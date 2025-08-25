import React, { useState, useRef, useEffect } from "react";
import { FaSearch, FaBell, FaTimes } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useUser } from "../../context/UserContext";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userData } = useUser();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const dropdownRef = useRef(null);

  const hideSearchBarRoutes = ["/employees"];
  const shouldHideSearchBar = hideSearchBarRoutes.includes(location.pathname);

  // Logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error:", error.message);
    } else {
      localStorage.removeItem("userData");
      navigate("/login");
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (dropdownRef.current && !(dropdownRef.current as any).contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

// 🔹 Fetch Pending Requests (from view)
// 🔹 Fetch Pending Requests (from view)
useEffect(() => {
  if (!userData?.company_id) return;

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from("pending_requests_view")
        .select("*")
        .eq("company_id", userData.company_id);

      if (error) throw error;

      // Normalize for UI
      const combined = (data || []).map((r) => ({
        id: r.request_id,
        type: r.request_source === "ATTENDANCE" ? r.request_type : "REIMBURSEMENT",
        status: r.status,
        created_at: r.created_at,
        detail: r.description,
        userId: r.user_id,
        requestedBy: r.user_name || "Unknown User",
        navigateTo:
          r.request_source === "ATTENDANCE"
            ? `/attendance-detail/${r.user_id}` // ✅ new attendance route
            : `/reimbursements/${r.user_id}`,   // ✅ new reimbursement route
      }));

      setRequests(combined);
    } catch (err) {
      console.error("Error fetching pending requests view:", err);
    }
  };

  fetchRequests();
}, [userData?.company_id]);



  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 border-b border-gray-200 space-y-4 sm:space-y-0">
      {/* Title */}
      <h3 className="text-lg font-semibold capitalize">
        {location.pathname === "/employees/add"
          ? "Employee"
          : location.pathname.includes("employees")
          ? "Employees"
          : location.pathname.includes("attendance")
          ? "Attendance And Leave"
          : location.pathname.includes("pay")
          ? "Pay Runs"
          : location.pathname.includes("reimbursements")
          ? "Reimbursements"
          : location.pathname.includes("templates")
          ? "Templates"
          : location.pathname.includes("settings")
          ? "Settings"
          : location.pathname.includes("personal-details")
          ? "Personal Details"
          : location.pathname.includes("pay-slips")
          ? "Pay Slips"
          : "Dashboard"}
      </h3>

      {/* Right Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 space-y-4 sm:space-y-0 w-full sm:w-auto">
        {/* Search Bar */}
        {!shouldHideSearchBar && (
          <div className="flex items-center bg-gray-100 px-3 py-2 rounded w-full sm:w-auto">
            <FaSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search Category..."
              className="bg-transparent outline-none w-full"
            />
          </div>
        )}

        {/* Notification Icon */}
        <div className="relative">
          <FaBell
            className="text-gray-600 cursor-pointer"
            onClick={() => setShowNotifModal(true)}
          />
          {requests.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 rounded-full">
              {requests.length}
            </span>
          )}
        </div>

        {/* Profile Info with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <img
              src="https://www.profilebakery.com/wp-content/uploads/2023/04/LINKEDIN-Profile-Picture-AI-400x400.jpg"
              alt="Profile"
              className="rounded-full w-[30px] h-[30px]"
            />
            <div>
              <p className="text-sm font-medium">{userData?.name || "Loading..."}</p>
              <p className="text-xs text-gray-500">{userData?.role || "User"}</p>
            </div>
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow-md z-10">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 🔹 Notification Modal */}
      {showNotifModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start pt-20 z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="bg-white rounded-lg shadow-lg w-[400px] max-h-[500px] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b px-4 py-2">
              <h2 className="text-lg font-semibold">Pending Requests</h2>
              <FaTimes
                className="cursor-pointer text-gray-600"
                onClick={() => setShowNotifModal(false)}
              />
            </div>

            {/* Requests List */}
            <div className="p-4 space-y-3">
              {requests.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">No pending requests</p>
              ) : (
                requests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => {
                      setShowNotifModal(false);
                      navigate(req.navigateTo);
                    }}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <p className="text-sm font-medium">
                      {req.type} Request {req.amount ? `- ₹${req.amount}` : ""}
                    </p>
                    <p className="text-xs text-gray-600">
                      Requested by: {req.requestedBy}
                    </p>
                    <p className="text-xs text-gray-500">
                      {req.detail || "No details"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(req.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
