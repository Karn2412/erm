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
  incentives: number;
  reimbursements: number;
  total_pay: number;
  source: "Live" | "History";
}

interface Props {
  selectedMonth: string; // YYYY-MM
  payRange: string;
  search: string;
  companyId?: string; // optional
}

const PayRunsTable: React.FC<Props> = ({ selectedMonth, payRange, search, companyId }) => {
  const [payRunsData, setPayRunsData] = useState<PayRun[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [alreadyApproved, setAlreadyApproved] = useState(false);
  console.log(alreadyApproved);
  

  useEffect(() => {
    const fetchPayRuns = async () => {
      const today = new Date();
      const currentMonth = today.toISOString().slice(0, 7); // YYYY-MM
      let formatted: PayRun[] = [];

      if (selectedMonth === currentMonth) {
        // Live payroll
        let query = supabase
          .from("monthly_payroll_view")
          .select(`
            user_id,
            employee_name,
            monthly_ctc,
            base_pay,
            deductions,
            reimbursements,
            incentives,
            total_pay,
            
            company_id,
            daily_expected_hours,
            working_days,
            total_worked_hours,
            month_end,
            month_start,
            paid_leave_days

          `);

        if (companyId) query = query.eq("company_id", companyId);

        const { data: liveData, error: liveErr } = await query;
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
          incentives: item.incentives || 0,
          reimbursements: item.reimbursements || 0,
          total_pay: item.total_pay,
          source: "Live" as const,
          daily_expected_hours: item.daily_expected_hours || 0,
          working_days: item.working_days || 0,
          total_worked_hours: item.total_worked_hours || 0,
          base_pay: item.base_pay || 0,
        }));
      } else {
        // History payroll
        let query = supabase
          .from("payroll_history_view")
          .select(`
            user_id,
            employee_name,
            month,
            monthly_ctc,
            base_pay,
            incentives,
            deductions,
            reimbursements,
            total_pay,
            company_id
          `)
          .eq("month", `${selectedMonth}-01`);

        if (companyId) query = query.eq("company_id", companyId);

        const { data: historyData, error: histErr } = await query;
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
          incentives: item.incentives || 0,
          reimbursements: item.reimbursements || 0,
          total_pay: item.total_pay,
          source: "History" as const,
        }));
      }

      // Apply search filter
      if (search) {
        formatted = formatted.filter((p) =>
          p.employee_name.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Apply pay range filter
      if (payRange === "0 - 1 Lakh") {
        formatted = formatted.filter((p) => p.total_pay < 100000);
      } else if (payRange === "1 Lakh - 2 Lakh") {
        formatted = formatted.filter((p) => p.total_pay >= 100000 && p.total_pay < 200000);
      }

      setPayRunsData(formatted);

      // Check if already approved
      const { data } = await supabase
        .from("payroll_history")
        .select("id")
        .eq("month", `${selectedMonth}-01`)
        .limit(1)
        .eq("company_id", companyId || "");
      setAlreadyApproved((data?.length ?? 0) > 0);
    };

    fetchPayRuns();
  }, [selectedMonth, payRange, search, companyId]);

  const handleViewMore = (userId: string) => {
    setSelectedUser(userId);
    setShowModal(true);
  };
  const handleApproveSingle = async (row: PayRun) => {
  try {
    const { data: existing } = await supabase
      .from("payroll_history")
      .select("id")
      .eq("user_id", row.user_id)
      .eq("company_id", companyId || "")
      .eq("month", `${selectedMonth}-01`)
      .limit(1);

    if (existing && existing.length > 0) {
      toast.error("Payroll already approved for this user.");
      return;
    }

    const insertData = {
      company_id: companyId,
      user_id: row.user_id,
      month: `${selectedMonth}-01`,
      monthly_ctc: row.salary,
      base_pay: row.total_pay - (row.deductions + row.incentives + row.reimbursements) ,
      incentives: row.incentives,
      reimbursements: row.reimbursements,
      deductions: row.deductions,
      total_pay: row.total_pay,
    };

    const { error } = await supabase.from("payroll_history").insert(insertData);
    if (error) {
      console.error("❌ Approve payroll error:", error);
      toast.error("Failed to approve payroll");
    } else {
      toast.success("Payroll approved!");
      setPayRunsData((prev) =>
        prev.map((p) =>
          p.user_id === row.user_id ? { ...p, source: "History" } : p
        )
      );
    }
  } catch (err) {
    console.error(err);
    toast.error("Something went wrong");
  }
};


  

  
  return (
    <>
    
     

      <div className="overflow-x-auto rounded-lg bg-white">
        <table className="min-w-full text-sm text-gray-700 border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">SL No</th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">Employee Name</th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">Salary</th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">Deductions</th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">Incentives</th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">Reimbursements</th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">Total Pay</th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">View More</th>
              <th className="py-3 px-4 text-left text-gray-600 uppercase text-xs">Action</th>
            </tr>
          </thead>
          <tbody>
            {payRunsData.map((item, index) => (
              <tr key={`${item.user_id}-${selectedMonth}`} className="odd:bg-blue-50 even:bg-gray-50 hover:bg-gray-100 transition">
                <td className="py-3 px-4 rounded-l-lg">{index + 1}</td>
                <td className="py-3 px-4 font-medium text-gray-800">{item.employee_name}</td>
                <td className="py-3 px-4">{item.salary}</td>
                <td className="py-3 px-4">{item.deductions}</td>
                <td className="py-3 px-4">{item.incentives}</td>
                <td className="py-3 px-4">{item.reimbursements}</td>
                <td className="py-3 px-4 font-semibold">{item.total_pay}</td>
                <td className="py-3 px-4 rounded-r-lg">
                  <button
                    onClick={() => handleViewMore(item.user_id)}
                    className={`text-gray-600 hover:text-gray-900 ${item.source === "History" ? "opacity-50 cursor-not-allowed" : ""}`}
                    disabled={item.source === "History"}
                  >
                    <FaEye />
                  </button>
                </td>
                <td className="py-3 px-4">
  {item.source === "Live" ? (
    <button
      onClick={() => handleApproveSingle(item)}
      className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 text-xs"
    >
      Approve
    </button>
  ) : (
    <span className="text-gray-500 text-xs">Approved</span>
  )}
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
          companyId={companyId}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default PayRunsTable;
