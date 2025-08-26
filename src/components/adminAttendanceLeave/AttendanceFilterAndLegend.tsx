// AttendanceFilterAndLegend.tsx
import React, { useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { supabase } from '../../supabaseClient';

interface Props {
  selectedDate: string;
  onDateChange: (d: string) => void;
  onDepartmentChange: (deptId: string) => void;
  onSearchChange: (query: string) => void;
}

const AttendanceFilterAndLegend: React.FC<Props> = ({
  selectedDate,
  onDateChange,
  onDepartmentChange,
  onSearchChange,
}) => {
  const [departments, setDepartments] = useState<{ id: string; department_name: string }[]>([]);

  // Fetch departments dynamically
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, department_name')
        .order('department_name', { ascending: true });

      if (!error && data) {
        setDepartments(data);
      }
    };

    fetchDepartments();
  }, []);

  return (
    <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
      <h2 className="text-base font-semibold mb-4">Employee Attendance</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="border border-blue-300 rounded-full pl-4 pr-2 py-2 text-gray-700 text-sm w-full focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            className="border border-blue-300 rounded-full px-4 py-2 text-sm w-full text-gray-700 focus:ring-blue-500 focus:outline-none"
            onChange={(e) => onDepartmentChange(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.department_name}
              </option>
            ))}
          </select>
        </div>

        {/* Empty placeholders */}
        <div></div>
        <div></div>

        {/* Search */}
        <div className="col-span-1 rounded-2xl p-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 text-sm" />
            <input
              type="text"
              placeholder="Search by employee name..."
              className="w-full border border-indigo-50 rounded-lg pl-8 py-2 text-sm focus:ring-blue-500 focus:outline-none"
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="col-span-2 grid grid-cols-2 items-center text-xs rounded-2xl">
          <div className="flex items-center justify-around">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>
            <p className="ms-2">Checked In</p>
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block ms-4"></span>
            <p className="ms-2">Absent</p>
          </div>
          <div className="flex items-center justify-around">
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span>
            <p className="ms-2">Regularization</p>
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block ms-4"></span>
            <p className="ms-2">Approved Off</p>
          </div>
        </div>

        <div className="col-span-1 flex justify-end items-center space-x-3"></div>
      </div>
    </div>
  );
};

export default AttendanceFilterAndLegend;
