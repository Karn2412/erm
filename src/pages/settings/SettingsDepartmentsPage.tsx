import React from 'react';

import SettingsSidebar from '../../components/settings/SettingsSidebar';
import DepartmentsTable from '../../components/settings/DepartmentsTable';

const SettingsDepartmentsPage: React.FC = () => {
  // const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex">
      {/* Main Sidebar */}
      {/* <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}

      <div className="flex-1">
        {/* Top Header */}
        {/* <Header /> */}

        {/* Main Settings Page */}
        <div className="flex p-6 space-x-4">
          {/* Left Settings Sidebar Section */}
          <div className="w-1/4">
            {/* Settings Title */}
            <h2 className="text-lg font-bold ms-4 mt-1">Settings</h2>

            {/* Left Sidebar Menu */}
            <SettingsSidebar />
          </div>

          {/* Right Content Section */}
          <div className="w-3/4">
           

            {/* Table */}
            <DepartmentsTable />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDepartmentsPage;
