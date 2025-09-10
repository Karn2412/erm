import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

interface AddEmployeeFormProps {
  onEmployeeCreated: (userId: string, companyId: string) => void;
}

const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({
  onEmployeeCreated,
}) => {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    number: "",
    gender_id: "", // ✅ using gender_id instead of string
    dateOfJoining: "",
    designation_id: "",
    department_id: "",
    role_name: "staff",
    work_start: "",
    work_end: "",
    work_location: "",
  });

  const [departments, setDepartments] = useState<
    { id: string; department_name: string }[]
  >([]);
  const [genders, setGenders] = useState<{ id: string; type: string }[]>([]);
  const [designations, setDesignations] = useState<
    { id: string; designation: string }[]
  >([]);
  const [workLocations, setWorkLocations] = useState<any[]>([]);
  console.log("workLocations>>>>>>>>>>>>", workLocations);

  useEffect(() => {
    const fetchDesignations = async () => {
      const { data, error } = await supabase
        .from("designations")
        .select("id, designation");
      if (!error && data) {
        setDesignations(data);
      }
    };
    fetchDesignations();
  }, []);

  // ✅ Fetch departments for current admin’s company
  useEffect(() => {
    const fetchDepartments = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleRecord } = await supabase
        .from("user_roles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (!roleRecord) return;

      const { data, error } = await supabase
        .from("departments")
        .select("id, department_name")
        .eq("company_id", roleRecord.company_id);

      if (!error && data) {
        setDepartments(data);
      }
    };

    fetchDepartments();
  }, []);
  // ✅ Fetch work locations for current admin’s company
  const fetchWorkLocations = async () => {
    // 1. Get logged in user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // 2. Get company_id from user_roles
    const { data: roleRecord, error: roleError } = await supabase
      .from("user_roles")
      .select("company_id")
      .eq("id", user.id) // 👈 make sure this matches your user_roles schema (might be user_id instead of id)
      .single();

    if (roleError || !roleRecord) return;

    // 3. Fetch work locations for that company
    const { data, error } = await supabase
      .from("work_locations")
      .select("id, name")
      .eq("company_id", roleRecord.company_id);

    if (!error && data) {
      setWorkLocations(data);
    }
  };
  useEffect(() => {
    fetchWorkLocations();
  }, []);

  // ✅ Fetch genders list
  useEffect(() => {
    const fetchGenders = async () => {
      const { data, error } = await supabase.from("genders").select("id, type");
      if (!error && data) {
        setGenders(data);
      }
    };
    fetchGenders();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Get session token
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        alert("Session not found. Please login again.");
        return;
      }
      if (!formData.department_id) {
        alert("Please select a department.");
        return;
      }
      if (!formData.gender_id) {
        alert("Please select a gender.");
        return;
      }

      // inside handleSubmit
      if (!formData.department_id) {
        alert("Please select a department.");
        return;
      }

      const accessToken = session.access_token;

      // Get current logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("Failed to get current user.");
        return;
      }

      // Get company_id of current admin
      const { data: roleRecord, error: roleError } = await supabase
        .from("user_roles")
        .select("company_id, roles(role)")
        .eq("id", user.id)
        .single();

      if (roleError || !roleRecord) {
        alert("User role not found.");
        return;
      }

      const companyId = roleRecord.company_id;
      const fullName =
        `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim();
      const formattedDate = new Date(formData.dateOfJoining)
        .toISOString()
        .split("T")[0];

      const requestBody = {
  email: formData.email,
  password: formData.password,
  name: fullName,
  number: formData.number,
  gender_id: formData.gender_id,
  date_of_joining: formattedDate,
  designation_id: formData.designation_id,
  department_id: formData.department_id,
  company_id: companyId,
  role_name: formData.role_name,
  work_location: formData.work_location, // ✅ send selected location
};


      // Helper function to convert HH:mm to seconds
      const timeToSeconds = (timeStr: string) => {
        if (!timeStr) return 0;
        const [hours, minutes] = timeStr.split(":").map(Number);
        return hours * 3600 + minutes * 60;
      };

      console.log("requestBody>>>>>>>>>>>>>", requestBody);

      // Call Edge Function
      const response = await fetch(
        "https://xdcbcvvlbyizxhrbramv.supabase.co/functions/v1/my-function",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        alert(`❌ Failed: ${result.error}`);
      } else {
        const newUserId = result.user_id;

        // Insert work hours into working_hours table
        const { error: workHoursError } = await supabase
          .from("working_hours")
          .insert([
            {
              company_id: companyId,
              user_id: newUserId,
              work_start: timeToSeconds(formData.work_start),
              work_end: timeToSeconds(formData.work_end),
              created_at: new Date().toISOString(),
            },
          ]);

        if (workHoursError) {
          alert(
            `⚠️ Employee created, but failed to set working hours: ${workHoursError.message}`
          );
        } else {
          alert("✅ Employee and working hours added successfully!");
        }

        // Pass IDs to parent
        onEmployeeCreated(newUserId, companyId);

        // Reset form
        setFormData({
          firstName: "",
          middleName: "",
          lastName: "",
          email: "",
          password: "",
          number: "",
          gender_id: "", // ✅ reset to empty
          dateOfJoining: "",
          designation_id: "",
          department_id: "",
          role_name: "staff",
          work_start: "",
          work_end: "",
          work_location: "",
        });
      }
    } catch (err: any) {
      alert("Unexpected error: " + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 ">
      <div className="space-y-6 pr-6">
        {/* Employee Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Employee Name <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={formData.firstName}
              onChange={handleChange}
              className="w-3/4 px-3 py-2 border border-blue-400 rounded-full"
            />
            <input
              type="text"
              name="middleName"
              placeholder="Middle Name"
              value={formData.middleName}
              onChange={handleChange}
              className="w-3/4 px-3 py-2 border border-blue-400 rounded-full"
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={formData.lastName}
              onChange={handleChange}
              className="w-3/4 px-3 py-2 border border-blue-400 rounded-full"
            />
          </div>
        </div>

        {/* Date of Joining */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Joining <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="dateOfJoining"
              value={formData.dateOfJoining}
              onChange={handleChange}
              className="w-3/4 px-3 py-2 border border-blue-400 rounded-full"
            />
          </div>
        </div>

        {/* Email & Password */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="abc@company.com"
              value={formData.email}
              onChange={handleChange}
              className="w-3/4 px-3 py-2 border border-blue-400 rounded-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              value={formData.password}
              onChange={handleChange}
              className="w-3/4 px-3 py-2 border border-blue-400 rounded-full"
            />
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <input
            id="isDirector"
            type="checkbox"
            className="mt-1 h-5 w-5 rounded-md border-2 border-blue-400 text-blue-600 focus:ring-2 focus:ring-blue-300 cursor-pointer"
          />
          <label
            htmlFor="isDirector"
            className="text-sm text-gray-700 cursor-pointer"
          >
            Employee is a director/person with substantial interest in the
            company.
          </label>
        </div>

        {/* Gender & Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="relative w-3/4">
              <select
                name="gender_id"
                value={formData.gender_id}
                onChange={handleChange}
                className="w-full appearance-none px-3 py-2 border border-blue-400 rounded-full bg-white pr-10"
              >
                <option value="">Select Gender</option>
                {genders.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.type}
                  </option>
                ))}
              </select>
              {/* Dropdown Arrow with Circle */}
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <div className="w-6 h-6 rounded-full border border-blue-400 flex items-center justify-center bg-blue-50">
                  <svg
                    className="w-3 h-3 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="number"
              placeholder="+91 9876543210"
              value={formData.number}
              onChange={handleChange}
              className="w-3/4 px-3 py-2 border border-blue-400 rounded-full"
            />
          </div>
        </div>

        {/* Designation & Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Designation <span className="text-red-500">*</span>
            </label>
            <div className="relative w-3/4">
              <select
                name="designation_id"
                value={formData.designation_id}
                onChange={handleChange}
                className="w-full appearance-none px-3 py-2 border border-blue-400 rounded-full bg-white pr-10"
              >
                <option value="">Select Designation</option>
                {designations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.designation}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department <span className="text-red-500">*</span>
            </label>
            <div className="relative w-3/4">
              <select
                name="department_id"
                value={formData.department_id}
                onChange={handleChange}
                required
                className="w-full appearance-none px-3 py-2 border border-blue-400 rounded-full bg-white pr-10"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.department_name}
                  </option>
                ))}
              </select>
              {/* Dropdown Arrow with Circle */}
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <div className="w-6 h-6 rounded-full border border-blue-400 flex items-center justify-center bg-blue-50">
                  <svg
                    className="w-3 h-3 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="relative w-3/4">
              <select
                name="role_name"
                value={formData.role_name}
                onChange={handleChange}
                className="w-full appearance-none px-3 py-2 border border-blue-400 rounded-full bg-white pr-10"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
              {/* Dropdown Arrow with Circle */}
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <div className="w-6 h-6 rounded-full border border-blue-400 flex items-center justify-center bg-blue-50">
                  <svg
                    className="w-3 h-3 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Work Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Location <span className="text-red-500">*</span>
            </label>
            <div className="relative w-3/4">
              <select
                name="work_location"
                value={formData.work_location}
                onChange={handleChange}
                className="w-full appearance-none px-3 py-2 border border-blue-400 rounded-full bg-white pr-10"
              >
                <option value="">Select Location</option>
                {workLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              {/* Dropdown Arrow with Circle */}
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                <div className="w-6 h-6 rounded-full border border-blue-400 flex items-center justify-center bg-blue-50">
                  <svg
                    className="w-3 h-3 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Work Hours */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="work_start"
              value={formData.work_start}
              onChange={handleChange}
              className="w-3/4 px-3 py-2 border border-blue-400 rounded-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Work End Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="work_end"
              value={formData.work_end}
              onChange={handleChange}
              className="w-3/4 px-3 py-2 border border-blue-400 rounded-full"
            />
          </div>
        </div>

        {/* Enable Portal Access Checkbox */}
        <div className="flex items-start space-x-2 mt-3">
          <input
            id="portalAccess"
            type="checkbox"
            className="mt-1 h-5 w-5 rounded-md border-2 border-blue-400 text-blue-600 focus:ring-2 focus:ring-blue-300 cursor-pointer"
          />
          <label
            htmlFor="portalAccess"
            className="text-sm text-gray-700 cursor-pointer"
          >
            Enable Portal Access <br />
            <span className="text-xs text-gray-500">
              The employee will be able to view payslips, submit their IT
              declaration, create reimbursement claims and so on.
            </span>
          </label>
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
          >
            Add Employee
          </button>
        </div>
      </div>
    </form>
  );
};

export default AddEmployeeForm;
