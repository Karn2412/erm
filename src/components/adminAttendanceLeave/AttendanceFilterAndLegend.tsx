// AttendanceFilterAndLegend.tsx
import React, { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { supabase } from "../../supabaseClient";

interface Props {
  selectedDate: string;
  onDateChange: (d: string) => void;
  onDepartmentChange: (deptId: string) => void;
  onSearchChange: (query: string) => void;
  onDesignationChange: (desigId: string) => void; // ✅ NEW
}

const AttendanceFilterAndLegend: React.FC<Props> = ({
  selectedDate,
  onDateChange,
  onDepartmentChange,
  onSearchChange,
  onDesignationChange,
}) => {
  const [departments, setDepartments] = useState<
    { id: string; department_name: string }[]
  >([]);
  const [designations, setDesignations] = useState<
  { id: string; designation: string }[]
>([]);
console.log(designations);


useEffect(() => {
  const fetchDesignations = async () => {
    const { data, error } = await supabase
      .from("designations")
      .select("id, designation")
      .order("designation", { ascending: true });
    if (!error && data) {
      setDesignations(data);
    }
  };
  fetchDesignations();
}, [])

  // Fetch departments dynamically
  useEffect(() => {
    const fetchDepartments = async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("id, department_name")
        .order("department_name", { ascending: true });

      if (!error && data) {
        setDepartments(data);
      }
    };

    fetchDepartments();
  }, []);

  return (
    <div className="mb-6 bg-white p-4  ">
      <h2 className="text-base font-semibold mb-4">Employee Attendance</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Date Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="border border-blue-300 rounded-full pl-4 pr-2 py-2 text-gray-700 text-sm w-full focus:ring-blue-500 focus:outline-none"
          />
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Department
          </label>
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
        {/* designation */}
        <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Designation
  </label>
  <select
    className="border border-blue-300 rounded-full px-4 py-2 text-sm w-full text-gray-700 focus:ring-blue-500 focus:outline-none"
    onChange={(e) => onDesignationChange(e.target.value)}
  >
    <option value="">All Designations</option>
    {designations.map((desig) => (
      <option key={desig.id} value={desig.id}>
        {desig.designation}
      </option>
    ))}
  </select>
</div>

        {/* Empty placeholders */}
        <div></div>

        {/* Search */}
        <div className="col-span-1 rounded-2xl p-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-red-500 text-sm" />
            <input
              type="text"
              placeholder="Search by employee name..."
              className="w-full border border-indigo-50 rounded-3xl pl-8 py-2 text-sm focus:ring-blue-500 focus:outline-none"
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>

        {/* Legend */}
        <div className="col-span-2 grid grid-cols-4 items-center bg-gray-50 text-xs rounded-2xl py-1 my-1 gap-x-4 gap-y-1">
          {[
            { color: "green-500", label: "Checked In" },
            { color: "red-500", label: "Absent" },
            { color: "yellow-500", label: "Regularization" },
            { color: "blue-500", label: "Approved Off" },
          ].map(({ color, label }, idx) => (
            <div key={idx} className="flex items-center gap-x-2 justify-center">
              <span className={`w-3 h-3 rounded-full bg-${color}`}></span>
              <p>{label}</p>
            </div>
          ))}
        </div>


        <div className="col-span-1 flex justify-end items-center space-x-3"></div>
      </div>
    </div>
  );
};

export default AttendanceFilterAndLegend;
