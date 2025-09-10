import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, userId, updateData } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "userId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "update") {
      // Update user profile info
      if (updateData?.name || updateData?.number) {
        const { error: userError } = await supabase
          .from("users")
          .update({
            name: updateData.name,
            number: updateData.number,
          })
          .eq("id", userId);

        if (userError) throw userError;
      }

      // Update asset allocations (one row per asset)
      if (updateData?.assets?.length || updateData?.unique_assets) {
        // Clear old allocations
        const { error: delError } = await supabase
          .from("asset_allocations")
          .delete()
          .eq("user_id", userId);

        if (delError) throw delError;

        // Insert new allocations
        const newAllocations = updateData.assets.map((assetId: string) => ({
  user_id: userId,
  company_id: updateData.company_id,
  asset_id: assetId,
  unique_assets: updateData.unique_assets || null,
  allocated_on: new Date().toISOString(), // ✅ use allocated_on
}));


        const { error: insertError } = await supabase
          .from("asset_allocations")
          .insert(newAllocations);

        if (insertError) throw insertError;
      }

      // Update auth email/password
      if (updateData?.email || updateData?.password) {
        await supabase.auth.admin.updateUserById(userId, {
          email: updateData.email || undefined,
          password: updateData.password || undefined,
        });
      }

      return new Response(
        JSON.stringify({ message: "User updated successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "delete") {
      // Soft delete (mark inactive instead of hard delete)
      const { error } = await supabase
        .from("users")
        .update({ is_active: false })
        .eq("id", userId);

      if (error) throw error;

      return new Response(
        JSON.stringify({ message: "User marked as inactive successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
