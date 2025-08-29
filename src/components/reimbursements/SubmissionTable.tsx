import React, { useState } from "react";
import { FaEye } from "react-icons/fa";
import ReimbursementProofModal from "./modal/ReimbursementProofModal";

interface SubmissionItem {
  id: string;
  type: string;
  date: string;
  description: string;
  amount: number;
  proof?: string;
  status: string;
}

const SubmissionTable: React.FC<{ data: SubmissionItem[] }> = ({ data }) => {
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="rounded-xl overflow-x-auto bg-gray-50">
      <table className="min-w-full text-sm border-separate border-spacing-y-3">
        <thead>
          <tr className="text-gray-600 text-left">
            <th className="py-2 px-4">Sl no</th>
            <th className="py-2 px-4">Type of Reimbursement</th>
            <th className="py-2 px-4">Expense Date</th>
            <th className="py-2 px-4">Description</th>
            <th className="py-2 px-4">Amount</th>
            <th className="py-2 px-4">Proof</th>
            {/* <th className="py-2 px-4">Action</th> */}
          </tr>
        </thead>

        <tbody>
          {data.map((item, index) => (
            <tr
              key={item.id}
              className={`rounded-2xl ${
                index % 2 === 0 ? "bg-[#F3F2FD]" : "bg-[#E9F4FF]"
              }`}
            >
              <td className="py-3 px-4 rounded-l-2xl">{index + 1}</td>
              <td className="py-3 px-4">{item.type}</td>
              <td className="py-3 px-4">{item.date}</td>
              <td className="py-3 px-4">{item.description}</td>
              <td className="py-3 px-4">{item.amount}</td>

              {/* Proof button */}
              <td className="py-3 px-4">
                <button
                  onClick={() => {
                    setSelectedId(item.id);
                    setSelectedProof(item.proof || "");
                  }}
                  className="flex items-center bg-[#E7EBF6] hover:bg-[#D7DEEE] text-sm px-3 py-1.5 rounded-full"
                >
                  View <FaEye className="ml-2 text-gray-700" size={14} />
                </button>
              </td>

              {/* Approve / Reject buttons */}
              {/* <td className="py-3 px-4 flex space-x-2 rounded-r-2xl">
                <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-1.5 rounded-full">
                  Approve
                </button>
                <button className="bg-red-500 hover:bg-red-600 text-white px-4 py-1.5 rounded-full">
                  Reject
                </button>
              </td> */}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {selectedProof && selectedId && (
        <ReimbursementProofModal
          reimbursementId={selectedId}
          proofUrl={selectedProof}
          onClose={() => {
            setSelectedProof(null);
            setSelectedId(null);
          }}
          onActionComplete={() => {
            // 🔄 refresh from parent
          }}
        />
      )}
    </div>
  );
};

export default SubmissionTable;
