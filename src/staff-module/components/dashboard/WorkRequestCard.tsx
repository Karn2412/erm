// WorkRequestCard.tsx
import React, { useEffect, useState } from "react";
import { FiHome } from "react-icons/fi";
import { BiCalendarCheck } from "react-icons/bi";
import { MdOutlineAccessTime } from "react-icons/md";
import RegularizeModal from "../modals/RegularizeModal";
import LeaveRequestModal from "../modals/Leavemodal";
import WorkFromHome from "../modals/WorkfromHome";
import { supabase } from "../../../supabaseClient"; // make sure this path matches your project
import { useUser } from "../../../context/UserContext";

type RequestType = "REGULARIZATION" | "LEAVE" | "WFH";
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED";

interface AttendanceRequest {
  id: string;
  request_type: RequestType;
  status: RequestStatus;
  start_date: string | null;
  created_at: string;
}

const WorkRequestCard: React.FC = () => {
  const { userData } = useUser();
  const userId = userData?.id;

  const [requests, setRequests] = useState<AttendanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showWFHModal, setShowWFHModal] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const fetchRequests = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("attendance_requests")
        .select("id, request_type, status, start_date, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching attendance requests:", error);
        setRequests([]);
      } else {
        setRequests(data || []);
      }
      setLoading(false);
    };

    fetchRequests();
  }, [userId]);

  // Type counts
  const leaveCount = requests.filter(r => r.request_type === "LEAVE").length;
  const wfhCount = requests.filter(r => r.request_type === "WFH").length;
  const regularizeCount = requests.filter(r => r.request_type === "REGULARIZATION").length;

  // Status counts
  const pendingCount = requests.filter(r => r.status === "PENDING").length;
  const approvedCount = requests.filter(r => r.status === "APPROVED").length;
  const rejectedCount = requests.filter(r => r.status === "REJECTED").length;

  return (
    <div className="bg-gray-50 p-6 rounded-2xl ">
      <h2 className=" font-semibold text-gray-800 mb-6">
        Work Related Requests
      </h2>

      <div className="flex">
        {/* Left column: actions */}
        <div className="flex flex-col space-y-4">
  <button
    onClick={() => setShowWFHModal(true)}
    className="flex items-center justify-start space-x-2 w-48 bg-blue-900 hover:bg-blue-800 text-white text-xs font-medium px-4 py-2 rounded-lg"
  >
    <FiHome className="text-xl" />
    <span>Work From Home Request</span>
  </button>

  <button
    onClick={() => setShowLeaveModal(true)}
    className="flex items-center justify-start space-x-2 w-48 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg"
  >
    <BiCalendarCheck className="text-xl" />
    <span>Leave Request</span>
  </button>

  <button
    onClick={() => setShowModal(true)}
    className="flex items-center justify-start space-x-2 w-48 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium px-4 py-2 rounded-lg"
  >
    <MdOutlineAccessTime className="text-xl" />
    <span>Regularize</span>
  </button>
</div>


        {/* Right column: summary */}
        <div className="ml-8 flex-1 space-y-3 text-sm bg-gray-100 p-6 rounded-2xl text-gray-700">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <p>
                You’ve submitted{" "}
                <span className="font-medium">{leaveCount} leave</span>,{" "}
                <span className="font-medium">{wfhCount} WFH</span>, and{" "}
                <span className="font-medium">{regularizeCount} regularization</span> requests.
              </p>

              <div className="space-y-1">
                <p className="text-yellow-700">{pendingCount} pending</p>
                <p className="text-green-700">{approvedCount} approved</p>
                <p className="text-red-700">{rejectedCount} rejected</p>
              </div>

              



            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showLeaveModal && <LeaveRequestModal onClose={() => setShowLeaveModal(false)} />}
      {showModal && <RegularizeModal onClose={() => setShowModal(false)} />}
      {showWFHModal && <WorkFromHome onClose={() => setShowWFHModal(false)} />}
    </div>
  );
};

export default WorkRequestCard;
