import React, { useEffect, useState } from "react";
import { useUser } from "../../../context/UserContext";
import { supabase } from "../../../supabaseClient";

interface Reimbursement {
  id: string;
  category: string;
  expense_date: string;
  description: string | null;
  amount: number;
  receipt_url: string | null;
  status: string;
  proofUrl?: string | null;
}

const statusColors: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-800",
  PENDING: "bg-yellow-100 text-yellow-800",
  REJECTED: "bg-red-100 text-red-800",
};

const ReimbursementRequestCard: React.FC = () => {
  const { userData } = useUser();
  const [requests, setRequests] = useState<Reimbursement[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState<"ALL" | "APPROVED" | "PENDING" | "REJECTED">("ALL");
  const [timeFilter, setTimeFilter] = useState<"MONTH" | "YEAR" | "ALL">("MONTH");

  const fetchReimbursements = async () => {
    if (!userData?.id) return;

    const { data, error } = await supabase
      .from("reimbursements")
      .select("id, category, expense_date, description, amount, receipt_url, status")
      .eq("user_id", userData.id)
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("❌ fetch reimbursements", error);
      return;
    }

    const withUrls = await Promise.all(
      (data || []).map(async (item) => {
        if (item.receipt_url) {
          const { data: signed } = await supabase.storage
            .from("reimbursement")
            .createSignedUrl(item.receipt_url, 60 * 60 * 24);
          return { ...item, proofUrl: signed?.signedUrl };
        }
        return { ...item, proofUrl: null };
      })
    );

    setRequests(withUrls);
  };

  useEffect(() => {
    fetchReimbursements();
  }, [userData]);

  const filteredRequests = requests.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    const expenseDate = new Date(r.expense_date);
    const now = new Date();
    if (timeFilter === "MONTH") return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    if (timeFilter === "YEAR") return expenseDate.getFullYear() === now.getFullYear();
    return true;
  });

  const statusCounts = {
    APPROVED: requests.filter((r) => r.status === "APPROVED").length,
    PENDING: requests.filter((r) => r.status === "PENDING").length,
    REJECTED: requests.filter((r) => r.status === "REJECTED").length,
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg relative">
      {/* Top-right time toggle */}
      <div className="absolute top-4 right-4 flex space-x-2">
        {["MONTH", "YEAR", "ALL"].map((f) => (
          <button
            key={f}
            className={`px-3 py-1 rounded-full font-medium border transition ${
              timeFilter === f ? "bg-blue-500 text-white border-blue-500" : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
            }`}
            onClick={() => setTimeFilter(f as "MONTH" | "YEAR" | "ALL")}
          >
            {f === "MONTH" ? "This Month" : f === "YEAR" ? "This Year" : "All"}
          </button>
        ))}
      </div>

      <h2 className="text-xl font-semibold text-gray-800 mb-6 ">Reimbursement Requests</h2>

      {/* Status buttons */}
      <div className="flex justify-center space-x-4 mb-6">
        {(["APPROVED", "PENDING", "REJECTED"] as const).map((status) => (
          <button
            key={status}
            className={`px-6 py-3 rounded-xl font-medium flex items-center space-x-3 shadow hover:scale-105 transform transition ${statusColors[status]}`}
            onClick={() => {
              setStatusFilter(status);
              setIsModalOpen(true);
            }}
          >
            <span>{status}</span>
            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold shadow">
              {statusCounts[status]}
            </span>
          </button>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="bg-white w-full max-w-6xl p-6 rounded-2xl shadow-xl overflow-auto max-h-[80vh] relative">
            <h3 className="text-xl font-semibold mb-3">Reimbursement History - {statusFilter}</h3>
            <p className="text-sm text-gray-500 mb-5">
              Total Requests: <span className="font-bold">{filteredRequests.length}</span>
            </p>

            {filteredRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No reimbursement requests found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="px-3 py-2 text-left">Sl No</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Date</th>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                      <th className="px-3 py-2 text-left">Proof</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((item, i) => (
                      <tr key={item.id} className="border-t hover:bg-gray-50 transition">
                        <td className="px-3 py-2">{i + 1}</td>
                        <td className="px-3 py-2">{item.category}</td>
                        <td className="px-3 py-2">{new Date(item.expense_date).toLocaleDateString()}</td>
                        <td className="px-3 py-2 truncate max-w-xs">{item.description}</td>
                        <td className="px-3 py-2">₹{item.amount}</td>
                        <td className="px-3 py-2">
                          {item.proofUrl ? (
                            <a
                              href={item.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 bg-blue-200 text-xs rounded-full text-gray-700 hover:bg-blue-300 transition"
                            >
                              View 👁️
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className={`px-3 py-2 font-medium ${statusColors[item.status]}`}>
                          {item.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReimbursementRequestCard;
