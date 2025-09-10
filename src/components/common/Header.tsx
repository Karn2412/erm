import { useState, useRef, useEffect } from "react";
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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const dropdownRef = useRef(null);

  const hideSearchBarRoutes = ["/employees"];
  const shouldHideSearchBar = hideSearchBarRoutes.includes(location.pathname);

  // ✅ Fetch avatar directly here
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!userData?.auth_id) return;

      const { data, error } = await supabase
        .from("user_with_email")
        .select("gender_avatar")
        .eq("auth_id", userData.auth_id)
        .single();

      if (!error && data) {
        setAvatarUrl(data.gender_avatar);
      }
    };

    fetchAvatar();
  }, [userData?.auth_id]);

  // Logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
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
  useEffect(() => {
    if (!userData?.company_id) return;

    const fetchRequests = async () => {
      try {
        let data: any[] = [];

        if (userData?.role?.toLowerCase() === "admin") {
          // ✅ Attendance requests
          const { data: attendanceData, error: attErr } = await supabase
            .from("attendance_requests")
            .select("id,user_id,request_type,status,reason,created_at")
            .eq("company_id", userData.company_id)
            .eq("status", "PENDING")
            .order("created_at", { ascending: false });

          if (attErr) console.error("Attendance fetch error", attErr);

          // ✅ Reimbursements
          const { data: reimbursementData, error: reimbErr } = await supabase
            .from("reimbursements")
            .select("id,user_id,category,status,description,expense_date,company_id")
            .eq("company_id", userData.company_id)
            .eq("status", "PENDING")
            .order("expense_date", { ascending: false });

          if (reimbErr) console.error("Reimbursement fetch error", reimbErr);

          // Merge + normalize
          data = [
            ...(attendanceData ?? []).map((r: any) => ({
              ...r,
              request_source: "ATTENDANCE",
              detail: r.reason || "No details",
            })),
            ...(reimbursementData ?? []).map((r: any) => ({
              ...r,
              request_source: "REIMBURSEMENT",
              request_type: r.category,
              created_at: r.expense_date,
              detail: r.description || "No details",
            })),
          ];
        } else {
          // ✅ Staff (self view)
          const { data: staffData, error: staffErr } = await supabase
            .from("attendance_requests")
            .select("id,request_type,status,reason,created_at")
            .eq("user_id", userData?.id)
            .in("status", ["APPROVED", "REJECTED"])
            .order("created_at", { ascending: false });

          if (staffErr) console.error("Staff fetch error", staffErr);

          data = staffData ?? [];
        }

        // ✅ Normalize for UI
        const normalized = (data || []).map((r: any) => ({
          id: r.id,
          type: r.request_type,
          status: r.status,
          created_at: r.created_at,
          detail: r.detail || r.reason || r.description || "No details",
          requestedBy: userData?.role?.toLowerCase() === "admin" ? r.user_id : userData?.name,
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
    <div className="flex justify-between items-center bg-[#f8f8f8] px-6 py-3 ">
      {/* Left: Breadcrumb / Page Title */}
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-gray-800 text-lg font-semibold mb-4">
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
        </span>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-5">
        {/* Search Bar */}
        {!shouldHideSearchBar && (
          <div className="flex items-center bg-white shadow-sm rounded-full px-3 py-2 w-[230px]">
            <FaSearch className="text-[#f97366] mr-2 text-sm" />
            <input
              type="text"
              placeholder="Search Category..."
              className="bg-transparent outline-none text-sm w-full text-gray-600 placeholder-gray-400"
            />
          </div>
        )}

        {/* Notification Icon */}
        <div className="relative">
          <FaBell
            className="text-gray-600 cursor-pointer text-lg"
            onClick={() => setShowNotifModal(true)}
          />

          {/* 🔴 Red dot when requests exist */}
          {userData?.role?.toLowerCase() === "admin" && requests.length > 0 && (
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-600"></span>
          )}
        </div>

        {/* Profile */}
        <div className="relative" ref={dropdownRef}>
  <div
    className="flex items-center space-x-2 cursor-pointer bg-white px-3 py-1 rounded-full shadow-sm"
    onClick={() => setDropdownOpen((prev) => !prev)}
  >
    <img
              src={
                avatarUrl ||
                "https://www.pngplay.com/wp-content/uploads/12/User-Avatar-Profile-Transparent-Free-PNG-Clip-Art.png"
              }
              alt="Profile"
              className="rounded-full w-[32px] h-[32px]"
            />

    <div className="text-sm">
      <p className="font-medium text-gray-800">
        {userData?.name || "Loading..."}
      </p>
      <p className="text-xs text-gray-500">
        {userData?.role || "User"}
      </p>
    </div>
  </div>

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

      {/* Notification Modal */}
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
                      <p className="text-xs text-gray-500">
                        {req.detail || "No details"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(req.created_at).toLocaleString()}
                      </p>
                    </div>

                    {userData?.role?.toLowerCase() !== "admin" && (
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
 