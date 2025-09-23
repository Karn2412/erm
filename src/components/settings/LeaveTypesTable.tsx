import React, { useState, useEffect } from "react";
import { FaEdit, FaDownload, FaPlus } from "react-icons/fa";

import { supabase } from "../../supabaseClient"; // ✅ your supabase client
import LeaveTypeModal from "./modal/LeaveTypeModal";
import type { LeaveType } from "../../types/leavetypes";



const LeaveTypesTable: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedLeaveType, setSelectedLeaveType] = useState<LeaveType | null>(null);

  // ✅ Load leave types
  const fetchLeaveTypes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("leave_types")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching leave types:", error.message);
    } else {
      setLeaveTypes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  // ✅ Save callback (add or update)
  const handleSave = async (lt: LeaveType, isEdit: boolean) => {
    if (isEdit) {
      const { data, error } = await supabase
        .from("leave_types")
        .update({
          leave_name: lt.leave_name,
          code: lt.code,
          description: lt.description,
          is_paid: lt.is_paid,
          max_days_per_month: lt.max_days_per_month,
          carry_forward: lt.carry_forward,
          yearly_limit: lt.yearly_limit,
          carry_forward_limit: lt.carry_forward_limit,
          requires_approval: lt.requires_approval,
          max_consecutive_days: lt.max_consecutive_days,
            color: lt.color || "#cccccc", // use provided color or default
        })
        .eq("id", lt.id)
        .select()
        .single();

      if (error) {
        console.error("Update error:", error.message);
      } else {
        setLeaveTypes((prev) => prev.map((l) => (l.id === data.id ? data : l)));
      }
    } else {
      const { data, error } = await supabase
        .from("leave_types")
        .insert([
          {
            leave_name: lt.leave_name,
            code: lt.code,
            description: lt.description,
            is_paid: lt.is_paid,
            max_days_per_month: lt.max_days_per_month,
            carry_forward: lt.carry_forward,
            yearly_limit: lt.yearly_limit,
            carry_forward_limit: lt.carry_forward_limit,
            requires_approval: lt.requires_approval,
            max_consecutive_days: lt.max_consecutive_days,
            company_id: lt.company_id, // you may need to pass this in
            color: lt.color || "#cccccc", // use provided color or default
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error.message);
      } else {
        setLeaveTypes((prev) => [data, ...prev]);
      }
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center bg-white mb-4">
        <h2 className="text-lg font-semibold">Leave Types</h2>

        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedLeaveType(null);
              setShowModal(true);
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm flex items-center"
          >
            <FaPlus className="mr-1" /> Add Leave Type
          </button>
          <button className="bg-gray-100 border text-gray-600 px-3 py-2 rounded text-sm flex items-center">
            <FaDownload className="mr-1" /> Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-blue-50 h-125 rounded-lg shadow p-4">
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2">Leave Name</th>
                <th>Code</th>
                <th>Paid</th>
                <th>Max/Month</th>
                <th>Carry Forward</th>
                <th>Yearly Limit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map((lt, index) => (
                <tr
                  key={lt.id}
                  className={`${
                    index % 2 === 0 ? "bg-blue-50" : "bg-blue-100"
                  } hover:bg-blue-200`}
                >
                  <td className="py-2">{lt.leave_name}</td>
                  <td>{lt.code || "-"}</td>
                  <td>{lt.is_paid ? "Yes" : "No"}</td>
                  <td>{lt.max_days_per_month ?? "-"}</td>
                  <td>{lt.carry_forward ? "Yes" : "No"}</td>
                  <td>{lt.yearly_limit ?? "-"}</td>
                  <td>
                    <button
                      className="text-blue-600 hover:underline flex items-center"
                      onClick={() => {
                        setSelectedLeaveType(lt);
                        setShowModal(true);
                      }}
                    >
                      <FaEdit className="mr-1" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Modal */}
        <LeaveTypeModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          leaveType={selectedLeaveType || undefined}
          onSaved={handleSave}
        />
      </div>
    </div>
  );
};

export default LeaveTypesTable;
