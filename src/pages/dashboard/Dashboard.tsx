import React, { useState } from 'react';

import OverviewCard from '../../components/adminDashboard/OverviewCard';
import LineChartComponent from '../../components/adminDashboard/LineChartComponent';
import PieChartComponent from '../../components/adminDashboard/PieChartComponent';
import BarChartComponent from '../../components/adminDashboard/BarChartComponent';



const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100" >
      {/* Sidebar */}
      {/* <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        {/* <Header /> */}

        {/* Dashboard Content */}
        <main className="p-4 overflow-auto space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <OverviewCard title="Total Employees" value="4,820" change="+5%" color="bg-blue-100" />
            <OverviewCard title="New Joinees" value="482" change="+10%" color="bg-blue-100" />
            <OverviewCard title="Exits" value="32" change="-0.66%" color="bg-red-100" />
            <OverviewCard title="Attrition   Rate" value="0.664%" change="-0.66%" color="bg-pink-100" />
          </div>

          {/* Payroll History */}
          <div className="bg-gray-100 p-4 rounded shadow-sm">
            <h2 className="text-lg font-semibold mb-2">Payroll History</h2>
            <LineChartComponent />
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-100 p-4 rounded shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Gender Distribution</h2>
              <PieChartComponent />
            </div>
            <div className="bg-white p-4 rounded shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Age Distribution</h2>
              <BarChartComponent />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
