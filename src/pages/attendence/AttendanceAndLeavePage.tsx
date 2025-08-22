// AttendanceAndLeavePage.tsx
import React, { useEffect, useState } from 'react';

import AttendanceFilterAndLegend from '../../components/adminAttendanceLeave/AttendanceFilterAndLegend';
import AttendanceTable from '../../components/adminAttendanceLeave/AttendanceTable';
import { supabase } from '../../supabaseClient';


const AttendanceAndLeavePage: React.FC = () => {
 
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // default selected date = today (yyyy-mm-dd)
  const [selectedDate, setSelectedDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);

      // 1) Get current admin session and company
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const adminUserId = session?.user?.id;
      if (!adminUserId) {
        setLoading(false);
        return;
      }

      const { data: adminUserData, error: adminUserErr } = await supabase
        .from('users')
        .select('company_id')
        .eq('id', adminUserId)
        .single();

      if (adminUserErr || !adminUserData?.company_id) {
        console.error('Unable to determine admin company:', adminUserErr);
        setLoading(false);
        return;
      }

      const companyId = adminUserData.company_id;

      // 2) fetch all users of company (id + name) — so we can show even if they have no attendance
      const { data: companyUsers, error: companyUsersError } = await supabase
        .from('users')
        .select('id, name')
        .eq('company_id', companyId);

      if (companyUsersError || !companyUsers) {
        console.error('Error fetching users:', companyUsersError);
        setLoading(false);
        return;
      }

      const userIds = companyUsers.map((u) => u.id);

      // 3) fetch attendance summary entries for selected date for these users
      const { data: attendanceRows, error: attendanceErr } = await supabase
        .from('employee_attendance_summary')
        .select(`
          user_id,
          name,
          attendance_date,
          total_worked_hours,
          expected_hours,
          check_in_latitudes,
          check_in_longitudes,
          check_out_latitudes,
          check_out_longitudes,
          attendance_statuses
        `)
        .in('user_id', userIds)
        .eq('attendance_date', selectedDate);

      if (attendanceErr) {
        console.error('Attendance fetch error:', attendanceErr);
      }

      // 4) fetch attendance_requests for these users that might affect selected date
      // We fetch all requests with start_date <= selectedDate (client-side we filter by end_date >= selectedDate)
      const { data: allRequests, error: reqError } = await supabase
        .from('attendance_requests')
        .select('*')
        .in('user_id', userIds)
        .lte('start_date', selectedDate)
        .order('created_at', { ascending: false });

      if (reqError) {
        console.error('Requests fetch error:', reqError);
      }

      // filter requests that cover selectedDate (end_date >= selectedDate) OR request_type=REGULARIZATION with start_date === selectedDate
      const requestsForDate = (allRequests || []).filter((r: any) => {
        if (!r.start_date) return false;
        const startOk = new Date(r.start_date) <= new Date(selectedDate + 'T23:59:59');
        const endOk = !r.end_date || new Date(r.end_date) >= new Date(selectedDate + 'T00:00:00');
        const coversDate = startOk && endOk;
        // Also include REGULARIZATION whose start_date == selectedDate explicitly
        const isRegularizeExact = r.request_type === 'REGULARIZATION' && r.start_date === selectedDate;
        return coversDate || isRegularizeExact;
      });

      // Build a lookup by user for requests on that date
      const requestsByUser: Record<string, any[]> = {};
      requestsForDate.forEach((r: any) => {
        requestsByUser[r.user_id] = requestsByUser[r.user_id] || [];
        requestsByUser[r.user_id].push(r);
      });

      // Build attendanceData for each company user (show all employees)
      const formatted = companyUsers.map((u: any) => {
        const userAttendance = (attendanceRows || []).find((a: any) => a.user_id === u.id);

        // default values
        let status = 'Absent';
        let check_in_latitudes: number[] = [];
        let check_in_longitudes: number[] = [];
        let check_out_latitudes: number[] = [];
        let check_out_longitudes: number[] = [];
        let total_worked_hours = 0;
        let expected_hours = 0;
        let attendance_statuses: string[] = [];

        if (userAttendance) {
          total_worked_hours = Number(userAttendance.total_worked_hours || 0);
          expected_hours = Number(userAttendance.expected_hours || 0);
          attendance_statuses = userAttendance.attendance_statuses || [];
          check_in_latitudes = userAttendance.check_in_latitudes || [];
          check_in_longitudes = userAttendance.check_in_longitudes || [];
          check_out_latitudes = userAttendance.check_out_latitudes || [];
          check_out_longitudes = userAttendance.check_out_longitudes || [];

          // default mapping if summary provides statuses
          if (attendance_statuses.length > 0) {
            status = attendance_statuses[0];
          } else {
            status = total_worked_hours > 0 ? 'Checked In' : 'Absent';
          }
        }

        // check requests for this user on this date
        const reqs = requestsByUser[u.id] || [];

        // priority: Approved LEAVE/WFH override everything -> "Approved Off"
        const approvedLeave = reqs.find((r: any) => (r.request_type === 'LEAVE' || r.request_type === 'WFH') && r.status === 'APPROVED');
        if (approvedLeave) {
          status = 'Approved Off'; // or show 'WFH' if you prefer: status = 'WFH'
        } else {
          // check regularization requests specifically for this date
          const regReq = reqs.find((r: any) => r.request_type === 'REGULARIZATION' && (r.start_date === selectedDate || (!r.start_date && r.requested_check_in && new Date(r.requested_check_in).toISOString().startsWith(selectedDate))));

          if (regReq) {
            // if regularization exists, show its status label
            if (regReq.status === 'REJECTED') {
              status = 'Rejected';
            } else if (regReq.status === 'APPROVED') {
              status = 'Regularized'; // or 'Checked In' depending on how you want to show it
            } else {
              // pending
              status = 'Regularize';
            }
          } else {
            // no special request - keep derived status above
            // also if employee has partial hours (total_worked_hours < expected_hours) we can mark Regularize
            if (total_worked_hours < expected_hours && expected_hours > 0) {
              status = 'Regularize';
            }
          }
        }

        return {
          user_id: u.id,
          name: u.name || 'Unknown',
          attendance_date: selectedDate,
          total_worked_hours,
          expected_hours,
          check_in_latitudes,
          check_in_longitudes,
          check_out_latitudes,
          check_out_longitudes,
          attendance_statuses: [status], // AttendanceTable expects array
        };
      });

      setAttendanceData(formatted);
      setLoading(false);
    };

    fetchAttendance();
  }, [selectedDate]);

  return (
    <div className="flex">
      {/* <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}

      <div className="flex-1">
        {/* <Header /> */}

        <div className="p-6">
          <AttendanceFilterAndLegend selectedDate={selectedDate} onDateChange={setSelectedDate} />
          {loading ? (
            <div className="text-center mt-10 text-gray-500">Loading attendance...</div>
          ) : (
            <AttendanceTable attendanceData={attendanceData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceAndLeavePage;
