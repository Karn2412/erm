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
}

const EmployeeTable: React.FC<{ search: string; department: string; designation: string }> = ({ search, department, designation }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const { userData } = useUser();

 const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const fetchEmployees = async () => {
    if (!userData?.company_id || !userData?.id) return;
    setLoading(true);

    let query = supabase
      .from("user_with_email")
      .select("auth_id, email, name, number, is_active, department_id, department_name, designation_id, company_id")
      .eq("company_id", userData.company_id)
      .neq("auth_id", userData.id);

    // ✅ Filter by department
    if (department) {
      query = query.eq("department_name", department);
    }

    // ✅ Apply search filter (case-insensitive, checks name/email/number)
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,number.ilike.%${search}%`
      );
    }
    // ✅ Filter by designation
    if (designation) {
      query = query.eq("designation_id", designation); // 🔑 filter by designation id
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
      status: emp.is_active,
    }));

    setEmployees(formatted);
    setLoading(false);
  };

  useEffect(() => {
    fetchEmployees();
  }, [userData, search, department,designation]); // ✅ refetch when filters change

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
         {/* ✅ Modal at parent level */}
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
