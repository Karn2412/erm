import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { supabase } from "../../supabaseClient";
import { useUser } from "../../context/UserContext";

const BAR_COLOR = "#94e1db";

const BarChartComponent: React.FC = () => {
  const [data, setData] = useState<{ age_range: string; value: number }[]>([]);
  const { userData } = useUser();

  useEffect(() => {
    const fetchAgeData = async () => {
      if (!userData?.company_id) return;

      const { data, error } = await supabase
        .from("age_distribution") // ✅ query the view
        .select("age_range, value")
        .eq("company_id", userData.company_id);

      if (error) {
        console.error("❌ Error fetching age data:", error);
        return;
      }

      setData(data || []);
    };

    fetchAgeData();
  }, [userData?.company_id]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 10, right: 20, left: 20, bottom: 10 }}>
        <XAxis dataKey="age_range" axisLine={false} tickLine={false} tick={{ fontSize: 14 }} />
        <YAxis hide />
        <Tooltip formatter={(value: number) => `${value}`} />
        <Bar dataKey="value" fill={BAR_COLOR} radius={[5, 5, 0, 0]} barSize={30}>
          <LabelList
            dataKey="value"
            position="top"
            style={{ fill: "#1a1a1a", fontWeight: 600, fontSize: 12 }}
          />
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={BAR_COLOR} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;
