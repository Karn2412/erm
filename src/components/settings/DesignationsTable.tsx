import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import DesignationModal from "./modal/DesignationModal";


interface Designation {
  id: string;
  designation: string;
  created_at: string;
}

const DesignationsTable: React.FC = () => {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [openModal, setOpenModal] = useState(false);

  // Fetch all designations
  const fetchDesignations = async () => {
    const { data, error } = await supabase
      .from("designations")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching designations:", error);
    } else {
      setDesignations(data || []);
    }
  };

  useEffect(() => {
    fetchDesignations();
  }, []);

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
          {designations.map((d) => (
            <tr key={d.id} className="">
              <td className="p-2 text-blue-600">{d.designation}</td>
            </tr>
          ))}
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
