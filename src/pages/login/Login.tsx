import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleType, setRoleType] = useState<"admin" | "staff">("admin"); // ✅ Role toggle
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { setUserData } = useUser();

  const handleLogin = async () => {
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    const userId = data.user.id;

    // ✅ Check if user exists in users table
    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !userRecord) {
      setError("You are not registered as a user.");
      return;
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("id, company_id, roles(role)")
      .eq("id", userId)
      .single();

    if (roleError || !roleData) {
      setError("Role not assigned. Contact admin.");
      return;
    }

    // Handle both single object and array cases
    interface RoleType {
      role: string;
    }
    const rolesData = roleData.roles as RoleType | RoleType[];
    const actualRole = Array.isArray(rolesData) ? rolesData[0]?.role : rolesData?.role;
    console.log(actualRole);

    // ✅ Check if selected role matches actual role
    if (roleType === "admin" && actualRole !== "admin") {
      setError("You are not an Admin.");
      return;
    }
    if (roleType === "staff" && actualRole === "admin") {
      setError("You cannot log in as Staff.");
      return;
    }

    // ✅ Save user data
    setUserData({
      ...userRecord,
      role: actualRole,
      company_id: roleData.company_id,
    });

    // ✅ Redirect based on roleType
    if (roleType === "admin") {
      navigate("/dashboard");
    } else {
      navigate("/staff/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 relative">
      {/* Glow effect */}
      <div className="absolute w-[300px] h-[300px] rounded-full bg-indigo-200 opacity-40 blur-3xl animate-pulse" />

      {/* Login Card */}
      <div className="bg-white rounded-3xl shadow-xl px-10 py-10 z-10 w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign In</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter your credentials to access your account
        </p>




        {/* Email Input */}
        <div className="mb-4 text-left">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your Email"
            className="w-full px-4 py-2 rounded-lg bg-gray-100 text-sm outline-none"
          />
        </div>

        {/* Password Input */}
        <div className="mb-4 text-left">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your Password"
            className="w-full px-4 py-2 rounded-lg bg-gray-100 text-sm outline-none"
          />
        </div>

        {/* Role Selection */}

        <div className="flex justify-center gap-4 mb-6">
          {["admin", "staff"].map((r) => (
            <button
              key={r}
              onClick={() => setRoleType(r as "admin" | "staff")}
              className={`px-6 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${roleType === r
                  ? "bg-[#002B5B] text-white border-[#002B5B]"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
            >
              {r === "admin" ? "Admin Login" : "Staff Login"}
            </button>
          ))}
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-[#002B5B] text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-900 transition"
        >
          Login
        </button>

        {error && (
          <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
        )}

        <p className="text-xs text-gray-600 mt-4">
          Don’t have an account? Contact your administrator
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
