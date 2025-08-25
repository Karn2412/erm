import React, { useState } from "react";
import { supabase } from "../../../supabaseClient";

interface Props {
  userId: string;
  companyId: string;
  onComplete: () => void; // trigger stepper update
}

const PaymentInformationForm: React.FC<Props> = ({ userId, companyId, onComplete }) => {
  const [selectedMethod, setSelectedMethod] = useState("Bank Transfer");

  const handleSubmit = async () => {
    const { error } = await supabase.from("payment_preferences").insert([
      { user_id: userId, method: selectedMethod, company_id: companyId },
    ]);

    if (error) {
      alert(error.message);
    } else {
      alert("✅ Payment preference saved");
      onComplete(); // move stepper forward
    }
  };

  const methods = ["Bank Transfer", "Cheque", "Cash"];

  return (
    <div className="p-6 rounded-lg shadow-sm max-w-3xl mx-auto bg-indigo-50">
      <h2 className="text-lg font-semibold mb-2">Payment Method</h2>
      {methods.map((m) => (
        <div
          key={m}
          className={`flex items-center justify-between p-4 rounded-md cursor-pointer ${
            selectedMethod === m
              ? "border-2 border-blue-500 bg-blue-50"
              : "border border-gray-200"
          }`}
          onClick={() => setSelectedMethod(m)}
        >
          <span>{m}</span>
          {selectedMethod === m && <span className="text-blue-600">✔</span>}
        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm mt-6"
      >
        Select Preference
      </button>
    </div>
  );
};

export default PaymentInformationForm;
