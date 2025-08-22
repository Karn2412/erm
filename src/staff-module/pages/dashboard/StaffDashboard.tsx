


import TimeTrackerCard from '../../components/dashboard/Timetrackercard';
import ReimbursementRequestCard from '../../components/dashboard/ReimbursementRequestCard';
import AttendanceChartCard from '../../components/dashboard/AttendanceChartCard';
import WorkRequestCard from '../../components/dashboard/WorkRequestCard';




const StaffDashboard = () => {
  

  return (
    <div className="flex">
      {/* <StaffSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}
      
        {/* <Header /> */}
        <div className="p-6  bg-blue-50">
          

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <TimeTrackerCard />
            <ReimbursementRequestCard 
           />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <AttendanceChartCard  />
            <WorkRequestCard />
          </div>

          {/* <PersonalDetailsCard /> */}
        </div>
      </div>
    
  );
};
export default StaffDashboard;





