import React, { useState, useEffect } from "react";
import { supabase } from "../../../supabaseClient";
import { FaUpload } from "react-icons/fa";

interface Document {
  name: string;
  url?: string;
}

interface Props {
  formData: { documents: Document[] };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  requiredDocs: string[];
}

const DocumentUploadForm: React.FC<Props> = ({
  formData,
  setFormData,
  requiredDocs,
}) => {
  const [newDocFile, setNewDocFile] = useState<File | null>(null);

console.log(newDocFile);


  // ✅ Fetch existing documents from DB on mount
  useEffect(() => {
    const fetchDocuments = async () => {
      const { data: authUser } = await supabase.auth.getUser();
      const userId = authUser?.user?.id;
      if (!userId) return;

      const { data, error } = await supabase
        .from("personal_details")
        .select("documents")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching documents:", error);
        return;
      }

      if (data?.documents) {
        setFormData((prev: any) => ({
          ...prev,
          documents: data.documents,
        }));
      }
    };

    fetchDocuments();
  }, [setFormData]);

  // ✅ Upload file immediately
  const handleAddDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setNewDocFile(file);

    try {
      const sanitizedName = file.name.replace(/\s+/g, "_");
      const path = `documents/${Date.now()}_${sanitizedName}`;

      const { error } = await supabase.storage
        .from("usersdocuments")
        .upload(path, file, { cacheControl: "3600", upsert: true });

      if (error) throw error;

      const { data } = supabase.storage
        .from("usersdocuments")
        .getPublicUrl(path);

      const newDoc = { name: file.name, url: data.publicUrl };
      const updatedDocs = [...(formData.documents || []), newDoc];

      setFormData((prev: any) => ({
        ...prev,
        documents: updatedDocs,
      }));

      // save to DB
      const { data: authUser } = await supabase.auth.getUser();
      const userId = authUser?.user?.id;
      if (userId) {
        await supabase
          .from("personal_details")
          .update({ documents: updatedDocs })
          .eq("id", userId);
      }
    } catch (err) {
      console.error("Upload Error:", err);
      alert("Failed to upload document.");
    }
  };

  // ✅ Delete file
  const handleDeleteDocument = async (doc: Document) => {
    if (!doc.url) return;

    try {
      const filePath = decodeURIComponent(
        doc.url.split("/storage/v1/object/public/usersdocuments/")[1]
      );

      await supabase.storage.from("usersdocuments").remove([filePath]);

      const updatedDocs = formData.documents.filter((d) => d.url !== doc.url);
      setFormData((prev: any) => ({ ...prev, documents: updatedDocs }));

      const { data: authUser } = await supabase.auth.getUser();
      const userId = authUser?.user?.id;
      if (userId) {
        await supabase
          .from("personal_details")
          .update({ documents: updatedDocs })
          .eq("id", userId);
      }
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete document.");
    }
  };

  // ✅ View file (open in new tab)
  const handleViewDocument = (doc: Document) => {
    if (doc.url) {
      window.open(doc.url, "_blank");
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Upload Listed Documents <span className="text-red-500">*</span>
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Left Column - Upload + Required Docs */}
        <div>
          <label className="inline-flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-full cursor-pointer hover:bg-blue-700 transition">
            <FaUpload className="w-4 h-4" />
            <span>Upload Files</span>
            <input
              type="file"
              className="hidden"
              onChange={handleAddDocument}
            />
          </label>

          {/* Required documents list */}
          <ul className="mt-8 list-decimal list-inside text-sm text-gray-800 space-y-1">
            {requiredDocs.map((doc, idx) => (
              <li key={idx}>{doc}</li>
            ))}
          </ul>
        </div>

        {/* Right Column - Uploaded Docs as Pills */}
        <div className="space-y-2">
          
          <div className="flex flex-wrap gap-2">
            {formData.documents?.map((doc, index) => (
              <div
                key={index}
                className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm cursor-pointer hover:bg-blue-200 transition"
                onClick={() => handleViewDocument(doc)}
              >
                <span className="truncate max-w-[120px]">{doc.name}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteDocument(doc);
                  }}
                  className="ml-2 text-gray-600 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadForm;
