import React, { useState } from "react";
import { FaEye, FaExclamationCircle } from "react-icons/fa";
import EmployeeModal from "./addemployee/employeemodal/EmployeeModal";

interface Props {
  employee: {
    id: string;
    name: string;
    email: string;
    number: string | null;
    department_name?: string;
    status?: boolean;
  };
  onRefresh: () => void;
}

const EmployeeRow: React.FC<Props> = ({ employee, onRefresh }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <tr className=" hover:bg-gray-50">
        {/* Employee ID */}
        <td className="px-4 py-3">
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700 font-mono text-sm">
            {employee.id}
          </span>
        </td>

        {/* Name */}
        <td className="px-4 py-3">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-medium">
            {employee.name}
          </span>
        </td>

        {/* Work Email */}
        <td className="px-4 py-3">
          <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
            {employee.email}
          </span>
        </td>

        {/* Mobile */}
        <td className="px-4 py-3">
          {employee.number ? (
            <span className="px-3 py-1 rounded-full bg-green-50 text-green-700">
              {employee.number}
            </span>
          ) : (
            <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-sm">
              <FaExclamationCircle />
              Incomplete
            </span>
          )}
        </td>

        {/* Department */}
        <td className="px-4 py-3">
          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-700">
            {employee.department_name || "-"}
          </span>
        </td>

        {/* Status */}
        <td className="px-4 py-3">
          {employee.status ? (
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium">
              Active
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 font-medium">
              Inactive
            </span>
          )}
        </td>

        {/* Actions */}
        <td className="px-4 py-3">
          <FaEye
            className="cursor-pointer text-gray-500 hover:text-blue-600"
            onClick={() => setOpen(true)}
          />
        </td>
      </tr>

      {open && (
        <EmployeeModal
          employee={employee}
          onClose={() => setOpen(false)}
          onUpdated={() => {
            setOpen(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
};

export default EmployeeRow;
