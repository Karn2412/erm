import { useEffect, useState } from "react";
import PaySlipCard from "../../components/payslip/PaySlipCard";
import { supabase } from "../../../supabaseClient";
import { useUser } from "../../../context/UserContext";
import { FaDownload, FaCalendarAlt } from "react-icons/fa";
import { usePayslipPdf } from "../../../utils/createPayslipPdf";

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

const quarterOptions = [
  { label: "JAN - MAR", months: [0, 1, 2] },
  { label: "APR - JUN", months: [3, 4, 5] },
  { label: "JUL - SEP", months: [6, 7, 8] },
  { label: "OCT - DEC", months: [9, 10, 11] },
];

const PayRunsPage = () => {
  const [payrolls, setPayrolls] = useState<PayrollHistory[]>([]);
  const [selectedQuarter, setSelectedQuarter] = useState(quarterOptions[0]);
  const [showAll, setShowAll] = useState(false);
  const { userData } = useUser();
  const { createPayslipPdf } = usePayslipPdf();

  useEffect(() => {
    const fetchPayrolls = async () => {
      if (!userData?.id || !userData?.company_id) return;

      const { data, error } = await supabase
        .from("payroll_history")
        .select("*")
        .eq("user_id", userData.id)
        .eq("company_id", userData.company_id)
        .order("month", { ascending: true });

      if (error) {
        console.error("❌ Error fetching payroll history:", error);
      } else {
        setPayrolls(data);
      }
    };

    fetchPayrolls();
  }, [userData]);

  const filteredPayrolls = showAll
    ? payrolls
    : payrolls.filter((p) => {
        const m = new Date(p.month).getMonth();
        return selectedQuarter.months.includes(m);
      });

  const handleDownloadAll = () => {
    filteredPayrolls.forEach((pay) => {
      const doc = createPayslipPdf(pay);
      const fileName = `Payslip_${new Date(pay.month).toLocaleDateString(
        "en-IN",
        { month: "short", year: "numeric" }
      )}.pdf`;
      doc.save(fileName);
    });
  };
    

  return (
    <div className="flex flex-col w-full">
      <div className="p-6 bg-white rounded-2xl shadow space-y-6">
        {/* Header */}
        <div className="p-5 mb-6 bg-white ">
          {/* Title */}
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Pay Slips
          </h2>

          {/* Filter under heading */}
          <div className="flex justify-between items-center">
            {/* Dropdown with icon */}
            <div className="relative w-48">
              <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <select
                className="pl-10 pr-3 py-2 w-full border border-blue-300 rounded-2xl text-sm appearance-none"
                value={selectedQuarter.label}
                onChange={(e) =>
                  setSelectedQuarter(
                    quarterOptions.find((q) => q.label === e.target.value) ||
                      quarterOptions[0]
                  )
                }
                disabled={showAll}
              >
                {quarterOptions.map((q) => (
                  <option key={q.label} value={q.label}>
                    {q.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleDownloadAll()}
                className="bg-green-500 text-white px-4 py-2 rounded flex items-center gap-2 text-sm"
              >
                <FaDownload /> Download All
              </button>

              <button
                onClick={() => setShowAll(!showAll)}
                className="bg-cyan-500 text-white px-4 py-2 rounded text-sm"
              >
                {showAll ? "Back to Filter" : "View All"}
              </button>
            </div>
          </div>
        </div>

        {/* Pay run cards */}
        <div className="bg-gray-100 rounded-2xl p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredPayrolls.length > 0 ? (
              filteredPayrolls.map((pay) => (
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
