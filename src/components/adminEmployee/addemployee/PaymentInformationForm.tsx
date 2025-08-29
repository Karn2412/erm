import React, { useState } from "react";
import { supabase } from "../../../supabaseClient";
import { FaUniversity, FaMoneyCheck, FaMoneyBill } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface Props {
  userId: string;
  companyId: string;
  onComplete: () => void;
}

const PaymentInformationForm: React.FC<Props> = ({ userId, companyId, onComplete }) => {
  const [selectedMethod, setSelectedMethod] = useState("Bank Transfer");
const navigate = useNavigate();

  const handleSubmit = async () => {
    const { error } = await supabase.from("payment_preferences").insert([
      { user_id: userId, method: selectedMethod, company_id: companyId },
    ]);

    if (error) {
      alert(error.message);
    } else {
      alert("✅ Payment preference saved");

      // Call parent onComplete if provided
      if (onComplete) {
        onComplete();
      }

      // ✅ Navigate to employees page
      navigate("/employees");
    }
  };


  const methods = [
    {
      key: "Bank Transfer",
      title: "Bank Transfer (manual process)",
      description: "Download Bank Advice and process the payment through your bank",
      icon: <FaUniversity size={32} className="text-blue-500" />,
    },
    {
      key: "Cheque",
      title: "Cheque",
      description: "Download Bank Advice and process the payment through your bank",
      icon: <FaMoneyCheck size={32} className="text-blue-500" />,
    },
    {
      key: "Cash",
      title: "Cash",
      description: "Download Bank Advice and process the payment through your bank",
      icon: <FaMoneyBill size={32} className="text-blue-500" />,
    },
  ];

  return (
    <div className="p-6 rounded-lg shadow-sm max-w-2xl bg-gray-50">
      {/* Heading */}
      <h2 className="text-lg font-semibold text-gray-800">Payment Method</h2>
      <p className="text-sm text-gray-500 mb-6">
        Choose which payment method is preferred :
      </p>

      {/* Options */}
      <div className="space-y-4">
        {methods.map((m) => (
          <div
            key={m.key}
            onClick={() => setSelectedMethod(m.key)}
            className={`flex items-center p-4 rounded-lg border cursor-pointer transition 
              ${
                selectedMethod === m.key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
          >
            {/* Icon */}
            <div className="mr-4">{m.icon}</div>

            {/* Text */}
            <div className="flex-1">
              <p className="font-medium text-gray-800">{m.title}</p>
              <p className="text-sm text-gray-500">{m.description}</p>
            </div>

            {/* Radio button */}
            <div
              className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                selectedMethod === m.key ? "border-blue-500" : "border-gray-300"
              }`}
            >
              {selectedMethod === m.key && (
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Button */}
      <button
        onClick={handleSubmit}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm mt-6"
      >
        Select Preference
      </button>
    </div>
  );
};

export default PaymentInformationForm;
