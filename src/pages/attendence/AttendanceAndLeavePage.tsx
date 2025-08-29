import React, { useEffect, useState } from "react";
import AttendanceFilterAndLegend from "../../components/adminAttendanceLeave/AttendanceFilterAndLegend";
import AttendanceTable from "../../components/adminAttendanceLeave/AttendanceTable";
import { supabase } from "../../supabaseClient";

const AttendanceAndLeavePage: React.FC = () => {
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedDesignation, setSelectedDesignation] = useState<string>("");
  console.log(setSelectedDesignation);

// 🔄 Load attendance from view
const loadAttendance = async () => {
  setLoading(true);
  try {
    // Get admin company_id
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const adminUserId = session?.user?.id;
    if (!adminUserId) {
      setAttendanceData([]);
      setLoading(false);
      return;
    }

    const { data: adminData } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", adminUserId)
      .single();

    const companyId = adminData?.company_id;
    if (!companyId) {
      setAttendanceData([]);
      setLoading(false);
      return;
    }

    // Fetch attendance
    const { data, error } = await supabase
      .from("employee_attendance_with_requests")
      .select("*")
      .eq("company_id", companyId)
      .eq("attendance_date", selectedDate);

    if (error) throw error;

    // Apply client-side filters
    const filtered = data.filter((row: any) => {
      const deptMatch = selectedDept ? row.department_id === selectedDept : true;
      const desigMatch = selectedDesignation
        ? row.designation_id === selectedDesignation
        : true;
      const searchMatch = searchQuery
        ? row.employee_name.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return deptMatch && desigMatch && searchMatch;
    });

    setAttendanceData(filtered);
  } catch (err: any) {
    console.error("Error loading attendance:", err.message);
    setAttendanceData([]);
  } finally {
    setLoading(false);
  }
};

// reload on any filter
useEffect(() => {
  loadAttendance();
}, [selectedDate, selectedDept, selectedDesignation, searchQuery]);


  // 🔄 Load attendance from view
  ;

  // 🔄 Reload on date / department / search change
  useEffect(() => {
    loadAttendance();
  }, [selectedDate, selectedDept, searchQuery]);

  return (
    <div className="flex">
      <div className="flex-1 bg-white rounded-2xl">
        <div className="p-6">
          <AttendanceFilterAndLegend
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onDepartmentChange={setSelectedDept}
            onSearchChange={setSearchQuery}
             onDesignationChange={setSelectedDesignation} // ✅
          />
          {loading ? (
            <div className="text-center mt-10 text-gray-500">
              Loading attendance...
            </div>
          ) : (
            <AttendanceTable attendanceData={attendanceData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceAndLeavePage;
