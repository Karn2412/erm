import { useEffect, useState } from "react";
import { MdApartment } from "react-icons/md";
import { FaMapMarkerAlt, FaUserTie, FaFilter, FaChevronDown } from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import { useUser } from "../../context/UserContext";

interface Department {
  id: string;
  department_name: string;
}

interface Designation {
  id: string;
  designation: string;
}
interface WorkLocation {
  id: string;
  name: string;
}

const EmployeeFilters = ({
  
  setDepartment,
  
  setDesignation,
 
  setWorkLocation,
  activeEmployees,
  inactiveEmployees,
  setSearch,

  
}: {
  department: string;
  setDepartment: (val: string) => void;
  designation: string;
  setDesignation: (val: string) => void;
  workLocation: string;
  setWorkLocation: (val: string) => void;
  activeEmployees: any[];
  inactiveEmployees: any[];
  setSearch: (val: string) => void;
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const { userData } = useUser();
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      if (!userData?.company_id) return;

      const { data, error } = await supabase
        .from("departments")
        .select("id, department_name")
        .eq("company_id", userData.company_id);

      if (!error && data) setDepartments(data);
    };
    fetchDepartments();
  }, [userData]);

  // Fetch work locations
  useEffect(() => {
    const fetchWorkLocations = async () => {
      if (!userData?.company_id) return;

      const { data, error } = await supabase
        .from("work_locations")
        .select("id, name")
        .eq("company_id", userData.company_id);

      if (!error && data) setWorkLocations(data);
    };
    fetchWorkLocations();
  }, [userData]);

  // Fetch designations
  useEffect(() => {
    const fetchDesignations = async () => {
      const { data, error } = await supabase
        .from("designations")
        .select("id, designation");

      if (!error && data) setDesignations(data);
    };
    fetchDesignations();
  }, []);

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  // helper when clicking a person in More Filters
  const handleClickPerson = (name: string | undefined) => {
    if (!name) return;
    setSearch(name);
    setOpenDropdown(null);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Work Location */}
      <div className="relative flex items-center justify-between bg-violet-100 px-4 py-3 rounded-2xl shadow cursor-pointer">
        <div className="flex items-center gap-2">
          <FaMapMarkerAlt className="text-violet-600 text-lg" />
          <span className="text-sm font-semibold text-gray-700">
            Select Work Location
          </span>
        </div>
        <button
          onClick={() => toggleDropdown("work")}
          className="w-7 h-7 rounded-full border border-violet-400 flex items-center justify-center bg-white"
        >
          <FaChevronDown
            className={`text-xs text-violet-600 transition-transform ${
              openDropdown === "work" ? "rotate-180" : ""
            }`}
          />
        </button>
        {openDropdown === "work" && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white shadow rounded-xl z-10">
            <div
              className="px-4 py-2 hover:bg-violet-50 cursor-pointer"
              onClick={() => setWorkLocation("")}
            >
              All
            </div>
            {workLocations.map((loc) => (
              <div
                key={loc.id}
                className="px-4 py-2 hover:bg-violet-50 cursor-pointer"
                onClick={() => setWorkLocation(loc.id)}
              >
                {loc.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Department */}
      <div className="relative flex items-center justify-between bg-blue-100 px-4 py-3 rounded-2xl shadow cursor-pointer">
        <div className="flex items-center gap-2">
          <MdApartment className="text-blue-600 text-lg" />
          <span className="text-sm font-semibold text-gray-700">
            Select Department
          </span>
        </div>
        <button
          onClick={() => toggleDropdown("department")}
          className="w-7 h-7 rounded-full border border-blue-400 flex items-center justify-center bg-white"
        >
          <FaChevronDown
            className={`text-xs text-blue-600 transition-transform ${
              openDropdown === "department" ? "rotate-180" : ""
            }`}
          />
        </button>
        {openDropdown === "department" && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white shadow rounded-xl z-10">
            <div
              className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
              onClick={() => setDepartment("")}
            >
              All
            </div>
            {departments.map((dep) => (
              <div
                key={dep.id}
                className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                onClick={() => setDepartment(dep.id)}
              >
                {dep.department_name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Designation */}
      <div className="relative flex items-center justify-between bg-red-100 px-4 py-3 rounded-2xl shadow cursor-pointer">
        <div className="flex items-center gap-2">
          <FaUserTie className="text-red-600 text-lg" />
          <span className="text-sm font-semibold text-gray-700">
            Select Designation
          </span>
        </div>
        <button
          onClick={() => toggleDropdown("designation")}
          className="w-7 h-7 rounded-full border border-red-400 flex items-center justify-center bg-white"
        >
          <FaChevronDown
            className={`text-xs text-red-600 transition-transform ${
              openDropdown === "designation" ? "rotate-180" : ""
            }`}
          />
        </button>
        {openDropdown === "designation" && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white shadow rounded-xl z-10">
            <div
              className="px-4 py-2 hover:bg-red-50 cursor-pointer"
              onClick={() => setDesignation("")}
            >
              All
            </div>
            {designations.map((des) => (
              <div
                key={des.id}
                className="px-4 py-2 hover:bg-red-50 cursor-pointer"
                onClick={() => setDesignation(des.id)}
              >
                {des.designation}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* More Filters */}
      <div className="relative flex items-center justify-between bg-pink-100 px-4 py-3 rounded-2xl shadow cursor-pointer">
        <div className="flex items-center gap-2">
          <FaFilter className="text-pink-600 text-lg" />
          <span className="text-sm font-semibold text-gray-700">
            More Filters
          </span>
        </div>
        <button
          onClick={() => toggleDropdown("more")}
          className="w-7 h-7 rounded-full border border-pink-400 flex items-center justify-center bg-white"
        >
          <FaChevronDown
            className={`text-xs text-pink-600 transition-transform ${
              openDropdown === "more" ? "rotate-180" : ""
            }`}
          />
        </button>

        {openDropdown === "more" && (
          <div className="absolute top-full left-0 mt-2 w-full bg-white shadow rounded-xl z-10">
            {/* Active Members */}
            {activeEmployees && activeEmployees.length > 0 && (
              <div className="border-b border-gray-200">
                <div className="px-4 py-2 font-semibold text-gray-700 bg-green-50">
                  Active Members
                </div>
                {activeEmployees.map(emp => (
                  <div
                    key={emp.id}
                    className="px-4 py-2 hover:bg-green-100 cursor-pointer text-sm"
                    onClick={() => handleClickPerson(emp.name)}
                  >
                    {emp.name}
                  </div>
                ))}
              </div>
            )}

            {/* Inactive Members */}
            {inactiveEmployees && inactiveEmployees.length > 0 && (
              <div>
                <div className="px-4 py-2 font-semibold text-gray-700 bg-gray-50">
                  Inactive Members
                </div>
                {inactiveEmployees.map(emp => (
                  <div
                    key={emp.id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-500"
                    onClick={() => handleClickPerson(emp.name)}
                  >
                    {emp.name}
                  </div>
                ))}
              </div>
            )}

            {/* If no data */}
            {(!activeEmployees || activeEmployees.length === 0) &&
              (!inactiveEmployees || inactiveEmployees.length === 0) && (
                <div className="px-4 py-3 text-sm text-gray-500">
                  No members to show
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeFilters;
