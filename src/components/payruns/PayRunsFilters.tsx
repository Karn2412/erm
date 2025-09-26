import React from "react";
import { FaSearch, FaHistory, FaCalendarAlt, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";

import { supabase } from "../../supabaseClient";

interface Props {
  selectedMonth: string;
  setSelectedMonth: (v: string) => void;
  payRange: string;
  setPayRange: (v: string) => void;
  search: string;
  setSearch: (v: string) => void;
  companyId?: string; // ✅ added so we can filter payroll_history
}

const PayRunsFilters: React.FC<Props> = ({
  selectedMonth,
  setSelectedMonth,
  payRange,
  setPayRange,
  search,
  setSearch,
  companyId,
}) => {
const handleExportToExcel = async () => {
  try {
    if (!companyId) {
      alert("Company ID not found. Please login again.");
      return;
    }

    // ✅ Convert selectedMonth (YYYY-MM) into YYYY-MM-01
    const selectedDate = `${selectedMonth}-01`;

    // ✅ Fetch payroll history only for this month
    const { data, error } = await supabase
      .from("payroll_history_view") // use view to get employee names
      .select(
        `
        employee_name,  
        month,
        monthly_ctc,
        daily_expected_hours,
        working_days,
        total_worked_hours,
        base_pay,
        incentives,
        reimbursements,
        deductions,
        total_pay
      `
      )
      .eq("company_id", companyId)
      .eq("month", selectedDate);

    if (error) {
      console.error("❌ Error fetching payroll history:", error);
      alert("Failed to fetch payroll history data.");
      return;
    }

    if (!data || data.length === 0) {
      alert("No payroll data found for the selected month.");
      return;
    }

    // ✅ Format rows for Excel
    const rows = data.map((row: any, index: number) => ({
      
      
      "SL No": index + 1,
      "Employee Name": row.employee_name || "N/A",
      Month: row.month ? new Date(row.month).toISOString().slice(0, 7) : "",
      "Monthly CTC": row.monthly_ctc,
      "Daily Expected Hours": row.daily_expected_hours,
      "Working Days": row.working_days,
      "Total Worked Hours": row.total_worked_hours,
      "Base Pay": row.base_pay,
      "Incentives": row.incentives,
      "Reimbursements": row.reimbursements,
      "Deductions": row.deductions,
      "Total Pay": row.total_pay,
    }));
    

    // ✅ Create worksheet & workbook
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Payroll");

    // ✅ Export file for this month
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `Payroll_${selectedMonth}.xlsx`; // ✅ only selected month
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("❌ Export failed:", err);
    alert("Failed to export payroll data.");
  }
};


  return (
    <div className="flex items-start justify-between w-full mb-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-6">
          {/* Month filter */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Select Month
            </label>
            <div className="flex items-center border border-blue-300 rounded-full px-4 py-2 text-sm w-64">
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Pay Range */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-1">
              Pay Range
            </label>
            <select
              value={payRange}
              onChange={(e) => setPayRange(e.target.value)}
              className="border border-blue-300 rounded-full px-4 py-2 text-sm text-gray-500 w-64 focus:outline-none"
            >
              <option>All</option>
              <option>0 - 1 Lakh</option>
              <option>1 Lakh - 2 Lakh</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center bg-gray-100 rounded-full px-3 py-2 text-sm w-60 mt-1">
          <FaSearch className="text-red-500 mr-2 text-xs" />
          <input
            type="text"
            placeholder="Search...."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent focus:outline-none"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-6">
        {/* Export Excel Button */}
        <button
          onClick={handleExportToExcel}
          className="flex items-center bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-full text-sm"
        >
          Export Excel
          <FaFileExcel className="ml-2 text-lg" />
        </button>

        {/* Current Month Button */}
        <button
          onClick={() => {
            const now = new Date();
            const formatted = now.toISOString().slice(0, 7); // YYYY-MM
            setSelectedMonth(formatted);
          }}
          className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-full text-sm"
        >
          Current Month
          <FaCalendarAlt className="ml-1 text-xs" />
        </button>

        {/* Show Past Button */}
        <button
          onClick={() => {
            const [year, month] = selectedMonth.split("-");
            const prevMonth = new Date(Number(year), Number(month) - 2);
            const formatted = prevMonth.toISOString().slice(0, 7);
            setSelectedMonth(formatted);
          }}
          className="flex items-center bg-[#00AEEF] hover:bg-[#058fc1] text-white px-4 py-2 rounded-full text-sm"
        >
          Show Past
          <FaHistory className="ml-1 text-xs" />
        </button>
      </div>
    </div>
  );
};

export default PayRunsFilters;
