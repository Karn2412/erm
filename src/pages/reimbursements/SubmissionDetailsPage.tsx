import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

import EmployeeDetailsCard from '../../components/reimbursements/EmployeeDetailsCard';
import SubmissionTable from '../../components/reimbursements/SubmissionTable';

interface SubmissionItem {
  id: string;
  type: string;
  date: string;
  description: string;
  amount: number;
  proof?: string;
  status: string;
}

interface Employee {
  name: string;
  department: string;
  avatar: string;
}

const SubmissionDetailsPage: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const [reimbursements, setReimbursements] = useState<SubmissionItem[]>([]);
  const [employee, setEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    async function fetchEmployee() {
      const { data, error } = await supabase
        .from("users")
        .select("name, departments(department_name)")
        .eq("id", employeeId)
        .single();

      if (error) {
        console.error("❌ fetch employee", error);
        return;
      }

      setEmployee({
        name: data.name,
        department: data.departments?.department_name || "-",
        avatar: "https://www.pngplay.com/wp-content/uploads/12/User-Avatar-Profile-Transparent-Free-PNG-Clip-Art.png",
      });
      console.log("✅ Employee data fetched:", data);
    }

    async function fetchSubmissions() {
      const { data, error } = await supabase
        .from("reimbursements")
        .select("id, category, expense_date, description, amount, receipt_url, status")
        .eq("user_id", employeeId)
        .order("expense_date", { ascending: false });

      if (error) {
        console.error("❌ fetch submissions", error);
        return;
      }

      setReimbursements(
        (data || []).map((r) => ({
          id: r.id,
          type: r.category,
          date: r.expense_date,
          description: r.description,
          amount: r.amount,
          proof: r.receipt_url,
          status: r.status,
        }))
      );
    }

    if (employeeId) {
      fetchEmployee();
      fetchSubmissions();
    }
  }, [employeeId]);

  return (
    <div className="flex">
      <div className="flex-1">
        <div className="p-4">
          {/* Page Heading */}
          <h2 className="text-lg font-semibold mb-4">
            Reimbursement Submissions {employee ? `for ${employee.name}` : ""}
          </h2>

          <div className="p-6 bg-indigo-50 rounded-xl">
            {/* Employee Info */}
            {employee && (
              <EmployeeDetailsCard
                name={employee.name}
                department={employee.department}
                avatar={employee.avatar}
              />
            )}

            {/* Table */}
            <SubmissionTable data={reimbursements} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailsPage;
