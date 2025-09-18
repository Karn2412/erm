import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { startOfWeek, endOfWeek, endOfMonth, format } from "date-fns";
import { supabase } from "../../supabaseClient";
import { FaMapMarkerAlt } from "react-icons/fa";

import EmployeeAttendanceHeader from "./EmployeeAttendanceHeader";

interface AttendanceRecord {
  day: string;
  date: string;
  hoursWorked: string;
  expectedHours: string;
  status: string;
  checkInLocation: { lat: number; long: number; time?: string } | null;
  checkOutLocation: { lat: number; long: number; time?: string } | null;
  requestType?: string;
  requestStatus?: string;
  isFuture?: boolean;
}

const EmployeeAttendanceDetailPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const today = new Date();

  const [selectedMonth] = useState(today.getMonth());
  const [selectedYear] = useState(today.getFullYear());
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">("weekly");
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [employee, setEmployee] = useState<{
    name: string;
    department: string;
    designation: string;
  } | null>(null);

  const getColorBorder = (status: string) => {
    switch (status) {
      case "Checked In":
        return "border-green-500";
      case "Absent":
        return "border-red-500";
      case "Regularized":
        return "border-orange-400";
      case "Work From Home":
        return "border-purple-500";
      case "Approved Leave":
        return "border-teal-500";
      case "Approved Off":
        return "border-blue-500";
      case "Incomplete":
        return "border-gray-300";
      case "Checked Out":
        return "border-purple-500";
      case "Pending Request":
        return "border-yellow-400";
      default:
        return "border-gray-300";
    }
  };

  const getColorBg = (status: string) => {
    switch (status) {
      case "Checked In":
        return "bg-green-500";
      case "Absent":
        return "bg-red-500";
      case "Regularized":
        return "bg-orange-400";
      case "Work From Home":
        return "bg-purple-500";
      case "Approved Leave":
        return "bg-teal-500";
      case "Approved Off":
        return "bg-blue-500";
      case "Incomplete":
        return "bg-gray-300";
      case "Checked Out":
        return "bg-purple-500";
      case "Pending Request":
        return "bg-yellow-400";
      default:
        return "bg-gray-300";
    }
  };

  useEffect(() => {
    if (!userId) return;

    const fetchEmployee = async () => {
      const { data, error } = await supabase
        .from("users")
        .select(
          `
          name,
          departments ( department_name ),
          designations ( designation )
        `
        )
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching employee:", error);
      } else if (data) {
        setEmployee({
          name: data.name,
          department: (data.departments as any)?.department_name || "",
          designation: (data.designations as any)?.designation || "",
        });
      }
    };

    fetchEmployee();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    const fetchAttendance = async () => {
      const startDate = format(
        new Date(selectedYear, selectedMonth, 1),
        "yyyy-MM-dd"
      );
      const endDate = format(
        endOfMonth(new Date(selectedYear, selectedMonth)),
        "yyyy-MM-dd"
      );

      const { data, error } = await supabase
        .from("employee_attendance_summary")
        .select("*")
        .eq("user_id", userId)
        .gte("attendance_date", startDate)
        .lte("attendance_date", endDate)
        .order("attendance_date", { ascending: true });

      if (error) {
        console.error("Error fetching attendance:", error);
        setAttendanceData([]);
        return;
      }

      const transformed: AttendanceRecord[] = [];
      const daysInMonth = new Date(
        selectedYear,
        selectedMonth + 1,
        0
      ).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(selectedYear, selectedMonth, day);
        const formattedDate = format(dateObj, "yyyy-MM-dd");
        const weekday = dateObj.toLocaleDateString("en-US", { weekday: "long" });
        const dbEntry = data?.find((entry) => entry.attendance_date === formattedDate);
        console.log("Processing date:", formattedDate, "DB Entry:", dbEntry);

        const isFuture = dateObj > today;

        console.log("Is future date:", formattedDate, isFuture);


        if (dbEntry) {
          const checkInLat = dbEntry.check_in_latitudes?.[0] ?? null;
          const checkInLong = dbEntry.check_in_longitudes?.[0] ?? null;
          const checkOutLat = dbEntry.check_out_latitudes?.[0] ?? null;
          const checkOutLong = dbEntry.check_out_longitudes?.[0] ?? null;

          const checkInTime = dbEntry.first_check_in_time
            ? new Date(dbEntry.first_check_in_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
            : null;

          const checkOutTime = dbEntry.last_check_out_time
            ? new Date(dbEntry.last_check_out_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
            : null;

          // ✅ Trust backend
          let status: string;

if (dbEntry?.request_type && dbEntry?.request_status === "PENDING") {
  // ✅ Pending request explicitly
  status = "Pending Request";
} else if (
  Array.isArray(dbEntry?.attendance_statuses) &&
  dbEntry.attendance_statuses.length > 0
) {
  status = dbEntry.attendance_statuses[0];

  if (status === "Incomplete" && dateObj < today) {
    status = "Absent"; // Past Incomplete → Absent
  }
} else {
  status = isFuture ? "Incomplete" : "Absent";
}



          transformed.push({
            day: weekday,
            date: dbEntry.attendance_date,
            hoursWorked: dbEntry.total_worked_hours?.toFixed(2) ?? "0.00",
            expectedHours: dbEntry.expected_hours?.toFixed(2) ?? "0.00",
            status,
            checkInLocation:
              checkInLat && checkInLong
                ? { lat: checkInLat, long: checkInLong, time: checkInTime || "" }
                : null,
            checkOutLocation:
              checkOutLat && checkOutLong
                ? { lat: checkOutLat, long: checkOutLong, time: checkOutTime || "" }
                : null,
            requestType: dbEntry.request_type,
            requestStatus: dbEntry.request_status,
            isFuture,
          });
        } else {
          // ✅ No DB entry at all
          const status = isFuture ? "Incomplete" : "Absent"; // Explicitly set status based on whether the day is in the future

          transformed.push({
            day: weekday,
            date: formattedDate,
            hoursWorked: "0.00",
            expectedHours: "0.00",
            status,
            checkInLocation: null,
            checkOutLocation: null,
            isFuture,
          });
        }
      }




      setAttendanceData(transformed);
    };

    fetchAttendance();
  }, [userId, selectedMonth, selectedYear]);

  const getCurrentWeekDates = () => {
    const start = startOfWeek(today, { weekStartsOn: 1 });
    const end = endOfWeek(today, { weekStartsOn: 1 });
    return attendanceData.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= start && itemDate <= end;
    });
  };

  return (
    <div className="p-6 backdrop-blur-md bg-white/50 rounded-xl shadow-inner">
      <div className="bg-gray-100 rounded-2xl p-3">
        <EmployeeAttendanceHeader
          viewMode={viewMode}
          setViewMode={setViewMode}
          employeeName={employee?.name || ""}
          department={employee?.department || ""}
          showRequestsButton={true}
          userId={userId ?? ""}
          designation={employee?.designation || ""}
        />

        <div
          className="overflow-y-scroll overflow-x-auto p-2"
          style={{ height: "500px", scrollbarGutter: "stable" }}
        >
          {viewMode === "weekly" ? (
            <table className="min-w-full text-sm border-separate border-spacing-y-2">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="py-2 px-3 text-left rounded-lg">Day</th>
                  <th className="py-2 px-3 text-left rounded-lg">Date</th>
                  <th className="py-2 px-3 text-left rounded-lg">Check In</th>
                  <th className="py-2 px-3 text-left rounded-lg">Progress</th>
                  <th className="py-2 px-3 text-left rounded-lg">Check Out</th>
                  <th className="py-2 px-3 text-left rounded-lg">Hours</th>
                  <th className="py-2 px-3 text-left rounded-lg">Status</th>
                </tr>
              </thead>
              <tbody>
                {getCurrentWeekDates().map((item, index) => (
                  <tr
                    key={index}
                    className={`shadow-sm rounded-lg ${index % 2 === 0 ? "bg-blue-50" : "bg-indigo-50"
                      } hover:bg-blue-100`}
                  >
                    <td className="py-2 px-3 rounded-l-lg">{item.day}</td>
                    <td className="py-2 px-3">{item.date}</td>
                    <td className="py-2 px-3 text-blue-600 hover:text-blue-800">
                      {item.checkInLocation ? (
                        <a
                          href={`https://www.google.com/maps?q=${item.checkInLocation.lat},${item.checkInLocation.long}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <FaMapMarkerAlt className="text-red-500" />{" "}
                          {item.checkInLocation.time || "View"}
                        </a>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center space-x-1">
                        <div
                          className={`w-3 h-3 rounded-full ${getColorBg(
                            item.status
                          )}`}
                        ></div>
                        <span className="text-xs text-gray-600">
                          {item.hoursWorked} / {item.expectedHours}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-blue-600 hover:text-blue-800">
                      {item.checkOutLocation ? (
                        <a
                          href={`https://www.google.com/maps?q=${item.checkOutLocation.lat},${item.checkOutLocation.long}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <FaMapMarkerAlt className="text-green-500" />{" "}
                          {item.checkOutLocation.time || "View"}
                        </a>
                      ) : (
                        "--"
                      )}
                    </td>
                    <td className="py-2 px-3">{item.hoursWorked}</td>
                    <td className="py-2 px-3 rounded-r-lg">
                      {item.status}
                      {/* {item.requestType && item.requestStatus === "APPROVED" && (
                        // <span className="ml-2 px-2 py-1 rounded bg-green-200 text-green-700 text-xs font-semibold">
                        //   {item.requestType}
                        // </span>
                      )} */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 bg-gray-50 rounded-2xl">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-500 mb-4">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-3">
                {(() => {
                  const firstDay = new Date(selectedYear, selectedMonth, 1);
                  const daysInMonth = new Date(
                    selectedYear,
                    selectedMonth + 1,
                    0
                  ).getDate();
                  const firstDayIndex = (firstDay.getDay() + 6) % 7; // Monday start

                  const calendarDays = [];
                  for (let i = 0; i < firstDayIndex; i++) {
                    calendarDays.push(<div key={`empty-${i}`} />);
                  }

                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(selectedYear, selectedMonth, day);
                    const formatted = format(date, "yyyy-MM-dd");
                    const found = attendanceData.find((d) => d.date === formatted);

                    let status = found?.status || "Incomplete";
if (found?.requestType && found?.requestStatus === "PENDING") {
  status = "Pending Request";
}


                    calendarDays.push(
                      <div
                        key={formatted}
                        className={`relative rounded-xl border ${getColorBorder(
                          status
                        )} shadow-sm hover:shadow-md flex flex-col justify-between h-28 bg-white`}
                      >
                        {/* Top row with date + geolocation */}
                        <div className="flex justify-between px-2 pt-2 text-sm font-medium text-gray-800">
                          <span>{day}</span>
                          <div className="flex gap-1">
                            {found?.checkInLocation && (
                              <span className="flex items-center gap-1 text-xs text-gray-600">
                                <FaMapMarkerAlt className="text-red-500" />
                                {found.checkInLocation.time}
                              </span>
                            )}
                            {found?.checkOutLocation && (
                              <span className="flex items-center gap-1 text-xs text-gray-600">
                                <FaMapMarkerAlt className="text-green-500" />
                                {found.checkOutLocation.time}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Status footer */}
                        <div
                          className={`text-[13px] rounded-b-xl font-semibold text-white text-center py-1 ${getColorBg(
                            status
                          )}`}
                        >
                          {status}
                        </div>
                      </div>
                    );
                  }

                  return calendarDays;
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendanceDetailPage;
