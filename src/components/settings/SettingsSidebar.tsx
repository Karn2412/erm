import React from 'react';
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaLayerGroup,
  FaUserTie,
  FaBalanceScale,
  FaMoneyBillWave,
  FaFileAlt,
  FaPercentage,
  FaCalendarAlt,
  FaClock,
  FaLaptop,
} from 'react-icons/fa';

interface SidebarProps {
  active: string; // ✅ currently active section
  onSelect: (name: string) => void; // ✅ notify parent
}

const menuItems = [
  { name: 'Organisational Profile', icon: <FaBuilding /> },
  { name: 'Work Locations', icon: <FaMapMarkerAlt /> },
  { name: 'Departments', icon: <FaLayerGroup /> },
  { name: 'Designations', icon: <FaUserTie /> },
  { name: 'Statutory Components', icon: <FaBalanceScale /> },
  { name: 'Salary Components', icon: <FaMoneyBillWave /> },
  { name: 'Salary Templates', icon: <FaFileAlt /> },
  { name: 'Taxes', icon: <FaPercentage /> },
  { name: 'Pay Schedule', icon: <FaCalendarAlt /> },
  { name: 'Leave & Attendance', icon: <FaClock /> },
  { name: 'Assets', icon: <FaLaptop /> }, // ✅ Added
];

const SettingsSidebar: React.FC<SidebarProps> = ({ active, onSelect }) => {
  return (
    <div className="bg-indigo-50 rounded-lg mt-4 shadow p-4 w-full">
      {menuItems.map((item) => (
        <div
          key={item.name}
          onClick={() => onSelect(item.name)}
          className={`py-2 px-3 text-gray-600 text-sm rounded hover:bg-gray-100 cursor-pointer flex items-center space-x-2 ${
            item.name === active ? 'bg-gray-200 font-medium' : ''
          }`}
        >
          {item.icon}
          <span>{item.name}</span>
        </div>
      ))}
    </div>
  );
};

export default SettingsSidebar;
