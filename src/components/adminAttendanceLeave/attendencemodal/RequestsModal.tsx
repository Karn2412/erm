// RequestsModal.tsx
import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient"; // adjust import path

const RequestsModal: React.FC<{ onClose: () => void; userId: string }> = ({
  onClose,
  userId,
}) => {
  const [activeTab, setActiveTab] = useState("Regularization Requests");
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // run populate_daily_wages for a given date
const runDailyWagesJob = async (date: string) => {
  const { error } = await supabase.rpc("populate_daily_wages", {
    target_date: date, // e.g. '2025-08-24'
  });

  if (error) {
    console.error("❌ Error running daily wages job:", error);
  } else {
    console.log("✅ Daily wages populated for", date);
  }
};

  // ✅ state to hold approved check-in/out for each request
  const [approvedTimes, setApprovedTimes] = useState<
    Record<string, { in: string; out: string }>
  >({});

  const handleTabChange = (tab: string) => setActiveTab(tab);

  // Fetch current session user id (to set reviewed_by)
  const getSessionUserId = async () => {
    const { data } = await supabase.auth.getSession();
    return data?.session?.user?.id ?? null;
  };

  // Fetch requests from Supabase
  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("attendance_requests")
      .select("*")
      .eq("user_id", userId) // ✅ filter by employee
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
    } else {
      setRequests(data || []);
      // preload approvedTimes from DB or requested values
      const initial: Record<string, { in: string; out: string }> = {};
      (data || []).forEach((r) => {
        initial[r.id] = {
          in: r.requested_check_in || "",
          out: r.requested_check_out || "",
        };
      });
      setApprovedTimes(initial);
    }
    setLoading(false);
  };

  // Update status for a single request (set reviewed_by + approved times)
 const updateStatus = async (
  id: string,
  newStatus: string,
  approvedIn?: string,
  approvedOut?: string
) => {
  const reviewer = await getSessionUserId();
  const { data, error } = await supabase
    .from("attendance_requests")
    .update({
      status: newStatus,
      reviewed_by: reviewer,
      approved_check_in: approvedIn ?? null,
      approved_check_out: approvedOut ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("start_date"); // fetch date to refresh daily_wages

  if (error) {
    console.error("Error updating status:", error);
  } else {
    fetchRequests();
    // ✅ trigger daily_wages refresh
    const req = data?.[0];
    if (req?.start_date) {
      await runDailyWagesJob(req.start_date);
    }
  }
};


  // Update status for all in current tab
  const updateAllStatus = async (newStatus: string) => {
    const ids = getCurrentData().map((req) => req.id);
    if (!ids.length) return;
    const reviewer = await getSessionUserId();
    await runDailyWagesJob(new Date().toISOString().slice(0, 10)); 


    const { error } = await supabase
      .from("attendance_requests")
      .update({
        status: newStatus,
        reviewed_by: reviewer,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);

    if (error) {
      console.error("Error updating all:", error);
    } else {
      fetchRequests();
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const getCurrentData = () => {
    switch (activeTab) {
      case "Leave Requests":
        return requests.filter((r) => r.request_type === "LEAVE");
      case "Work From Home Requests":
        return requests.filter((r) => r.request_type === "WFH");
      default:
        return requests.filter((r) => r.request_type === "REGULARIZATION");
    }
  };

  // ✅ fixed version - no hooks here
  const renderRegularizationRequest = (item: any) => {
    const approvedIn = approvedTimes[item.id]?.in || "";
    const approvedOut = approvedTimes[item.id]?.out || "";

    return (
      <div
        key={item.id}
        className="bg-[#f1f3ff] rounded-lg p-4 mb-4 flex justify-between items-center"
      >
        <div className="flex-1 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <p>
              <span className="font-semibold">Requested Check-in :</span>{" "}
              {item.requested_check_in ?? "--"}
            </p>
            <p>
              <span className="font-semibold">Requested Check-out :</span>{" "}
              {item.requested_check_out ?? "--"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-2">
            <p>
              <span className="font-semibold">Date :</span>{" "}
              {item.start_date ?? "--"}
            </p>
            <p>
              <span className="font-semibold">Reason :</span> {item.reason}
            </p>
          </div>

          {/* Show approved times once approved */}
          {item.status === "APPROVED" && (
            <div className="grid grid-cols-2 gap-4 mt-4 text-green-700 text-sm">
              <p>
                <span className="font-semibold">Approved Check-in :</span>{" "}
                {item.approved_check_in
                  ? new Date(item.approved_check_in).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "--"}
              </p>
              <p>
                <span className="font-semibold">Approved Check-out :</span>{" "}
                {item.approved_check_out
                  ? new Date(item.approved_check_out).toLocaleString([], {
                      dateStyle: "short",
                      timeStyle: "short",
                    })
                  : "--"}
              </p>
            </div>
          )}

          {/* Inputs only visible when pending */}
          {item.status === "PENDING" && (
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Approved Check-in
                </label>
                <input
                  type="datetime-local"
                  value={approvedIn ? approvedIn.substring(0, 16) : ""}
                  onChange={(e) =>
                    setApprovedTimes((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], in: e.target.value },
                    }))
                  }
                  className="border px-2 py-1 rounded w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Approved Check-out
                </label>
                <input
                  type="datetime-local"
                  value={approvedOut ? approvedOut.substring(0, 16) : ""}
                  onChange={(e) =>
                    setApprovedTimes((prev) => ({
                      ...prev,
                      [item.id]: { ...prev[item.id], out: e.target.value },
                    }))
                  }
                  className="border px-2 py-1 rounded w-full text-sm"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 ml-4 items-center">
          {item.status === "REJECTED" ? (
            <span className="bg-red-200 text-red-700 text-xs px-4 py-1 rounded font-semibold">
              Rejected
            </span>
          ) : item.status === "APPROVED" ? (
            <span className="text-green-600 text-xs font-semibold">
              Approved
            </span>
          ) : (
            <>
              <button
                onClick={() =>
                  updateStatus(item.id, "APPROVED", approvedIn, approvedOut)
                }
                className="bg-green-500 text-white text-xs px-4 py-1 rounded hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus(item.id, "REJECTED")}
                className="bg-red-500 text-white text-xs px-4 py-1 rounded hover:bg-red-600"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderLeaveRequest = (item: any) => (
    <div
      key={item.id}
      className="bg-[#f1f3ff] rounded-lg p-4 mb-4 flex justify-between items-center h-20"
    >
      <div className="flex-1 text-sm grid grid-cols-4 gap-4">
        <div>
          <p>
            <span className="font-semibold">Start Date :</span> {item.start_date}
          </p>
          <p>
            <span className="font-semibold">End Date :</span> {item.end_date}
          </p>
        </div>
        <div>
          <p>
            <span className="font-semibold">Type :</span> {item.request_type}
          </p>
        </div>
        <div>
          <p>
            <span className="font-semibold">Reason :</span> {item.reason}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {item.status === "REJECTED" ? (
            <span className="bg-red-200 text-red-700 text-sm px-4 py-1 rounded font-medium">
              Rejected
            </span>
          ) : item.status === "APPROVED" ? (
            <span className="text-green-600 text-sm font-medium">Approved</span>
          ) : (
            <>
              <button
                onClick={() => updateStatus(item.id, "APPROVED")}
                className="bg-green-500 text-white text-xs px-4 py-1 rounded hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus(item.id, "REJECTED")}
                className="bg-red-500 text-white text-xs px-4 py-1 rounded hover:bg-red-600"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderWFHRequest = (item: any) => (
    <div
      key={item.id}
      className="bg-[#f1f3ff] rounded-lg p-4 mb-4 flex justify-between items-center h-20"
    >
      <div className="flex-1 text-sm grid grid-cols-4 gap-4">
        <div>
          <p>
            <span className="font-semibold">Start Date :</span> {item.start_date}
          </p>
          <p>
            <span className="font-semibold">End Date :</span> {item.end_date}
          </p>
        </div>
        <div>
          <p>
            <span className="font-semibold">Location :</span> Work From Home
          </p>
        </div>
        <div>
          <p>
            <span className="font-semibold">Reason :</span> {item.reason}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          {item.status === "REJECTED" ? (
            <span className="bg-red-200 text-red-700 text-sm px-4 py-1 rounded font-medium">
              Rejected
            </span>
          ) : item.status === "APPROVED" ? (
            <span className="text-green-600 text-sm font-medium">Approved</span>
          ) : (
            <>
              <button
                onClick={() => updateStatus(item.id, "APPROVED")}
                className="bg-green-500 text-white text-xs px-4 py-1 rounded hover:bg-green-600"
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus(item.id, "REJECTED")}
                className="bg-red-500 text-white text-xs px-4 py-1 rounded hover:bg-red-600"
              >
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderRequest = (item: any) => {
    switch (activeTab) {
      case "Leave Requests":
        return renderLeaveRequest(item);
      case "Work From Home Requests":
        return renderWFHRequest(item);
      default:
        return renderRegularizationRequest(item);
    }
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="relative rounded-2xl w-full max-w-5xl p-6 shadow-xl backdrop-blur-md bg-white">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-2xl text-gray-600 hover:text-gray-800"
        >
          ✖
        </button>
        <h2 className="text-xl font-semibold mb-4">Requests</h2>
        <div className="flex space-x-4 mb-4">
          {[
            "Regularization Requests",
            "Leave Requests",
            "Work From Home Requests",
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                activeTab === tab
                  ? "bg-blue-100 text-blue-600 border border-blue-400"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="bg-[#eeeeee] p-4 rounded-xl max-h-[400px] overflow-y-auto">
          {loading ? (
            <p>Loading...</p>
          ) : (
            getCurrentData().map((item) => renderRequest(item))
          )}
        </div>
        <div className="mt-4 flex justify-center gap-4">
          <button
            onClick={() => updateAllStatus("APPROVED")}
            className="bg-green-500 text-white text-sm px-6 py-2 rounded hover:bg-green-600"
          >
            Approve All
          </button>
          <button
            onClick={() => updateAllStatus("REJECTED")}
            className="bg-red-500 text-white text-sm px-6 py-2 rounded hover:bg-red-600"
          >
            Reject All
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestsModal;
