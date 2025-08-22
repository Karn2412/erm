import React, { useEffect, useState } from 'react';

import EmployeeDetailsCard from '../../components/reimbursements/EmployeeDetailsCard';
import SubmissionTable from '../../components/reimbursements/SubmissionTable';
import { useParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';



const SubmissionDetailsPage: React.FC = () => {
  // const [sidebarOpen, setSidebarOpen] = useState(false);
   const { employeeId } = useParams<{ employeeId: string }>();
const [reimbursements, setReimbursements] = useState<SubmissionItem[]>([]);

useEffect(() => {
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
      (data || []).map((r, i) => ({
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

  fetchSubmissions();
}, [employeeId]);

   
      

  return (
    <div className="flex">
      {/* <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}
      <div className="flex-1">
        {/* <Header /> */}

        <div className="p-4">
          {/* Page Heading */}
          <h2 className="text-lg font-semibold mb-4">Submissions</h2>

          <div className='p-6 bg-indigo-50'>
            {/* Employee Info */}
          <EmployeeDetailsCard
            name="Corey Baptista"
            department="Ostrobyte Overseas"
            designation="UI UX Designer"
            avatar="https://randomuser.me/api/portraits/men/32.jpg"
          />

          {/* Table */}
          <SubmissionTable data={reimbursements} />
          </div>
           
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetailsPage;
