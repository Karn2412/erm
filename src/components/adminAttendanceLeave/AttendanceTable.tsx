import React from "react";
import { FaEye, FaMapMarkerAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface AttendanceItem {
  user_id: number;
  employee_name: string;
  attendance_date: string;
  total_worked_hours: number;
  expected_hours: number;
  check_in_latitudes: number[] | null;
  check_in_longitudes: number[] | null;
  check_out_latitudes: number[] | null;
  check_out_longitudes: number[] | null;
  attendance_statuses: string[] | null;
  department_name: string; // ✅ Added Department
  designation?: string; // ✅ Added Designation (optional)
}

interface AttendanceTableProps {
  attendanceData: AttendanceItem[];
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ attendanceData }) => {
  const navigate = useNavigate();
  const today = new Date().toISOString().split("T")[0];

  const todayData = attendanceData.filter(
    (item) => item.attendance_date === today
  );

  const handleViewClick = (userId: number) => {
    navigate(`/attendance-detail/${userId}`);
  };

  // 🟢 Status badge styles
  const getStatusBadge = (status: string) => {
    const baseClass =
      "px-3 py-1 text-xs rounded-full font-medium whitespace-nowrap";

    switch (status) {
      case "Rejected":
        return <span className={`${baseClass} bg-red-100 text-red-700`}>Rejected</span>;
      case "Regularize":
        return <span className={`${baseClass} bg-orange-100 text-orange-600`}>Regularize</span>;
      case "Checked In":
        return <span className={`${baseClass} bg-green-100 text-green-600`}>Checked In</span>;
      case "Approved Off":
        return <span className={`${baseClass} bg-blue-100 text-blue-600`}>Approved Off</span>;
      case "Absent":
      default:
        return <span className={`${baseClass} bg-gray-100 text-gray-500`}>Absent</span>;
    }
  };

  // 📍 Location link
  const renderLocationIcon = (lat?: number | null, long?: number | null) => {
    if (!lat || !long) return <span className="text-gray-400 text-sm">--</span>;
    return (
      <a
        href={`https://www.google.com/maps?q=${lat},${long}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:text-blue-800"
        title={`${lat.toFixed(4)}, ${long.toFixed(4)}`}
      >
        <FaMapMarkerAlt size={16} />
      </a>
    );
  };

  return (
   <div className="overflow-x-auto rounded-2xl  ">
      {/* Added border-separate & vertical spacing for row gaps */}
      <table className="min-w-full text-sm text-gray-700   border-separate border-spacing-y-2 border-spacing-x-0">
        <thead className="bg-white text-gray-700 uppercase text-xs">
          <tr>
            <th className="py-3 px-4 text-left">SL No</th>
            <th className="py-3 px-4 text-left">Employee Name</th>
            <th className="py-3 px-4 text-left">Department</th>
            <th className="py-3 px-4 text-left">Designation</th>
            <th className="py-3 px-4 text-center">Check In</th>
            <th className="py-3 px-4 text-center">Status</th>
            <th className="py-3 px-4 text-center">Check Out</th>
            <th className="py-3 px-4 text-center">View</th>
          </tr>
        </thead>

        {/* Removed divide-y utilities so gaps show through */}
        <tbody>
          {todayData.length > 0 ? (
            todayData.map((item, index) => {
              const status = item.attendance_statuses?.[0] ?? "Absent";
              const checkInLat = item.check_in_latitudes?.[0] ?? null;
              const checkInLong = item.check_in_longitudes?.[0] ?? null;
              const checkOutLat = item.check_out_latitudes?.[0] ?? null;
              const checkOutLong = item.check_out_longitudes?.[0] ?? null;
               console.log(item);
               
              return (
                <tr
                  key={`${item.user_id}-${item.attendance_date}`}
                  className="odd:bg-blue-50 even:bg-indigo-100 hover:bg-gray-100  rounded-2xl transition"
                >
                  <td className="py-3 rounded-l-2xl px-4">{index + 1}</td>
                  <td className="py-3 px-4 font-medium">{item.employee_name}</td>
                  <td className="py-3 px-4">{item.department_name}</td>
                  <td className="py-3 px-4">{item.designation ?? "--"}</td>
                  <td className="py-3 px-4 text-center">
                    {renderLocationIcon(checkInLat, checkInLong)}
                  </td>
                  <td className="py-3 px-4 text-center">{getStatusBadge(status)}</td>
                  <td className="py-3 px-4 text-center">
                    {renderLocationIcon(checkOutLat, checkOutLong)}
                  </td>
                  <td className="py-3 px-4 rounded-r-2xl text-center">
                    {status === "Rejected" ? (
                      <span className="text-sm text-red-600 font-semibold">N/A</span>
                    ) : (
                      <button
                        onClick={() => handleViewClick(item.user_id)}
                        className="bg-blue-200 hover:bg-blue-300 text-gray-900 px-3 py-1 rounded-md text-xs flex items-center gap-1 mx-auto"
                      >
                        View <FaEye size={12} />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={8}
                className="text-center py-6 text-gray-500 text-sm bg-white"
              >
                No attendance records for today.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
