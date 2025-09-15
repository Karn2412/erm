import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";



interface Props {
  userId: string;
  month: string; // YYYY-MM
  onClose: () => void;
  companyId?: string; // optional, for future use
}

interface PayRunDetail {
  monthly_ctc: number;
  daily_expected_hours: number;
  total_worked_hours: number;
  base_pay: number;
  deductions: number;
  incentives: number;
  reimbursements: number;
  total_pay: number;

}

interface Adjustment {
  id: string;
  type: "DEDUCTION" | "INCENTIVE" | "REIMBURSEMENT";
  amount: number;
  note: string | null;
  created_at: string;
}

const PayRunDetailsModal: React.FC<Props> = ({ userId, month, onClose }) => {
  const [details, setDetails] = useState<PayRunDetail | null>(null);
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [form, setForm] = useState({ type: "INCENTIVE", amount: 0, note: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    fetchDetails();
    fetchAdjustments();
  }, [userId, month]);

  const fetchDetails = async () => {
    const { data, error } = await supabase
      .from("monthly_payroll_view")
      .select(
        "monthly_ctc, daily_expected_hours, total_worked_hours, base_pay, deductions, incentives, reimbursements, total_pay"
      )
      .eq("user_id", userId)
      .eq("month", `${month}-01`)
      .single();

    if (!error && data) setDetails(data);
  };

const fetchAdjustments = async () => {
  const { data, error } = await supabase
    .from("payroll_adjustments")
    .select("id, type, amount, note, created_at")
    .eq("user_id", userId)
    .eq("month", `${month}-01`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Fetch error:", error);
    return;
  }

  setAdjustments(data || []);
};



const handleAddOrUpdate = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  // ✅ fetch the real company_id for this user
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", userId)
    .single();

  if (userError || !userRow) {
    console.error("❌ Could not fetch company_id:", userError);
    setLoading(false);
    return;
  }

  if (editId) {
    // update
    const { error } = await supabase
      .from("payroll_adjustments")
      .update({
        type: form.type,
        amount: form.amount,
        note: form.note || null,
      })
      .eq("id", editId);

    if (error) console.error("❌ Update error:", error);
    setEditId(null);
  } else {
    // insert
    const { error } = await supabase.from("payroll_adjustments").insert([
      {
        company_id: userRow.company_id, // ✅ real UUID now
        user_id: userId,
        month: `${month}-01`,
        type: form.type,
        amount: form.amount,
        note: form.note || null,
      },
    ]);

    if (error) console.error("❌ Insert error:", error);
  }

  setLoading(false);
  setForm({ type: "INCENTIVE", amount: 0, note: "" });
  fetchDetails();
  fetchAdjustments();
};




  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this adjustment?")) return;

    const { error } = await supabase
      .from("payroll_adjustments")
      .delete()
      .eq("id", id);

    if (error) console.error("❌ Delete error:", error);

    fetchDetails();
    fetchAdjustments();
  };

  const handleEdit = (adj: Adjustment) => {
    setForm({
      type: adj.type,
      amount: adj.amount,
      note: adj.note || "",
    });
    setEditId(adj.id);
  };

  if (!details) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"  style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="bg-white rounded-lg shadow-lg p-6 w-[750px] max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Pay Run Details</h2>

        {/* Salary Summary */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>Monthly CTC: ₹{details.monthly_ctc}</div>
          <div>Worked Hours: {details.total_worked_hours}</div>
          <div>Expected Hours/Day: {details.daily_expected_hours}</div>
          <div>Base Pay: ₹{details.base_pay}</div>
          <div className="text-red-600">Deductions: ₹{details.deductions}</div>
          <div className="text-green-600">Incentives: ₹{details.incentives}</div>
          <div className="text-blue-600">
            Reimbursements: ₹{details.reimbursements}
          </div>
          <div className="font-bold">Total Pay: ₹{details.total_pay}</div>
        </div>

        {/* Adjustments List */}
        <h3 className="text-md font-semibold mb-2">Adjustments</h3>
        {adjustments.length > 0 ? (
          <table className="w-full text-sm border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Type</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Note</th>
                <th className="p-2">Date</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((adj) => (
                <tr key={adj.id} className="border-t">
                  <td className="p-2">{adj.type}</td>
                  <td className="p-2">₹{adj.amount}</td>
                  <td className="p-2">{adj.note || "--"}</td>
                  <td className="p-2">
                    {new Date(adj.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => handleEdit(adj)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => handleDelete(adj.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-500 mb-4">No adjustments yet.</p>
        )}

        {/* Add/Edit Adjustment Form */}
        <h3 className="text-md font-semibold mb-2">
          {editId ? "Edit Adjustment" : "Add Adjustment"}
        </h3>
        <form onSubmit={handleAddOrUpdate} className="flex gap-3 mb-6">
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="border rounded px-2 py-1"
          >
            <option value="INCENTIVE">Incentive</option>
            <option value="DEDUCTION">Deduction</option>
            <option value="REIMBURSEMENT">Reimbursement</option>
          </select>
          <input
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm({ ...form, amount: parseFloat(e.target.value) })
            }
            placeholder="Amount"
            className="border rounded px-2 py-1 w-28"
            required
          />
          <input
            type="text"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
            placeholder="Note"
            className="border rounded px-2 py-1 flex-1"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-500 text-white px-4 py-1 rounded hover:bg-indigo-600"
          >
            {loading ? "Saving..." : editId ? "Update" : "Add"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm({ type: "INCENTIVE", amount: 0, note: "" });
              }}
              className="bg-gray-300 px-4 py-1 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          )}
        </form>

        <button
          onClick={onClose}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PayRunDetailsModal; 