import React, { useState } from "react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [roleType, setRoleType] = useState<"admin" | "staff">("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // ✅ loading state
  const [showPassword, setShowPassword] = useState(false); // ✅ toggle password
  const navigate = useNavigate();
  const { setUserData } = useUser();

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const userId = data.user.id;

    const { data: userRecord, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !userRecord) {
      setError("You are not registered as a user.");
      setLoading(false);
      return;
    }

    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("id, company_id, roles(role)")
      .eq("id", userId)
      .single();

    if (roleError || !roleData) {
      setError("Role not assigned. Contact admin.");
      setLoading(false);
      return;
    }

    interface RoleType {
      role: string;
    }
    const rolesData = roleData.roles as RoleType | RoleType[];
    const actualRole = Array.isArray(rolesData) ? rolesData[0]?.role : rolesData?.role;

    if (roleType === "admin" && actualRole !== "admin") {
      setError("You are not an Admin.");
      setLoading(false);
      return;
    }
    if (roleType === "staff" && actualRole === "admin") {
      setError("You cannot log in as Staff.");
      setLoading(false);
      return;
    }

    setUserData({
      ...userRecord,
      role: actualRole,
      company_id: roleData.company_id,
    });

    setLoading(false);

    if (roleType === "admin") {
      navigate("/dashboard");
    } else {
      navigate("/staff/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 relative">
      <div className="absolute w-[300px] h-[300px] rounded-full bg-indigo-200 opacity-40 blur-3xl animate-pulse" />

      <div className="bg-white rounded-3xl shadow-xl px-10 py-10 z-10 w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Sign In</h2>
        <p className="text-sm text-gray-600 mb-4">
          Enter your credentials to access your account
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
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

          {/* Password Input with Eye Icon */}
          <div className="mb-4 text-left relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your Password"
              className="w-full px-4 py-2 rounded-lg bg-gray-100 text-sm outline-none pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-9 text-gray-600"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>

          {/* Role Selection */}
          <div className="flex justify-center gap-4 mb-6">
            {["admin", "staff"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleType(r as "admin" | "staff")}
                className={`px-6 py-2 rounded-lg text-sm font-medium border transition-all duration-200 ${
                  roleType === r
                    ? "bg-[#002B5B] text-white border-[#002B5B]"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {r === "admin" ? "Admin Login" : "Staff Login"}
              </button>
            ))}
          </div>

          {/* Login Button with Loading */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
              loading
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-[#002B5B] text-white hover:bg-blue-900"
            }`}
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && (
            <p className="text-red-500 text-sm mt-3 text-center">{error}</p>
          )}
        </form>

        <p className="text-xs text-gray-600 mt-4">
          Don’t have an account? Contact your administrator
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
