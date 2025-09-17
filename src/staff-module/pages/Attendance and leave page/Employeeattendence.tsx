// Employeeattendence.tsx
import  { useEffect, useState } from 'react'

import WorkRequestCard from '../../components/dashboard/WorkRequestCard'
import TimeTrackerCard from '../../components/dashboard/Timetrackercard'

import AttendanceWeeklyTable from '../../components/Attendence and leave/AttendanceWeeklyTable'
import { supabase } from '../../../supabaseClient'
import { useUser } from '../../../context/UserContext'
import { format, endOfMonth, addDays, isAfter } from 'date-fns'
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
  const [approvedOffDate, setApprovedOffDate] = useState<string | null>(null);  // IGNORE

  console.log(regularizeDate, leaveDate, wfhDate, approvedOffDate);
  

  const approvedOffDates = new Set<string>();
  console.log(regularizeDate);
  console.log(setSelectedMonth);
  console.log(setSelectedYear);
  
  
  //
  const getColorBorder = (status: string) => {
    switch (status) {
      case 'Checked In': return 'border-green-500';
      case 'Checked Out': return 'border-purple-500';
      case 'Absent': return 'border-red-500';
      case 'Regularize': return 'border-orange-400';
      case 'Regularized': return 'border-orange-600';
      case 'Approved Off': return 'border-blue-500';
      case 'Approved Leave': return 'border-indigo-500';
      case 'Work From Home': return 'border-purple-500';
      default: return 'border-gray-300';
    }
  };

  const getColorBg = (status: string) => {
    switch (status) {
      case 'Checked In': return 'bg-green-500';
      case 'Checked Out': return 'bg-purple-500';
      case 'Absent': return 'bg-red-500';
      case 'Regularize': return 'bg-orange-400';
      case 'Regularized': return 'bg-orange-600';
      case 'Approved Off': return 'bg-blue-500';
      case 'Approved Leave': return 'bg-indigo-500';
      case 'Work From Home': return 'bg-purple-500';
      case 'Incomplete': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  useEffect(() => {
    if (!userId) return;

    const fetchAttendance = async () => {
      setLoading(true);

      const startDate = format(new Date(selectedYear, selectedMonth, 1), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd');

      const { data: summary } = await supabase
        .from('employee_attendance_summary')
        .select('*')
        .eq('user_id', userId)
        .gte('attendance_date', startDate)
        .lte('attendance_date', endDate)
        .order('attendance_date', { ascending: true });

      const { data: approvedRequests } = await supabase
        .from('attendance_requests')
        .select('request_type, status, start_date, end_date')
        .eq('user_id', userId)
        .eq('status', 'APPROVED')
        .in('request_type', ['LEAVE', 'WFH', 'APPROVED OFF'])
        .lte('start_date', endDate)
        .gte('end_date', startDate);

      const leaveDates = new Set<string>();
      const wfhDates = new Set<string>();

      if (approvedRequests?.length) {
        for (const r of approvedRequests) {
          const s = new Date(r.start_date as string);
          const e = new Date(r.end_date as string);
          for (let d = s; !isAfter(d, e); d = addDays(d, 1)) {
            const dayStr = format(d, 'yyyy-MM-dd');
            if (r.request_type === 'LEAVE') leaveDates.add(dayStr);
            if (r.request_type === 'WFH') wfhDates.add(dayStr);
            if (r.request_type === 'APPROVED OFF') approvedOffDates.add(dayStr);
          }
        }
      }

      const transformed: AttendanceRecord[] = [];
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(selectedYear, selectedMonth, day);
        const formattedDate = format(dateObj, 'yyyy-MM-dd');
        const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        const isWeekend = weekday === 'Saturday' || weekday === 'Sunday';
        const isFuture = dateObj > today;

        const dbEntry = summary?.find((entry) => entry.attendance_date === formattedDate);

       if (leaveDates.has(formattedDate)) {
  transformed.push({
    day: weekday,
    date: formattedDate,
    hoursWorked: dbEntry?.total_worked_hours?.toFixed(2) ?? '0.00',
    expectedHours: dbEntry?.expected_hours?.toFixed(2) ?? '0.00',
     status: 'Approved Leave',   // match admin side

    // raw fields (required by type) — set null when absent
    first_check_in_time: dbEntry?.first_check_in_time ?? null,
    last_check_out_time: dbEntry?.last_check_out_time ?? null,
    check_in_latitudes: dbEntry?.check_in_latitudes ?? null,
    check_in_longitudes: dbEntry?.check_in_longitudes ?? null,
    check_out_latitudes: dbEntry?.check_out_latitudes ?? null,
    check_out_longitudes: dbEntry?.check_out_longitudes ?? null,
    attendance_statuses: dbEntry?.attendance_statuses ?? null,
    request_type: dbEntry?.request_type ?? null,
    request_status: dbEntry?.request_status ?? null,

    // friendly objects you also use elsewhere
    checkInLocation: null,
    checkOutLocation: null,
  } as AttendanceRecord);
  continue;
}

if (wfhDates.has(formattedDate)) {
  transformed.push({
    day: weekday,
    date: formattedDate,
    hoursWorked: dbEntry?.total_worked_hours?.toFixed(2) ?? '0.00',
    expectedHours: dbEntry?.expected_hours?.toFixed(2) ?? '0.00',
    status: 'Work From Home',
    first_check_in_time: dbEntry?.first_check_in_time ?? null,
    last_check_out_time: dbEntry?.last_check_out_time ?? null,
    check_in_latitudes: dbEntry?.check_in_latitudes ?? null,
    check_in_longitudes: dbEntry?.check_in_longitudes ?? null,
    check_out_latitudes: dbEntry?.check_out_latitudes ?? null,
    check_out_longitudes: dbEntry?.check_out_longitudes ?? null,
    attendance_statuses: dbEntry?.attendance_statuses ?? null,
    request_type: dbEntry?.request_type ?? null,
    request_status: dbEntry?.request_status ?? null,

    checkInLocation: null,
    checkOutLocation: null,
  } as AttendanceRecord);
  continue;
}
if (approvedOffDates.has(formattedDate)) {
  transformed.push({
    day: weekday,
    date: formattedDate,
    hoursWorked: dbEntry?.total_worked_hours?.toFixed(2) ?? '0.00',
    expectedHours: dbEntry?.expected_hours?.toFixed(2) ?? '0.00',
    status: 'Approved Off',
    first_check_in_time: dbEntry?.first_check_in_time ?? null,
    last_check_out_time: dbEntry?.last_check_out_time ?? null,
    check_in_latitudes: dbEntry?.check_in_latitudes ?? null,
    check_in_longitudes: dbEntry?.check_in_longitudes ?? null,
    check_out_latitudes: dbEntry?.check_out_latitudes ?? null,
    check_out_longitudes: dbEntry?.check_out_longitudes ?? null,
    attendance_statuses: dbEntry?.attendance_statuses ?? null,
    request_type: dbEntry?.request_type ?? null,
    request_status: dbEntry?.request_status ?? null,
    checkInLocation: null,
    checkOutLocation: null,
  } as AttendanceRecord);
  continue;
}



if (dbEntry) {
  const worked = Number(dbEntry.total_worked_hours ?? 0);
  const expected = Number(dbEntry.expected_hours ?? 0);

  // ✅ Trust backend first
  let status: string = dbEntry.attendance_statuses?.[0] || "Absent";

  // ---- Staff-specific override ----
  const underHours = !isWeekend && !isFuture && expected > 0 && worked + 0.01 < expected;

  if (underHours) {
    if (dbEntry.first_check_in_time) {
      // staff showed up but did not complete hours
      status = "Regularize";
    } else {
      // no check-in at all
      status = "Absent";
    }
  }

  // (rest of your record construction remains unchanged)
  const record: AttendanceRecord = {
    day: weekday,
    date: dbEntry.attendance_date,
    attendance_date: dbEntry.attendance_date,
    hoursWorked: worked.toFixed(2),
    expectedHours: expected.toFixed(2),
    first_check_in_time: dbEntry.first_check_in_time ?? null,
    last_check_out_time: dbEntry.last_check_out_time ?? null,
    check_in_latitudes: dbEntry.check_in_latitudes ?? null,
    check_in_longitudes: dbEntry.check_in_longitudes ?? null,
    check_out_latitudes: dbEntry.check_out_latitudes ?? null,
    check_out_longitudes: dbEntry.check_out_longitudes ?? null,
    attendance_statuses: dbEntry.attendance_statuses ?? null,
    request_type: dbEntry.request_type ?? null,
    request_status: dbEntry.request_status ?? null,
    checkInLocation: dbEntry.first_check_in_time
      ? {
          lat: dbEntry.check_in_latitudes?.[0] ?? null,
          long: dbEntry.check_in_longitudes?.[0] ?? null,
          time: new Date(dbEntry.first_check_in_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }
      : null,
    checkOutLocation: dbEntry.last_check_out_time
      ? {
          lat:
            (dbEntry.check_out_latitudes?.length ?? 0) > 0
              ? dbEntry.check_out_latitudes?.slice(-1)[0] ?? null
              : null,
          long:
            (dbEntry.check_out_longitudes?.length ?? 0) > 0
              ? dbEntry.check_out_longitudes?.slice(-1)[0] ?? null
              : null,
          time: new Date(dbEntry.last_check_out_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }
      : null,
    status,
  };

  transformed.push(record);
} else {
  // ✅ Fallback when no dbEntry at all
  const status = isFuture
    ? "Upcoming"
    : isWeekend
    ? "Approved Off"
    : "Absent";

  transformed.push({
    day: weekday,
    date: formattedDate,
    hoursWorked: "0.00",
    expectedHours: "0.00",
    status,
    first_check_in_time: null,
    last_check_out_time: null,
    check_in_latitudes: null,
    check_in_longitudes: null,
    check_out_latitudes: null,
    check_out_longitudes: null,
    attendance_statuses: null,
    request_type: null,
    request_status: null,
    checkInLocation: null,
    checkOutLocation: null,
  } as AttendanceRecord);
}

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
        { color: "blue-500", label: "Approved Off" },
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
let status: string = 'Absent'; // default value
if (found) {
   if (!found.request_type || found.request_status !== "APPROVED") {
     if (isWeekend) status = "Approved Off";
     else if (isFuture) status = "Incomplete";
      else status = found.status ?? 'Absent';
   }
   else {
     status = found.status ?? 'Absent';
   }
} else {
  status = isWeekend ? "Approved Off" : isFuture ? "Upcoming" : "Absent";
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
                    className={`px-4 py-3 font-semibold ${
                      req.status === "APPROVED"
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
