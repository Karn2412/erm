import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../../../supabaseClient";
import { FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

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
  const [assets, setAssets] = useState<any[]>([]);
  const [weeklyOffs, setWeeklyOffs] = useState<number[]>([]);
const [weeklyOffsDetails, setWeeklyOffsDetails] = useState<any>(null);

const [weeklyOffsNote, setWeeklyOffsNote] = useState("");



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

  // allocated assets shown in list (metadata)
  const [assetList, setAssetList] = useState<
    {
      asset_id: string;
      name: string;
      description?: string;
      allocated_on?: string | null;
      returned_on?: string | null;
      unique_assets?: string | null;
    }[]
  >([]);
  const [uniqueAsset, setUniqueAsset] = useState("");

  // assets master with allocation info (allocated_to = user id if currently allocated)
  const [availableAssets, setAvailableAssets] = useState<
    { id: string; name: string; description?: string; status?: string | null; allocated_to?: string | null; allocatedToName?: string | null }[]
  >([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [relocateAsset, setRelocateAsset] = useState("");
  const [relocateTo, setRelocateTo] = useState("");

  // single-select state
  const [selectedAssetId, setSelectedAssetId] = useState<string>("");
  // Keep original allocated asset id to detect changes
  const initialAssetIdRef = useRef<string | null>(null);

  // map of asset_id -> allocated user id (active allocations)
  const allocatedMapRef = useRef<Record<string, string | null>>({});

  const supabaseUrl = (supabase as any).supabaseUrl;

  // asset-details modal state (same as before)
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [assetModalLoading, setAssetModalLoading] = useState(false);
  const [assetModalData, setAssetModalData] = useState<any>(null);
  const [companyAssetsSnapshot, setCompanyAssetsSnapshot] = useState<any[]>([]);





  

  // ---------- helper: load assets & allocations (used on mount and refresh) ----------
  const fetchAssetsAndEmployees = async () => {
    try {
      if (!employee?.company_id) return;

      // 1) fetch asset master with status
      const { data: assetMaster, error: assetError } = await supabase
        .from("assets")
        .select("id, name, description, status")
        .eq("company_id", employee.company_id);

      if (assetError) console.error("Error fetching assets:", assetError.message);

      // 2) fetch active allocations (returned_on is null) for this company
      const { data: activeAllocations, error: allocError } = await supabase
        .from("asset_allocations")
        .select("asset_id, user_id")
        .eq("company_id", employee.company_id)
        .is("returned_on", null);

      if (allocError) console.error("Error fetching allocations:", allocError.message);

      // 3) fetch employee names for display
      const { data: empData, error: empError } = await supabase
        .from("users")
        .select("id, name")
        .eq("company_id", employee.company_id);

      if (empError) console.error("Error fetching employees:", empError.message);
      else setAllEmployees(empData || []);

      // build allocated map
      const allocMap: Record<string, string | null> = {};
      (activeAllocations || []).forEach((r: any) => {
        allocMap[r.asset_id] = r.user_id;
      });
      allocatedMapRef.current = allocMap;

      // combine asset master with allocation info and allocatedToName if available
      const assetsWithAlloc = (assetMaster || []).map((a: any) => {
        const allocated_to = allocMap[a.id] || null;
        const allocatedToName = allocated_to ? (empData || []).find((e: any) => e.id === allocated_to)?.name ?? null : null;
        return {
          id: a.id,
          name: a.name,
          description: a.description,
          status: a.status || "available",
          allocated_to,
          allocatedToName,
        };
      });

      setAvailableAssets(assetsWithAlloc || []);
      setCompanyAssetsSnapshot(assetsWithAlloc || []);
    } catch (err) {
      console.error("Unexpected error:", err);
    }
  };
  // -------------------------------------------------------------------------------

  // initial load
  useEffect(() => {
    fetchAssetsAndEmployees();
  }, [employee?.company_id]);

  // Fetch employee details, working hours, and current asset allocations
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

       //Weekly Offs
        const { data: weeklyOffsData, error: weeklyOffsError } = await supabase
  .from("user_weekly_offs")
  .select("weekly_offs, description, updated_at")
  .eq("user_id", employee.id)
  .maybeSingle();

if (weeklyOffsError) {
  console.error("Error fetching weekly offs:", weeklyOffsError.message);
}
if (weeklyOffsData) {
  setWeeklyOffs(weeklyOffsData.weekly_offs || []);
  setWeeklyOffsDetails(weeklyOffsData);
}


// Salary Details (latest entry)
const { data: salaryData, error: salaryError } = await supabase
  .from("salary_details")
  .select("monthly_ctc, regime_it, employee_pf, esi_coverage, created_at")
  .eq("user_id", employee.id)
  .order("created_at", { ascending: false })
  .limit(1)
  .maybeSingle();
  console.log(salaryData);
  

if (salaryError) {
  console.error("Error fetching salary details:", salaryError.message);
}
if (salaryData) {
  setSalaryAmount(salaryData.monthly_ctc?.toString() || "");
  // if you want to support different currencies, you may need to store it in db
  setSalaryCurrency("INR"); 
}


        // Get current allocations for this user (only active — returned_on null)
        const { data: assetData, error } = await supabase
          .from("asset_allocations")
          .select("id, asset_id, unique_assets, allocated_on, returned_on")
          .eq("user_id", employee.id)
          .is("returned_on", null);

        if (!error && assetData?.length) {
          const assetIds = assetData.map((a) => a.asset_id);

          // fetch names + descriptions for those assets
          const { data: assetsMeta } = await supabase
            .from("assets")
            .select("id, name, description, status")
            .in("id", assetIds);


            

          const mappedAssets = assetData.map((row) => {
            const meta = assetsMeta?.find((a) => a.id === row.asset_id);
            return {
              asset_id: row.asset_id,
              name: meta?.name || "Unknown",
              description: meta?.description || "",
              allocated_on: row.allocated_on || null,
              returned_on: row.returned_on || null,
              unique_assets: row.unique_assets || null,
            };
          });

          setAssetList(mappedAssets);
          setUniqueAsset(assetData[0]?.unique_assets || "");
          setAssets(assetData);
          // since we allow only one asset per person, take first allocation (if present)
          const firstId = mappedAssets[0]?.asset_id || "";
          setSelectedAssetId(firstId);
          initialAssetIdRef.current = firstId;
        } else {
          // no allocations
          setAssetList([]);
          setSelectedAssetId("");
          initialAssetIdRef.current = null;
        }
      } catch (err) {
        console.error("Error fetching employee details:", err);
      }

      setLoading(false);
    };

    if (employee?.id) fetchDetails();
  }, [employee.id, /* refresh when availableAssets update: */ availableAssets]);

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

  // open asset modal (same as you had)
  const openAssetModal = async (assetId: string) => {
    setAssetModalOpen(true);
    setAssetModalLoading(true);
    setAssetModalData(null);

    try {
      // Fetch asset master row
      const { data: asset } = await supabase
        .from("assets")
        .select("id, name, description, status")
        .eq("id", assetId)
        .maybeSingle();

      // Fetch all allocations for this asset (history)
      const { data: allocations } = await supabase
        .from("asset_allocations")
        .select("id, asset_id, user_id, allocated_on, returned_on, unique_assets")
        .eq("asset_id", assetId)
        .order("allocated_on", { ascending: false });

      // Fetch user names involved (collect unique user ids)
      const userIds = Array.from(new Set((allocations || []).map((a: any) => a.user_id).filter(Boolean)));
      let usersMap: Record<string, any> = {};
      if (userIds.length) {
        const { data: users } = await supabase
          .from("users")
          .select("id, name")
          .in("id", userIds);
        usersMap = (users || []).reduce((acc: any, u: any) => {
          acc[u.id] = u;
          return acc;
        }, {});
      }

      // Build enriched allocations
      const enriched = (allocations || []).map((a: any) => ({
        ...a,
        userName: usersMap[a.user_id]?.name || a.user_id,
      }));

      // also build snapshot of all company assets + who currently has them (returned_on is null)
      const { data: allAssets } = await supabase
        .from("assets")
        .select("id, name, description, status")
        .eq("company_id", employee.company_id);

      const { data: currentAllocations } = await supabase
        .from("asset_allocations")
        .select("asset_id, user_id")
        .eq("company_id", employee.company_id)
        .is("returned_on", null);

      const currentMap: Record<string, string> = {};
      (currentAllocations || []).forEach((r: any) => (currentMap[r.asset_id] = r.user_id));

      // get involved users for the snapshot
      const snapshotUserIds = Array.from(new Set(Object.values(currentMap)));
      let snapshotUsersMap: Record<string, any> = {};
      if (snapshotUserIds.length) {
        const { data: susers } = await supabase
          .from("users")
          .select("id, name")
          .in("id", snapshotUserIds);
        snapshotUsersMap = (susers || []).reduce((acc: any, u: any) => {
          acc[u.id] = u;
          return acc;
        }, {});
      }

      const snapshot = (allAssets || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        description: a.description,
        status: a.status || "available",
        allocated_to: currentMap[a.id] || null,
        allocatedToName: currentMap[a.id] ? snapshotUsersMap[currentMap[a.id]]?.name || currentMap[a.id] : null,
      }));

      setCompanyAssetsSnapshot(snapshot);
      setAssetModalData({
        asset,
        allocations: enriched,
      });
    } catch (err) {
      console.error("Error loading asset modal:", err);
    } finally {
      setAssetModalLoading(false);
    }
  };

  // ---------- SAVE: call edge fn then update asset statuses & refresh ----------
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

      // detect personal info changes
      const personalChanged =
        form.name !== employee.name ||
        form.number !== employee.number ||
        form.email !== employee.email ||
        form.password.trim();

      // detect asset change (single)
      const initialId = initialAssetIdRef.current || "";
      const assetChanged = selectedAssetId !== (initialId || "");

      // Prevent allocating asset that is actively allocated to another user
      const allocatedMap = allocatedMapRef.current;
      const pickedAsset = availableAssets.find(a => a.id === selectedAssetId);
      if (selectedAssetId && (pickedAsset?.status === 'allocated') && allocatedMap[selectedAssetId] && allocatedMap[selectedAssetId] !== employee.id) {
        const otherUserId = allocatedMap[selectedAssetId];
        const otherName = allEmployees.find((e) => e.id === otherUserId)?.name || otherUserId;
        toast.error(`❌ Cannot allocate "${pickedAsset?.name || 'asset'}". It's already allocated to ${otherName}.`);
        return;
      }

      if (personalChanged || assetChanged || uniqueAsset !== (assetList[0]?.unique_assets || "")) {
        somethingChanged = true;

        // build update payload for your edge function
        const updateData: any = {
          company_id: roleData.company_id,
          // include assets as array with single id (or [] to mean none)
          assets: Object.prototype.hasOwnProperty.call({ assets: selectedAssetId ? [selectedAssetId] : [] }, 'assets') ? (selectedAssetId ? [selectedAssetId] : []) : undefined,
          unique_assets: uniqueAsset || null,
        };

        // include personal info if changed
        if (personalChanged) {
          updateData.name = form.name;
          updateData.number = form.number;
          updateData.email = form.email;
          if (form.password) updateData.password = form.password;
        }

        // call edge function to perform update (it expects Authorization Bearer token)
        const res = await fetch(`${supabaseUrl}/functions/v1/delete-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            action: "update",
            userId: employee.id,
            updateData,
          }),
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Failed to update employee: ${txt}`);
        }

        // --- Now update assets.status column to keep consistency ---
        // If previous asset exists and is different -> set previous status to 'available'
        const prevId = initialId || null;
        const newId = selectedAssetId || null;

        // If prevId exists and is different from newId, mark prev available
        if (prevId && prevId !== newId) {
          const { error: e1 } = await supabase
            .from("assets")
            .update({ status: "available" })
            .eq("id", prevId);
          if (e1) console.error("Failed to mark previous asset available:", e1.message);
        }

        // If newId exists, mark it allocated
        if (newId) {
          const { error: e2 } = await supabase
            .from("assets")
            .update({ status: "allocated" })
            .eq("id", newId);
          if (e2) console.error("Failed to mark selected asset allocated:", e2.message);
        }

        // refresh asset snapshots & maps
        await fetchAssetsAndEmployees();
      }

      // Insert working hours if provided
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
      // Save/Update weekly offs
const { error: weeklyOffsError } = await supabase.from("user_weekly_offs").upsert(
  {
    user_id: employee.id,
    company_id: employee.company_id,
    weekly_offs: weeklyOffs,
    description: weeklyOffsNote || null,
    updated_at: new Date(),
  },
  { onConflict: "user_id" }
);

if (weeklyOffsError) {
  console.error("Error updating weekly offs:", weeklyOffsError.message);
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
        toast.success("✅ Changes saved successfully!");
        onUpdated();
      } else {
        toast.loading("ℹ No changes to save.");
      }
    } catch (err: any) {
      console.error(err);
      toast.error(`❌ ${err.message}`);
    }
  };
  // -------------------------------------------------------------------------------

  // Relocate logic unchanged, but refresh snapshot after relocate
  const handleRelocate = async () => {
    if (!relocateAsset || !relocateTo) {
      toast("Select both fields");
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
      toast.error("❌ Failed to relocate asset");
      return;
    }

    // asset stays allocated — but we refresh snapshots to show new owner
    await fetchAssetsAndEmployees();

    toast.success("✅ Asset relocated successfully!");
    onUpdated();
  };

  // ---------- Add this inside EmployeeModal, after handleRelocate and before handleDelete ----------
const handleRemoveAsset = async (assetId: string) => {
  if (!assetId) return;
  if (!confirm("Are you sure you want to remove this asset from the user and mark it available?")) return;

  try {
    // 1) mark allocation row(s) for this user+asset as returned (returned_on = now)
    const { error: retErr } = await supabase
      .from("asset_allocations")
      .update({ returned_on: new Date().toISOString() })
      .match({ user_id: employee.id, asset_id: assetId })
      .is("returned_on", null); // only update active allocations

    if (retErr) {
      console.error("Failed to mark allocation returned:", retErr);
      toast.error("❌ Failed to mark allocation returned: " + retErr.message);
      return;
    }

    // 2) update asset.status to 'available'
    const { error: statusErr } = await supabase
      .from("assets")
      .update({ status: "available" })
      .eq("id", assetId);

    if (statusErr) {
      console.error("Failed to update asset status:", statusErr);
      toast.error("❌ Failed to update asset status: " + statusErr.message);
      return;
    }

    // 3) refresh local data
    await fetchAssetsAndEmployees(); // ensure this helper exists (you already have it)
    // refresh this user's allocations
    const { data: refreshedAllocations } = await supabase
      .from("asset_allocations")
      .select("id, asset_id, unique_assets, allocated_on, returned_on")
      .eq("user_id", employee.id)
      .is("returned_on", null);

    if (refreshedAllocations) {
      const assetIds = refreshedAllocations.map((a: any) => a.asset_id);
      if (assetIds.length) {
        const { data: assetsMeta } = await supabase
          .from("assets")
          .select("id, name, description, status")
          .in("id", assetIds);
        const mapped = refreshedAllocations.map((row: any) => {
          const meta = assetsMeta?.find((m: any) => m.id === row.asset_id);
          return {
            asset_id: row.asset_id,
            name: meta?.name || "Unknown",
            description: meta?.description || "",
            allocated_on: row.allocated_on || null,
            returned_on: row.returned_on || null,
            unique_assets: row.unique_assets || null,
          };
        });
        setAssetList(mapped);
        initialAssetIdRef.current = mapped[0]?.asset_id || null;
        setSelectedAssetId(mapped[0]?.asset_id || "");
      } else {
        setAssetList([]);
        initialAssetIdRef.current = null;
        setSelectedAssetId("");
      }
    }

    toast.success("✅ Asset removed and marked available.");
    onUpdated();
  } catch (err: any) {
    console.error("Error removing asset:", err);
    toast.error("❌ Error removing asset: " + (err?.message || err));
  }
};
  // ---------- DELETE employee ----------

  const handleDelete = async () => {
    if (!toast.loading("Are you sure? This will permanently deactivate the user.")) return;

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

      toast.success("✅ User deleted successfully!");
      onUpdated();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to delete user");
    }
  };

  if (loading)
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
        Loading...
      </div>
    );

  // ---------- UI (kept mostly as you had it) ----------
  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center p-4 z-50"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.6)" }}
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto border border-gray-100">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Employee Details</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition">
              <FaTimes className="w-6 h-6" />
            </button>
          </div>

          {/* Personal Info */}
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {["name", "number", "email", "password"].map((field) => (
              <input
                key={field}
                name={field}
                type={field === "password" ? "password" : "text"}
                value={form[field as keyof typeof form]}
                onChange={handleChange}
                placeholder={field === "password" ? "New Password" : field.charAt(0).toUpperCase() + field.slice(1)}
                className="w-full p-3 rounded-full border border-blue-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            ))}
          </div>

          {/* Current Working Hours */}
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Working Hours</h3>
          <p className="text-gray-700 text-sm bg-blue-50 p-3 rounded-lg mb-6">
            <b>Start:</b> {secondsToTime(workHours?.work_start)} <br />
            <b>End:</b> {secondsToTime(workHours?.work_end)} <br />
            <b>Last Updated:</b> {workHours ? new Date(workHours.created_at).toLocaleDateString() : "-"}
          </p>

          {/* Current Weekly Offs */}
<h3 className="text-lg font-semibold text-gray-800 mb-2">Weekly Offs</h3>
{weeklyOffsDetails ? (
  <div className="text-gray-700 text-sm bg-green-50 p-3 rounded-lg mb-6">
    <b>Days Off:</b>{" "}
    {weeklyOffs
      .map((d) =>
        ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d]
      )
      .join(", ")}
    <br />
    <b>Description:</b> {weeklyOffsDetails.description || "-"} <br />
    <b>Last Updated:</b>{" "}
    {weeklyOffsDetails.updated_at
      ? new Date(weeklyOffsDetails.updated_at).toLocaleDateString()
      : "-"}
  </div>
) : (
  <p className="text-gray-500 text-sm mb-6">No weekly offs set</p>
)}

{/* Current Salary */}
<h3 className="text-lg font-semibold text-gray-800 mb-2">Current Salary</h3>
{salaryAmount ? (
  <div className="text-gray-700 text-sm bg-yellow-50 p-3 rounded-lg mb-6">
    <b>CTC:</b> {salaryAmount} {salaryCurrency}
    <br />
    <b>PF:</b> Yes
    <br />
    <b>ESI:</b> No
    <br />
    <b>Regime:</b> Old
  </div>
) : (
  <p className="text-gray-500 text-sm mb-6">No salary set</p>
)}



          {/* Update Working Hours */}
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Update Working Hours</h3>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className="p-3 border border-blue-300 rounded-full focus:ring-2 focus:ring-blue-400" />
            <input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className="p-3 border border-blue-300 rounded-full focus:ring-2 focus:ring-blue-400" />
          </div>


          {/* Weekly Offs Section */}
<h3 className="text-lg font-semibold text-gray-800 mb-2">Weekly Offs</h3>

<div className="mb-4">
  <div className="grid grid-cols-2 gap-2">
    {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map(
      (day, index) => (
        <label key={index} className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={weeklyOffs.includes(index)}
            onChange={(e) => {
              if (e.target.checked) {
                setWeeklyOffs([...weeklyOffs, index]);
              } else {
                setWeeklyOffs(weeklyOffs.filter((d) => d !== index));
              }
            }}
          />
          <span>{day}</span>
        </label>
      )
    )}
  </div>

  <textarea
    className="mt-3 w-full border rounded-md p-2 text-sm"
    placeholder="Add description (optional)"
    value={weeklyOffsNote}
    onChange={(e) => setWeeklyOffsNote(e.target.value)}
  />
</div>


          {/* Salary */}
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Salary Details</h3>
          <div className="grid grid-cols-2 gap-4 mb-8">
            <input type="number" placeholder="Amount" value={salaryAmount} onChange={(e) => setSalaryAmount(e.target.value)} className="p-3 border border-blue-300 rounded-full focus:ring-2 focus:ring-blue-400" />
            <select value={salaryCurrency} onChange={(e) => setSalaryCurrency(e.target.value)} className="p-3 border border-blue-300 rounded-full focus:ring-2 focus:ring-blue-400">
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          {/* Allocated Assets */}
<h3 className="text-lg font-semibold text-gray-800 mb-3">Allocated Assets</h3>
<ul className="list-disc list-inside text-gray-700 text-sm space-y-2 mb-6">
  {assetList.length === 0 && <li className="text-gray-500">No asset allocated</li>}
  {assetList.map((a, idx) => (
    <li key={a.asset_id + "-" + idx} className="bg-blue-50 p-3 rounded-lg border flex justify-between items-start">
      <div className="flex-1">
        <div className="font-medium text-gray-800 cursor-pointer" onClick={() => openAssetModal(a.asset_id)}>
          {a.name}
        </div>
        {a.description && <div className="text-gray-600 text-sm mt-1">{a.description}</div>}
        {a.unique_assets && <div className="text-sm mt-1"><b>Unique:</b> {a.unique_assets}</div>}
        <div className="text-xs text-gray-500 mt-1">
          Allocated: {a.allocated_on ? new Date(a.allocated_on).toLocaleDateString() : "-"}
          {a.returned_on && ` • Returned: ${new Date(a.returned_on).toLocaleDateString()}`}
        </div>
      </div>

      {/* Remove button */}
      <div className="ml-4 flex-shrink-0">
        <button
          onClick={() => handleRemoveAsset(a.asset_id)}
          className="bg-red-500 text-white px-3 py-1 rounded-full text-sm hover:bg-red-600"
          title="Remove asset and mark available"
        >
          Remove
        </button>
      </div>
    </li>
  ))}
</ul>


          {/* Update Asset Allocation (single-select) */}
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Update Asset Allocation</h3>
          <div className="mb-2">
            <label className="text-sm text-gray-700 block mb-2">Select asset to allocate (only one allowed)</label>
            <div className="flex gap-2">
              <select
                value={selectedAssetId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedAssetId(id);
                  // set assetList preview to just the selected asset
                  if (id) {
                    const a = availableAssets.find((x) => x.id === id);
                    setAssetList([
                      {
                        asset_id: a?.id || id,
                        name: a?.name || "Unknown",
                        description: a?.description || "",
                        allocated_on: null,
                        returned_on: null,
                        unique_assets: null,
                      },
                    ]);
                  } else {
                    setAssetList([]);
                  }
                }}
                className="w-full p-3 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              >
                <option value="">-- Select asset --</option>
                {availableAssets.map((asset) => (
                  <option
                    key={asset.id}
                    value={asset.id}
                    disabled={Boolean(asset.allocated_to && asset.allocated_to !== employee.id)}
                    title={asset.description || ""}
                  >
                    {asset.name}
                    {asset.allocated_to ? ` — allocated to ${asset.allocatedToName || asset.allocated_to}` : ""}
                  </option>
                ))}
              </select>

              {/* NEW: view details button for selected asset */}
              <button
                type="button"
                onClick={() => selectedAssetId && openAssetModal(selectedAssetId)}
                className="bg-gray-100 border p-2 rounded-lg hover:bg-gray-200"
                disabled={!selectedAssetId}
                title="View asset details"
              >
                View
              </button>
            </div>
          </div>

          {/* Show description of selected asset */}
          {selectedAssetId && (
            <div className="mb-4 bg-gray-50 p-3 rounded-lg border">
              <div className="font-medium">{availableAssets.find(a => a.id === selectedAssetId)?.name || "Selected asset"}</div>
              {availableAssets.find(a => a.id === selectedAssetId)?.description && (
                <div className="text-sm text-gray-600 mt-1">
                  {availableAssets.find(a => a.id === selectedAssetId)?.description}
                </div>
              )}
            </div>
          )}

          <input type="text" placeholder="Unique Asset (applies to allocation)" value={uniqueAsset} onChange={(e) => setUniqueAsset(e.target.value)} className="p-3 border border-blue-300 rounded-full w-full focus:ring-2 focus:ring-blue-400 mb-8" />

          {/* Re-Allocate Asset */}
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Re-Allocate Asset</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <select value={relocateAsset} onChange={(e) => setRelocateAsset(e.target.value)} className="p-3 border border-blue-300 rounded-full focus:ring-2 focus:ring-blue-400">
              <option value="">Select Asset</option>
              {assetList.map((a) => (
                <option key={a.asset_id} value={a.asset_id}>
                  {a.name} {a.description ? ` - ${a.description.slice(0, 40)}${a.description.length > 40 ? "..." : ""}` : ""}
                </option>
              ))}
            </select>

            <select value={relocateTo} onChange={(e) => setRelocateTo(e.target.value)} className="p-3 border border-blue-300 rounded-full focus:ring-2 focus:ring-blue-400">
              <option value="">Select Employee</option>
              {allEmployees.filter((emp) => emp.id !== employee.id).map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <button onClick={handleRelocate} className="bg-indigo-600 text-white px-5 py-2.5 rounded-full hover:bg-indigo-700 transition mb-8">
            Relocate Asset
          </button>

          {/* Personal Details */}
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Personal Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 mb-6">
            {details &&
              Object.entries(details)
                .filter(([key]) => key !== "documents" && key !== "auth_id")
                .map(([key, value]) => (
                  <p key={key} className="bg-blue-50 p-3 rounded-lg border text-gray-800">
                    <b>{key.replace(/_/g, " ").toUpperCase()}:</b> {String(value || "-")}
                  </p>
                ))}
          </div>

          {/* Documents */}
          {details?.documents && details.documents.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Uploaded Documents</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {details.documents.map((doc: any) => (
                  <div key={doc.name} className="flex flex-col items-center bg-blue-50 p-3 rounded-lg border hover:shadow-md transition">
                    <p className="text-sm font-medium text-gray-700 mb-2">{doc.name}</p>
                    <img src={doc.url} alt={doc.name} className="w-28 h-28 object-cover rounded-lg cursor-pointer hover:opacity-90 transition" onClick={() => setPreviewImage(doc.url)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="mt-6 flex flex-wrap gap-4 justify-end">
            <button onClick={handleSaveChanges} className="bg-green-600 text-white px-6 py-2.5 rounded-full hover:bg-green-700 transition">
              Save Changes
            </button>
            <button onClick={handleDelete} className="bg-red-600 text-white px-6 py-2.5 rounded-full hover:bg-red-700 transition">
              Deactivate
            </button>
            <button onClick={onClose} className="bg-gray-400 text-white px-6 py-2.5 rounded-full hover:bg-gray-500 transition">
              Close
            </button>
          </div>
        </div>

        {/* Image Preview */}
        {previewImage && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setPreviewImage(null)}>
            <img src={previewImage} alt="Preview" className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg" />
          </div>
        )}
      </div>

      {/* ----- NEW: Asset Details Modal ----- */}
      {assetModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="bg-white rounded-2xl w-full max-w-5xl p-6 max-h-[85vh] overflow-y-auto border">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">
                  {assetModalLoading ? "Loading..." : assetModalData?.asset?.name || "Asset Details"}
                </h3>
                {!assetModalLoading && assetModalData?.asset?.description && (
                  <p className="text-sm text-gray-600 mt-2">{assetModalData.asset.description}</p>
                )}
              </div>
              <button onClick={() => setAssetModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <FaTimes className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Left: selected asset allocation history */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">Allocation History</h4>
                {assetModalLoading && <p className="text-sm text-gray-500">Loading...</p>}
                {!assetModalLoading && assetModalData?.allocations?.length === 0 && <p className="text-sm text-gray-500">No allocations found for this asset.</p>}
                {!assetModalLoading && assetModalData?.allocations?.map((alloc: any) => (
                  <div key={alloc.id} className="mb-3 p-3 bg-white rounded border">
                    <div className="text-sm font-medium">{alloc.userName}</div>
                    <div className="text-xs text-gray-500">
                      Allocated: {alloc.allocated_on ? new Date(alloc.allocated_on).toLocaleString() : "-"}
                      {alloc.returned_on && ` • Returned: ${new Date(alloc.returned_on).toLocaleString()}`}
                    </div>
                    {alloc.unique_assets && <div className="text-xs text-gray-700 mt-1">Unique: {alloc.unique_assets}</div>}
                  </div>
                ))}
              </div>

              {/* Right: company assets snapshot (Available / Allocated) */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h4 className="font-semibold mb-2">Company Assets Snapshot</h4>

                <div>
                  <div className="text-sm font-medium mb-1">Available</div>
                  <div className="space-y-2 mb-3">
                    {companyAssetsSnapshot.filter(a => !a.allocated_to).length === 0 && <div className="text-xs text-gray-500">None</div>}
                    {companyAssetsSnapshot.filter(a => !a.allocated_to).map(a => (
                      <div key={a.id} className="p-2 bg-white rounded border text-sm">
                        <div className="font-medium">{a.name}</div>
                        {a.description && <div className="text-xs text-gray-500">{a.description}</div>}
                        <div className="mt-1">
                          <button className="text-xs underline" onClick={() => { setAssetModalOpen(false); openAssetModal(a.id); }}>
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="text-sm font-medium mb-1">Allocated</div>
                  <div className="space-y-2">
                    {companyAssetsSnapshot.filter(a => a.allocated_to).length === 0 && <div className="text-xs text-gray-500">None</div>}
                    {companyAssetsSnapshot.filter(a => a.allocated_to).map(a => (
                      <div key={a.id} className="p-2 bg-white rounded border text-sm">
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-gray-500">{a.allocatedToName ? `Allocated to ${a.allocatedToName}` : `Allocated to ${a.allocated_to}`}</div>
                        <div className="mt-1">
                          <button className="text-xs underline" onClick={() => { setAssetModalOpen(false); openAssetModal(a.id); }}>
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-right">
              <button className="px-4 py-2 rounded bg-gray-200" onClick={() => setAssetModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview (outside) */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className="max-w-[90%] max-h-[90%] rounded-lg shadow-lg" />
        </div>
      )}
    </>
  );
};

export default EmployeeModal;
