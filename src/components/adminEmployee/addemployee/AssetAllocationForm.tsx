import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";

interface Props {
  userId: string;
  companyId: string;
  onComplete: () => void;
}

interface Asset {
  id: string;
  name: string;
}

const AssetAllocationForm: React.FC<Props> = ({ userId, companyId, onComplete }) => {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [uniqueAssets, setUniqueAssets] = useState("");
  const [availableAssets, setAvailableAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch only available assets
 useEffect(() => {
  const fetchAssets = async () => {
    if (!companyId) {
      console.warn("⚠️ No companyId provided, skipping asset fetch");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from("assets")
      .select("id, name")
      .eq("company_id", companyId)
      .eq("status", "available");

    if (error) {
      console.error("Error fetching assets:", error.message);
    } else {
      setAvailableAssets(data || []);
    }
    setLoading(false);
  };

  fetchAssets();
}, [companyId]);


  const toggleAsset = (assetId: string) => {
    setSelectedAssets((prev) =>
      prev.includes(assetId)
        ? prev.filter((a) => a !== assetId)
        : [...prev, assetId]
    );
  };

  const handleSubmit = async () => {
    if (selectedAssets.length === 0) {
      alert("⚠️ Please select at least one asset to allocate");
      return;
    }

    // Insert one row per selected asset
    const rows = selectedAssets.map((assetId) => ({
      user_id: userId,
      asset_id: assetId,
      company_id: companyId,
      unique_assets: uniqueAssets || null,
    }));

    const { error } = await supabase.from("asset_allocations").insert(rows);

    if (error) {
      alert("❌ Allocation failed: " + error.message);
    } else {
      // ✅ Update asset status to 'allocated'
      await supabase
        .from("assets")
        .update({ status: "allocated" })
        .in("id", selectedAssets);

      alert("✅ Assets allocated successfully");
      setSelectedAssets([]);
      setUniqueAssets("");
      onComplete();
    }
  };

  if (loading) return <p>Loading assets...</p>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-5 rounded-4xl bg-white">
      {/* Dynamic Checkboxes */}
      <div className="col-span-1 grid grid-cols-2 gap-2">
        {availableAssets.length === 0 ? (
          <p className="text-gray-500 text-sm">No assets available</p>
        ) : (
          availableAssets.map((asset) => (
            <label key={asset.id} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={selectedAssets.includes(asset.id)}
                onChange={() => toggleAsset(asset.id)}
                className="h-4 w-4 text-blue-600"
              />
              <span>{asset.name}</span>
            </label>
          ))
        )}
      </div>

      {/* Unique assets input */}
      <div className="col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mention any unique assets (If any)
        </label>
        <input
          type="text"
          value={uniqueAssets}
          onChange={(e) => setUniqueAssets(e.target.value)}
          className="w-full px-3 py-3 border border-blue-400 rounded-2xl"
        />
      </div>

      <div className="col-span-full mt-4 flex justify-between items-center">
        <span className="text-sm text-gray-600">
          Kindly note that all assets requested need approval from admin
        </span>
        <button
          onClick={handleSubmit}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm"
        >
          Submit Request
        </button>
      </div>
    </div>
  );
};

export default AssetAllocationForm;
