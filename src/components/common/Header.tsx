import  { useState, useRef, useEffect } from "react";
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

  // Fetch requests
// 🔹 Fetch requests for admin/staff
useEffect(() => {
  if (!userData?.company_id) return;

  const fetchRequests = async () => {
    try {
      let data, error;
      console.log(error);
      

      if (userData.role === "Admin") {
        // Admin: fetch all PENDING requests from attendance_requests and reimbursements
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance_requests")
          .select(`
            id,
            user_id,
            request_type,
            status,
            reason,
            created_at
          `)
          .eq("company_id", userData.company_id)
          .eq("status", "PENDING")
          .order("created_at", { ascending: false });

        if (attendanceError) throw attendanceError;

        const { data: reimbursementData, error: reimbursementError } = await supabase
          .from("reimbursements")
          .select(`
            id,
            user_id,
            category as request_type,
            status,
            description,
            expense_date as created_at
          `)
          .eq("company_id", userData.company_id)
          .eq("status", "PENDING")
          .order("created_at", { ascending: false });

        if (reimbursementError) throw reimbursementError;

        data = [
          ...(attendanceData || []).map((r: Record<string, any>) => ({
            ...r,
            request_source: "ATTENDANCE",
            detail: r.reason,
          })),
          ...(reimbursementData || []).map((r: Record<string, any>) => ({
            ...r,
            request_source: "REIMBURSEMENT",
            detail: r.description,
            

          })),
        ];
       
      } else {
        // Staff: show only APPROVED or REJECTED requests
        ({ data, error } = await supabase
          .from("attendance_requests")
          .select(`
            id,
            request_type,
            status,
            reason,
            created_at
          `)
          .eq("user_id", userData.id)
          .in("status", ["APPROVED", "REJECTED"])
          .order("created_at", { ascending: false }));
      }

      const normalized = (data || []).map((r: any) => ({
        id: r.id,
        type: r.request_type,
        status: r.status,
        created_at: r.created_at,
        detail: r.detail || r.reason || r.description || "No details",
        requestedBy: userData.role === "Admin" ? r.user_id : userData.name,
        navigateTo:
          r.request_source === "REIMBURSEMENT"
            ? `/reimbursements/${r.user_id}`
            : `/attendance-detail/${r.user_id}`,
      }));

      setRequests(normalized);
    } catch (err) {
      console.error("Error fetching requests:", err);
    }
  };

  fetchRequests();
}, [userData?.company_id, userData?.id, userData?.role]);


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
        </div>

        {/* Profile Info with Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => setDropdownOpen((prev) => !prev)}
          >
            <img
              src="https://www.pngplay.com/wp-content/uploads/12/User-Avatar-Profile-Transparent-Free-PNG-Clip-Art.png"
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
              <h2 className="text-lg font-semibold">Requests</h2>
              <FaTimes
                className="cursor-pointer text-gray-600"
                onClick={() => setShowNotifModal(false)}
              />
            </div>

            {/* Requests List */}
            <div className="p-4 space-y-3">
              {requests.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">No requests</p>
              ) : (
                requests.map((req) => (
                  <div
                    key={req.id}
                    onClick={() => {
                      setShowNotifModal(false);
                      navigate(req.navigateTo);
                    }}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <p className="text-sm font-medium">{req.type} Request</p>
                      <p className="text-xs text-gray-500">{req.detail || "No details"}</p>
                      <p className="text-xs text-gray-400">{new Date(req.created_at).toLocaleString()}</p>
                    </div>

                    {userData.role !== "Admin" && (
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          req.status === "APPROVED"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {req.status}
                      </span>
                    )}
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
