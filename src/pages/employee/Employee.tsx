import { useState } from "react";
import EmployeeActions from "../../components/adminEmployee/EmployeeActions";
import EmployeeFilters from "../../components/adminEmployee/EmployeeFilters";
import EmployeeTable from "../../components/adminEmployee/EmployeeTable";

const EmployeesPage: React.FC = () => {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [designation, setDesignation] = useState("");

  return (
    <div className="flex h-screen bg-gray-100 ">
      <div className="flex flex-col flex-1 w-full overflow-hidden bg-gray-100">
        <main className="flex-1  p-4">
          <div className="bg-white rounded-xl shadow-sm h-full p-6 overflow-auto">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold">Active Employees</h2>
              <EmployeeActions search={search} setSearch={setSearch} />
            </div>

            <div className="mb-4">
              <EmployeeFilters department={department} setDepartment={setDepartment} designation={designation} setDesignation={setDesignation} />
            </div>

            <div className="overflow-auto">
              <EmployeeTable search={search} department={department} designation={designation} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeesPage;
