// AttendanceWeeklyTable.tsx
import React from "react";
import {  FaMapMarkerAlt } from "react-icons/fa";
import { isAfter, startOfWeek, addDays, format } from "date-fns";
import type { AttendanceRecord } from "../../../types/attendance";


interface TableRow extends AttendanceRecord {
  day: string;
  status: string;
}

interface AttendanceWeeklyTableProps {
  data: AttendanceRecord[];
  onRegularize?: (date: string) => void;
}

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const getDotColor = (status: string) => {
  switch (status) {
    case "Checked In":
      return "bg-green-500";
    case "Completed":
      return "bg-green-500";

      case "Checked Out":
      return "bg-purple-500";
    case "Absent":
      return "bg-red-500";
    case "Approved Off":
      return "bg-blue-500";
    case "Approved Leave":
      return "bg-indigo-500";
    case "Work From Home":
      return "bg-purple-500";
    case "Regularized":
      return "bg-orange-400";
    case "Incomplete":
      return "bg-gray-500";
    default:
      return "bg-gray-400";
  }
};

const AttendanceWeeklyTable: React.FC<AttendanceWeeklyTableProps> = ({
  data,
  
}) => {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 1 }); // Monday

  const weekData: TableRow[] = weekDays.map((day, index) => {
    const date = addDays(start, index);
    const dateStr = format(date, "yyyy-MM-dd");
    const isWeekend = day === "Saturday" || day === "Sunday";
    const isFuture = isAfter(date, today);

    const dbEntry = data.find(
      (d) => d.date === dateStr || d.attendance_date === dateStr
    );

    if (dbEntry) {
      

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

        // inside weekData map() when you have dbEntry:
const checkInLat = dbEntry.check_in_latitudes?.[0] ?? null;
const checkInLong = dbEntry.check_in_longitudes?.[0] ?? null;

// pick *last* element for check-out (safer)
const checkOutLen = dbEntry.check_out_latitudes?.length ?? 0;
const checkOutLat = checkOutLen > 0 ? dbEntry.check_out_latitudes?.[checkOutLen - 1] ?? null : null;

const checkOutLonLen = dbEntry.check_out_longitudes?.length ?? 0;
const checkOutLong = checkOutLonLen > 0 ? dbEntry.check_out_longitudes?.[checkOutLonLen - 1] ?? null : null;


      // ---- STATUS RESOLUTION (same as monthly) ----
      let status = dbEntry.attendance_statuses?.[0] || "Absent";

      if (dbEntry.last_check_out_time) {
        status = "Checked Out";
      } else if (dbEntry.first_check_in_time) {
        status = "Checked In";
      }

      if (dbEntry.request_type && dbEntry.request_status === "APPROVED") {
        switch (dbEntry.request_type) {
          case "REGULARIZATION":
            status = "Regularized";
            break;
          case "WFH":
            status = "Work From Home";
            break;
          case "LEAVE":
            status = "Approved Leave";
            break;
          case "APPROVED OFF":
            status = "Approved Off";
            break;
        }
      }

      // Weekend / Future overrides
      if (isWeekend) status = "Approved Off";
      if (isFuture) status = "Incomplete";

      return {
        ...dbEntry,
        day,
        date: dateStr,
        status,
        first_check_in_time: checkInTime,
        last_check_out_time: checkOutTime,
        check_in_latitudes: checkInLat ? [checkInLat] : null,
        check_in_longitudes: checkInLong ? [checkInLong] : null,
        check_out_latitudes: checkOutLat ? [checkOutLat] : null,
        check_out_longitudes: checkOutLong ? [checkOutLong] : null,
      };
    }

    // ---- FALLBACK (no record found) ----
    let status = "Absent";
    if (isWeekend) status = "Approved Off";
    if (isFuture) status = "Incomplete";

    return {
      day,
      date: dateStr,
      hoursWorked: "0.00",
      expectedHours: "0.00",
      check_in_latitudes: null,
      check_in_longitudes: null,
      check_out_latitudes: null,
      check_out_longitudes: null,
      status,
    };
  });

  const renderTimeWithLocation = (
    time?: string | null,
    lat?: number | null,
    long?: number | null
  ) => {
    if (!time) return <span className="text-gray-400 text-sm">--</span>;
    if (!lat || !long) return <span>{time}</span>;

    return (
      <div className="flex items-center justify-center gap-1">
        <span>{time}</span>
        <a
          href={`https://www.google.com/maps?q=${lat},${long}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800"
          title={`${lat.toFixed(4)}, ${long.toFixed(4)}`}
        >
          <FaMapMarkerAlt size={14} />
        </a>
      </div>
    );
  };

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
            {weekData.map((row, idx) => {
              const checkInLat = row.check_in_latitudes?.[0] ?? null;
              const checkInLong = row.check_in_longitudes?.[0] ?? null;
              const checkOutLat = row.check_out_latitudes?.[0] ?? null;
              const checkOutLong = row.check_out_longitudes?.[0] ?? null;

              return (
                <tr
                  key={idx}
                  className={`${idx % 2 === 0 ? "bg-blue-50" : "bg-violet-50"
                    } hover:bg-blue-100 transition duration-200`}
                >
                  <td className="px-4 py-3 rounded-l-xl">{row.day}</td>
                  <td className="px-4 py-3">{row.date}</td>
                  <td className="px-4 py-3">
                    {row.hoursWorked} / {row.expectedHours}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {renderTimeWithLocation(
                      row.first_check_in_time,
                      checkInLat,
                      checkInLong
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {renderTimeWithLocation(
                      row.last_check_out_time,
                      checkOutLat,
                      checkOutLong
                    )}
                  </td>


                  <td className="px-4 py-3 rounded-r-xl">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`h-2 w-2 rounded-full ${getDotColor(
                          row.status
                        )}`}
                      ></span>
                      <span className="text-sm font-medium text-gray-700">
                        {row.status}
                      </span>
                      {row.request_type &&
                        row.request_status === "APPROVED" && (
                          <span className="ml-2 px-2 py-1 rounded bg-green-200 text-green-700 text-xs font-semibold">
                            {row.request_type}
                          </span>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttendanceWeeklyTable;
