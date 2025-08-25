/// <reference types="https://deno.land/std@0.192.0/types.d.ts" />
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function withCors(res: Response): Response {
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  return res;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // ✅ Verify JWT
    const authHeader = req.headers.get("Authorization");
    const jwt = authHeader?.replace("Bearer ", "");
    if (!jwt) {
      return withCors(new Response(JSON.stringify({ error: "Unauthorized: Missing Bearer token" }), { status: 401 }));
    }

    const { data: authUser, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !authUser?.user?.id) {
      return withCors(new Response(JSON.stringify({ error: "Invalid Token" }), { status: 401 }));
    }

    // ✅ Fetch admin's company_id
    const { data: admin, error: adminError } = await supabase
      .from("user_roles")
      .select("company_id, roles(role)")
      .eq("id", authUser.user.id)
      .single();

    if (adminError || !admin) {
      return withCors(new Response(JSON.stringify({ error: "Could not fetch admin role", details: adminError?.message }), { status: 403 }));
    }

    if (admin.roles.role !== "admin") {
      return withCors(new Response(JSON.stringify({ error: "Not an Admin" }), { status: 403 }));
    }

    if (!admin.company_id) {
      return withCors(new Response(JSON.stringify({ error: "Admin has no company_id assigned" }), { status: 400 }));
    }

    const adminCompanyId = admin.company_id;

    // ✅ Parse Request Body
    const body = await req.json();
    const { email, password, name, number, role_name, gender_id, department_id } = body;

    // Validate fields
    if (!email || !password || !name || !number) {
      return withCors(new Response(JSON.stringify({ error: "Missing required fields: email, password, name, number" }), { status: 400 }));
    }

    if (!gender_id) {
      return withCors(new Response(JSON.stringify({ error: "gender_id is required" }), { status: 400 }));
    }

    if (!department_id) {
      return withCors(new Response(JSON.stringify({ error: "department_id is required" }), { status: 400 }));
    }

    // ✅ Create Auth User
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userError || !userData?.user?.id) {
      console.error("Auth Create User Error:", userError);
      return withCors(new Response(JSON.stringify({ error: "Auth user creation failed", details: userError?.message }), { status: 500 }));
    }

    const newUserId = userData.user.id;

    // ✅ Insert into users table
    const { error: insertError } = await supabase.from("users").insert([
      {
        id: newUserId,
        name,
        number,
        company_id: adminCompanyId,
        gender_id,
        department_id,
      },
    ]);

    if (insertError) {
      console.error("Insert Error:", insertError);
      return withCors(new Response(JSON.stringify({ error: "User insert failed", details: insertError.message }), { status: 500 }));
    }

    // ✅ Fetch the correct role_id (admin or staff)
    const selectedRole = role_name === "admin" ? "admin" : "staff";
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .select("id")
      .eq("role", selectedRole)
      .single();

    if (roleError || !roleData) {
      return withCors(new Response(JSON.stringify({ error: "Role not found in roles table", details: roleError?.message }), { status: 400 }));
    }

    // ✅ Assign role to the new user
    const { error: userRoleError } = await supabase.from("user_roles").insert([
      {
        id: newUserId,
        company_id: adminCompanyId,
        role_id: roleData.id,
      },
    ]);

    if (userRoleError) {
      console.error("User Role Insert Error:", userRoleError);
      return withCors(new Response(JSON.stringify({ error: "Failed to assign user role", details: userRoleError.message }), { status: 500 }));
    }

    return withCors(
      new Response(
        JSON.stringify({
          message: "✅ User Created & Role Assigned",
          user_id: newUserId,
          role: selectedRole,
        }),
        { status: 200 }
      )
    );
  } catch (err) {
    console.error("Unexpected Error:", err);
    return withCors(new Response(JSON.stringify({ error: "Unexpected server error", details: String(err) }), { status: 500 }));
  }
});
