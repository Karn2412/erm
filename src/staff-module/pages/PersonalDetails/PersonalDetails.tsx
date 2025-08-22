import React, { useEffect, useState } from "react";

import BasicDetailsForm from "../../components/personaldetails/BasicDetailsForm";
import SectionStepper from "../../components/personaldetails/SectionTabs";

import BankingDetailsForm from "../../components/personaldetails/BankingDetailForm";
import DocumentUploadForm from "../../components/personaldetails/DocumentUploadForm";
import { supabase } from "../../../supabaseClient";

const PersonalDetailsPage: React.FC = () => {

  const [currentSection, setCurrentSection] = useState(1);

  const [basicDetails, setBasicDetails] = useState<any>({});
  const [bankingDetails, setBankingDetails] = useState<any>({});
  const [usersdocuments, setDocuments] = useState<any>({
  documents: [],  // ✅ Keep only this
});


const handleSubmit = async () => {
  try {
    const { data: authUser } = await supabase.auth.getUser();
    const userId = authUser?.user?.id;

    if (!userId) {
      alert("User not logged in");
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", userId)
      .maybeSingle();

    const companyId = profile?.company_id;
    if (!companyId) {
      alert("No company assigned to this user.");
      return;
    }

    // Upload helper
  const uploadFile = async (file: File) => {
  const sanitizedName = file.name.replace(/\s+/g, "_").replace(/[\[\]]/g, "");
  const path = `documents/${Date.now()}_${sanitizedName}`;

  const { data, error } = await supabase.storage
    .from("usersdocuments")
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (error) {
    console.error("Upload error:", error.message);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from("usersdocuments")
    .getPublicUrl(path);

  return publicUrlData.publicUrl;
};


    // Upload all files in documents[]
    const documentUploads = await Promise.all(
      (usersdocuments.documents || []).map(async (doc: any) => {
        if (doc.file instanceof File) {
          const url = await uploadFile(doc.file);
          return { name: doc.name, url };
        }
        return { name: doc.name, url: doc.url };
      })
    );

    // Save in DB
    const { error } = await supabase.from("personal_details").upsert(
      {
        id: userId,
        company_id: companyId,
        date_of_birth: basicDetails.date_of_birth,
        age: basicDetails.age,
        pan_no: basicDetails.pan_no,
        fathers_name: basicDetails.father_name,
        personal_email: basicDetails.personal_email,
        address_1: basicDetails.address_line1,
        address_2: basicDetails.address_line2,
        differently_abled: basicDetails.differently_abled_type,
        city: basicDetails.city,
        state: basicDetails.state,
        pincode: basicDetails.pincode,
        full_name: bankingDetails.name,
        account_number: bankingDetails.accountNumber,
        ifsc_code: bankingDetails.ifscCode,
        bank_name: bankingDetails.bankName,
        branch_name: bankingDetails.branchName,
        documents: documentUploads, // ✅ Only user-uploaded docs
      },
      { onConflict: "id" }
    );

    if (error) throw error;

    alert("Details submitted/updated successfully!");
  } catch (error) {
    console.error("Submit Error:", error);
    alert("Submission failed.");
  }
};
;
;

  useEffect(() => {
    const fetchPersonalDetails = async () => {
      const { data: authUser } = await supabase.auth.getUser();
      const userId = authUser?.user?.id;

      if (!userId) return;

      const { data, error } = await supabase
        .from("personal_details")
        .select("*")
        .eq("id", userId)
        .maybeSingle(); // ✅ FIXED

      if (error) {
        console.error("Fetch personal details error:", error);
        return;
      }

      if (!data) {
        console.log("No personal details found for this user.");
        return;
      }

      // ✅ Set state if data exists
      setBasicDetails({
        date_of_birth: data.date_of_birth,
        age: data.age,
        pan_no: data.pan_no,
        father_name: data.fathers_name,
        personal_email: data.personal_email,
        address_line1: data.address_1,
        address_line2: data.address_2,
        differently_abled_type: data.differently_abled,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
      });

      setBankingDetails({
        accountNumber: data.account_number,
        name: data.full_name,
        ifscCode: data.ifsc_code,
        bankName: data.bank_name,
        branchName: data.branch_name,
      });

      setDocuments(() => ({
        documents:  data.documents || [],   }));

      console.log("Fetched Personal Details:", data);
    };

    fetchPersonalDetails();
  }, []);

  return (
    
      
      <div className="flex flex-col w-full">
        {/* <StaffSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      /> */}
        {/* <Header /> */}
        <main className="p-6 bg-blue-50">
          <div className="bg-white p-4">
            <SectionStepper
              currentSection={currentSection}
              onSectionChange={setCurrentSection}
            />
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              {currentSection === 1 && (
                <BasicDetailsForm
                  formData={basicDetails}
                  setFormData={setBasicDetails}
                />
              )}
              {currentSection === 2 && (
                <BankingDetailsForm
                  formData={bankingDetails}
                  setFormData={setBankingDetails}
                />
              )}
              {currentSection === 3 && (
                <DocumentUploadForm
                  formData={usersdocuments}
                  setFormData={setDocuments}
                />
              )}
            </div>

            {currentSection === 3 && (
              <div className="mt-6 text-right">
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-6 py-2 rounded-full hover:bg-blue-700"
                >
                  Submit Details
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    
  );
};

export default PersonalDetailsPage;
