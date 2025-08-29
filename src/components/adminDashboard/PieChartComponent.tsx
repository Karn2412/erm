import React, { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  type PieLabelRenderProps,
} from "recharts";
import { supabase } from "../../supabaseClient";
import { useUser } from "../../context/UserContext";

const COLORS = ["#b4fff3", "#a394f7", "#ffd27f"];

const PieChartComponent: React.FC = () => {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const { userData } = useUser();

  useEffect(() => {
    const fetchGenderData = async () => {
      if (!userData?.company_id) return;

      const { data, error } = await supabase
        .from("users_gender_count")
        .select("gender, value")
        .eq("company_id", userData.company_id);

      if (error) {
        console.error("❌ Error fetching gender stats:", error);
        return;
      }

      const formatted =
        data?.map((row: any) => {
          const g = (row.gender || "").toLowerCase();
          return {
            name: g === "male" ? "Men" : g === "female" ? "Women" : "Other",
            value: row.value,
          };
        }) || [];

      setData(formatted);
    };

    fetchGenderData();
  }, [userData?.company_id]);

  const renderCustomLabel = ({
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius = 0,
    outerRadius = 0,
    index = 0,
  }: PieLabelRenderProps) => {
    const RADIAN = Math.PI / 180;
    const radius =
      Number(innerRadius) + (Number(outerRadius) - Number(innerRadius)) * 0.5;
    const x = Number(cx) + radius * Math.cos(-Number(midAngle) * RADIAN);
    const y = Number(cy) + radius * Math.sin(-Number(midAngle) * RADIAN);

    const label = data[index];
    if (!label) return null;

    const total = data.reduce((sum, d) => sum + d.value, 0);
    const percent = total > 0 ? (label.value / total) * 100 : 0;

    // Calculate the initial vertical shift to center the entire text block.
    // The font sizes are 14px, 12px, 12px. Let's estimate line height at 1.2x font size.
    // Line 1: 14px * 1.2 = 16.8
    // Line 2: 12px * 1.2 = 14.4
    // Line 3: 12px * 1.2 = 14.4
    // Total height is ~45.6px. The center is at ~22.8px from the top.
    // We can use `dy` to shift the first line up by half the total height.
    const initialDy = -15; // Adjusted to shift the first line up for centering

    return (
      <text
        x={x}
        y={y}
        fill="#000"
        textAnchor="middle"
        dominantBaseline="central"
      >
        <tspan
          x={x}
          dy={initialDy}
          style={{ fontSize: "14px", fontWeight: "500" }}
        >
          {label.name}
        </tspan>
        <tspan
          x={x}
          dy={18}
          style={{ fontSize: "12px", fontWeight: "normal" }}
        >
          {label.value}
        </tspan>
        <tspan
          x={x}
          dy={16}
          style={{ fontSize: "12px", fontWeight: "normal" }}
        >
          {percent.toFixed(1)}%
        </tspan>
      </text>
    );
  };

  // 👉 Compute totals & percentages dynamically
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const female = data.find((d) => d.name === "Women")?.value || 0;
  const male = data.find((d) => d.name === "Men")?.value || 0;

  const femalePercent = total > 0 ? ((female / total) * 100).toFixed(1) : "0";
  const malePercent = total > 0 ? ((male / total) * 100).toFixed(1) : "0";
  
  
  return (
    <div className="flex flex-col md:flex-row justify-between bg-gray-100 rounded-xl p-4 ">
      {/* Pie chart */}
      <div className="w-full lg:w-1/2 h-[350px] flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={115}
              cornerRadius={8}
              paddingAngle={2}
              labelLine={false}
              label={renderCustomLabel}
              startAngle={90}
              endAngle={450}
            >
              {data.map((_, index) =>
              
              
              (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any, name: string) => [`${value} (${((value / total) * 100).toFixed(1)}%)`, name]}
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Box (dynamic) */}
      <div className="w-full md:w-[250px]  md:mt-0 md:ml-4 text-sm">
        <p className="mt-25">
          <span className="font-light ">Female workforce</span> makes up{" "}
          <span className="font-semibold">{femalePercent}%</span> of employees.
        </p>
        <p className="mt-6">
          <span className="font-light">Male workforce</span> represents{" "}
          <span className="font-semibold">{malePercent}%</span>.
        </p>
        {data.some((d) => d.name === "Other") && (
          <p className="mt-2">
            <span className="font-semibold">Other genders</span> account for{" "}
            <span className="font-bold">
              {((100 - Number(femalePercent) - Number(malePercent)) || 0).toFixed(1)}%
            </span>.
          </p>
        )}
      </div>
    </div>
  );
};

export default PieChartComponent;
