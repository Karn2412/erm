// Employeeattendence.tsx
import { useEffect, useState } from 'react'

import WorkRequestCard from '../../components/dashboard/WorkRequestCard'
import TimeTrackerCard from '../../components/dashboard/Timetrackercard'

import AttendanceWeeklyTable from '../../components/Attendence and leave/AttendanceWeeklyTable'
import { supabase } from '../../../supabaseClient'
import { useUser } from '../../../context/UserContext'
import { format, } from 'date-fns'
import { FaMapMarkerAlt } from 'react-icons/fa'
import type { AttendanceRecord } from '../../../types/attendance'





interface AttendanceRequest {
  id: string;
  request_type: 'REGULARIZATION' | 'LEAVE' | 'WFH';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  start_date: string | null;
  end_date?: string | null;
  created_at: string;
}

const EmployeeAttendancePage = () => {
  const { userData } = useUser();
  const userId = userData?.id;

  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly')
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [requests, setRequests] = useState<AttendanceRequest[]>([])
  const [reqLoading, setReqLoading] = useState(true)

  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState<number>(today.getMonth())
  const [selectedYear, setSelectedYear] = useState<number>(today.getFullYear())
  const [regularizeDate, setRegularizeDate] = useState<string | null>(null);
  const [leaveDate, setLeaveDate] = useState<string | null>(null);  // IGNORE
  const [wfhDate, setWFHDate] = useState<string | null>(null);  // IGNORE
  const [approvedOffDate, setApprovedOffDate] = useState<string | null>(null);

  // IGNORE

  console.log(setSelectedMonth, setSelectedYear, regularizeDate, leaveDate, wfhDate, approvedOffDate);



  //
  const getColorBorder = (status: string) => {
    switch (status) {
      case 'Checked In': return 'border-green-500';
      case 'Checked Out': return 'border-purple-500';
      case 'Absent': return 'border-red-500';
      case 'Regularize': return 'border-orange-300';
      case 'Regularized': return 'border-orange-300';
      case 'Weekly Off': return 'border-blue-500';
      case 'Approved Leave': return 'border-indigo-500';
      case 'Work From Home': return 'border-purple-500';
      case 'Request Sent': return 'border-yellow-400';
      default: return 'border-gray-300';
    }
  };

  const getColorBg = (status: string) => {
    switch (status) {
      case 'Checked In': return 'bg-green-500';
      case 'Checked Out': return 'bg-purple-500';
      case 'Absent': return 'bg-red-500';
      case 'Regularize': return 'bg-orange-400';
      case 'Regularized': return 'bg-orange-400';
      case 'Weekly Off': return 'bg-blue-500';
      case 'Approved Leave': return 'bg-indigo-500';
      case 'Work From Home': return 'bg-purple-500';
      case 'Incomplete': return 'bg-gray-400';
      case 'Request Sent': return 'bg-yellow-400';

      default: return 'bg-gray-300';
    }
  };

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true);

      // 1️⃣ Fetch attendance summary for user in selected month/year
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);

      const { data: attendanceSummary, error } = await supabase
        .from("employee_attendance_summary")
        .select("*")
        .eq("user_id", userId)
        .gte("attendance_date", startDate.toISOString())
        .lte("attendance_date", endDate.toISOString())

      console.log("Attendance Summary:", attendanceSummary);

      if (error) {
        console.error("Error fetching attendance:", error);
        setLoading(false);
        return;
      }

      // 2️⃣ Fetch user weekly offs
      const { data: weeklyOff } = await supabase
        .from("user_weekly_offs")
        .select("weekly_offs")
        .eq("user_id", userId)
        .single();

      const weeklyOffDays: number[] = weeklyOff?.weekly_offs || []; // e.g. [0,6] → Sun & Sat

      // 3️⃣ Transform into calendar data
      const transformed: AttendanceRecord[] = [];
      const daysInMonth = endDate.getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(selectedYear, selectedMonth, day);
        const formattedDate = currentDate.toISOString().split("T")[0];
        const weekday = currentDate.toLocaleDateString("en-US", { weekday: "short" });
        const weekDayIndex = currentDate.getDay(); // 0=Sun ... 6=Sat

        const dbEntry = attendanceSummary?.find((a) => a.attendance_date === formattedDate);
        const worked = dbEntry?.total_hours || 0;
        const expected = dbEntry?.expected_hours || 0;
        const isFuture = currentDate > new Date();
        const isWeeklyOff = weeklyOffDays.includes(weekDayIndex);

        let status: string = "Upcoming"; // Default value

        // ✅ Priority order with corrected Absent condition
        if (isWeeklyOff) {
          status = "Weekly Off";
        } else if (dbEntry?.attendance_statuses?.[0] === "Regularized") {
          status = "Regularized";
        } else if (worked < expected && worked > 0 && !isFuture) {
          status = "Regularize";
        } else if ((isFuture && dbEntry?.attendance_statuses?.[0] === 'Incomplete') || (!dbEntry && isFuture)) {
          status = "Upcoming";
        } else if (!isFuture && worked <= 0) {
          status = "Absent";
        } else if (!isFuture && worked >= expected) {
          status = "Present"; // Handle full attendance
        }

        transformed.push({
          day: weekday,
          date: formattedDate,
          hoursWorked: worked.toFixed(2),
          expectedHours: expected.toFixed(2),
          status,
          first_check_in_time: dbEntry?.first_check_in_time || null,
          last_check_out_time: dbEntry?.last_check_out_time || null,
          check_in_latitudes: dbEntry?.check_in_latitudes || null,
          check_in_longitudes: dbEntry?.check_in_longitudes || null,
          check_out_latitudes: dbEntry?.check_out_latitudes || null,
          check_out_longitudes: dbEntry?.check_out_longitudes || null,
          attendance_statuses: dbEntry?.attendance_statuses || null,
          request_type: dbEntry?.request_type || null,
          request_status: dbEntry?.request_status || null,
          checkInLocation: dbEntry?.checkInLocation || null,
          checkOutLocation: dbEntry?.checkOutLocation || null,
        } as AttendanceRecord);
      }

      setAttendanceData(transformed);
      setLoading(false);
    };

    fetchAttendance();
  }, [userId, selectedMonth, selectedYear]);


  useEffect(() => {
    if (!userId) return;

    const fetchRequests = async () => {
      setReqLoading(true);
      const { data } = await supabase
        .from('attendance_requests')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })


      setRequests(data || []);
      setReqLoading(false);
    };

    fetchRequests();
  }, [userId]);
  const pendingRegularizeDates = new Set<string>(
    requests
      .filter(r => r.request_type === "REGULARIZATION" && r.status === "PENDING")
      .flatMap(r => {
        if (!r.start_date) return [];
        const start = new Date(r.start_date);
        const end = r.end_date ? new Date(r.end_date) : start;
        const days: string[] = [];
        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
          days.push(format(d, "yyyy-MM-dd"));
        }
        return days;
      }));

  if (loading) return <div>Loading attendance...</div>;

  return (
    <div className="flex bg-white min-h-screen">
      <div className="flex flex-col w-full">
        <div className="p-6 space-y-6">
          {/* Top Cards */}
          <div className="flex gap-4 items-stretch">
            <div className="w-1/2">
              <div className="h-full bg-gray-50  rounded-lg">
                <TimeTrackerCard />
              </div>
            </div>
            <div className="w-1/2">
              <div className="h-full">
                <WorkRequestCard />
              </div>
            </div>
          </div>


          {/* Attendance Panel */}
          <div className="bg-white backdrop-blur-md rounded-2xl  p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Employee Attendance</h2>

              <div className="flex items-center gap-6">
                {/* Weekly/Monthly Toggle */}
                <div className="flex rounded-full bg-gray-50">
                  <button
                    onClick={() => setViewMode('weekly')}
                    className={`px-4 py-1 rounded-l-lg text-sm font-medium transition ${viewMode === 'weekly' ? 'bg-gray-300 text-gray-900' : 'text-gray-400'}`}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setViewMode('monthly')}
                    className={`px-4 py-1 rounded-r-lg text-sm font-medium transition ${viewMode === 'monthly' ? 'bg-gray-300 text-gray-900' : 'text-gray-400'}`}
                  >
                    Monthly
                  </button>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-x-4 bg-gray-50 rounded-2xl px-4 py-1 text-xs">
                  {[
                    { color: "green-500", label: "Checked In" },
                    { color: "red-500", label: "Absent" },
                    { color: "yellow-500", label: "Regularization" },
                    { color: "blue-500", label: "Weekly Off" },
                  ].map(({ color, label }, idx) => (
                    <div key={idx} className="flex items-center gap-x-2">
                      <span className={`w-3 h-3 rounded-full bg-${color}`}></span>
                      <p>{label}</p>
                    </div>
                  ))}
                </div>
                {/* <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="rounded px-2 py-1 border">
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {format(new Date(2025, i, 1), 'MMMM')}
                    </option>
                  ))}
                </select>

                <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="rounded px-2 py-1 border">
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <option key={year}>{year}</option>
                  ))}
                </select> */}
              </div>
            </div>


            <div className="bg-white rounded-xl  p-4">
              {viewMode === 'weekly' ? (
                <AttendanceWeeklyTable
                  data={attendanceData}
                  onRegularize={(date) => setRegularizeDate(date)}
                  onRequestLeave={(date) => setLeaveDate(date)}  // IGNORE
                  onRequestWFH={(date) => setWFHDate(date)}  // IGNORE
                  onRequestApprovedOff={(date) => setApprovedOffDate(date)}  // IGNORE
                />
              ) : (
                <div className="grid grid-cols-7 gap-3">
                  {(() => {
                    const firstDay = new Date(selectedYear, selectedMonth, 1);
                    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                    const firstDayIndex = (firstDay.getDay() + 6) % 7; // Monday start

                    const calendarDays = [];
                    for (let i = 0; i < firstDayIndex; i++) {
                      calendarDays.push(<div key={`empty-${i}`} />);
                    }

                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(selectedYear, selectedMonth, day);
                      const formatted = format(date, "yyyy-MM-dd");
                      const found = attendanceData.find((d) => d.date === formatted);
                      const isFuture = date > today;
                      const weekday = date.toLocaleDateString("en-US", { weekday: "long" });
                      const isWeekend = weekday === "Saturday" || weekday === "Sunday";


                      // Resolve status (prefer found.status, but keep weekend/future rules)
                      // ---- Resolve status with unified logic ----
                      let status: string;

                      if (found) {
                        // ✅ Trust backend statuses first (Regularized / Checked In / Checked Out / etc.)
                        if (found.status === "Regularized" || found.status === "Regularize" || found.status === "Upcoming" || found.status === "Incomplete") {
                          status = found.status;
                        } else {
                          status = found.status ?? "Absent";
                        }

                        // ✅ Override based on requests if APPROVED
                        if (found.request_type && found.request_status === "APPROVED") {
                          if (found.request_type === "LEAVE") status = "Approved Leave";
                          if (found.request_type === "WFH") status = "Work From Home";
                          if (found.request_type === "WEEKLY OFF") status = "Weekly Off";
                        }

                        // ✅ Pending Regularization override
                        // ✅ NEW: Override if there’s a PENDING regularization
                        if (pendingRegularizeDates.has(formatted)) {
                          status = "Request Sent";
                        }

                        // ✅ Handle future/past rules
                        if (status === "Incomplete" && !isFuture) {
                          status = "Absent"; // Past incomplete becomes Absent
                        }
                        if ((isFuture && !found.status) || found.status === "Incomplete") {
                          status = "Incomplete"; // Future no record → Incomplete
                        }
                      } else {
                        // ✅ No record fallback
                        status = isWeekend ? "Weekly Off" : isFuture ? "Upcoming" : "Absent";
                      }




                      // ---- Resolve times and lat/long (support both shapes) ----
                      const ciTime =
                        found?.checkInLocation?.time ??
                        (found?.first_check_in_time ? new Date(found.first_check_in_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null);
                      const coTime =
                        found?.checkOutLocation?.time ??
                        (found?.last_check_out_time ? new Date(found.last_check_out_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null);

                      const ciLat = found?.checkInLocation?.lat ?? found?.check_in_latitudes?.[0] ?? null;
                      const ciLong = found?.checkInLocation?.long ?? found?.check_in_longitudes?.[0] ?? null;

                      // pick last element for check-out arrays if available
                      const coLat =
                        found?.checkOutLocation?.lat ??
                        (found?.check_out_latitudes?.length ? found.check_out_latitudes[found.check_out_latitudes.length - 1] : null) ??
                        null;
                      const coLong =
                        found?.checkOutLocation?.long ??
                        (found?.check_out_longitudes?.length ? found.check_out_longitudes[found.check_out_longitudes.length - 1] : null) ??
                        null;

                      // small helpers
                      const mapLink = (lat: number | null, long: number | null) =>
                        lat != null && long != null ? `https://www.google.com/maps?q=${lat},${long}` : null;

                      calendarDays.push(
                        <div
                          key={formatted}
                          className={`relative rounded-xl border ${getColorBorder(status)} shadow-sm hover:shadow-md flex flex-col justify-between h-28 bg-white`}
                        >
                          {/* Top row: date + times */}
                          <div className="flex justify-between px-2 pt-2 text-sm font-medium text-gray-800">
                            <span>{day}</span>

                            <div className="flex gap-2 items-center">
                              {/* Check-in */}
                              {!isFuture && ciTime ? (
                                mapLink(ciLat, ciLong) ? (
                                  <a
                                    href={mapLink(ciLat, ciLong)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-gray-600"
                                    title={`Check-in: ${ciLat?.toFixed?.(4)}, ${ciLong?.toFixed?.(4)}`}
                                  >
                                    <FaMapMarkerAlt className="text-red-500" />
                                    <span>{ciTime}</span>
                                  </a>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-gray-600">
                                    <FaMapMarkerAlt className="text-red-500" />
                                    <span>{ciTime}</span>
                                  </span>
                                )
                              ) : null}

                              {/* Check-out */}
                              {!isFuture && coTime ? (
                                mapLink(coLat, coLong) ? (
                                  <a
                                    href={mapLink(coLat, coLong)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-gray-600"
                                    title={`Check-out: ${coLat?.toFixed?.(4)}, ${coLong?.toFixed?.(4)}`}
                                  >
                                    <FaMapMarkerAlt className="text-green-500" />
                                    <span>{coTime}</span>
                                  </a>
                                ) : (
                                  <span className="flex items-center gap-1 text-xs text-gray-600">
                                    <FaMapMarkerAlt className="text-green-500" />
                                    <span>{coTime}</span>
                                  </span>
                                )
                              ) : null}
                            </div>
                          </div>

                          {/* optional middle: show worked hours if you want */}
                          {/* <div className="text-center text-xs px-2">
            {!isFuture && found?.hoursWorked && found.hoursWorked !== "0.00"
              ? `${found.hoursWorked} / ${found.expectedHours} hrs`
              : isFuture
              ? `${found?.expectedHours ?? "0.00"} hrs expected`
              : null}
          </div> */}

                          {/* Status footer */}
                          <div className={`text-[13px] rounded-b-xl font-semibold text-white text-center py-1 ${getColorBg(status)}`}>
                            {status}
                          </div>
                        </div>
                      );
                    }

                    return calendarDays;
                  })()}
                </div>

              )}
            </div>
          </div>

          {/* Requests Table Panel */}
          <div className="bg-white backdrop-blur-md rounded-2xl  p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Requests</h2>

            <div className="overflow-x-auto">
              <div className="max-h-80 overflow-y-auto rounded-xl custom-scrollbar">
                <table className="min-w-full text-sm text-left border-separate border-spacing-y-2">
                  <thead className="bg-gray-100 text-gray-700 sticky top-0 rounded-xl">
                    <tr>
                      <th className="px-4 py-2 rounded-l-lg">Date</th>
                      <th className="px-4 py-2">Type</th>
                      <th className="px-4 py-2">Status</th>
                      <th className="px-4 py-2 rounded-r-lg">Requested On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reqLoading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-gray-500">
                          Loading...
                        </td>
                      </tr>
                    ) : requests.length > 0 ? (
                      requests.map((req) => {
                        const formattedDate = req.start_date
                          ? new Date(req.start_date).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                          : "-";
                        const createdDate = new Date(req.created_at).toLocaleDateString(
                          "en-GB",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          }
                        );
                        return (
                          <tr
                            key={req.id}
                            className="bg-white shadow-sm hover:shadow-md transition rounded-lg"
                          >
                            <td className="px-4 py-3 rounded-l-lg">{formattedDate}</td>
                            <td className="px-4 py-3">{req.request_type}</td>
                            <td
                              className={`px-4 py-3 font-semibold ${req.status === "APPROVED"
                                  ? "text-green-600"
                                  : req.status === "REJECTED"
                                    ? "text-red-600"
                                    : "text-yellow-600"
                                }`}
                            >
                              {req.status}
                            </td>
                            <td className="px-4 py-3 rounded-r-lg">{createdDate}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="text-center py-4 text-gray-500 bg-white rounded-lg"
                        >
                          No requests found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}

export default EmployeeAttendancePage