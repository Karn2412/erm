import React, { useState, useEffect } from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { supabase } from "../../../supabaseClient";

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetSaved: (asset: any, isEdit: boolean) => void;
  asset?: any; // if provided → Edit mode
}

const AssetModal: React.FC<AssetModalProps> = ({
  isOpen,
  onClose,
  onAssetSaved,
  asset,
}) => {
  const [assetName, setAssetName] = useState("");
  
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("available");


  // pre-fill values if editing
  useEffect(() => {
   if (asset) {
  setAssetName(asset.name || "");
  setDescription(asset.description || "");
  setStatus(asset.status || "available");   // 👈 prefill
} else {
  setAssetName("");
  setDescription("");
  setStatus("available");
}
  }, [asset, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const adminId = session?.user?.id;
    if (!adminId) return;

    const { data: adminUser } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", adminId)
      .single();

    if (!adminUser?.company_id) return;

    let savedAsset;

    if (asset) {
      // 🔹 Edit mode → update
      const { data, error } = await supabase
        .from("assets")
        .update({
          name: assetName,
          status,
          description,
        })
        .eq("id", asset.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating asset:", error.message);
      } else {
        savedAsset = data;
      }
    } else {
      // 🔹 Add mode → insert
      const { data, error } = await supabase
        .from("assets")
        .insert([
          {
            company_id: adminUser.company_id,
            name: assetName,
            
            description,
            status,
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error adding asset:", error.message);
      } else {
        savedAsset = data;
      }
    }

    if (savedAsset) {
      onAssetSaved(savedAsset, !!asset);
      onClose();
    }

    setLoading(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="bg-white rounded-xl w-96 p-6 relative shadow-lg">
        <button onClick={onClose} className="absolute top-4 right-4 text-xl">
          <FaTimes />
        </button>

        <h2 className="text-lg font-semibold mb-4">
          {asset ? "Edit Asset" : "New Asset"}
        </h2>

        <div className="space-y-4 bg-gray-200 rounded-tr-2xl rounded-tl-2xl p-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Asset Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="w-full border border-blue-300 rounded-full px-3 py-2 text-sm"
            />
          </div>

         <div>
  <label className="block text-sm font-medium mb-1">
    Status <span className="text-red-500">*</span>
  </label>
  {asset?.status === "allocated" ? (
  <p className="text-red-600 text-sm">
    This asset is allocated. To free it, remove/return allocation first.
  </p>
) : (
  <select
    value={status}
    onChange={(e) => setStatus(e.target.value)}
    className="w-full border border-blue-300 rounded-full px-3 py-2 text-sm"
  >
    <option value="available">Available</option>
    <option value="not available">Not Available</option>
    <option value="under repairing">Under Repairing</option>
  </select>
)}

</div>


          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-blue-300 rounded-2xl px-3 py-2 text-sm h-28"
            />
          </div>
        </div>

        <div className="rounded-bl-2xl rounded-br-2xl bg-gray-200 py-2 flex justify-center">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-blue-500 text-white py-2 px-4 rounded-full flex items-center gap-2 hover:bg-blue-600 disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : asset
              ? "Update Asset"
              : "Save Asset"}{" "}
            <FaCheck />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssetModal;
