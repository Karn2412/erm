import React, { useEffect, useState } from "react";
import { supabase } from "../../../../supabaseClient";
import { FaTimes } from "react-icons/fa";

const EmployeeModal = ({
  employee,
  onClose,
  onUpdated,
}: {
  employee: any;
  onClose: () => void;
  onUpdated: () => void;
}) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [workHours, setWorkHours] = useState<any>(null);
  const [assets, setAssets] = useState<any>([]);
  console.log(assets);

  const [form, setForm] = useState({
    name: employee.name,
    number: employee.number,
    email: employee.email,
    password: "",
  });

  const [workStart, setWorkStart] = useState("");
  const [workEnd, setWorkEnd] = useState("");

  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("INR");

  const [assetList, setAssetList] = useState<
    { asset_id: string; name: string }[]
  >([]);
  const [uniqueAsset, setUniqueAsset] = useState("");

  const [availableAssets, setAvailableAssets] = useState<
    { id: string; name: string }[]
  >([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [relocateAsset, setRelocateAsset] = useState("");
  const [relocateTo, setRelocateTo] = useState("");

  const supabaseUrl = (supabase as any).supabaseUrl;

  // Fetch assets and employees for dropdowns
  useEffect(() => {
    const fetchAssetsAndEmployees = async () => {
      try {
        console.log("Fetching assets and employees for company:", employee?.company_id);
        
        if (!employee?.company_id) return; // prevent running with null company_id

        const { data: assetMaster, error: assetError } = await supabase
          .from("assets")
          .select("id, name")
          .eq("company_id", employee.company_id);

        if (assetError) {
          console.error("Error fetching assets:", assetError.message);
        } else {
          console.log("Available Assets:", assetMaster);
          setAvailableAssets(assetMaster || []);
        }

        const { data: empData, error: empError } = await supabase
          .from("users")
          .select("id, name")
          .eq("company_id", employee.company_id);

        if (empError) {
          console.error("Error fetching employees:", empError.message);
        } else {
          console.log("All Employees:", empData);
          setAllEmployees(empData || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
      }
    };

    fetchAssetsAndEmployees();
  }, [employee?.company_id]);


  // Fetch employee details, working hours, and asset allocations
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // Personal details
        const { data: personalData } = await supabase
          .from("admin_personal_details_view")
          .select("*")
          .eq("auth_id", employee.id)
          .maybeSingle();

        if (personalData) {
          setDetails(personalData);
          setForm((prev) => ({
            ...prev,
            name: personalData.full_name || employee.name,
            number: employee.number || "",
            email: employee.email || "",
          }));
        }

        // Working hours
        const { data: whData } = await supabase
          .from("working_hours")
          .select("work_start, work_end, created_at")
          .eq("user_id", employee.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        setWorkHours(whData);

        const { data: assetData, error } = await supabase
          .from("asset_allocations")
          .select("asset_id, unique_assets, allocated_on, returned_on")
          .eq("user_id", employee.id);

        if (!error && assetData?.length) {
          const assetIds = assetData.map(a => a.asset_id);

          const { data: assets } = await supabase
            .from("assets")
            .select("id, name")
            .in("id", assetIds);

          const mappedAssets = assetData.map(row => ({
            asset_id: row.asset_id,
            name: assets?.find(a => a.id === row.asset_id)?.name || "Unknown",
          }));

          setAssetList(mappedAssets);
          setUniqueAsset(assetData[0]?.unique_assets || "");
          setAssets(assetData);
        }

      } catch (err) {
        console.error("Error fetching employee details:", err);
      }

      setLoading(false);
    };

    fetchDetails();
  }, [employee.id, availableAssets]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const secondsToTime = (seconds: number) => {
    if (seconds == null) return "-";
    const h = Math.floor(seconds / 3600)
      .toString()
      .padStart(2, "0");
    const m = Math.floor((seconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    return `${h}:${m}`;
  };

  const timeToSeconds = (time: string) => {
    if (!time) return null;
    const [h, m] = time.split(":").map(Number);
    return h * 3600 + m * 60;
  };

  const handleSaveChanges = async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      let somethingChanged = false;

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("company_id")
        .eq("id", employee.id)
        .single();

      if (!roleData || roleError) {
        throw new Error("Failed to fetch company data");
      }

      // Update personal info
      if (
        form.name !== employee.name ||
        form.number !== employee.number ||
        form.email !== employee.email ||
        form.password.trim()
      ) {
        const res = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "update",
            userId: employee.id,
            updateData: {
              name: form.name,
              number: form.number,
              email: form.email,
              password: form.password || undefined,
            },
          }),
        });

        if (!res.ok) throw new Error("Failed to update employee");
        somethingChanged = true;
      }

      // Insert working hours
      if (workStart && workEnd) {
        const startSeconds = timeToSeconds(workStart);
        const endSeconds = timeToSeconds(workEnd);

        const { error: whError } = await supabase.from("working_hours").insert({
          company_id: roleData.company_id,
          user_id: employee.id,
          work_start: startSeconds,
          work_end: endSeconds,
          created_at: new Date().toISOString(),
        });

        if (whError) throw whError;
        somethingChanged = true;
      }

      // Insert salary
      if (salaryAmount) {
        const { error: salaryError } = await supabase
          .from("salary_details")
          .insert({
            company_id: roleData.company_id,
            user_id: employee.id,
            date_of_joining: new Date().toISOString().split("T")[0],
            employee_pf: true,
            esi_coverage: false,
            regime_it: "old",
            monthly_ctc: parseFloat(salaryAmount),
          });

        if (salaryError) throw salaryError;
        somethingChanged = true;
      }

      if (somethingChanged) {
        alert("✅ Changes saved successfully!");
        onUpdated();
      } else {
        alert("ℹ No changes to save.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`❌ ${err.message}`);
    }
  };
  const handleRelocate = async () => {
    if (!relocateAsset || !relocateTo) {
      alert("Select both fields");
      return;
    }

    const { error } = await supabase
      .from("asset_allocations")
      .update({
        user_id: relocateTo,
        allocated_on: new Date().toISOString(),
      })
      .match({
        user_id: employee.id,
        asset_id: relocateAsset,
      });

    if (error) {
      console.error(error);
      alert("❌ Failed to relocate asset");
      return;
    }

    alert("✅ Asset relocated successfully!");
    onUpdated();
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure? This will permanently delete the user."))
      return;

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "delete",
          userId: employee.id,
        }),
      });

      if (!res.ok) throw new Error("Delete failed");

      alert("✅ User deleted successfully!");
      onUpdated();
    } catch (err) {
      console.error(err);
      alert("❌ Failed to delete user");
    }
  };

  if (loading)
    return (
      <div
        className="fixed inset-0 flex items-center justify-center"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      >
        Loading...
      </div>
    );

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-700">Employee Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Personal Info Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {["name", "number", "email", "password"].map((field) => (
            <input
              key={field}
              name={field}
              type={field === "password" ? "password" : "text"}
              value={form[field as keyof typeof form]}
              onChange={handleChange}
              placeholder={
                field === "password"
                  ? "New Password"
                  : field.charAt(0).toUpperCase() + field.slice(1)
              }
              className="w-full p-2 rounded-lg border border-blue-300"
            />
          ))}
        </div>

        {/* Working Hours */}
        <div className="border-t pt-4 mt-3">
          <h3 className="text-lg font-semibold mb-2">Add Working Hours</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <input
              type="time"
              value={workStart}
              onChange={(e) => setWorkStart(e.target.value)}
              className="p-2 border border-blue-300 rounded-lg"
            />
            <input
              type="time"
              value={workEnd}
              onChange={(e) => setWorkEnd(e.target.value)}
              className="p-2 border border-blue-300 rounded-lg"
            />
          </div>
        </div>

        {/* Salary */}
        <div className="border-t pt-4 mt-3">
          <h3 className="text-lg font-semibold mb-2">Add Salary Details</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <input
              type="number"
              placeholder="Amount"
              value={salaryAmount}
              onChange={(e) => setSalaryAmount(e.target.value)}
              className="p-2 border border-blue-300 rounded-lg"
            />
            <select
              value={salaryCurrency}
              onChange={(e) => setSalaryCurrency(e.target.value)}
              className="p-2 border border-blue-300 rounded-lg"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>

        {/* Asset Allocation */}
        <div className="border-t pt-4 mt-3">
          <h3 className="text-lg font-semibold mb-2">
            Update Asset Allocation
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            {availableAssets.map((asset) => (
              <label key={asset.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={assetList.some((a) => a.asset_id === asset.id)}
                  onChange={() => {
                    setAssetList((prev) => {
                      const exists = prev.find((a) => a.asset_id === asset.id);
                      if (exists)
                        return prev.filter((a) => a.asset_id !== asset.id);
                      return [
                        ...prev,
                        { asset_id: asset.id, name: asset.name },
                      ];
                    });
                  }}
                />
                <span>{asset.name}</span>
              </label>
            ))}
          </div>
          <input
            type="text"
            placeholder="Unique Asset"
            value={uniqueAsset}
            onChange={(e) => setUniqueAsset(e.target.value)}
            className="p-2 border border-blue-300 rounded-lg w-full"
          />
        </div>

        {/* Relocate Asset */}
        <div className="border-t pt-4 mt-3">
          <h3 className="text-lg font-semibold mb-2">Re-Allocate Asset</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <select
              value={relocateAsset}
              onChange={(e) => setRelocateAsset(e.target.value)}
              className="p-2 border border-blue-300 rounded-lg"
            >
              <option value="">Select Asset</option>
              {assetList.map((a) => (
                <option key={a.asset_id} value={a.asset_id}>
                  {a.name}
                </option>
              ))}
            </select>

            <select
              value={relocateTo}
              onChange={(e) => setRelocateTo(e.target.value)}
              className="p-2 border border-blue-300 rounded-lg"
            >
              <option value="">Select Employee</option>
              {allEmployees
                .filter((emp) => emp.id !== employee.id)
                .map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}
                  </option>
                ))}
            </select>
          </div>

          <button
            onClick={handleRelocate}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Relocate Asset
          </button>
        </div>

        {/* Current Working Hours */}
        <div className="border-t pt-4 mt-3">
          <h3 className="text-lg font-semibold mb-2">Current Working Hours</h3>
          <p className="text-gray-700 text-sm">
            <b>Start:</b> {secondsToTime(workHours?.work_start)} <br />
            <b>End:</b> {secondsToTime(workHours?.work_end)} <br />
            <b>Last Updated:</b>{" "}
            {workHours
              ? new Date(workHours.created_at).toLocaleDateString()
              : "-"}
          </p>
        </div>

        {/* Allocated Assets */}
        <div className="border-t pt-4 mt-3">
          <h3 className="text-lg font-semibold mb-2">Allocated Assets</h3>
          <ul className="list-disc list-inside text-gray-700 text-sm">
            {assetList.map((a, idx) => (
              <li key={idx}>
                <b>Asset:</b> {a.name} <br />
                {uniqueAsset && idx === 0 && (
                  <span>
                    <b>Unique:</b> {uniqueAsset}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Personal Details */}
        <div className="border-t pt-4 mt-3">
          <h3 className="text-lg font-semibold mb-2">Personal Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            {details &&
              Object.entries(details)
                .filter(([key]) => key !== "documents" && key !== "auth_id")
                .map(([key, value]) => (
                  <p key={key}>
                    <b>{key.replace(/_/g, " ").toUpperCase()}:</b>{" "}
                    {String(value || "-")}
                  </p>
                ))}
          </div>

          {/* Documents */}
          {details?.documents && details.documents.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Uploaded Documents</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {details.documents.map((doc: any) => (
                  <div key={doc.name} className="flex flex-col items-center">
                    <p className="text-sm font-medium">{doc.name}</p>
                    <img
                      src={doc.url}
                      alt={doc.name}
                      className="w-28 h-28 object-cover rounded-lg cursor-pointer hover:opacity-80"
                      onClick={() => setPreviewImage(doc.url)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-5 flex flex-wrap gap-3 justify-between">
          <button
            onClick={handleSaveChanges}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 w-full sm:w-auto"
          >
            Save Changes
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 w-full sm:w-auto"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
          >
            Close
          </button>
        </div>
      </div>

      {/* Image Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg"
          />
        </div>
      )}
    </div>
  );
};

export default EmployeeModal;
