import { useEffect, useState } from "react";
import { useUser } from "../../context/UserContext";
import EmployeeRow from "./EmployeeRow";
import { supabase } from "../../supabaseClient";

interface Employee {
  id: string;
  name: string;
  email: string;
  number: string;
  status?: boolean;
  department_id?: string;
  department_name?: string;
}

const EmployeeTable = ({ search, department }: { search: string; department: string }) => {
  const [data, setData] = useState<Employee[]>([]);
  const { userData } = useUser(); // contains company_id

  const fetchEmployees = async () => {
    if (!userData?.company_id || !userData?.id) return;

    const { data, error } = await supabase
      .from("user_with_email")
      .select("auth_id, email, name, number, company_id, is_active, department_id, department_name")
      .eq("company_id", userData.company_id)
      .neq("auth_id", userData.id);

    if (error) {
      console.error("Error fetching employees:", error.message);
      return;
    }

    const formatted = data.map((emp: any) => ({
      id: emp.auth_id,
      name: emp.name,
      email: emp.email,
      number: emp.number,
      status: emp.is_active,
      department_id: emp.department_id,
      department_name: emp.department_name,
    }));

    setData(formatted);
  };

  useEffect(() => {
    fetchEmployees();
  }, [userData]);

  // ✅ Apply search + department filter
  const filtered = data.filter((emp) => {
    const matchesSearch =
      emp.name?.toLowerCase().includes(search.toLowerCase()) ||
      emp.email?.toLowerCase().includes(search.toLowerCase());

    const matchesDept =
      department === "" || emp.department_name === department;

    return matchesSearch && matchesDept;
  });

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
      <table className="min-w-full text-sm mt-4">
        <thead className="bg-gray-50 text-gray-500 font-medium">
          <tr>
            <th className="px-4 py-2 text-left">Employee ID</th>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Work Email</th>
            <th className="px-4 py-2 text-left">Mobile</th>
            <th className="px-4 py-2 text-left">Department</th>
            <th className="px-4 py-2 text-left">Status</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((emp) => (
            <EmployeeRow
              key={emp.id}
              employee={emp}
              onRefresh={fetchEmployees}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmployeeTable;
