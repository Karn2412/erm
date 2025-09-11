import React, { useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import PayRunDetailsModal from "./PayRunDetailsModal";
import toast from "react-hot-toast";

interface PayRun {
  id: string;
  user_id: string;
  employee_name: string;
  salary: number;
  deductions: number;
  incentives: number; // ⚡ keep it in state, default = 0
  reimbursements: number;
  total_pay: number;
  source: "Live" | "History";
}

interface Props {
  selectedMonth: string; // YYYY-MM
  payRange: string;
  search: string;
}

const PayRunsTable: React.FC<Props> = ({ selectedMonth, payRange, search }) => {
  const [payRunsData, setPayRunsData] = useState<PayRun[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [alreadyApproved, setAlreadyApproved] = useState(false);

  useEffect(() => {
    const fetchPayRuns = async () => {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
      let formatted: PayRun[] = [];

      if (selectedMonth === currentMonth) {
        // ✅ Live payroll
        const { data: liveData, error: liveErr } = await supabase
          .from("monthly_payroll_view")
          .select(`
            user_id,
            employee_name,
            monthly_ctc,
            base_pay,
            deductions,
            reimbursements,
            total_pay,
            month
          `);

        if (liveErr) {
          console.error("❌ Live payroll error:", liveErr);
          return;
        }

        formatted = (liveData || []).map((item: any) => ({
          id: item.user_id,
          user_id: item.user_id,
          employee_name: item.employee_name,
          salary: item.monthly_ctc,
          deductions: item.deductions || 0,
          incentives: 0, // ⚡ not in view → default to 0
          reimbursements: item.reimbursements || 0,
          total_pay: item.total_pay,
          source: "Live" as const,
        }));
      } else {
        // ✅ History payroll
        const { data: historyData, error: histErr } = await supabase
          .from("payroll_history_view")
          .select(`
            user_id,
            employee_name,
            month,
            monthly_ctc,
            base_pay,
            deductions,
            reimbursements,
            total_pay
          `)
          .eq("month", selectedMonth); // ⚡ match YYYY-MM

        if (histErr) {
          console.error("❌ History payroll error:", histErr);
          return;
        }

        formatted = (historyData || []).map((item: any) => ({
          id: item.user_id,
          user_id: item.user_id,
          employee_name: item.employee_name,
          salary: item.monthly_ctc,
          deductions: item.deductions || 0,
          incentives: 0, // ⚡ default
          reimbursements: item.reimbursements || 0,
          total_pay: item.total_pay,
          source: "History" as const,
        }));
      }

      // 🔎 Apply filters
      let results = formatted;

      if (search) {
        results = results.filter((p) =>
          p.employee_name.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (payRange === "0 - 1 Lakh") {
        results = results.filter((p) => p.total_pay < 100000);
      } else if (payRange === "1 Lakh - 2 Lakh") {
        results = results.filter(
          (p) => p.total_pay >= 100000 && p.total_pay < 200000
        );
      }

      setPayRunsData(results);
    };

    // 🔎 Check if payroll already approved in history
    const checkApproval = async () => {
      const { data } = await supabase
        .from("payroll_history_view")
        .select("user_id")
        .eq("month", selectedMonth) // ⚡ match YYYY-MM
        .limit(1);

      setAlreadyApproved((data?.length ?? 0) > 0);
    };

    fetchPayRuns();
    checkApproval();
  }, [selectedMonth, payRange, search]);

  const handleViewMore = (userId: string) => {
    setSelectedUser(userId);
    setShowModal(true);
  };

  const handleApprovePayroll = async () => {
    try {
      const { error } = await supabase.rpc("close_month_payroll", {
        p_month: selectedMonth, // ⚡ YYYY-MM
      });

      if (error) {
        console.error("❌ Approve payroll error:", error);
        toast.error("Failed to approve payroll");
      } else {
        toast.success("Payroll approved and saved to history!");
        setAlreadyApproved(true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong");
    }
  };

  // ✅ Last day of current month check
  const today = new Date();
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const isLastDay =
    today.toDateString() === lastDay.toDateString() &&
    selectedMonth === today.toISOString().slice(0, 7);

  return (
    <>
      {/* ✅ Approve button block */}
      {isLastDay && !alreadyApproved && (
        <div className="flex justify-end mb-3">
          <button
            onClick={handleApprovePayroll}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Approve Monthly Payroll
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg bg-white">
        <table className="min-w-full text-sm text-gray-700 border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">
                SL No
              </th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">
                Employee Name
              </th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">
                Salary
              </th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">
                Deductions
              </th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">
                Incentives
              </th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">
                Reimbursements
              </th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">
                Total Pay
              </th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">
                View More
              </th>
            </tr>
          </thead>

          <tbody>
            {payRunsData.map((item, index) => (
              <tr
                key={`${item.user_id}-${selectedMonth}`}
                className="odd:bg-blue-50 even:bg-gray-50 hover:bg-gray-100 transition"
              >
                <td className="py-3 px-4 rounded-l-lg">{index + 1}</td>
                <td className="py-3 px-4 font-medium text-gray-800">
                  {item.employee_name}
                </td>
                <td className="py-3 px-4">{item.salary}</td>
                <td className="py-3 px-4">{item.deductions}</td>
                <td className="py-3 px-4">{item.incentives}</td>
                <td className="py-3 px-4">{item.reimbursements}</td>
                <td className="py-3 px-4 font-semibold">{item.total_pay}</td>
                <td className="py-3 px-4 rounded-r-lg">
                  <button
                    onClick={() => handleViewMore(item.user_id)}
                    className={`text-gray-600 hover:text-gray-900 ${
                      item.source === "History"
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={item.source === "History"}
                  >
                    <FaEye />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && selectedUser && (
        <PayRunDetailsModal
          userId={selectedUser}
          month={selectedMonth}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default PayRunsTable;
