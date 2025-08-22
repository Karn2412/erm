import React from 'react';

import EmployeeActions from '../../components/adminEmployee/EmployeeActions';
import EmployeeFilters from '../../components/adminEmployee/EmployeeFilters';
import EmployeeTable from '../../components/adminEmployee/EmployeeTable';

const EmployeesPage: React.FC = () => {
  // const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      {/* <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}

      {/* Main Content */}
      <div className="flex flex-col flex-1 w-full overflow-hidden bg-gray-100">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden flex justify-between items-center bg-white p-4 border-b border-gray-200">
          {/* <button onClick={() => setSidebarOpen(true)} className="text-gray-700 text-xl">
            <FaBars />
          </button> */}
          <h2 className="text-lg font-semibold">Employees</h2>
        </div>

        {/* Header */}
        {/* <Header /> */}

        {/* Main Area */}
        <main className="flex-1 overflow-hidden p-4">
          <div className="bg-white rounded-xl shadow-sm h-full p-6 overflow-auto">
            {/* Section Title + Actions */}
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 gap-4">
              <h2 className="text-xl font-semibold">Active Employees</h2>
              <EmployeeActions />
            </div>

            {/* Filters */}
            <div className="mb-4">
              <EmployeeFilters />
            </div>

            {/* Table */}
            <div className="overflow-auto">
              <EmployeeTable />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default EmployeesPage;
