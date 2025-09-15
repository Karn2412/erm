import React, { useEffect, useState, useCallback } from "react";
import ReimbursementsFilters from "../../components/reimbursements/ReimbursementsFilters";
import ReimbursementsTable from "../../components/reimbursements/ReimbursementsTable";
import { supabase } from "../../supabaseClient";

interface Employee {
  id: string;
  name: string;
  number: string;
  department_name?: string | null;
  designation?: string | null;
}

const ReimbursementsPage: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);

  // ✅ Get logged-in user & company
  useEffect(() => {
    const getCompany = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 👇 assuming company_id is stored in users table
        const { data: profile } = await supabase
          .from("users")
          .select("company_id")
          .eq("id", user.id)
          .single();

        setCompanyId(profile?.company_id || null);
      }
    };
    getCompany();
  }, []);

  const fetchEmployees = useCallback(async () => {
    if (!companyId) return;

    // Step 1: Get reimbursements for this company (skip CANCELLED)
    const { data: reimbursements, error: reimbErr } = await supabase
      .from("reimbursements")
      .select("user_id")
      .neq("status", "CANCELLED")
      .eq("company_id", companyId); // ✅ filter by company

    if (reimbErr) {
      console.error("❌ reimbursements fetch", reimbErr);
      return;
    }

    const userIds = [...new Set((reimbursements || []).map((r) => r.user_id))];
    if (userIds.length === 0) {
      setEmployees([]);
      return;
    }

    // Step 2: Get users from this company with dept + designation
    const { data: users, error: userErr } = await supabase
      .from("users")
      .select(`
        id,
        name,
        number,
        departments ( department_name ),
        designations ( designation )
      `)
      .in("id", userIds)
      .eq("company_id", companyId); // ✅ ensure users belong to same company

    if (userErr) {
      console.error("❌ users fetch", userErr);
      return;
    }

    setEmployees(
      (users || []).map((u: any) => ({
        id: u.id,
        name: u.name,
        number: u.number,
        department_name: u.departments?.department_name || null,
        designation: u.designations?.designation || null,
      }))
    );
  }, [companyId]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // 🔎 client-side search
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.number.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex">
      <div className="flex-1">
        <div className="p-6 bg-indigo-50 h-screen">
          <div className="p-3 bg-white h-screen">
            {/* Title */}
            <h2 className="text-lg font-semibold mb-4">Submissions</h2>

            {/* Filters */}
            <ReimbursementsFilters
              search={search}
              setSearch={setSearch}
              onRefresh={fetchEmployees}
            />

            {/* Table */}
            <ReimbursementsTable employees={filteredEmployees} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReimbursementsPage;
