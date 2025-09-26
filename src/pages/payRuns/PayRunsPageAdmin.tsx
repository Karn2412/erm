// PayRunsPageAdmin.tsx — use this to replace your current parent file
import React, { useEffect, useState } from "react";
import PayRunsFilters from "../../components/payruns/PayRunsFilters";
import PayRunsTable from "../../components/payruns/PayRunsTable";
import { supabase } from "../../supabaseClient";

const PayRunsPageAdmin: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [payRange, setPayRange] = useState<string>("All");
  const [search, setSearch] = useState<string>("");

  // NEW: store the logged-in admin's company id
  const [companyId, setCompanyId] = useState<string | undefined>(undefined);
  const [loadingCompany, setLoadingCompany] = useState(true);

  useEffect(() => {
    const loadCompanyForAdmin = async () => {
      try {
        setLoadingCompany(true);
        // get current user session
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.warn("No logged-in user found");
          setCompanyId(undefined);
          setLoadingCompany(false);
          return;
        }

        // Adjust this query if your user_roles table uses a different PK column
        // In your earlier code you fetched company_id with .from('user_roles').select('company_id').eq('id', employee.id)
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("company_id")
          .eq("id", user.id) // assumes user.id is the same id used in user_roles
          .single();

        if (roleError) {
          console.error("Error fetching user role/company:", roleError);
          setCompanyId(undefined);
        } else {
          setCompanyId(roleData?.company_id || undefined);
        }
      } catch (err) {
        console.error("Failed to load company for logged admin:", err);
        setCompanyId(undefined);
      } finally {
        setLoadingCompany(false);
      }
    };

    loadCompanyForAdmin();
  }, []);

  // optional: render a loading state while company is resolved
  if (loadingCompany) {
    return (
      <div className="p-6">
        <p>Loading company context...</p>
      </div>
    );
  }

  return (
    <div className="flex">
      <div className="flex-1">
        <div className="p-9 bg-indigo-50">
          <div className="bg-white p-5 rounded-2xl">
            <h2 className="text-lg font-semibold mb-4">Pay Runs</h2>

            {/* Filters */}
            <PayRunsFilters
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              payRange={payRange}
              setPayRange={setPayRange}
              search={search}
              setSearch={setSearch}
              companyId={companyId}
            />

            {/* NO company picker shown — we pass the logged-in admin's companyId */}
            <PayRunsTable
              selectedMonth={selectedMonth}
              payRange={payRange}
              search={search}
              companyId={companyId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayRunsPageAdmin;
