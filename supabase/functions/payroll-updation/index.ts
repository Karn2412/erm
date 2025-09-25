/// <reference types="https://deno.land/std@0.192.0/types.d.ts" />
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // service role key for insert
);

serve(async () => {
  try {
    console.log("🚀 Starting payroll finalization process");
    
    const today = new Date();
    console.log("📅 Today's date:", today);

    const monthStr = today.toISOString().slice(0, 7); // YYYY-MM
    console.log("🗓 Month string:", monthStr);

    const monthStart = `${monthStr}-01`;
    console.log("🟢 Month start:", monthStart);

    // 1. Get live payrolls from view
    const { data: liveData, error: liveErr } = await supabase
      .from("monthly_payroll_view")
      .select(`
        user_id,
        employee_name,
        monthly_ctc,
        base_pay,
        incentives,
        reimbursements,
        deductions,
        total_pay,
        company_id
      `);

    console.log("📊 Live payroll data:", liveData);
    if (liveErr) {
      console.error("❌ Error fetching live payroll:", liveErr);
      throw liveErr;
    }

    if (!liveData || liveData.length === 0) {
      console.log("ℹ No live payroll found.");
      return new Response("No live payroll found.", { status: 200 });
    }

    // 2. Filter out already approved users
    const insertData: any[] = [];
    for (const row of liveData) {
      console.log("🔹 Processing row:", row);

      const { data: existing, error: existingErr } = await supabase
        .from("payroll_history")
        .select("id")
        .eq("user_id", row.user_id)
        .eq("company_id", row.company_id)
        .eq("month", monthStart)
        .limit(1);

      console.log("🔸 Existing payroll check:", existing, existingErr);

      if (existing && existing.length > 0) {
        console.log(`✅ Payroll already exists for user_id ${row.user_id}, skipping.`);
        continue; // skip already approved
      }

      const newRow = {
        company_id: row.company_id,
        user_id: row.user_id,
        month: monthStart,
        monthly_ctc: row.monthly_ctc,
        base_pay: row.base_pay,
        incentives: row.incentives,
        reimbursements: row.reimbursements,
        deductions: row.deductions,
        total_pay: row.total_pay,
      };

      console.log("🟢 Adding to insertData:", newRow);
      insertData.push(newRow);
    }

    if (insertData.length > 0) {
      console.log("📥 Inserting payroll records:", insertData);
      const { error } = await supabase
        .from("payroll_history")
        .insert(insertData);
      if (error) {
        console.error("❌ Error inserting payroll records:", error);
        throw error;
      }
      console.log("✅ Payroll inserted successfully.");
    } else {
      console.log("ℹ No new payrolls to insert.");
    }

    return new Response(`Payroll finalized for ${monthStr}`, { status: 200 });
  } catch (err) {
    console.error("❌ Payroll finalize error:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
});
