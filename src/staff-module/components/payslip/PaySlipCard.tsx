import React, { useState, useEffect } from "react";
import { FaDownload } from "react-icons/fa";
import PayslipPreviewModal from "../Staffpayslip/PaySlipPreview";
import { supabase } from "../../../supabaseClient";
import { fillTemplate } from "../../../utils/filledtemplate";
import html2pdf from "html2pdf.js";


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
  const [showActions, setShowActions] = useState(false);
  const [templateHtml, setTemplateHtml] = useState<string>("");
  const [filledTemplate, setFilledTemplate] = useState<string>("");
  const [userData, setUserData] = useState<any>(null);

useEffect(() => {
  async function loadUserDetails() {
    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        number,
        department:departments (department_name),
        designation:designations (designation),
        company:companies (name, logo_url, business_location)
      `)
      .eq("id", payroll.user_id)
      .single();

    if (!error && data) {
      setUserData(data);
    }
  }

  loadUserDetails();
}, [payroll.user_id]);
console.log("userData:", userData);


  

  useEffect(() => {
  async function loadTemplate() {
  const { data, error } = await supabase
    .from("templates")
    .select("html_content")
    .eq("is_default", true)
    .eq("name", "Regular Payslip - Standard")   // ✅ only regular payslip template

  if (!error && data?.length > 0) {
    setTemplateHtml(data[0].html_content);
  }
}

    loadTemplate();

  }, []);
const handleDownload = () => {
  if (!filledTemplate) return;

  const fileName = `Payslip_${new Date(payroll.month).toLocaleDateString(
    "en-IN",
    { month: "short", year: "numeric" }
  )}.pdf`;

  const opt = {
    margin: 0.5,
    filename: fileName,
    html2canvas: { scale: 2 },
    jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
  };

  html2pdf().set(opt).from(filledTemplate).save();
};
useEffect(() => {
  if (!templateHtml || !userData) return;

  // Compute company initials
  const initials =
    userData.company?.name
      ?.split(" ")
      .map((word: string) => word[0])
      .join("")
      .toUpperCase() || "";

  // Compute total earnings
  const totalEarnings = payroll.base_pay + payroll.incentives + payroll.reimbursements;

  const templateData = {
    employee_id: payroll.user_id,
    employee_name: userData.name,
    department: userData.department?.department_name || "Department",
    designation: userData.designation?.designation || "Designation",
    date_of_joining: userData.created_at
      ? new Date(userData.created_at).toLocaleDateString("en-IN")
      : "",

    company_name: userData.company?.name || "Company",
    company_logo: userData.company?.logo_url || "",
    company_initials: initials,
    company_location: userData.company?.business_location || "",

    month: new Date(payroll.month).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    }),
    pay_date: new Date(payroll.created_at).toLocaleDateString("en-IN"),
    working_days: payroll.working_days,
    lop_days: 0,
    bank_account: "****1234", // ← replace if you have bank info

    base_pay: payroll.base_pay,
    incentives: payroll.incentives,
    reimbursements: payroll.reimbursements,
    total_earnings: totalEarnings,

    deductions: payroll.deductions,
    net_pay: payroll.total_pay,
    monthly_ctc: payroll.monthly_ctc,
  };

  setFilledTemplate(fillTemplate(templateHtml, templateData));
}, [templateHtml, payroll, userData]);



  return (
    <div
      className="w-60 h-72 p-4 rounded-xl shadow flex flex-col justify-center items-center relative bg-gray-200 border border-blue-400 cursor-pointer"
      onClick={() => setShowActions(!showActions)}
    >
      {/* Month tag */}
      <div className="absolute top-2 right-2 text-xs font-bold bg-cyan-600 text-white px-2 py-1 rounded">
        {new Date(payroll.month).toLocaleString("default", {
          month: "short",
        })}
      </div>

      {/* Actions only visible when clicked */}
      {/* Actions */}
      {showActions && (
        <div className="flex flex-col gap-2 items-center">
          <button
            onClick={() => setShowModal(true)}
            className="bg-cyan-500 text-white px-4 py-1 rounded-full text-sm"
          >
            Preview
          </button>
          <button
            onClick={handleDownload}
            className="bg-green-500 text-white px-4 py-1 rounded-full text-sm flex items-center gap-2"
          >
            <FaDownload /> Download
          </button>
        </div>
      )}


      {showModal && (
        <PayslipPreviewModal
          onClose={() => setShowModal(false)}
          month={payroll.month}
          payroll={payroll}
          filledTemplate={filledTemplate}
          htmlContent={filledTemplate}
        />
      )}
    </div>
  );
};

export default PaySlipCard;
