import { useEffect, useState } from "react";
import { MdApartment } from "react-icons/md";
import { supabase } from "../../supabaseClient";
import { useUser } from "../../context/UserContext";

interface Department {
  id: string;
  department_name: string;
}

const EmployeeFilters = ({
  department,
  setDepartment,
}: {
  department: string;
  setDepartment: (val: string) => void;
}) => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const { userData } = useUser(); // ✅ has company_id

  useEffect(() => {
    const fetchDepartments = async () => {
      if (!userData?.company_id) return;

      const { data, error } = await supabase
        .from("departments")
        .select("id, department_name")
        .eq("company_id", userData.company_id);

      if (error) {
        console.error("Error fetching departments:", error.message);
        return;
      }
      setDepartments(data || []);
    };

    fetchDepartments();
  }, [userData]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="flex items-center bg-blue-100 px-3 py-2 rounded shadow w-full">
        <MdApartment className="text-blue-600 text-lg mr-2" />
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="bg-transparent outline-none w-full text-sm font-medium"
        >
          <option value="">All Departments</option>
          {departments.map((dep) => (
            <option key={dep.id} value={dep.department_name}>
              {dep.department_name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default EmployeeFilters;
