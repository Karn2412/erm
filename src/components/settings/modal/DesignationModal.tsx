import React, { useState } from "react";
import { supabase } from "../../../supabaseClient";
import { useUser } from "../../../context/UserContext";
import toast from "react-hot-toast";


interface Props {
  onClose: () => void;
  onSaved: () => void;
}

const DesignationModal: React.FC<Props> = ({ onClose, onSaved }) => {
  const [designation, setDesignation] = useState("");
  const { userData } = useUser();
  const handleSave = async () => {
    if (!designation.trim()) return;

    const { error } = await supabase
      .from("designations")
      .insert([{ designation,
        company_id: userData.company_id, // 👈 ensure company is linked
       }]);

    if (error) {
      console.error("Insert failed:", error);
      toast.error("Failed to save designation");
    } else {
      onSaved(); // refresh table
      onClose(); // close modal
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="bg-white rounded-lg shadow p-6 w-96">
        <h2 className="text-lg font-bold mb-4">New Designation</h2>
        <input
          type="text"
          value={designation}
          onChange={(e) => setDesignation(e.target.value)}
          placeholder="Enter designation name"
          className="border p-2 w-full rounded mb-4"
        />
        <div className="flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 border rounded">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignationModal;
