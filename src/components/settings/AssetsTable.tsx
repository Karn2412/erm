import React, { useEffect, useState } from "react";
import { FaDownload, FaEdit, FaTrash } from "react-icons/fa";
import { supabase } from "../../supabaseClient";
import AddAssetModal from "./modal/AddAssetModal";

interface Asset {
  id: string;
  name: string;
  
  description: string | null;
  status: string;
}

const AssetsTable: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
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

      const { data, error } = await supabase
        .from("assets")
        .select("id, name, description,status")
        .eq("company_id", adminUser.company_id);

      if (error) {
        console.error("Error fetching assets:", error);
      } else {
        setAssets(data || []);
      }
    };

    fetchAssets();
  }, []);

  return (
    <>
      <div className="flex justify-between items-center bg-white mb-4">
        <h2 className="text-lg font-semibold">Assets</h2>

        <div className="flex space-x-2">
          <button
            onClick={() => {
              setSelectedAsset(null);
              setShowModal(true);
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
          >
            Add Asset
          </button>
          <button className="bg-gray-100 border text-gray-600 px-3 py-2 rounded text-sm flex items-center">
            <FaDownload className="mr-1" />
          </button>
        </div>
      </div>

      <div className="bg-blue-50 h-125 rounded-lg shadow p-4">
        <table className="w-full text-sm">
          <thead>
  <tr className="text-left text-gray-600">
    <th className="py-2">Asset Name</th>
    <th>Description</th>
    <th>Status</th>   {/* 👈 real status column */}
    <th>Actions</th> {/* 👈 edit/delete actions */}
  </tr>
</thead>
<tbody>
  {assets.map((asset, index) => (
    <tr
      key={asset.id}
      className={`${index % 2 === 0 ? "bg-blue-50" : "bg-blue-100"} hover:bg-blue-200`}
    >
      <td className="py-2">{asset.name}</td>
      <td>{asset.description || "-"}</td>
      
      {/* STATUS COLUMN */}
      <td>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            asset.status === "available"
              ? "bg-green-100 text-green-700"
              : asset.status === "allocated"
              ? "bg-yellow-100 text-yellow-700"
              : asset.status === "under repairing"
              ? "bg-orange-100 text-orange-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {asset.status}
        </span>
      </td>

      {/* ACTIONS COLUMN */}
<td className="flex space-x-3 mt-3 items-center">
  
    <>
      {/* EDIT BUTTON */}
      <button
        className="text-blue-600 hover:underline flex items-center"
        onClick={() => {
          setSelectedAsset(asset);
          setShowModal(true);
        }}
      >
        <FaEdit className="mr-1" /> 
      </button>

      {/* DELETE BUTTON */}
      <button
        className="text-red-600 hover:underline flex items-center"
        onClick={async () => {
          const confirmDelete = window.confirm(
            `Are you sure you want to delete "${asset.name}"?`
          );
          if (!confirmDelete) return;

          const { error } = await supabase
            .from("assets")
            .delete()
            .eq("id", asset.id);

          if (error) {
            console.error("Error deleting asset:", error);
            alert("Failed to delete asset. Try again.");
          } else {
            setAssets((prev) => prev.filter((a) => a.id !== asset.id));
          }
        }}
      >
        <FaTrash className="mr-1" />
      </button>
    </>
  
</td>

    </tr>
  ))}
</tbody>
        </table>

        {/* Modal */}
        <AddAssetModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          asset={selectedAsset || undefined}
          onAssetSaved={(asset, isEdit) => {
            if (isEdit) {
              setAssets((prev) => prev.map((a) => (a.id === asset.id ? asset : a)));
            } else {
              setAssets((prev) => [...prev, asset]);
            }
          }}
        />
      </div>
    </>
  );
};

export default AssetsTable;
