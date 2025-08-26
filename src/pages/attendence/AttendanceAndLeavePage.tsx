import React, { useEffect, useState } from 'react';
import AttendanceFilterAndLegend from '../../components/adminAttendanceLeave/AttendanceFilterAndLegend';
import AttendanceTable from '../../components/adminAttendanceLeave/AttendanceTable';
import { supabase } from '../../supabaseClient';

const AttendanceAndLeavePage: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedDept, setSelectedDept] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);
      try {
        // 1️⃣ Get admin session & company
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const adminUserId = session?.user?.id;
        if (!adminUserId) return setLoading(false);

        const { data: adminUserData, error: adminErr } = await supabase
          .from("users")
          .select("company_id")
          .eq("id", adminUserId)
          .single();
        if (adminErr || !adminUserData?.company_id) return setLoading(false);

        const companyId = adminUserData.company_id;

        // 2️⃣ Fetch all employees
        const { data: employees, error: empErr } = await supabase
          .from("users")
          .select("id, name, department_id, departments(department_name)")
          .eq("company_id", companyId);

        if (empErr || !employees) throw empErr;

        console.log("Selected Date:", selectedDate);
        

        // 3️⃣ Fetch attendance for selected date
        const { data: attendance, error: attErr } = await supabase
          .from("employee_attendance_with_requests")
          .select(
            "user_id, employee_name, department_id, department_name, attendance_date, total_worked_hours, expected_hours, check_in_latitudes, check_in_longitudes, check_out_latitudes, check_out_longitudes, attendance_statuses"
          )
          .eq("company_id", companyId)
          .eq("attendance_date", selectedDate);

        if (attErr) throw attErr;

        const normalizeDate = (d: string) => d.split("T")[0]; // keep only YYYY-MM-DD

        const mergedData = employees.map((emp) => {
          const record = attendance?.find(
            (a) =>
              a.user_id === emp.id &&
              normalizeDate(a.attendance_date) === selectedDate
          );

          if (record) {
            return record; // ✅ has attendance
          }

          // ❌ Absent fallback
          return {
            user_id: emp.id,
            employee_name: emp.name,
            department_id: emp.department_id,
            department_name: emp.departments?.department_name ?? "-",
            attendance_date: selectedDate,
            total_worked_hours: 0,
            expected_hours: 8,
            check_in_latitudes: null,
            check_in_longitudes: null,
            check_out_latitudes: null,
            check_out_longitudes: null,
            attendance_statuses: ["Absent"],
          };
          console.log("Absent record created:", emp.name);

        });


        // 5️⃣ Apply client-side filtering
        const filtered = mergedData.filter((row) => {
          const deptMatch = selectedDept ? row.department_id === selectedDept : true;
          const searchMatch = searchQuery
            ? row.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
            : true;
          return deptMatch && searchMatch;
        });

        setAttendanceData(filtered);
      } catch (err: any) {
        console.error("Error fetching attendance:", err.message);
        setAttendanceData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedDate, selectedDept, searchQuery]);


  return (
    <div className="flex">
      <div className="flex-1">
        <div className="p-6">
          <AttendanceFilterAndLegend
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onDepartmentChange={setSelectedDept}
            onSearchChange={setSearchQuery}
          />
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
