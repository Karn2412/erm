// Employeeattendence.tsx
import React, { useEffect, useState } from 'react'

import WorkRequestCard from '../../components/dashboard/WorkRequestCard'
import TimeTrackerCard from '../../components/dashboard/Timetrackercard'

import AttendanceWeeklyTable from '../../components/Attendence and leave/AttendanceWeeklyTable'
import { supabase } from '../../../supabaseClient'
import { useUser } from '../../../context/UserContext'
import { format, endOfMonth, addDays, isAfter } from 'date-fns'

interface AttendanceRecord {
  day: string;
  date: string;
  hoursWorked: string;
  expectedHours: string;
  status: string;
  checkInLocation: { lat: number; long: number } | null;
  checkOutLocation: { lat: number; long: number } | null;
}

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

  const [regularizeDate, setRegularizeDate] = useState<string | null>(null)

  const getColorBorder = (status: string) => {
    switch (status) {
      case 'Checked In': return 'border-green-500';
      case 'Absent': return 'border-red-500';
      case 'Regularize': return 'border-orange-400';
      case 'Approved Off': return 'border-blue-500';
      case 'Leave': return 'border-indigo-500';
      case 'WFH': return 'border-purple-500';
      default: return 'border-gray-300';
    }
  };

  const getColorBg = (status: string) => {
    switch (status) {
      case 'Checked In': return 'bg-green-500';
      case 'Absent': return 'bg-red-500';
      case 'Regularize': return 'bg-orange-400';
      case 'Approved Off': return 'bg-blue-500';
      case 'Leave': return 'bg-indigo-500';
      case 'WFH': return 'bg-purple-500';
      case 'Incomplete': return 'bg-yellow-500';
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
        .in('request_type', ['LEAVE', 'WFH'])
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
            status: 'Leave',
            checkInLocation: null,
            checkOutLocation: null,
          });
          continue;
        }
        if (wfhDates.has(formattedDate)) {
          transformed.push({
            day: weekday,
            date: formattedDate,
            hoursWorked: dbEntry?.total_worked_hours?.toFixed(2) ?? '0.00',
            expectedHours: dbEntry?.expected_hours?.toFixed(2) ?? '0.00',
            status: 'WFH',
            checkInLocation: null,
            checkOutLocation: null,
          });
          continue;
        }

        if (dbEntry) {
          const worked = Number(dbEntry.total_worked_hours ?? 0);
          const expected = Number(dbEntry.expected_hours ?? 0);
          let status: string = dbEntry.attendance_statuses?.[0] || 'Absent';
          const underHours = !isWeekend && !isFuture && expected > 0 && worked + 0.01 < expected;
          if (underHours) status = 'Regularize';

          transformed.push({
            day: weekday,
            date: dbEntry.attendance_date,
            hoursWorked: worked.toFixed(2),
            expectedHours: expected.toFixed(2),
            status,
            checkInLocation: null,
            checkOutLocation: null,
          });
        } else {
          const status = isWeekend ? (isFuture ? 'Incomplete' : 'Approved Off') : (isFuture ? 'Incomplete' : 'Absent');
          transformed.push({
            day: weekday,
            date: formattedDate,
            hoursWorked: '0.00',
            expectedHours: '0.00',
            status,
            checkInLocation: null,
            checkOutLocation: null,
          });
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
        .limit(10);

      setRequests(data || []);
      setReqLoading(false);
    };

    fetchRequests();
  }, [userId]);

  if (loading) return <div>Loading attendance...</div>;

  return (
    <div className="flex bg-blue-50 min-h-screen">
      <div className="flex flex-col w-full">
        <div className="p-6 space-y-6">
          {/* Top Cards */}
          <div className="flex gap-4 items-stretch">
  <div className="w-1/2">
    <div className="h-full bg-white shadow-md rounded-lg">
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
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Employee Attendance</h2>

              <div className="flex items-center gap-4">
                <div className="flex rounded-full bg-white shadow-inner">
                  <button
                    onClick={() => setViewMode('weekly')}
                    className={`px-4 py-1 rounded-l-full text-sm font-medium transition ${viewMode === 'weekly' ? 'bg-gray-300 text-gray-900' : 'text-gray-400'}`}
                  >Weekly</button>
                  <button
                    onClick={() => setViewMode('monthly')}
                    className={`px-4 py-1 rounded-r-full text-sm font-medium transition ${viewMode === 'monthly' ? 'bg-gray-300 text-gray-900' : 'text-gray-400'}`}
                  >Monthly</button>
                </div>

                <select value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="rounded px-2 py-1 border">
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
                </select>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              {viewMode === 'weekly' ? (
                <AttendanceWeeklyTable
                  data={attendanceData}
                  onRegularize={(date) => setRegularizeDate(date)}
                />
              ) : (
                <>
                  <div className="grid grid-cols-7 text-center text-sm font-semibold text-gray-600 mb-4">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <div key={day}>{day}</div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-3">
                    {(() => {
                      const firstDay = new Date(selectedYear, selectedMonth, 1)
                      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
                      const firstDayIndex = (firstDay.getDay() + 6) % 7

                      const calendarDays = []
                      for (let i = 0; i < firstDayIndex; i++) calendarDays.push(<div key={`empty-${i}`} />)

                      for (let day = 1; day <= daysInMonth; day++) {
                        const date = new Date(selectedYear, selectedMonth, day)
                        const formatted = format(date, 'yyyy-MM-dd')
                        const found = attendanceData.find(d => d.date === formatted)
                        const isFuture = date > today
                        const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
                        const isWeekend = weekday === 'Saturday' || weekday === 'Sunday'
                        let status = found ? found.status : isWeekend ? (isFuture ? 'Incomplete' : 'Approved Off') : (isFuture ? 'Incomplete' : 'Absent')

                        calendarDays.push(
                          <div key={formatted} className={`rounded-xl border ${getColorBorder(status)} shadow-sm hover:shadow-md flex flex-col justify-between h-24`}>
                            <div className="flex justify-between px-2 pt-2 text-sm font-medium text-gray-800">
                              <span>{day}</span>
                              <span className="text-xs text-gray-500">
                                {found?.checkInLocation ? 'IN' : ''} {found?.checkOutLocation ? 'OUT' : ''}
                              </span>
                            </div>
                            <div className={`text-[13px] rounded-b-xl font-semibold text-white text-center py-1 ${getColorBg(status)}`}>
                              {status}
                            </div>
                          </div>
                        )
                      }
                      return calendarDays
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Requests Table Panel */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow p-6 mt-6">
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
