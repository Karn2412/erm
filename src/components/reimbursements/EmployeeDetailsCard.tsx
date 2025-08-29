import React from 'react';

interface EmployeeDetailsCardProps {
  name: string;
  department: string;
  designation: string;
  avatar: string;
}

const EmployeeDetailsCard: React.FC<EmployeeDetailsCardProps> = ({
  name,
  department,
  designation,
  avatar,
}) => {
  return (
    <div className="bg-gray-50 rounded-xl p-5 mb-4 ">
      <div className="grid grid-cols-3 gap-6">
        {/* Employee Name */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">
            Employee Name
          </label>
          <div className="flex items-center space-x-2 border border-blue-300 rounded-full px-3 py-2 bg-white">
            <img
              src={avatar}
              alt={name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-gray-800 font-medium">{name}</span>
          </div>
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Department</label>
          <div className="border border-blue-300 rounded-full px-3 py-2 bg-white">
            {department}
          </div>
        </div>

        {/* Designation (blank for now) */}
        <div>
          <label className="block text-sm text-gray-600 mb-1">Designation</label>
          <div className="border border-blue-300 rounded-full px-3 py-2 bg-white">
            {designation}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsCard;
