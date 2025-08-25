import React, { useState } from "react";
// ❌ remove createClient
// import { createClient } from "@supabase/supabase-js";

// ✅ import your shared client
import { supabase } from "../../../supabaseClient";

interface Props {
  userId: string;
  companyId: string;
  onComplete: () => void; // ✅ trigger stepper update
}

const AssetAllocationForm: React.FC<Props> = ({ userId, companyId, onComplete }) => {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [uniqueAssets, setUniqueAssets] = useState("");

  const toggleAsset = (asset: string) => {
    setSelectedAssets((prev) =>
      prev.includes(asset) ? prev.filter((a) => a !== asset) : [...prev, asset]
    );
  };

  const handleSubmit = async () => {
    const { error } = await supabase.from("asset_allocations").insert([
      {
        user_id: userId,
        assets: selectedAssets,
        company_id: companyId,
        unique_assets: uniqueAssets,
      },
    ]);
    if (error) {
      alert(error.message);
    } else {
      alert("✅ Asset request submitted");
      onComplete(); // ✅ move stepper forward
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 p-5 rounded-4xl bg-white">
      {/* Checkboxes */}
      <div className="col-span-1 grid grid-cols-2 gap-2">
        {[
          "Phone",
          "Laptop",
          "Headset",
          "Stand",
          "Charger",
          "Camera",
          "Mic",
          "Sim Card",
        ].map((item) => (
          <label key={item} className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={selectedAssets.includes(item)}
              onChange={() => toggleAsset(item)}
              className="h-4 w-4 text-blue-600"
            />
            <span>{item}</span>
          </label>
        ))}
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
