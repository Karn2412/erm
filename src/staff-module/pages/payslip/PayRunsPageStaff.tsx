import { useEffect, useState } from "react";
import PaySlipCard from "../../components/payslip/PaySlipCard";
import { supabase } from "../../../supabaseClient";
import { useUser } from "../../../context/UserContext";

interface PayrollHistory {
  id: string;
  user_id: string;
  company_id: string;
  month: string;
  monthly_ctc: number;
  base_pay: number;
  incentives: number;
  reimbursements: number;
  deductions: number;
  total_pay: number;
  working_days: number;
  created_at: string;
}

const PayRunsPage = () => {
  const [payrolls, setPayrolls] = useState<PayrollHistory[]>([]);
  const { userData } = useUser(); // ✅ current logged-in staff

  useEffect(() => {
    const fetchPayrolls = async () => {
      if (!userData?.id || !userData?.company_id) return;

      const { data, error } = await supabase
        .from("payroll_history")
        .select("*")
        .eq("user_id", userData.id)
        .eq("company_id", userData.company_id)
        .order("month", { ascending: false });

      if (error) {
        console.error("❌ Error fetching payroll history:", error);
      } else {
        setPayrolls(data);
      }
    };

    fetchPayrolls();
  }, [userData]);

  return (
    <div className="flex flex-col w-full">
      <div className="p-6 bg-blue-50">
        <div className="p-5 flex justify-between items-start mb-6 bg-white rounded-b-lg">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Payslips (Current + Previous Months)
          </h2>
        </div>

        <div className="bg-gray-200 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {payrolls.length > 0 ? (
              payrolls.map((pay) => (
                <PaySlipCard key={pay.id} payroll={pay} />
              ))
            ) : (
              <p className="text-gray-600">No payslips found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayRunsPage;
