import React, { useState } from "react";
import { supabase } from "../../../supabaseClient";
; // your Supabase client import

interface SalaryDetailsFormProps {
  userId: string;      // Pass from parent (employee's user_id)
  companyId: string;   // Pass from parent (current company_id)
  dateOfJoining: string; // ✅ new prop
  onComplete: () => void
}

const SalaryDetailsForm: React.FC<SalaryDetailsFormProps> = ({ userId, companyId, dateOfJoining, onComplete }) => {
  const [monthlyCTC, setMonthlyCTC] = useState<number | "">("");
  const [pfCovered, setPfCovered] = useState(true);
  const [esiCovered, setEsiCovered] = useState(true);
  const [regimeIT, setRegimeIT] = useState("New Regime");

  const [basicSalary, setBasicSalary] = useState(0);
  const [hra, setHra] = useState(0);
  const [specialAllowance, setSpecialAllowance] = useState(0);

  // Auto calculation when CTC changes
  const handleCTCChange = (value: string) => {
    const ctc = parseFloat(value.replace(/,/g, "")) || 0;
    setMonthlyCTC(ctc);

    const basic = ctc * 0.55;
    const hraAmt = ctc * 0.275;
    const special = ctc * 0.175;

    setBasicSalary(parseFloat(basic.toFixed(2)));
    setHra(parseFloat(hraAmt.toFixed(2)));
    setSpecialAllowance(parseFloat(special.toFixed(2)));
  };

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!monthlyCTC || !dateOfJoining) {
      alert("Please fill in Date of Joining and CTC");
      return;
    }

    const { data, error } = await supabase
    
    
      .from("salary_details")
      .insert([
        {
          company_id: companyId,
          user_id: userId,
          date_of_joining: dateOfJoining,
          employee_pf: pfCovered,
          esi_coverage: esiCovered,
          regime_it: regimeIT,
          monthly_ctc: monthlyCTC,
        },
        
        
      ]);
      console.log(data);
      

    if (error) {
      console.error(error);
      alert("Error saving salary details");
    } else {
      alert("Salary details saved successfully!");
      onComplete(); 
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      {/* Top Heading */}
      <h2 className="text-center text-gray-700 font-semibold mb-6">Particulars</h2>

      {/* Grid with 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-5 rounded-4xl bg-indigo-50 ">
        {/* Date of Joining */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date of Joining <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
  value={dateOfJoining}
  disabled //
            className="w-full px-3 py-2 border border-blue-300 rounded-full focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Monthly CTC */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Monthly CTC (In INR)
          </label>
          <input
            type="number"
            value={monthlyCTC}
            onChange={(e) => handleCTCChange(e.target.value)}
            placeholder="16000"
            className="w-full px-3 py-2 border border-blue-300 rounded-full focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div></div>

        {/* PF Covered */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Whether the employee is PF covered?
          </label>
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={pfCovered}
                onChange={() => setPfCovered(true)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={!pfCovered}
                onChange={() => setPfCovered(false)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>No</span>
            </label>
          </div>
        </div>

        {/* ESI Covered */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Whether the employee is ESI covered?
          </label>
          <div className="flex space-x-4 mt-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={esiCovered}
                onChange={() => setEsiCovered(true)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>Yes</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={!esiCovered}
                onChange={() => setEsiCovered(false)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span>No</span>
            </label>
          </div>
        </div>

        <div></div>

        {/* IT Regime */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Method of Regime for IT <span className="text-red-500">*</span>
          </label>
          <select
            value={regimeIT}
            onChange={(e) => setRegimeIT(e.target.value)}
            className="w-full px-3 py-2 border border-blue-300 rounded-full focus:ring-2 focus:ring-indigo-500"
          >
            <option>New Regime</option>
            <option>Old Regime</option>
          </select>
        </div>
      </div>

      {/* CTC Earnings Table */}
      <div className="mt-6 rounded-md overflow-hidden">
       <table className="min-w-full text-sm text-left border-separate border-spacing-y-2">
  <thead className="bg-gray-50 text-gray-700">
    <tr>
      <th className="px-4 py-2">Earnings</th>
      <th className="px-4 py-2">% Earnings on CTC</th>
      <th className="px-4 py-2">Amount</th>
    </tr>
  </thead>
  <tbody>
    <tr className="bg-blue-50 rounded-xl overflow-hidden border">
      <td className="px-4 py-2 rounded-l-2xl">Basic Salary &amp; DA</td>
      <td className="px-4 py-2">55.00%</td>
      <td className="px-4 py-2 rounded-r-2xl">{basicSalary.toLocaleString()}</td>
    </tr>
    <tr className="bg-indigo-50 rounded-xl overflow-hidden border">
      <td className="px-4 py-2 rounded-l-2xl">HRA</td>
      <td className="px-4 py-2">27.50%</td>
      <td className="px-4 py-2 rounded-r-2xl">{hra.toLocaleString()}</td>
    </tr>
    <tr className="bg-blue-50 rounded-xl overflow-hidden border">
      <td className="px-4 py-2 rounded-l-2xl">Special Allowance</td>
      <td className="px-4 py-2">17.50%</td>
      <td className="px-4 py-2 rounded-r-2xl">{specialAllowance.toLocaleString()}</td>
    </tr>
    <tr className="bg-blue-300 font-semibold rounded-2xl overflow-hidden border">
      <td className="px-4 py-2 rounded-l-2xl">Gross Earnings</td>
      <td></td>
      <td className="px-4 py-2 rounded-r-2xl">{monthlyCTC?.toLocaleString() || 0}</td>
    </tr>
  </tbody>
</table>

      </div>

      {/* Submit Button */}
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
        >
          Save Salary Details
        </button>
      </div>
    </form>
  );
};

export default SalaryDetailsForm;
