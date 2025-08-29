import React from "react";
import { FaEye } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface Employee {
  id: string;
  name: string;
  number: string;
  department_name?: string | null; // department fetched from join
  designation?: string | null; // designation fetched from join
}

interface Props {
  employees: Employee[];
}

const ReimbursementsTable: React.FC<Props> = ({ employees }) => {
  const navigate = useNavigate();

  const handleViewSubmission = (employeeId: string) => {
    navigate(`/reimbursements/${employeeId}`);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
    <table className="min-w-full text-sm bg-white border-separate border-spacing-y-3">
  <thead>
    <tr className="text-gray-500 text-left bg-white">
      <th className="py-3 px-4 w-1/12">Sl no</th>
      <th className="py-3 px-4 w-3/12">Name</th>
      <th className="py-3 px-4 w-3/12">Department</th>
      <th className="py-3 px-4 w-3/12">Designation</th>
      <th className="py-3 px-4 w-2/12">Submissions</th>
    </tr>
  </thead>

  <tbody>
    {employees.map((item, index) => (
      <tr
        key={item.id}
        className={`rounded-2xl ${
          index % 2 === 0 ? "bg-[#F3F2FD]" : "bg-[#E9F4FF]"
        }`}
      >
        {/* Sl no */}
        <td className="py-3 px-4 rounded-l-2xl">{index + 1}</td>

        {/* Name with avatar */}
        <td className="py-3 px-4 flex items-center space-x-2">
          <img
            src={
              "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3485.jpg?w=1380"
            }
            alt={item.name}
            className="w-8 h-8 rounded-full"
          />
          <span className="font-medium">{item.name}</span>
        </td>

        {/* Department */}
        <td className=" px-4">{item.department_name || "-"}</td>

        {/* Designation */}
        <td className=" px-4">{item.designation || "-"}</td>

        {/* Submissions button */}
        <td className="  rounded-r-2xl">
          <div className=" ">
            <button
              onClick={() => handleViewSubmission(item.id)}
              className="flex items-center bg-[#C7DFFF] hover:bg-[#B6D4FF] text-sm px-4 py-1.5 rounded-lg"
            >
              View Submission
              <FaEye className="ml-2 text-black" size={14} />
            </button>
          </div>
        </td>
      </tr>
    ))}

    {employees.length === 0 && (
      <tr>
        <td colSpan={5} className="text-center py-4 text-gray-400">
          No reimbursements found
        </td>
      </tr>
    )}
  </tbody>
</table>


    </div>
  );
};

export default ReimbursementsTable;
