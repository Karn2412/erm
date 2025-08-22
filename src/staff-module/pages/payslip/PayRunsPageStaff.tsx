import React, { useEffect, useState } from "react";
import PaySlipCard from "../../components/payslip/PaySlipCard";

import { supabase } from "../../../supabaseClient";
import { useUser } from "../../../context/UserContext";
 // staff context

interface PayrollHistory {
  id: string;
  user_id: string;
  company_id: string;
  month: string; // stored as date in DB
  monthly_ctc: number;
  base_pay: number;
  incentives: number;
  reimbursements: number;
  deductions: number;
  total_pay: number;
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
        .order("month", { ascending: false }); // latest month first

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
      {/* Main Content */}
      {/* <StaffSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}
        {/* <Header /> */}

        <div className="p-6 bg-blue-50">
          {/* Page Header */}
          <div className="p-5 flex justify-between items-start mb-6 bg-white rounded-b-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              Payslips (Current + Previous Months)
            </h2>
          </div>

          {/* PaySlip Cards */}
          <div className="bg-gray-200 rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {payrolls.length > 0 ? (
                payrolls.map((pay) => (
                  <PaySlipCard
                    key={pay.id}
                    month={new Date(pay.month).toLocaleString("default", {
                      month: "short",
                      year: "numeric",
                    })}
                    isAvailable={true}
                    employeeName={userData?.name || "Employee"}
                    salary={pay.base_pay}
                    reimbursements={pay.reimbursements}
                    deductions={pay.deductions}
                    incentives={pay.incentives}
                    totalPay={pay.total_pay}
                  />
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
