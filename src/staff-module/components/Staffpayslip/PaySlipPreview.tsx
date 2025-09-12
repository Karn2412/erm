import html2pdf from 'html2pdf.js';
import React from 'react';
import { FaTimes, FaDownload } from 'react-icons/fa';



interface PayslipPreviewModalProps {
  onClose: () => void;
  month: string;
  payroll: any;
   filledTemplate: string;
  htmlContent: string;
}

const PayslipPreviewModal: React.FC<PayslipPreviewModalProps> = ({
  onClose,
  
  payroll,
  filledTemplate,
  htmlContent,

}) => {


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

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-40" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="bg-white rounded-2xl p-4 w-full max-w-2xl relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-black text-2xl hover:text-gray-700"
        >
          <FaTimes />
        </button>

        <h2 className="text-lg font-semibold text-gray-800 mb-4">Payslip Preview</h2>

        {/* HTML Preview */}
        <div className="w-full h-96 border rounded-md overflow-auto p-4 bg-gray-50">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>

        <div className="flex justify-center mt-4">
          <button
            onClick={handleDownload}
            className="bg-green-600 text-white px-6 py-2 rounded-full flex items-center gap-2 hover:bg-green-700"
          >
            Download <FaDownload size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PayslipPreviewModal;
