import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
 // 👈 new layout

import Dashboard from "./pages/dashboard/Dashboard";
import EmployeesPage from "./pages/employee/Employee";
import AddEmployeePage from "./pages/employee/AddEmployeePage";
import AttendanceAndLeavePage from "./pages/attendence/AttendanceAndLeavePage";
import EmployeeAttendanceDetailPage from "./components/adminAttendanceLeave/EmployeeAttendanceDetailPage";

import ReimbursementsPage from "./pages/reimbursements/ReimbursementsPage";
import SubmissionDetailsPage from "./pages/reimbursements/SubmissionDetailsPage";
import TemplatesPage from "./pages/templates/TemplatesPage";
import SettingsDepartmentsPage from "./pages/settings/SettingsDepartmentsPage";
import StaffDashboard from "./staff-module/pages/dashboard/StaffDashboard";
import PersonalDetailsPage from "./staff-module/pages/PersonalDetails/PersonalDetails";
import EmployeeAttendancePage from "./staff-module/pages/Attendance and leave page/Employeeattendence";
import PayRunsPage from "./staff-module/pages/payslip/PayRunsPageStaff";
import ReimbursementPage from "./staff-module/pages/reimbursments/StaffReimbursementPage";
import PayRunsPageAdmin from "./pages/payRuns/PayRunsPageAdmin";
import LoginPage from "./pages/login/Login";
import ProtectedRoute from "./ProtectedRoute";
import Layout from "./Layout";

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              {/* Admin routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
              <Route path="/employees/add" element={<ProtectedRoute><AddEmployeePage /></ProtectedRoute>} />
              <Route path="/attendance" element={<ProtectedRoute><AttendanceAndLeavePage /></ProtectedRoute>} />
              <Route path="/attendance-detail/:userId" element={<ProtectedRoute><EmployeeAttendanceDetailPage /></ProtectedRoute>} />
              <Route path="/payruns" element={<ProtectedRoute><PayRunsPageAdmin /></ProtectedRoute>} />
              <Route path="/reimbursements" element={<ProtectedRoute><ReimbursementsPage /></ProtectedRoute>} />
              <Route path="/reimbursements/:employeeId" element={<ProtectedRoute><SubmissionDetailsPage /></ProtectedRoute>} />
              <Route path="/templates" element={<ProtectedRoute><TemplatesPage /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsDepartmentsPage /></ProtectedRoute>} />

              {/* Staff routes */}
              <Route path="/staff/dashboard" element={<StaffDashboard />} />
              <Route path="/staff/personal-details" element={<PersonalDetailsPage />} />
              <Route path="/staff/attendance" element={<EmployeeAttendancePage />} />
              <Route path="/staff/pay-slips" element={<PayRunsPage />} />
              <Route path="/staff/reimbursements" element={<ReimbursementPage />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  );
};

export default App;
