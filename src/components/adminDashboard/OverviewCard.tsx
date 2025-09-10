import React, { useEffect, useState } from "react";
import { HiUsers, HiUserPlus, HiUserMinus } from "react-icons/hi2";
import { HiTrendingDown } from "react-icons/hi";
import { supabase } from "../../supabaseClient";

interface Props {
  title: string;
  color: string;
  queryKey: "totalEmployees" | "newJoinees" | "attritionRate" | "exists";
}

const OverviewCard: React.FC<Props> = ({ title, color, queryKey }) => {
  const [value, setValue] = useState<string>("0");

  const getIcon = () => {
    switch (queryKey) {
      case "totalEmployees":
        return <HiUsers className="mt-2 w-6 h-6 text-gray-600" />;
      case "newJoinees":
        return <HiUserPlus className="mt-2 w-6 h-6 text-gray-600" />;
      case "attritionRate":
        return <HiTrendingDown className="mt-2 w-6 h-6 text-gray-600" />;
      case "exists":
        return <HiUserMinus className="mt-2 w-6 h-6 text-gray-600" />;
      default:
        return <HiUsers className="mt-2 w-6 h-6 text-gray-600" />;
    }
  };

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
          .from("users")
          .select("company_id")
          .eq("id", userId)
          .single();

        if (userError) {
          console.error("Error fetching company_id:", userError.message);
          return;
        }
        if (!user) return;

        // ✅ 3. Query company stats view (now includes exits)
        const { data: stats, error: statsError } = await supabase
          .from("company_employee_stats")
          .select("total_employees, new_joinees, exits, attrition_rate")
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
        if (queryKey === "exists") result = stats.exits ?? 0;
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
    <div className={`p-4 rounded-2xl shadow-sm ${color}`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex flex-col">
          <p className="text-sm text-gray-600">{title}</p>
          <div className="text-xl font-bold">{value}</div>
        </div>
      </div>
    </div>
  );
};

export default OverviewCard;
