// src/components/staff reimbursement/StaffReimbursementTable.tsx
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../../supabaseClient";
import toast from "react-hot-toast";

interface Props {
  refresh: number;
}

interface Reimbursement {
  id: string;
  category: string;
  expense_date: string;
  description: string | null;
  amount: number;
  receipt_url: string | null;
  status: string;
  proofUrl?: string | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "APPROVED":
      return "text-green-600";
    case "REJECTED":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
};

const ReimbursementTable: React.FC<Props> = ({ refresh }) => {
  const [data, setData] = useState<Reimbursement[]>([]);

  async function fetchData() {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth?.user?.id;
    if (!uid) return;

    const { data, error } = await supabase
      .from("reimbursements")
      .select("id, category, expense_date, description, amount, receipt_url, status")
      .eq("user_id", uid)
      .order("expense_date", { ascending: false });

    if (error) {
      console.error("❌ fetch reimbursements", error);
      return;
    }

    const withUrls = await Promise.all(
      (data || []).map(async (item) => {
        if (item.receipt_url) {
          const { data: signed } = await supabase.storage
            .from("reimbursement")
            .createSignedUrl(item.receipt_url, 60 * 60 * 24);
          return { ...item, proofUrl: signed?.signedUrl };
        }
        return { ...item, proofUrl: null };
      })
    );

    setData(withUrls);
  }

  useEffect(() => {
    fetchData();
  }, [refresh]);

  // Delete
  async function handleDelete(id: string) {
    const { error } = await supabase.from("reimbursements").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete reimbursement");
      return;
    }
    toast.success("Reimbursement deleted");
    fetchData();
  }

  // Edit
  async function handleEdit(item: Reimbursement) {
    const newAmount = prompt("Enter new amount:", String(item.amount));
    if (!newAmount) return;

    const { error } = await supabase
      .from("reimbursements")
      .update({ amount: Number(newAmount) })
      .eq("id", item.id)
      .eq("status", "PENDING");

    if (error) {
      toast.error("Failed to update reimbursement");
      return;
    }
    toast.success("Reimbursement updated");
    fetchData();
  }

  // ✅ Check if at least one row is pending → controls header + layout
  const hasPending = useMemo(() => data.some((item) => item.status === "PENDING"), [data]);

  return (
    <div className="bg-white mt-8 rounded-2xl shadow-sm p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800  pb-2">
        Previous Submissions
      </h3>

      {/* Table Header */}
      <div
        className={`grid ${
          hasPending ? "grid-cols-9" : "grid-cols-7"
        } text-xs font-semibold text-gray-600 px-4 py-2`}
      >
        <div>Sl No</div>
        <div>Type</div>
        <div>Date</div>
        <div>Description</div>
        <div>Amount</div>
        <div>Proof</div>
        <div>Status</div>
        {hasPending && <div>Edit</div>}
        {hasPending && <div>Delete</div>}
      </div>

      {/* Table Rows */}
      <div className="mt-2 space-y-3">
        {data.map((item, i) => {
          const showActions = item.status === "PENDING";
          return (
            <div
              key={item.id}
              className={`grid ${
                hasPending ? "grid-cols-9" : "grid-cols-7"
              } items-center px-4 py-3 text-sm rounded-xl bg-gray-50 shadow-sm hover:shadow-md transition`}
            >
              <div>{i + 1}</div>
              <div className="font-medium">{item.category}</div>
              <div>{new Date(item.expense_date).toLocaleDateString()}</div>
              <div className="truncate text-gray-600">{item.description || "-"}</div>
              <div className="font-semibold">₹{item.amount}</div>
              <div>
                {item.proofUrl ? (
                  <a
                    href={item.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    View
                  </a>
                ) : (
                  "-"
                )}
              </div>
              <div className={`font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </div>

              {/* Action Buttons */}
              {hasPending && (
                <>
                  <div>
                    {showActions && (
                      <button
                        onClick={() => handleEdit(item)}
                        className="px-3 py-1 text-xs rounded-full bg-yellow-200 hover:bg-yellow-300 text-yellow-800"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  <div>
                    {showActions && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-1 text-xs rounded-full bg-red-200 hover:bg-red-300 text-red-800"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}

        {data.length === 0 && (
          <div className="text-center py-6 text-gray-500 text-sm">
            No submissions yet
          </div>
        )}
      </div>
    </div>
  );
};

export default ReimbursementTable;
