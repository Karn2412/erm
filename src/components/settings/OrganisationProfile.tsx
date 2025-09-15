import React, { useState, useEffect, useContext } from "react";

import { supabase } from "../../supabaseClient";
import { UserContext } from "../../context/UserContext";

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  employee_count?: number;
  is_filing_address: boolean;

}

const OrganisationProfile: React.FC = () => {
  const [orgName, setOrgName] = useState("");
  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [address, setAddress] = useState("");
  const [industry, setIndustry] = useState("Services");
  const [businessLocation, setBusinessLocation] = useState("India");
  const [dateFormat, setDateFormat] = useState("dd/MM/yyyy");
  const [fieldSeparator, setFieldSeparator] = useState("/");
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const { userData } = useContext(UserContext);
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyNumber, setCompanyNumber] = useState("");
  const [companyLocationId, setCompanyLocationId] = useState<string | null>(
    null
  );
  const [isEditingContact, setIsEditingContact] = useState(false);
  console.log(orgName);


  // Fetch company + locations
  useEffect(() => {
    const fetchData = async () => {
      if (!userData?.company_id) return;
      setLoading(true);

      // 1. Fetch company with its primary linked location (via location_id)
      const { data: company, error: companyErr } = await supabase
        .from("companies")
        .select(`
        id,
        name,
        email,
        number,
        logo_url,
        industry,
        business_location,
        date_format,
        field_separator,
        location_id,
        head_office:location_id (
          id,
          name,
          address,
          city,
          state,
          pincode,
          is_filing_address
        )
      `)
        .eq("id", userData.company_id)
        .single();

      console.log("Company:", company, "Error:", companyErr);

      if (company && !companyErr) {
        setOrgName(company.name);
        setLogoUrl(company.logo_url);
        setIndustry(company.industry || "Services");
        setBusinessLocation(company.business_location || "India");
        setDateFormat(company.date_format || "dd/MM/yyyy");
        setFieldSeparator(company.field_separator || "/");
        setCompanyLocationId(company.location_id);
        setCompanyEmail(company.email || "");
        setCompanyNumber(company.number || "");


        if (company.head_office?.[0]) {
          setAddress(
            `${company.head_office[0].address}, ${company.head_office[0].city}, ${company.head_office[0].state}, ${company.head_office[0].pincode}`
          );
        }
      }

      // 2. Fetch all work locations for dropdown
      const { data: locs, error: locErr } = await supabase
        .from("work_locations")
        .select("*")
        .eq("company_id", userData.company_id);

      if (locs && !locErr) setLocations(locs);

      setLoading(false);
    };

    fetchData();
  }, [userData?.company_id]);

  // Update address whenever selected location changes
  useEffect(() => {
    if (!companyLocationId) return;
    const loc = locations.find((l) => l.id === companyLocationId);
    if (loc) {
      setAddress(`${loc.address}, ${loc.city}, ${loc.state}, ${loc.pincode}`);
    }
  }, [companyLocationId, locations]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setLogo(e.target.files[0]);
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logo) return logoUrl;
    const ext = logo.name.split(".").pop();
    const fileName = `company-${userData.company_id}-logo.${ext}`;
    console.log(fileName);

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(fileName, logo, { upsert: true });

    if (uploadError) {
      console.error("Upload failed:", uploadError);
      return null;
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(fileName);
    return data.publicUrl;
    console.log(data.publicUrl);

  };


  const handleSave = async () => {
    setLoading(true);
    const uploadedLogoUrl = await uploadLogo();

    const companyId = userData?.company_id;
    if (!companyId) {
      alert("No company linked to this user!");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("companies")
      .update({
        name: orgName,
        logo_url: uploadedLogoUrl || logoUrl,
        industry,
        business_location: businessLocation,
        date_format: dateFormat,
        field_separator: fieldSeparator,
        location_id: companyLocationId,
        email: companyEmail,
        number: companyNumber,
      })
      .eq("id", companyId);


    if (error) {
      console.error("Save failed:", error);
      alert("Save failed, please check console");
    } else {
      alert("Saved successfully!");
      setLogoUrl(uploadedLogoUrl || logoUrl);
    }

    setLoading(false);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 space-y-6">
      <h2 className="text-xl font-bold">Organisation Profile</h2>

      {/* Organisation Logo */}
      <div>
        <label className="font-medium text-sm">Organisation Logo</label>
        <div className="mt-2 flex items-center space-x-4">
          {logo ? (
            // Show preview if a new file is selected
            <div className="border rounded-lg p-2 flex flex-col items-center">
              <img
                src={URL.createObjectURL(logo)}
                alt="preview"
                className="w-24 h-24 object-contain mb-2"
              />
              <button
                type="button"
                className="text-xs text-red-500"
                onClick={() => setLogo(null)}
              >
                Remove logo
              </button>
            </div>
          ) : logoUrl ? (
            // Show saved logo if exists
            <div className="border rounded-lg p-2 flex flex-col items-center">
              <img
                src={logoUrl}
                alt="logo"
                className="w-24 h-24 object-contain mb-2"
              />
              <button
                type="button"
                className="text-xs text-red-500"
                onClick={() => setLogoUrl(null)}
              >
                Remove logo
              </button>
            </div>
          ) : (
            // If no logo yet
            <input type="file" accept="image/*" onChange={handleLogoChange} />
          )}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          This logo will be displayed on documents such as Payslip and TDS Worksheet. <br />
          Preferred Image Size: 240 × 240px @ 72 DPI, Maximum size 1MB. <br />
          File Formats: PNG, JPG, and JPEG
        </p>
      </div>


      {/* Organisation Name */}
      <div>
        <label className="block text-sm font-medium">Organisation Name *</label>
        <input
          type="text"
          value={orgName}
          onChange={(e) => setOrgName(e.target.value)}
          className="mt-1 p-2 border border-blue-300 rounded w-full"
        />
      </div>

      {/* Business location & Industry */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Business Location *</label>
          <select
            value={businessLocation}
            onChange={(e) => setBusinessLocation(e.target.value)}
            className="mt-1 p-2 border rounded w-full border-blue-300"
          >
            <option value="India">India</option>
            <option value="US">United States</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Industry *</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="mt-1 p-2 border rounded w-full border-blue-300"
          >
            <option value="Services">Services</option>
            <option value="IT">IT</option>
          </select>
        </div>
      </div>

      {/* Date Format & Field Separator */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Date Format *</label>
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="mt-1 p-2 border rounded w-full border-blue-300"
          >
            <option value="dd/MM/yyyy">dd/MM/yyyy</option>
            <option value="MM/dd/yyyy">MM/dd/yyyy</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Field Separator</label>
          <select
            value={fieldSeparator}
            onChange={(e) => setFieldSeparator(e.target.value)}
            className="mt-1 p-2 border rounded w-full border-blue-300"
          >
            <option value="/">/</option>
            <option value="-">-</option>
          </select>
        </div>
      </div>

      {/* Organisation Address */}
      <div>
        <label className="block text-sm font-medium">Organisation Address *</label>
        <select
          value={companyLocationId || ""}
          onChange={(e) => setCompanyLocationId(e.target.value)}
          className="mt-1 p-2 border rounded w-full border-blue-300"
        >
          <option value="">Select a work location</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name} – {loc.city}, {loc.state}
            </option>
          ))}
        </select>
      </div>

      {/* Filing Address Card */}
      <div className="border rounded-lg p-4 bg-gray-50 border-blue-300">
        <h3 className="font-semibold">Head Office</h3>
        <p>{address}</p>
        <p className="text-sm text-gray-600 mt-1">
          This registered address will be used across all Forms & Payslips.
        </p>
      </div>

      {/* Contact Info */}
      const [isEditingContact, setIsEditingContact] = useState(false);

// Contact Info Section
<div>
  <h3 className="font-semibold flex items-center justify-between">
    Contact Info
    {!isEditingContact && (
      <button
        onClick={() => setIsEditingContact(true)}
        className="text-sm text-blue-600 hover:underline"
      >
        Edit
      </button>
    )}
  </h3>

  <div className="border rounded-lg p-4 mt-2 border-blue-300 space-y-4">
    {isEditingContact ? (
      <>
        <div>
          <label className="block text-sm font-medium">Primary Email</label>
          <input
            type="email"
            value={companyEmail}
            onChange={(e) => setCompanyEmail(e.target.value)}
            className="mt-1 p-2 border rounded w-full border-blue-300"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Primary Phone Number</label>
          <input
            type="text"
            value={companyNumber}
            onChange={(e) => setCompanyNumber(e.target.value)}
            className="mt-1 p-2 border rounded w-full border-blue-300"
          />
        </div>

        <div className="flex space-x-2">
          <button
            onClick={async () => {
              setLoading(true);
              const { error } = await supabase
                .from("companies")
                .update({
                  email: companyEmail,
                  number: companyNumber,
                })
                .eq("id", userData.company_id);

              if (error) {
                alert("Failed to save contact info");
                console.error(error);
              } else {
                alert("Contact info updated successfully!");
                setIsEditingContact(false);
              }
              setLoading(false);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditingContact(false)}
            className="bg-gray-300 text-black px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </>
    ) : (
      <>
        <p>
          <span className="font-medium">Email:</span> {companyEmail || "-"}
        </p>
        <p>
          <span className="font-medium">Phone:</span> {companyNumber || "-"}
        </p>
      </>
    )}
  </div>
</div>



      {/* Work Locations */}


      {/* Save Button */}
      <button
        onClick={handleSave}
        className="bg-indigo-600 text-white px-4 py-2 rounded mt-4 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </div>
  );
};

export default OrganisationProfile;
