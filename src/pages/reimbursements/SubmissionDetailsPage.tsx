import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../../supabaseClient";

import EmployeeDetailsCard from "../../components/reimbursements/EmployeeDetailsCard";
import SubmissionTable from "../../components/reimbursements/SubmissionTable";

interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  avatar: string;
}

interface SubmissionItem {
  id: string;
  type: string;
  date: string;
  description: string;
  amount: number;
  proof?: string;
  status: string;
}

const SubmissionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([]);

  /** 🔹 Fetch employee details */
  const fetchEmployeeDetails = useCallback(async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from("users")
      .select(`
        id,
        name,
        number,
        departments ( department_name ),
        designations ( designation )
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("❌ employee fetch", error);
      return;
    }

    setEmployee({
      id: data.id,
      name: data.name,
      department: (data.departments as any)?.department_name || "-",
      designation: (data.designations as any)?.designation || "-",
      avatar:
        "https://img.freepik.com/premium-vector/default-avatar-profile-icon-social-media-user-image-gray-avatar-icon-blank-profile-silhouette-vector-illustration_561158-3485.jpg?w=1380",
    });
  }, [id]);

  /** 🔹 Fetch reimbursements table submissions */
  const fetchSubmissions = useCallback(async () => {
    if (!id) return [];

    const { data, error } = await supabase
      .from("reimbursements")
      .select("id, category, expense_date, description, amount, receipt_url, status")
      .eq("user_id", id)
      .neq("status", "CANCELLED");

    if (error) {
      console.error("❌ reimbursements fetch", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      type: item.category === "REIMBURSEMENT" ? "Manual Reimbursement" : item.category,
      date: item.expense_date,
      description: item.description,
      amount: item.amount,
      proof: item.receipt_url,
      status: item.status,
    }));
  }, [id]);

  /** 🔹 Fetch payroll adjustments reimbursements */
  const fetchPayrollAdjustments = useCallback(async () => {
    if (!id) return [];

    const { data, error } = await supabase
      .from("payroll_adjustments")
      .select("id, type, month, amount, note, created_at")
      .eq("user_id", id)
      .eq("type", "REIMBURSEMENT");

    if (error) {
      console.error("❌ payroll adjustments fetch", error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      type: "Manual Reimbursement", // ✅ force display name
      date: item.month, // payroll month
      description: item.note || "-",
      amount: item.amount,
      proof: undefined, // payroll adjustments don't have proof
      status: "APPROVED", // default since payroll adjustments are admin added
    }));
  }, [id]);

  /** 🔹 Merge both sources */
  useEffect(() => {
    const fetchAll = async () => {
      await fetchEmployeeDetails();

      const [fromReimbursements, fromAdjustments] = await Promise.all([
        fetchSubmissions(),
        fetchPayrollAdjustments(),
      ]);

      setSubmissions([
        ...(fromReimbursements || []),
        ...(fromAdjustments || []),
      ]);
    };

    fetchAll();
  }, [fetchEmployeeDetails, fetchSubmissions, fetchPayrollAdjustments]);

  return (
    <div className="p-6 bg-indigo-50 min-h-screen">
      <div className="p-6 bg-white rounded-xl h-full ">
        {/* Title */}
        <h2 className="text-lg font-semibold mb-4">Submissions</h2>
        <div className="bg-gray-50 rounded-xl">
          {/* Employee Details */}
          {employee && (
            <EmployeeDetailsCard
              name={employee.name}
              department={employee.department}
              designation={employee.designation}
              avatar={employee.avatar}
            />
          )}

          {/* Submissions Table */}
          <SubmissionTable data={submissions} />
        </div>
      </div>
    </div>
  );
};

export default SubmissionPage;
