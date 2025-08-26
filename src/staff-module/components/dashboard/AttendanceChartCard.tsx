import React, { useEffect, useState } from "react";
import { PieChart, Pie, Cell, Label } from "recharts";
import { supabase } from "../../../supabaseClient";
import { useUser } from "../../../context/UserContext";
import dayjs from "dayjs";

interface Props {}

const COLORS = ["#b2fff7", "#fdaaaa", "#ffe29a"]; // Present, Absent, Approved Off

const AttendanceChartCard: React.FC<Props> = () => {
  const { userData } = useUser();
  const [present, setPresent] = useState(0);
  const [absent, setAbsent] = useState(0);
  const [approvedOff, setApprovedOff] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!userData?.id) return;

      const startOfMonth = dayjs().startOf("month").format("YYYY-MM-DD");
      const endOfMonth = dayjs().endOf("month").format("YYYY-MM-DD");

      const { data, error } = await supabase
        .from("employee_attendance_with_requests")
        .select("attendance_date, attendance_statuses")
        .eq("user_id", userData.id)
        .gte("attendance_date", startOfMonth)
        .lte("attendance_date", endOfMonth);

      if (error) {
        console.error("Error fetching attendance:", error.message);
        setLoading(false);
        return;
      }

      const totalDays = dayjs(endOfMonth).date();
      let presentDays = 0;
      let absentDays = 0;
      let approvedOffDays = 0;

      data?.forEach((record) => {
        const statuses: string[] = record.attendance_statuses || [];

        if (
          statuses.includes("Checked In") ||
          statuses.includes("Regularized") ||
          statuses.includes("Work From Home") ||
          statuses.includes("Approved Leave")
        ) {
          presentDays++;
        } else if (statuses.includes("Approved Off")) {
          approvedOffDays++;
        } else {
          absentDays++;
        }
      });

      // Some days missing from attendance records → count as absent
      const missingDays =
        totalDays - (presentDays + absentDays + approvedOffDays);
      absentDays += missingDays;

      // Convert into percentage
      setPresent((presentDays / totalDays) * 100);
      setAbsent((absentDays / totalDays) * 100);
      setApprovedOff((approvedOffDays / totalDays) * 100);

      setLoading(false);
    };

    fetchAttendance();
  }, [userData?.id]);

  const today = new Date().getDate();
  const totalDaysSoFar = today;

  // Only use absent% for message (ignores Approved Off)
  const absentDaysSoFar = Math.round((absent / 100) * totalDaysSoFar);

  let attendanceMessage = "";
  if (present >= 75) {
    attendanceMessage = `great consistency!`;
  } else if (present >= 50) {
    attendanceMessage = `average attendance — keep improving!`;
  } else {
    attendanceMessage = `low attendance — needs improvement!`;
  }

  const data = [
    { name: "Present", value: present },
    { name: "Absent", value: absent },
    { name: "Approved Off", value: approvedOff },
  ];

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg">
      <h3 className="text-lg font-medium mb-4 text-gray-800">
        Attendance Distribution
      </h3>

      {loading ? (
        <p>Loading attendance...</p>
      ) : (
        <div className="flex items-center">
          <PieChart width={270} height={180}>
            <Pie
              data={data}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              innerRadius={40}
              outerRadius={120}
              paddingAngle={4}
              cornerRadius={8}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}

              <Label
  position="center"
  content={({ viewBox }) => {
    if (!viewBox || typeof viewBox !== 'object' || !('cx' in viewBox) || !('cy' in viewBox)) {
      return null;
    }
    
    const { cx, cy } = viewBox as { cx: number; cy: number };
    
    return (
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="middle"
      >
        <tspan
          x={cx}
          dy="-0.5em"
          fontSize="16"
          fontWeight="600"
          fill="#111"
        >
          {present.toFixed(0)}%
        </tspan>
        <tspan x={cx} dy="1.4em" fontSize="12" fill="#555">
          Present
        </tspan>
      </text>
    );
  }}
/>
            </Pie>
          </PieChart>

          <div className="ml-6 bg-gray-100 p-5 rounded-2xl text-gray-700 text-sm space-y-2">
            <p>
              You’ve maintained an <strong>{present.toFixed(0)}%</strong>{" "}
              attendance rate this month — {attendanceMessage}
            </p>
            <p>
              <strong>{absentDaysSoFar}</strong> days absent until today.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceChartCard;
