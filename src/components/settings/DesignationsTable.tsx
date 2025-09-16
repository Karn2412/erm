import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import DesignationModal from "./modal/DesignationModal";
import { useUser } from "../../context/UserContext";


interface Designation {
  id: string;
  designation: string;
  created_at: string;
  company_id: string;
}

const DesignationsTable: React.FC = () => {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const { userData } = useUser(); // 👈 contains company_id
  console.log(userData);

  // Fetch company-specific designations
  const fetchDesignations = async () => {
    if (!userData?.company_id) return;

    const { data, error } = await supabase
      .from("designations")
      .select("*")
      .eq("company_id", userData.company_id) // 👈 filter by company
      .order("created_at", { ascending: true });
      console.log(data);
      

    if (error) {
      console.error("Error fetching designations:", error);
    } else {
      setDesignations(data || []);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, [userData?.company_id]); // 👈 re-fetch if company changes

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Designations</h2>
        <button
          onClick={() => setOpenModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          + New Designation
        </button>
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-sm font-medium">DESIGNATION NAME</th>
          </tr>
        </thead>
        <tbody>
          {designations.length > 0 ? (
            designations.map((d) => (
              <tr key={d.id}>
                <td className="p-2 text-blue-600">{d.designation}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="p-2 text-gray-500 italic">
                No designations found for this company
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {openModal && (
        <DesignationModal
          onClose={() => setOpenModal(false)}
          onSaved={fetchDesignations}
        />
      )}
    </div>
  );
};

export default DesignationsTable;
