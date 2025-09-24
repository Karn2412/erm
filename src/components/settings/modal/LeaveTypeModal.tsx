import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import type { LeaveType } from "../../../types/leavetypes";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leaveType?: LeaveType;
  onSaved: (lt: LeaveType, isEdit: boolean) => void;
}

const LeaveTypeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  leaveType,
  onSaved,
}) => {
  const [formData, setFormData] = useState<LeaveType>({
    leave_name: "",
    is_paid: true,
    max_days_per_month: null,
    carry_forward: false,
    yearly_limit: null,
    carry_forward_limit: null,
    requires_approval: true,
    max_consecutive_days: null,
    description: "",
    code: "",
    color: "#cccccc", // ✅ default color
  });

  useEffect(() => {
    if (leaveType) {
      setFormData(leaveType);
    } else {
      setFormData({
        leave_name: "",
        is_paid: true,
        max_days_per_month: null,
        carry_forward: false,
        yearly_limit: null,
        carry_forward_limit: null,
        requires_approval: true,
        max_consecutive_days: null,
        description: "",
        code: "",
        color: "#cccccc", // ✅ default fallback
      });
    }
  }, [leaveType]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = () => {
    if (!formData.leave_name) return toast.error("Leave name is required!");
    onSaved(formData, !!leaveType); // ✅ send raw formData
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            {leaveType ? "Edit Leave Type" : "Add Leave Type"}
          </h2>
          <button onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <input
            type="text"
            name="leave_name"
            placeholder="Leave Name"
            value={formData.leave_name}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
          <input
            type="text"
            name="code"
            placeholder="Code (e.g. SL)"
            value={formData.code || ""}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
          <textarea
            name="description"
            placeholder="Description"
            value={formData.description || ""}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />

          {/* ✅ Color Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="color"
                name="color"
                value={formData.color || "#cccccc"}
                onChange={handleChange}
                className="h-10 w-16 p-1 border rounded cursor-pointer"
              />
              <span className="text-sm text-gray-600">
                {formData.color?.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_paid"
                checked={formData.is_paid}
                onChange={handleChange}
                className="mr-2"
              />
              Paid
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="carry_forward"
                checked={formData.carry_forward}
                onChange={handleChange}
                className="mr-2"
              />
              Accumulative
            </label>
          </div>

          <input
            type="number"
            name="max_days_per_month"
            placeholder="Max Days Per Month"
            value={formData.max_days_per_month ?? ""}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="number"
            name="yearly_limit"
            placeholder="Yearly Limit"
            value={formData.yearly_limit ?? ""}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="number"
            name="carry_forward_limit"
            placeholder="Carry Forward Limit"
            value={formData.carry_forward_limit ?? ""}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />

          <input
            type="number"
            name="max_consecutive_days"
            placeholder="Max Consecutive Days"
            value={formData.max_consecutive_days ?? ""}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />

          <label className="flex items-center">
            <input
              type="checkbox"
              name="requires_approval"
              checked={formData.requires_approval}
              onChange={handleChange}
              className="mr-2"
            />
            Requires Approval
          </label>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-2 mt-6">
          <button
            className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
            onClick={handleSubmit}
          >
            {leaveType ? "Save Changes" : "Add Leave Type"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaveTypeModal;
