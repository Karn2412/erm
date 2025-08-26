import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient"; // adjust import path

interface Props {
  title: string;
  color: string;
  queryKey: "totalEmployees" | "newJoinees" | "attritionRate";
}

const OverviewCard: React.FC<Props> = ({ title, color, queryKey }) => {
  const [value, setValue] = useState<string>("0");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ 1. Get logged in user
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        // ✅ 2. Find the company_id of this user
        const { data: user, error: userError } = await supabase
          .from("user_with_email")
          .select("company_id")
          .eq("auth_id", userId)
          .single();

        if (userError) {
          console.error("Error fetching company_id:", userError.message);
          return;
        }
        if (!user) return;

        // ✅ 3. Query company stats view
        const { data: stats, error: statsError } = await supabase
          .from("company_employee_stats")
          .select("total_employees, new_joinees, attrition_rate")
          .eq("company_id", user.company_id)
          .single();

        if (statsError) {
          console.error("Error fetching stats:", statsError.message);
          return;
        }
        if (!stats) return;

        // ✅ 4. Assign correct value
        let result: string | number = "0";
        if (queryKey === "totalEmployees") result = stats.total_employees ?? 0;
        if (queryKey === "newJoinees") result = stats.new_joinees ?? 0;
        if (queryKey === "attritionRate") result = stats.attrition_rate ?? "0%";

        setValue(result.toString());
      } catch (err) {
        console.error("Error fetching data:", err);
        setValue("0");
      }
    };

    fetchData();
  }, [queryKey]);

  return (
    <div className={`p-4 rounded shadow-sm ${color}`}>
      <p className="text-sm text-gray-600">{title}</p>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
};

export default OverviewCard;
