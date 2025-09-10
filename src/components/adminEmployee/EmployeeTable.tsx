import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { useUser } from "../../context/UserContext";
import EmployeeRow from "./EmployeeRow";
import EmployeeModal from "./addemployee/employeemodal/EmployeeModal";

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
}

const EmployeeTable: React.FC<{
  search: string;
  department: string;
  designation: string;
  workLocation: string;
  setActiveEmployees: (emps: Employee[]) => void;
  setInactiveEmployees: (emps: Employee[]) => void;
}> = ({ search, department, designation, workLocation, setActiveEmployees, setInactiveEmployees }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const { userData } = useUser();

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    if (selectedEmployee) {
      console.log("Selected Employee:", selectedEmployee);
    }
  }, [selectedEmployee]);

  const fetchEmployees = async () => {
    if (!userData?.company_id || !userData?.id) return;
    setLoading(true);

    let query: any = supabase
      .from("user_with_email")
      .select("auth_id, email, name, number, is_active, department_id, department_name, designation_id, company_id, gender, gender_avatar, location_id, work_location")
      .eq("company_id", userData.company_id)
      .neq("auth_id", userData.id);

    // Filter by department
    if (department) {
      query = query.eq("department_id", department);
    }

    // Search filter
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,number.ilike.%${search}%`
      );
    }

    // Filter by designation
    if (designation) {
      query = query.eq("designation_id", designation);
    }

    // Filter by work location
    if (workLocation) {
      query = query.eq("location_id", workLocation);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching employees:", error.message);
      setLoading(false);
      return;
    }

    const formatted = (data || []).map((emp: any) => ({
      id: emp.auth_id,
      name: emp.name,
      email: emp.email,
      number: emp.number,
      department_name: emp.department_name,
      company_id: emp.company_id,
      status: emp.is_active,
      avatar: emp.gender_avatar || "https://dummyimage.com/100x100/cccccc/000000&text=User",
      designation_id: emp.designation_id,
      location_id: emp.location_id,
      work_location: emp.work_location,
    }));

    // produce active/inactive lists for More Filters
    const activeList = formatted.filter((f: any) => f.status).map((f: any) => ({ id: f.id, name: f.name }));
    const inactiveList = formatted.filter((f: any) => !f.status).map((f: any) => ({ id: f.id, name: f.name }));

    // send these up to parent so filters can show them
    setActiveEmployees(activeList);
    setInactiveEmployees(inactiveList);

    // Sort active first, inactive last
    formatted.sort((a: Employee, b: Employee) => (a.status === b.status ? 0 : a.status ? -1 : 1));

    setEmployees(formatted);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData, search, department, designation, workLocation]);

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
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-6 text-gray-500">
                Loading employees...
              </td>
            </tr>
          ) : employees.length > 0 ? (
            employees.map((emp, idx) => (
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
                No employees found
              </td>
            </tr>
          )}
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
