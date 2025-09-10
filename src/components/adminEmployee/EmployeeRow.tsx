import React, { useState } from "react";
import { FaEye, FaExclamationCircle } from "react-icons/fa";


interface Props {
  employee: {
    id: string;
    name: string;
    email: string;
    number: string | null;
    department_name?: string;
    company_id?: string;
    status?: boolean;
    avatar?: string;   // ✅ new
  };
  index: number;           // ✅ required, 0-based
  onRefresh: () => void;
  onOpenModal: () => void; 
}

const EmployeeRow: React.FC<Props> = ({ employee, index, onOpenModal }) => {
  const [open, setOpen] = useState(false);
  console.log(open);
  const profileIncomplete = !employee.department_name || !employee.number;
  const rowBg = index % 2 === 0 ? "bg-indigo-50" : "bg-blue-50";

  

  return (
    <>
    <>
      <tr className="transition">
        {/* Profile (index + avatar) — left rounded */}
       <td className={`px-4 py-3 ${rowBg} rounded-l-2xl`}>
  <div className="flex items-center">
    {/* Avatar */}
    <div className="relative w-8 h-8 rounded-full  ring-1 ring-black/5">
     <img
  src={employee.avatar}
  alt={`${employee.name} Avatar`}
  className="w-full h-full object-cover rounded-full"
/>
    </div>

    {/* Index Number */}
    <span className="ml-1 text-gray-800 text-sm font-semibold">
      {index + 1}
    </span>
  </div>
</td>


        {/* Employee Name */}
        <td className={`px-4 py-3 font-medium text-gray-800 ${rowBg}`}>{employee.name}</td>

        {/* Work Email */}
        <td className={`px-4 py-3 text-sm text-gray-700 ${rowBg}`}>{employee.email}</td>

        {/* Department / Incomplete */}
        <td className={`px-4 py-3 ${rowBg}`}>
          {profileIncomplete ? (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-lg text-sm">
              <FaExclamationCircle />
              This employee’s profile is incomplete.
              <button
                className="ml-2 text-blue-700 hover:underline font-medium"
                onClick={() => setOpen(true)}
              >
                Complete Now
              </button>
            </div>
          ) : (
            <span className="text-sm text-gray-800">{employee.department_name}</span>
          )}
        </td>

        {/* Status */}
        <td className={`px-4 py-3 ${rowBg}`}>
          {!profileIncomplete &&
            (employee.status ? (
              <span className="flex items-center text-green-700 text-sm font-medium">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                Active
              </span>
            ) : (
              <span className="text-sm text-gray-500">Inactive</span>
            ))}
        </td>

        {/* View More — right rounded */}
        <td className={`px-4 py-3 ${rowBg} rounded-r-3xl`}>
          <FaEye
            className="cursor-pointer text-gray-600 hover:text-blue-700"
            onClick={onOpenModal}
          />
        </td>
      </tr>

      
    </>
    
   </>
  );
};

export default EmployeeRow;
