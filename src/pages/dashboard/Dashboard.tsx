

import OverviewCard from '../../components/adminDashboard/OverviewCard';
import LineChartComponent from '../../components/adminDashboard/LineChartComponent';
import PieChartComponent from '../../components/adminDashboard/PieChartComponent';
import BarChartComponent from '../../components/adminDashboard/BarChartComponent';



const Dashboard = () => {
 

  return (
    <div className="flex h-screen " >
      {/* Sidebar */}
      {/* <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}

      {/* Main Content */}
      <div className="flex flex-col flex-1 ">
        {/* Header */}
        {/* <Header /> */}

        {/* Dashboard Content */}
        <main className="p-4  space-y-6" style={{ backgroundColor: 'rgb(255, 255, 255)' }}>
          {/* Overview Cards */}
          <h2 className="font-semibold mb-2">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white">
            
            <OverviewCard title="Total Employees" color="bg-indigo-50" queryKey="totalEmployees" />
<OverviewCard title="New Joinees" color="bg-blue-50" queryKey="newJoinees" />
<OverviewCard title="Exists" color="bg-red-100" queryKey="exists" />
<OverviewCard title="Attrition Rate" color="bg-pink-100"  queryKey="attritionRate"  />

          </div>

          {/* Payroll History */}
          <div className="bg-gray-100 p-4 rounded-2xl shadow-sm">
            <h2 className="font-semibold  mb-2">Payroll History</h2>
            <LineChartComponent />
          </div>

          {/* Distribution Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-100 p-4 rounded shadow-sm">
              <h2 className=" font-semibold mb-2">Gender Distribution</h2>
              <PieChartComponent />
            </div>
            <div className="bg-gray-100 p-4 rounded shadow-sm">
              <h2 className=" font-semibold mb-2">Age Distribution</h2>
              <BarChartComponent />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
