import React, { useState, useEffect } from 'react';
import { FaDownload } from 'react-icons/fa';
import PayslipPreviewModal from '../Staffpayslip/PaySlipPreview';
import { supabase } from '../../../supabaseClient';
import { fillTemplate } from '../../../utils/filledtemplate';

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

interface PaySlipCardProps {
  payroll: PayrollHistory;
}

const PaySlipCard: React.FC<PaySlipCardProps> = ({ payroll }) => {
  const [showModal, setShowModal] = useState(false);
  const [templateHtml, setTemplateHtml] = useState<string>("");
  const [filledTemplate, setFilledTemplate] = useState<string>("");

  // fetch template once
// fetch template once
useEffect(() => {
  async function loadTemplate() {
    const { data, error } = await supabase
      .from("templates")
      .select("html_content")
      .eq("is_default", true);

    if (error) {
      console.error("Template fetch error:", error);
    } else if (data && data.length > 0) {
      setTemplateHtml(data[0].html_content);
    }
  }

  loadTemplate(); // ✅ call it
}, []);


  // fill template when payroll + template ready
  useEffect(() => {
    if (!templateHtml) return;

    const templateData = {
      employee_id: payroll.user_id,
      employee_name: "Employee", // you can replace with userData.name if context passed
      department: "Department",  // fetch if available
      designation: "Employee",
      month: new Date(payroll.month).toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      pay_date: new Date(payroll.created_at).toLocaleDateString("en-IN"),
      working_days: payroll.working_days,
      lop_days: 0,
      bank_account: "****1234",
      base_pay: payroll.base_pay,
      incentives: payroll.incentives,
      reimbursements: payroll.reimbursements,
      deductions: payroll.deductions,
      net_pay: payroll.total_pay,
      monthly_ctc: payroll.monthly_ctc,
    };

    setFilledTemplate(fillTemplate(templateHtml, templateData));
  }, [templateHtml, payroll]);

  return (
    <div className="w-60 h-72 p-4 rounded-xl shadow flex flex-col justify-center items-center relative bg-gray-200 border border-blue-400">
      <div className="absolute top-2 right-2 text-xs font-bold bg-cyan-600 text-white px-2 py-1 rounded">
        {new Date(payroll.month).toLocaleString("default", { month: "short", year: "numeric" })}
      </div>

      <button
        onClick={() => setShowModal(true)}
        className="bg-cyan-500 text-white px-4 py-1 rounded-full text-sm mb-2"
      >
        Preview
      </button>

      <button
        onClick={() => setShowModal(true)}
        className="bg-green-500 text-white px-4 py-1 rounded-full text-sm flex items-center gap-2"
      >
        <FaDownload /> Download
      </button>

      {showModal && (
        <PayslipPreviewModal
          onClose={() => setShowModal(false)}
          month={payroll.month}
          htmlContent={filledTemplate}
        />
      )}
    </div>
  );
};

export default PaySlipCard;
