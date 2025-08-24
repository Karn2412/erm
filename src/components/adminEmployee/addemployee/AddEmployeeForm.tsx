import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";

interface AddEmployeeFormProps {
  onEmployeeCreated: (userId: string, companyId: string) => void;
}

const AddEmployeeForm: React.FC<AddEmployeeFormProps> = ({ onEmployeeCreated }) => {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    number: "",
    gender: "Male",
    dateOfJoining: "",
    designation: "",
    department: "",
    role_name: "staff",
    work_start: "",
    work_end: "",
  });

  const [departments, setDepartments] = useState<{ id: string; department_name: string }[]>([]);

useEffect(() => {
  const fetchDepartments = async () => {
    // get current logged in user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // find company_id from user_roles
    const { data: roleRecord } = await supabase
      .from("user_roles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!roleRecord) return;

    // fetch departments for that company
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

      const accessToken = session.access_token;

      // Get current logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
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
      if (roleRecord.roles.role !== "admin") {
        alert("You are not an admin.");
        return;
      }

      const companyId = roleRecord.company_id;
      const fullName = `${formData.firstName} ${formData.middleName} ${formData.lastName}`.trim();
      const formattedDate = new Date(formData.dateOfJoining)
        .toISOString()
        .split("T")[0];

      const requestBody = {
        email: formData.email,
        password: formData.password,
        name: fullName,
        number: formData.number,
        gender: formData.gender,
        date_of_joining: formattedDate,
        
        designation: formData.designation,
        department_id: formData.department,
        company_id: companyId,
        role_name: formData.role_name,
      };
      // Helper function to convert HH:mm to seconds
const timeToSeconds = (timeStr: string) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 3600 + minutes * 60;
};


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
              users_id: newUserId,
                   work_start: timeToSeconds(formData.work_start), // ✅ converted to seconds
      work_end: timeToSeconds(formData.work_end),     // ✅ converted to seconds
              created_at: new Date().toISOString(),
            },
          ]);

        if (workHoursError) {
          alert(`⚠️ Employee created, but failed to set working hours: ${workHoursError.message}`);
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
          gender: "Male",
          dateOfJoining: "",
          designation: "",
          department: "",
          role_name: "staff",
          work_start: "",
          work_end: "",
        });
      }
    } catch (err: any) {
      alert("Unexpected error: " + err.message);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-md shadow-sm">
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

        {/* Gender & Mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gender <span className="text-red-500">*</span>
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-3/4 px-3 py-2 border border-blue-400 rounded-full bg-white"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
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
              Designation
            </label>
            <input
              type="text"
              name="designation"
              placeholder="e.g. Software Engineer"
              value={formData.designation}
              onChange={handleChange}
              className="w-3/4 px-3 py-2 border border-blue-400 rounded-full"
            />
          </div>
          <div>
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Department <span className="text-red-500">*</span>
  </label>
  <select
    name="department"
    value={formData.department}
    onChange={handleChange}
    className="w-3/4 px-3 py-2 border border-blue-400 rounded-full bg-white"
  >
    <option value="">Select Department</option>
    {departments.map((dept) => (
      <option key={dept.id} value={dept.id}>
        {dept.department_name}
      </option>
    ))}
  </select>
</div>

        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Role <span className="text-red-500">*</span>
          </label>
          <select
            name="role_name"
            value={formData.role_name}
            onChange={handleChange}
            className="w-3/4 px-3 py-2 border border-blue-400 rounded-full bg-white"
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
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
