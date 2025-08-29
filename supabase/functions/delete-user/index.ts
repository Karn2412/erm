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
      if (updateData?.name || updateData?.number) {
        await supabase
          .from("users")
          .update({
            name: updateData.name,
            number: updateData.number,
          })
          .eq("id", userId);
      }
   if (updateData?.assets || updateData?.unique_assets) {
  const { error: assetError } = await supabase
    .from("asset_allocations")
    .upsert(
      {
        user_id: userId,
        company_id: updateData.company_id,
        assets: updateData.assets || [],
        unique_assets: updateData.unique_assets || null,
        created_at: new Date().toISOString(),
      },
      { onConflict: "user_id" } // 👈 works only if user_id is unique
    );

  if (assetError) throw assetError;
}





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
      const { data: personal } = await supabase
        .from("personal_details")
        .select("documents")
        .eq("id", userId)
        .maybeSingle();

      if (personal?.documents) {
        const paths = personal.documents.map((doc: any) =>
          decodeURIComponent(
            doc.url.split("/storage/v1/object/public/usersdocuments/")[1],
          )
        );
        if (paths.length > 0) {
          await supabase.storage.from("usersdocuments").remove(paths);
        }
      }

      await supabase.from("personal_details").delete().eq("id", userId);
      await supabase.from("users").delete().eq("id", userId);
      await supabase.auth.admin.deleteUser(userId);

      return new Response(
        JSON.stringify({ message: "User deleted successfully" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
