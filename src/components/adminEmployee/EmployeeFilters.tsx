import { useEffect, useState } from "react";
import { MdApartment } from "react-icons/md";
import { FaMapMarkerAlt, FaUserTie, FaFilter, FaChevronDown, FaCheck } from "react-icons/fa";
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
  department,
  setDepartment,
  designation,
  setDesignation,
  workLocation,
  setWorkLocation,
  statusFilter,
  setStatusFilter,   // 👈 new prop
}: {
  department: string;
  setDepartment: (val: string) => void;
  designation: string;
  setDesignation: (val: string) => void;
  workLocation: string;
  setWorkLocation: (val: string) => void;
  statusFilter: "all" | "active" | "inactive";
  setStatusFilter: (val: "all" | "active" | "inactive") => void;
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
              className={`px-4 py-2 flex items-center justify-between cursor-pointer ${
                workLocation === ""
                  ? "bg-violet-200 font-semibold text-violet-700"
                  : "hover:bg-violet-50"
              }`}
              onClick={() => {
                setWorkLocation("");
                setOpenDropdown(null);
              }}
            >
              <span>All</span>
              {workLocation === "" && <FaCheck className="text-violet-600 text-xs" />}
            </div>
            {workLocations.map((loc) => (
              <div
                key={loc.id}
                className={`px-4 py-2 flex items-center justify-between cursor-pointer ${
                  workLocation === loc.id
                    ? "bg-violet-200 font-semibold text-violet-700"
                    : "hover:bg-violet-50"
                }`}
                onClick={() => {
                  setWorkLocation(loc.id);
                  setOpenDropdown(null);
                }}
              >
                <span>{loc.name}</span>
                {workLocation === loc.id && (
                  <FaCheck className="text-violet-600 text-xs" />
                )}
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
              className={`px-4 py-2 flex items-center justify-between cursor-pointer ${
                department === ""
                  ? "bg-blue-200 font-semibold text-blue-700"
                  : "hover:bg-blue-50"
              }`}
              onClick={() => {
                setDepartment("");
                setOpenDropdown(null);
              }}
            >
              <span>All</span>
              {department === "" && <FaCheck className="text-blue-600 text-xs" />}
            </div>
            {departments.map((dep) => (
              <div
                key={dep.id}
                className={`px-4 py-2 flex items-center justify-between cursor-pointer ${
                  department === dep.id
                    ? "bg-blue-200 font-semibold text-blue-700"
                    : "hover:bg-blue-50"
                }`}
                onClick={() => {
                  setDepartment(dep.id);
                  setOpenDropdown(null);
                }}
              >
                <span>{dep.department_name}</span>
                {department === dep.id && (
                  <FaCheck className="text-blue-600 text-xs" />
                )}
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
              className={`px-4 py-2 flex items-center justify-between cursor-pointer ${
                designation === ""
                  ? "bg-red-200 font-semibold text-red-700"
                  : "hover:bg-red-50"
              }`}
              onClick={() => {
                setDesignation("");
                setOpenDropdown(null);
              }}
            >
              <span>All</span>
              {designation === "" && <FaCheck className="text-red-600 text-xs" />}
            </div>
            {designations.map((des) => (
              <div
                key={des.id}
                className={`px-4 py-2 flex items-center justify-between cursor-pointer ${
                  designation === des.id
                    ? "bg-red-200 font-semibold text-red-700"
                    : "hover:bg-red-50"
                }`}
                onClick={() => {
                  setDesignation(des.id);
                  setOpenDropdown(null);
                }}
              >
                <span>{des.designation}</span>
                {designation === des.id && (
                  <FaCheck className="text-red-600 text-xs" />
                )}
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
        {/* All Members */}
        <div
          className={`px-4 py-2 flex items-center justify-between cursor-pointer ${
            statusFilter === "all"
              ? "bg-pink-200 font-semibold text-pink-700"
              : "hover:bg-pink-50"
          }`}
          onClick={() => {
            setStatusFilter("all");
            setOpenDropdown(null);
          }}
        >
          <span>All Members</span>
          {statusFilter === "all" && <FaCheck className="text-pink-600 text-xs" />}
        </div>

        {/* Active Members */}
        <div
          className={`px-4 py-2 flex items-center justify-between cursor-pointer ${
            statusFilter === "active"
              ? "bg-green-200 font-semibold text-green-700"
              : "hover:bg-green-50"
          }`}
          onClick={() => {
            setStatusFilter("active");
            setOpenDropdown(null);
          }}
        >
          <span>Active Members</span>
          {statusFilter === "active" && <FaCheck className="text-green-600 text-xs" />}
        </div>

        {/* Inactive Members */}
        <div
          className={`px-4 py-2 flex items-center justify-between cursor-pointer ${
            statusFilter === "inactive"
              ? "bg-gray-200 font-semibold text-gray-700"
              : "hover:bg-gray-50"
          }`}
          onClick={() => {
            setStatusFilter("inactive");
            setOpenDropdown(null);
          }}
        >
          <span>Inactive Members</span>
          {statusFilter === "inactive" && <FaCheck className="text-gray-600 text-xs" />}
        </div>
      </div>
    )}
  </div>

    </div>
  );
};

export default EmployeeFilters;
