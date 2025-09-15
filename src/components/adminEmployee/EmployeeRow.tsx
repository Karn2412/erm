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
    profile_status?: string;
  };
  index: number;           // ✅ required, 0-based
  onRefresh: () => void;
  onOpenModal: () => void; 
}

const EmployeeRow: React.FC<Props> = ({ employee, index, onOpenModal }) => {
  const [open, setOpen] = useState(false);
  console.log(open,setOpen);
  const profileIncomplete = employee.profile_status === "Incomplete Profile";
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
<td className={`px-4 py-3 text-sm text-gray-700 ${rowBg}`}>
  {employee.email}
</td>

{/* Department + Status */}
{profileIncomplete ? (
  <td className={`px-4 py-3 ${rowBg}`} colSpan={2}>
    <div className="flex items-center justify-between text-red-600 bg-red-50 px-3 py-1 rounded-lg text-sm">
      <div className="flex items-center gap-2">
        <FaExclamationCircle />
        <span>This employee’s personal information is</span>
      </div>
      <span className="text-blue-800 font-medium">Incomplete</span>
    </div>
  </td>
) : (
  <>
    <td className={`px-4 py-3 ${rowBg}`}>
      <span className="text-sm text-gray-800">{employee.department_name}</span>
    </td>
    <td className={`px-4 py-3 ${rowBg}`}>
      {employee.status ? (
        <span className="flex items-center text-green-700 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-1" />
          Active
        </span>
      ) : (
        <span className="text-sm text-gray-500">Inactive</span>
      )}
    </td>
  </>
)}


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
