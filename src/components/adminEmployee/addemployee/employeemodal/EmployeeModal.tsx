import React, { useEffect, useState } from "react";
import { supabase } from "../../../../supabaseClient";

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
  const [assets, setAssets] = useState<any>(null);

  // Employee info form
  const [form, setForm] = useState({
    name: employee.name,
    number: employee.number,
    email: employee.email,
    password: "",
  });

  // Working hours form
  const [workStart, setWorkStart] = useState("");
  const [workEnd, setWorkEnd] = useState("");

  // Salary form
  const [salaryAmount, setSalaryAmount] = useState("");
  const [salaryCurrency, setSalaryCurrency] = useState("INR");

  // Asset form
  const [assetData, setAssetData] = useState<string | null>(null);
  const [assetList, setAssetList] = useState<string[]>([]); // comma-separated
  const [uniqueAsset, setUniqueAsset] = useState<string>("");

  const supabaseUrl = (supabase as any).supabaseUrl;

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        // 1️⃣ Fetch personal details
        const { data: personalData, error: personalError } = await supabase
          .from("admin_personal_details_view")
          .select("*")
          .eq("auth_id", employee.id)
          .maybeSingle();

        if (personalError) console.error(personalError);

        if (personalData) {
          setDetails(personalData);
          setForm((prev) => ({
            ...prev,
            name: personalData.full_name || employee.name,
            number: employee.number || "",
            email: employee.email || "",
          }));

        }

        // 2️⃣ Fetch latest working hours (order by created_at)
        const { data: whData, error: whError } = await supabase
          .from("working_hours")
          .select("work_start, work_end, created_at")
          .eq("user_id", employee.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();


        if (whError) console.error(whError);
        setWorkHours(whData);

        // 3️⃣ Fetch asset allocations
        const { data: assetData, error: assetError } = await supabase
          .from("asset_allocations")
          .select("assets, unique_assets, created_at")
          .eq("user_id", employee.id)
          .order("created_at", { ascending: false });

        if (assetData) {
          console.log("assetData:", assetData);
          setAssetList(assetData[0]?.assets || []);
        }

        if (assetError) console.error(assetError);
        setAssets(assetData || []);
      } catch (err) {
        console.error("Error fetching employee details:", err);
      }

      setLoading(false);
    };

    fetchDetails();
  }, [employee.id]);

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
  console.log(secondsToTime(3661));

  console.log(setWorkHours);

  const handleAssetList = (value: string) => {
    setAssetData(value);
  };

  // Convert HH:MM → seconds
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

      // Get company_id for employee (only once)
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("company_id")
        .eq("id", employee.id)
        .single();

      if (roleError) throw roleError;




      // 1️⃣ Update employee info
      if (
        form.name !== employee.name ||
        form.number !== employee.number ||
        form.email !== employee.email ||
        form.password.trim() !== ""
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

      // 2️⃣ Insert working hours
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


      // Inside handleSaveChanges
      if (assetData?.trim() || assetList.length > 0 || uniqueAsset.trim()) {

        let newAssetList = assetData?.trim() ? [assetData.trim()] : [];
        if (assetList.length > 0) newAssetList = [...newAssetList, ...assetList];

        const { error: upsertError } = await supabase
          .from("asset_allocations")
          .upsert(
            {
              company_id: roleData.company_id,
              user_id: employee.id,
              assets: newAssetList,
              unique_assets: uniqueAsset || null,
              created_at: new Date().toISOString(),
            },
            { onConflict: "user_id" } // 👈 requires unique constraint
          );

        if (upsertError) throw upsertError;
        somethingChanged = true;
      }


      // 3️⃣ Insert salary details
      if (salaryAmount) {
        const { error: salaryError } = await supabase
          .from("salary_details")
          .insert({
            company_id: roleData.company_id,
            user_id: employee.id, // correct column name
            date_of_joining: new Date().toISOString().split("T")[0], // today's date or from a field
            employee_pf: true, // or from a checkbox in the form
            esi_coverage: false, // or from a checkbox
            regime_it: "old", // or from a select dropdown
            monthly_ctc: parseFloat(salaryAmount),
          })


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

  const handleDelete = async () => {
    if (!confirm("Are you sure? This will permanently delete the user.")) return;

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
      <div className="fixed inset-0 flex items-center justify-center " style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
        Loading...
      </div>
    );

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-gray-700">Employee Details</h2>

        {/* Editable Inputs */}
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

        {/* Update Assets */}
        <div className="border-t pt-4 mt-3">
          <h3 className="text-lg font-semibold mb-2">Update Asset Allocation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <input
              type="text"
              placeholder="Assets (comma separated)"
              value={assetData || ''}
              onChange={(e) => handleAssetList(e.target.value)}
              className="p-2 border border-blue-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Unique Asset"
              value={uniqueAsset}
              onChange={(e) => setUniqueAsset(e.target.value)}
              className="p-2 border border-blue-300 rounded-lg"
            />
          </div>
        </div>


        {/* Salary Details */}
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
        {/* Current Working Hours */}

        <div className="border-t pt-4 mt-3">
          <h3 className="text-lg font-semibold mb-2">Current Working Hours</h3>
          <p className="text-gray-700 text-sm">
            <b>Start:</b> {secondsToTime(workHours.work_start)} <br />
            <b>End:</b> {secondsToTime(workHours.work_end)} <br />
            <b>Last Updated:</b>{" "}
            {new Date(workHours.created_at).toLocaleDateString()}
          </p>
        </div>


        {/* Assets Allocated */}

        <div className="border-t pt-4 mt-3">
          <h3 className="text-lg font-semibold mb-2">Allocated Assets</h3>
          <ul className="list-disc list-inside text-gray-700 text-sm">
            {assets.map((asset: any, idx: number) => (
              <li key={idx}>
                {/* remove status */}
                <b>Assets:</b> {asset.assets.join(", ")} <br />
                {asset.unique_assets && (
                  <span>
                    <b>Unique:</b> {asset.unique_assets}
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
                    <b>{key.replace(/_/g, " ").toUpperCase()}:</b> {String(value || "-")}
                  </p>
                ))}
          </div>

          {/* Uploaded Documents */}
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
