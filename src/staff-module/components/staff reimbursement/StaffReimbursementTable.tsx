import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../../../supabaseClient";

import { FaEye } from "react-icons/fa";

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
    case "PENDING":
      return "text-yellow-600";
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

  // Add functions above return()
const handleEdit = (item: Reimbursement) => {
  console.log("Editing reimbursement:", item);
  // 👉 Here you can open a modal or form pre-filled with item data
};

const handleDelete = async (id: string) => {
  if (!confirm("Are you sure you want to delete this reimbursement?")) return;

  const { error } = await supabase.from("reimbursements").delete().eq("id", id);

  if (error) {
    console.error("❌ Error deleting reimbursement", error);
    return;
  }

  // Refresh the list
  fetchData();
};


  useEffect(() => {
    fetchData();
  }, [refresh]);

  const hasPending = useMemo(() => data.some((item) => item.status === "PENDING"), [data]);

  return (
    <div className="bg-gray-50 mt-8 rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 pb-2">
        Previous Submissions
      </h3>

      {/* Header */}
      <div
        className={`grid ${
          hasPending ? "grid-cols-9" : "grid-cols-7"
        } text-xs font-semibold text-gray-600 px-4 py-2`}
      >
        <div>Sl no</div>
        <div>Type</div>
        <div>Expense Date</div>
        <div>Description</div>
        <div>Amount</div>
        <div>Proof</div>
        <div>Status</div>
        {hasPending && <div>Edit</div>}
        {hasPending && <div>Delete</div>}
      </div>

      {/* Rows */}
      <div className="mt-2 space-y-3">
        {data.map((item, i) => {
          const showActions = item.status === "PENDING";

          return (
            <div
              key={item.id}
              className={`grid ${
                hasPending ? "grid-cols-9" : "grid-cols-7"
              } items-center px-4 py-3 text-sm rounded-xl transition 
              ${i % 2 === 0 ? "bg-indigo-50" : "bg-blue-50"}`}
            >
              <div>{i + 1}</div>
              <div className="font-medium">{item.category}</div>
              <div>{new Date(item.expense_date).toLocaleDateString()}</div>
              <div className="truncate text-gray-600">{item.description || "-"}</div>
              <div className="font-semibold">{item.amount}</div>
              <div className="">
                {item.proofUrl ? (
                  <a
                    href={item.proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 border border-blue-400 px-2 py-1 rounded-md text-blue-700 hover:bg-blue-50"
                  >
                    View <FaEye />
                  </a>
                ) : (
                  "-"
                )}
              </div>
              <div className={`font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </div>

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
