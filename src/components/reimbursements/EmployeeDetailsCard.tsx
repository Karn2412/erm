import React from 'react';

interface EmployeeDetailsCardProps {
  name: string;
  department: string;
  avatar: string;
}

const EmployeeDetailsCard: React.FC<EmployeeDetailsCardProps> = ({
  name,
  department,
  avatar,
}) => {
  return (
    <div className="bg-indigo-50 p-4 rounded-xl mb-4">
      <div className="grid grid-cols-2 gap-4 items-start">
        {/* Employee Name */}
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">Employee Name</p>
          <div className="flex border-blue-400 items-center space-x-2 border rounded-full px-4 py-2">
            <img src={avatar} alt={name} className="w-8 h-8 rounded-full object-cover" />
            <span className="text-sm font-medium">{name}</span>
          </div>
        </div>

        {/* Department */}
        <div>
          <p className="text-xs font-semibold text-gray-600 mb-1">Department</p>
          <div className="border border-blue-400 rounded-full px-4 py-2 text-sm text-black flex items-center">
            {department}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsCard;
