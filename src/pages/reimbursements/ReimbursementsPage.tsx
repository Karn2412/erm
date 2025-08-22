import React, { useEffect, useState } from "react";

import ReimbursementsFilters from "../../components/reimbursements/ReimbursementsFilters";
import ReimbursementsTable from "../../components/reimbursements/ReimbursementsTable";
import { supabase } from "../../supabaseClient";

interface Employee {
  id: string;
  name: string;
  number: string;
}

const ReimbursementsPage: React.FC = () => {
  
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      // Step 1: Get reimbursements (skip CANCELLED)
      const { data: reimbursements, error: reimbErr } = await supabase
        .from("reimbursements")
        .select("user_id")
        .neq("status", "CANCELLED");

      if (reimbErr) {
        console.error("❌ reimbursements fetch", reimbErr);
        return;
      }

      const userIds = [...new Set((reimbursements || []).map((r) => r.user_id))];
      if (userIds.length === 0) return;

      // Step 2: Get users
      const { data: users, error: userErr } = await supabase
        .from("users")
        .select("id, name, number")
        .in("id", userIds);

      if (userErr) {
        console.error("❌ users fetch", userErr);
        return;
      }

      setEmployees(users || []);
    };

    fetchEmployees();
  }, []);

  return (
    <div className="flex">
      {/* <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}
      <div className="flex-1">
        {/* <Header /> */}

        <div className="p-6 bg-indigo-50 h-screen">
          <div className="p-3 bg-white h-screen">
            {/* Title */}
            <h2 className="text-lg font-semibold mb-4">Submissions</h2>

            {/* Filters */}
            <ReimbursementsFilters />

            {/* Table */}
            <ReimbursementsTable employees={employees} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReimbursementsPage;
