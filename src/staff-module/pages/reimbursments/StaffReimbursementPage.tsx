// src/pages/staff/ReimbursementPage.tsx
import React, { useState } from 'react';

import ReimbursementTable from '../../components/staff reimbursement/StaffReimbursementTable';
import { supabase } from '../../../supabaseClient';
import toast, { Toaster } from 'react-hot-toast';

const ReimbursementPage: React.FC = () => {


  // Form state
  const [type, setType] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [refresh, setRefresh] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id;
      if (!userId) {
        toast.error("Not logged in");
        return;
      }

      // get company_id
      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("company_id")
        .eq("id", userId)
        .single();
      if (userErr) throw userErr;

      let receiptPath: string | null = null;

      // Upload proof if provided
      if (file) {
        const filePath = `${userId}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage
          .from("reimbursement") // ✅ correct bucket
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadErr) throw uploadErr;
        receiptPath = filePath; // store path only
      }

      // Insert into DB
      const { error } = await supabase.from("reimbursements").insert([
        {
          company_id: userData.company_id,
          user_id: userId,
          expense_date: expenseDate,
          category: type,
          description,
          amount: Number(amount),
          receipt_url: receiptPath, // store path only
          status: "PENDING",
        },
      ]);

      if (error) throw error;

      toast.success("Reimbursement submitted ✅");
      setType("");
      setExpenseDate("");
      setAmount("");
      setDescription("");
      setFile(null);
      setRefresh(r => r + 1);
    } catch (err: any) {
      console.error("❌ Submit reimbursement", err);
      toast.error("Failed to submit reimbursement");
    }
  }

  return (
    
    <div className="flex flex-col w-full">
        {/* <StaffSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} /> */}
        {/* <Header /> */}
        <main className="p-6">
          <Toaster />

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white p-6 rounded-3xl shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Type of Reimbursement <span className="text-red-500">*</span>
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full border border-blue-400 rounded-full px-4 py-2 text-sm outline-none"
                  required
                >
                  <option value="">Please pick a type</option>
                  <option value="Travel">Travel</option>
                  <option value="Supplies">Supplies</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Expense Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  required
                  className="w-full border border-blue-400 rounded-full px-4 py-2 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full border border-blue-400 rounded-full px-4 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                className="w-full border border-blue-400 rounded-2xl px-4 py-2 text-sm outline-none"
                rows={3}
                placeholder="Description..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700">
                Upload Proof
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="text-sm"
              />
            </div>

            <div className="text-end">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-2 text-sm rounded-full hover:bg-green-700"
              >
                Apply For Reimbursement
              </button>
            </div>
          </form>

          {/* Table */}
          <div className="mt-6">
            <ReimbursementTable refresh={refresh} />
          </div>
        </main>
      </div>
    
  );
};

export default ReimbursementPage;
