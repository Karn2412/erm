import React, { useState } from "react";
import PayRunsFilters from "../../components/payruns/PayRunsFilters";
import PayRunsTable from "../../components/payruns/PayRunsTable";

const PayRunsPageAdmin: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );
  const [payRange, setPayRange] = useState<string>("All");
  const [search, setSearch] = useState<string>("");

  return (
    <div className="flex">
      <div className="flex-1">
        <div className="p-9 bg-indigo-50 ">
          <div className="bg-white p-5 rounded-2xl" >
            <h2 className="text-lg font-semibold mb-4">Upcoming Pay Runs</h2>

            {/* pass props */}
            <PayRunsFilters
              selectedMonth={selectedMonth}
              setSelectedMonth={setSelectedMonth}
              payRange={payRange}
              setPayRange={setPayRange}
              search={search}
              setSearch={setSearch}
            />
            <PayRunsTable
              selectedMonth={selectedMonth}
              payRange={payRange}
              search={search}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayRunsPageAdmin;
