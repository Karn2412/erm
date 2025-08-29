import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { supabase } from "../../supabaseClient";
import { useUser } from "../../context/UserContext";

const BAR_COLOR = "#94e1db";
const BG_COLOR = "#ffffff";

const BarChartComponent: React.FC = () => {
  const [data, setData] = useState<{ age_range: string; value: number; percentage: number }[]>([]);
  const { userData } = useUser();

  useEffect(() => {
    const fetchAgeData = async () => {
      if (!userData?.company_id) return;

      const { data, error } = await supabase
        .from("age_distribution")
        .select("age_range, value")
        .eq("company_id", userData.company_id);

      if (error) {
        console.error("❌ Error fetching age data:", error);
        return;
      }

      // Convert to percentages
      const total = data?.reduce((sum, d) => sum + d.value, 0) || 1;
      const formatted = (data || []).map((d) => ({
        ...d,
        percentage: Math.round((d.value / total) * 100),
      }));

      setData(formatted);
    };

    fetchAgeData();
  }, [userData?.company_id]);

  return (
    <ResponsiveContainer className="mt-4" width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 10, left: 10, bottom: 10 }}
      >
        <XAxis
          dataKey="age_range"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 14 }}
        />
        <YAxis hide domain={[0, 100]} />
        <Tooltip formatter={(val: number) => `${val}%`} cursor={{ fill: "transparent" }} />

        <Bar
          dataKey="percentage"
          radius={[10, 10, 10, 10]}
          barSize={50}
          fill={BAR_COLOR}
          // 🔑 Custom background for each bar
          background={{
            fill: BG_COLOR,
            radius: 10,
          }}
        >
          <LabelList
  dataKey="percentage"
  content={({ x, width, value }) => {
    if (value == null) return null;
    return (
      <text
        x={Number(x || 0) + Number(width || 0) / 2}
        y={15} // 👈 controls how high above the bar the label sits
        textAnchor="middle"
        fill="#1a1a1a"
        fontWeight="600"
        fontSize={14}
      >
        {value}%
      </text>
    );
  }}
/>

        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;
