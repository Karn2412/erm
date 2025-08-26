import React from 'react';


interface EmployeeDetailsCardProps {
  name: string;
 
  avatar: string;
}

const EmployeeDetailsCard: React.FC<EmployeeDetailsCardProps> = ({
  name,
  
  avatar,
}) => {
  return (
    <div className="bg-white shadow-md rounded-xl p-5 mb-4 border border-gray-200">
      {/* Top row: Avatar + Name + Role */}
      <div className="flex items-center space-x-4 mb-4">
        <img
          src={avatar}
          alt={name}
          className="w-14 h-14 rounded-full object-cover border-2 border-indigo-400"
        />
        <div>
          <p className="text-lg font-semibold text-gray-800">{name}</p>
          
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
        {/* Department */}
        {/* <div className="flex items-center space-x-2">
          <FaBuilding className="text-indigo-500" />
          <span className="font-medium">Department:</span>
          <span>{department}</span>
        </div> */}

        <div></div>

        {/* Additional fields can go here */}
      </div>
    </div>
  );
};

export default EmployeeDetailsCard;
