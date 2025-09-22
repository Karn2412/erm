import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useUser } from "../../context/UserContext";
import EmployeeRow from "./EmployeeRow";
import EmployeeModal from "./addemployee/employeemodal/EmployeeModal";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

interface Employee {
  id: string;
  name: string;
  email: string;
  number: string | null;
  department_name?: string;
  status?: boolean;
  company_id?: string;
  avatar?: string;
  designation_id?: string | null;
  location_id?: string | null;
  work_location?: string | null;
  profile_status?: string;
  user_role?: string;
}

const EmployeeTable: React.FC<{
  search: string;
  department: string;
  designation: string;
  workLocation: string;
  statusFilter: "all" | "active" | "inactive";
  setActiveEmployees: (emps: Employee[]) => void;
  setInactiveEmployees: (emps: Employee[]) => void;
}> = ({
  search,
  department,
  designation,
  workLocation,
  setActiveEmployees,
  setInactiveEmployees,
  statusFilter,
}) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const { userData } = useUser();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // dropdown toggle states
  const [showStaff, setShowStaff] = useState(true);
  const [showAdmin, setShowAdmin] = useState(false);

 const fetchEmployees = async () => {
  if (!userData?.company_id) return;
  setLoading(true);

  let query: any = supabase
    .from("user_with_email")
    .select(
      "auth_id, email, name, number, is_active, department_id, department_name, designation_id, company_id, gender, gender_avatar, location_id, work_location, profile_status, user_role"
    )
    .eq("company_id", userData.company_id);

  if (department) query = query.eq("department_id", department);
  if (search)
    query = query.or(
      `name.ilike.%${search}%,email.ilike.%${search}%,number.ilike.%${search}%`
    );
  if (designation) query = query.eq("designation_id", designation);
  if (workLocation) query = query.eq("location_id", workLocation);

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching employees:", error.message);
    setLoading(false);
    return;
  }

  let formatted = (data || []).map((emp: any) => ({
    id: emp.auth_id,
    name: emp.name,
    email: emp.email,
    number: emp.number,
    department_name: emp.department_name,
    company_id: emp.company_id,
    status: emp.is_active,
    avatar:
      emp.gender_avatar ||
      "https://dummyimage.com/100x100/cccccc/000000&text=User",
    designation_id: emp.designation_id,
    location_id: emp.location_id,
    work_location: emp.work_location,
    profile_status: emp.profile_status,
    user_role: emp.user_role,
  }));

  if (statusFilter === "active") {
    formatted = formatted.filter((emp: Employee) => emp.status);
  } else if (statusFilter === "inactive") {
    formatted = formatted.filter((emp: Employee) => !emp.status);
  }

  const activeList = formatted
    .filter((f: any) => f.status)
    .map((f: any) => ({ id: f.id, name: f.name }));
  const inactiveList = formatted
    .filter((f: any) => !f.status)
    .map((f: any) => ({ id: f.id, name: f.name }));

  setActiveEmployees(activeList);
  setInactiveEmployees(inactiveList);

  setEmployees(formatted);
  setLoading(false);
};


  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, search, department, designation, workLocation, statusFilter]);

 const admins = employees.filter((e) => e.user_role?.toLowerCase() === "admin");
const staff = employees.filter((e) => e.user_role?.toLowerCase() === "staff");

  return (
    <div className="bg-white rounded-lg shadow-sm max-h-120 overflow-y-auto">
      <table className="min-w-full border-separate border-spacing-y-2 border-spacing-x-0">
        <thead className="bg-white text-left text-xs font-extralight text-gray-600">
          <tr>
            <th className="px-4 py-3">Profile</th>
            <th className="px-4 py-3">Employee Name</th>
            <th className="px-4 py-3">Work Email</th>
            <th className="px-4 py-3">Department</th>
            <th className="px-4 py-3">Employee Status</th>
            <th className="px-4 py-3">View More</th>
          </tr>
        </thead>

       <tbody>
{/* Admin Section FIRST */}
<tr>
  <td
    colSpan={6}
    className="bg-gray-50 cursor-pointer"
    onClick={() => setShowAdmin(!showAdmin)}
  >
    <div className="flex items-center justify-between px-4 py-2 font-medium text-gray-700">
      <div className="flex items-center">
        {showAdmin ? (
          <FaChevronDown className="mr-2" />
        ) : (
          <FaChevronRight className="mr-2" />
        )}
        Admins
      </div>
      {/* Green badge at the end */}
      <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
        {admins.length}
      </span>
    </div>
  </td>
</tr>

  {showAdmin &&
    (loading ? (
      <tr>
        <td colSpan={6} className="text-center py-6 text-gray-500">
          Loading admins...
        </td>
      </tr>
    ) : admins.length > 0 ? (
      admins.map((emp, idx) => (
        <EmployeeRow
          key={emp.id}
          employee={emp}
          index={idx}
          onRefresh={fetchEmployees}
          onOpenModal={() => setSelectedEmployee(emp)}
        />
      ))
    ) : (
      <tr>
        <td colSpan={6} className="text-center py-6 text-gray-500">
          No admins found
        </td>
      </tr>
    ))}

  {/* Staff Section BELOW */}
 <tr>
  <td
    colSpan={6}
    className="bg-gray-50 cursor-pointer"
    onClick={() => setShowStaff(!showStaff)}
  >
    <div className="flex items-center justify-between px-4 py-2 font-medium text-gray-700">
      <div className="flex items-center">
        {showStaff ? (
          <FaChevronDown className="mr-2" />
        ) : (
          <FaChevronRight className="mr-2" />
        )}
        Staff
      </div>
      {/* Green badge at the end */}
      <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
        {staff.length}
      </span>
    </div>
  </td>
</tr>

  {showStaff &&
    (loading ? (
      <tr>
        <td colSpan={6} className="text-center py-6 text-gray-500">
          Loading staff...
        </td>
      </tr>
    ) : staff.length > 0 ? (
      staff.map((emp, idx) => (
        <EmployeeRow
          key={emp.id}
          employee={emp}
          index={idx}
          onRefresh={fetchEmployees}
          onOpenModal={() => setSelectedEmployee(emp)}
        />
      ))
    ) : (
      <tr>
        <td colSpan={6} className="text-center py-6 text-gray-500">
          No staff found
        </td>
      </tr>
    ))}
</tbody>

      </table>

      {selectedEmployee && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          onUpdated={() => {
            fetchEmployees();
            setSelectedEmployee(null);
          }}
        />
      )}
    </div>
  );
};

export default EmployeeTable;
