// utils/createPayslipPdf.ts
import jsPDF from "jspdf";

import autoTable from "jspdf-autotable"; 
import { useUser } from "../context/UserContext"; // adjust path if needed

type PayrollRow = {
  user_id: string;
  month: string;            // e.g. "2025-08-01"
  monthly_ctc: number;
  base_pay: number;
  deductions: number;
  incentives: number;
  reimbursements: number;
  total_pay: number;
};

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n);



export function usePayslipPdf() {
  const { userData } = useUser(); // ✅ employee + company info

  function createPayslipPdf(
    payroll: PayrollRow,
    opts?: { logoDataUrl?: string } // optional base64 logo if you have
  ) {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    // ---- Company info ----
    const companyName = userData?.company?.name || "Company Name";
    const addr = [
      userData?.company?.addressLine1,
      userData?.company?.addressLine2,
    ]
      .filter(Boolean)
      .join(" • ");
    const panOrTin = userData?.company?.panOrTin;

    if (opts?.logoDataUrl) {
      doc.addImage(opts.logoDataUrl, "PNG", 40, 28, 60, 60);
    }
    doc.setFontSize(16).setFont("helvetica", "bold");
    doc.text(companyName, 40, 40);
    doc.setFontSize(10).setFont("helvetica", "normal");
    if (addr) doc.text(addr, 40, 58);
    if (panOrTin) doc.text(`PAN/TIN: ${panOrTin}`, 40, 74);

    doc.setFontSize(18).setFont("helvetica", "bold");
    doc.text("PAYSLIP", pageWidth - 40, 42, { align: "right" });

    // ---- Employee block ----
    const month = new Date(payroll.month);
    const monthLabel = month.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
    });

    const empName = userData?.name || "Employee Name";
    const empId = payroll.user_id;

    doc.setFontSize(11).setFont("helvetica", "normal");
    doc.text(`Employee: ${empName}`, 40, 110);
    doc.text(`Employee ID: ${empId}`, 40, 126);
    doc.text(`Month: ${monthLabel}`, 40, 142);

    // ---- Earnings / Deductions table ----
    autoTable(doc, {
      startY: 170,
      head: [["Component", "Amount"]],
      body: [
        ["Base Pay", inr(payroll.base_pay || 0)],
        ["Incentives", inr(payroll.incentives || 0)],
        ["Reimbursements", inr(payroll.reimbursements || 0)],
        ["Deductions", `- ${inr(payroll.deductions || 0)}`],
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [245, 245, 245], textColor: 0 },
      columnStyles: { 0: { cellWidth: 280 }, 1: { halign: "right" } },
      margin: { left: 40, right: 40 },
    });

    // ---- Summary ----
    const afterTableY = (doc as any).lastAutoTable.finalY + 18;
    doc.setFont("helvetica", "bold").setFontSize(12);
    doc.text(`Net Pay: ${inr(payroll.total_pay)}`, 40, afterTableY);
    doc.setFont("helvetica", "normal").setFontSize(10);
    doc.text(`CTC (Monthly): ${inr(payroll.monthly_ctc)}`, 40, afterTableY + 18);

    // ---- Footer ----
    const footerY = doc.internal.pageSize.getHeight() - 40;
    doc.setDrawColor(220).line(40, footerY - 18, pageWidth - 40, footerY - 18);
    doc.setFontSize(9).setTextColor(120);
    doc.text("This is a system-generated payslip.", 40, footerY);

    return doc;
  }

  return { createPayslipPdf };
}
