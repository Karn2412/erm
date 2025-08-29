import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../../supabaseClient";
import { useUser } from "../../context/UserContext"; // assuming you have this

interface PayrollData {
  month: string;
  payroll: number;
}

const LineChartComponent: React.FC = () => {
  const [data, setData] = useState<PayrollData[]>([]);
  const { userData } = useUser(); // contains company_id

  useEffect(() => {
    const fetchPayrollHistory = async () => {
      if (!userData?.company_id) return;

      // fetch payroll history for the company
      const { data, error } = await supabase
        .from("payroll_history")
        .select("month, total_pay")
        .eq("company_id", userData.company_id)
        .order("month", { ascending: true });

      if (error) {
        console.error("❌ Error fetching payroll history:", error);
        return;
      }

      // aggregate by month (sum all employees)
      const monthlyMap: Record<string, number> = {};
      data?.forEach((row: any) => {
        const monthKey = new Date(row.month).toLocaleString("default", {
          month: "short",
        });
        monthlyMap[monthKey] =
          (monthlyMap[monthKey] || 0) + Number(row.total_pay || 0);
      });

      // transform into recharts format
      const formatted = Object.keys(monthlyMap).map((m) => ({
        month: m,
        payroll: monthlyMap[m],
      }));

      setData(formatted);
    };

    fetchPayrollHistory();
  }, [userData?.company_id]);

  return (
    <div className="bg-gray-100 p-4 w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorPayroll" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00bcd4" stopOpacity={0.2} />
              <stop offset="15%" stopColor="#00bcd4" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="#888" strokeDasharray="4 4" vertical={false} />

          <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize:10 }} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize:10 }} />

          <Tooltip />

          <Area
            type="linear"
            dataKey="payroll"
            stroke="#003366"
            fillOpacity={0.5}
            fill="url(#colorPayroll)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChartComponent;
