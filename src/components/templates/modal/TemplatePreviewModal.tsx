import React from 'react';
import { FaTimes } from 'react-icons/fa';

interface TemplatePreviewModalProps {
  onClose: () => void;
  htmlContent: string;
}

const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({ onClose, htmlContent }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl relative">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-black text-2xl">
          <FaTimes />
        </button>

        <h2 className="text-lg font-semibold mb-4">Template Preview</h2>

        {/* Preview Box */}
        <div className="bg-gray-100 rounded-lg h-96 overflow-auto p-4 border">
          <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
        </div>
      </div>
    </div>
  );
};


export default TemplatePreviewModal;
