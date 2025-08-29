// AttendanceWeeklyTable.tsx
import React from 'react';
import { FaSyncAlt, FaMapMarkerAlt } from 'react-icons/fa';
import { isBefore, isAfter, startOfWeek, addDays, format } from 'date-fns';

interface AttendanceRecord {
  day: string;
  date: string;
  hoursWorked: string;
  expectedHours: string;
  status: string; // e.g. Completed, Absent, Leave, WFH, Regularize, Approved Off, Incomplete, Checked In
  checkInLocation: { lat: number; long: number } | null;
  checkOutLocation: { lat: number; long: number } | null;
}

interface AttendanceWeeklyTableProps {
  data: AttendanceRecord[];
  onRegularize?: (date: string) => void; // 👈 NEW
}

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const getDotColor = (status: string) => {
  switch (status) {
    case 'Checked In':
    case 'Completed':
      return 'bg-green-500';
    case 'Absent':
      return 'bg-red-500';
    case 'Approved Off':
      return 'bg-blue-500';
    case 'Leave':
      return 'bg-indigo-500';   // 👈 NEW
    case 'WFH':
      return 'bg-purple-500';   // 👈 NEW
    case 'Regularize':
      return 'bg-orange-400';
    case 'Incomplete':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-400';
  }
};

const openMap = (lat: number, long: number) => {
  window.open(`https://www.google.com/maps?q=${lat},${long}`, '_blank');
};

const AttendanceWeeklyTable: React.FC<AttendanceWeeklyTableProps> = ({ data, onRegularize }) => {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const weekData = weekDays.map((day, index) => {
    const date = addDays(start, index);
    const dateStr = format(date, 'yyyy-MM-dd');
    const matched = data.find((d) => d.date === dateStr);
    const isWeekend = day === 'Saturday' || day === 'Sunday';

    if (matched) {
      // If already has a status from upstream, prefer that
      // But if user is checked-in and not final, show "Checked In"
      const status =
        matched.checkInLocation &&
        !['Completed', 'Regularize', 'Approved Off', 'Leave', 'WFH'].includes(matched.status)
          ? 'Checked In'
          : matched.status;

      return { ...matched, status, day };
    }

    // fallback cells for days not in provided data
    let status = 'Absent';
    if (isAfter(date, today)) {
      status = 'Incomplete';
    } else if (isWeekend && isBefore(date, today)) {
      status = 'Approved Off';
    }

    return {
      day,
      date: dateStr,
      hoursWorked: '0.00',
      expectedHours: '0.00',
      checkInLocation: null,
      checkOutLocation: null,
      status,
    };
  });

  return (
    <div className="overflow-auto bg-gray-50 rounded-2xl p-6">
      <div className="rounded-xl overflow-hidden">
        <table className="w-full text-sm border-separate border-spacing-y-3">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Day</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Worked / Expected (hrs)</th>
              <th className="px-4 py-3">Check-In</th>
              <th className="px-4 py-3">Check-Out</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {weekData.map((row, idx) => (
              <tr
                key={idx}
                className={`${idx % 2 === 0 ? 'bg-blue-50' : 'bg-violet-50'} hover:bg-blue-100 transition duration-200`}
              >
                <td className="px-4 py-3 rounded-l-xl">{row.day}</td>
                <td className="px-4 py-3">{row.date}</td>
                <td className="px-4 py-3">
                  {row.hoursWorked} / {row.expectedHours}
                </td>
                <td className="px-4 py-3">
                  {row.checkInLocation ? (
                    <button
                      onClick={() => openMap(row.checkInLocation!.lat, row.checkInLocation!.long)}
                      className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <FaMapMarkerAlt className="text-sm" />
                      <span>Map</span>
                    </button>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {row.checkOutLocation ? (
                    <button
                      onClick={() => openMap(row.checkOutLocation!.lat, row.checkOutLocation!.long)}
                      className="text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <FaMapMarkerAlt className="text-sm" />
                      <span>Map</span>
                    </button>
                  ) : (
                    <span className="text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-4 py-3 rounded-r-xl">
                  {row.status === 'Regularize' ? (
                    <button
                      onClick={() => onRegularize?.(row.date)} // 👈 NEW
                      className="flex items-center space-x-2 px-3 py-1 text-sm bg-orange-400 text-white font-medium rounded-full"
                    >
                      <span>Regularize</span>
                      <FaSyncAlt className="text-xs" />
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className={`h-2 w-2 rounded-full ${getDotColor(row.status)}`}></span>
                      <span className="text-sm font-medium text-gray-700">{row.status}</span>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceWeeklyTable;
