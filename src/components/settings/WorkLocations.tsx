import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { FaUsers, FaEdit } from "react-icons/fa";
import { useUser } from "../../context/UserContext"; // Adjust path to your UserContext

// Hardcoded districts remain
const districts = {
  Kerala: ["Ernakulam", "Kollam", "Kozhikode"],
  "Tamil Nadu": ["Chennai", "Coimbatore"],
  Karnataka: ["Bangalore", "Mysore"],
};
console.log(districts);


const WorkLocations: React.FC = () => {
  const { userData } = useUser(); // Fetch logged-in user data
  const [locations, setLocations] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]); // store state objects with id & name
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    city: "",
    state: "", // this will be state id (uuid)
    pincode: "",
    isFilingAddress: false,
  });

  // Fetch states and locations
  useEffect(() => {
    fetchStates();
    fetchLocations();
  }, []);

  const fetchStates = async () => {
    const { data, error } = await supabase.from("states").select("id,name");
    if (error) console.error("Error fetching states:", error);
    else setStates(data || []);
  };

 const fetchLocations = async () => {
  if (!userData?.company_id) {
    console.error("Company ID not found for logged-in user");
    setLoading(false);
    return;
  }

  try {
    const { data, error } = await supabase
      .from("work_locations")
      .select(
        "id,name,address,city,state,pincode,is_filing_address,company_id"
      )
      .eq("company_id", userData.company_id); // Must be a valid UUID

    if (error) throw error;
    setLocations(data || []);
  } catch (err) {
    console.error("Error fetching locations:", err);
  } finally {
    setLoading(false);
  }
};


const getStateName = (stateId: string) => states.find((s) => s.id === stateId)?.name || "";


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userData?.company_id) {
      alert("❌ Company not found for logged-in user.");
      return;
    }

    const dataToSubmit = {
      name: form.name,
      address: form.address,
      city: form.city,
      state: form.state, // UUID of selected state
      pincode: form.pincode,
      company_id: userData.company_id, // dynamic company id
      is_filing_address: form.isFilingAddress,
    };

    if (editing) {
      const { error } = await supabase
        .from("work_locations")
        .update(dataToSubmit)
        .eq("id", editing.id);

      if (error) {
        alert("❌ Failed to update location");
        console.error(error);
      } else {
        alert("✅ Location updated!");
        setEditing(null);
        setShowForm(false);
        fetchLocations();
      }
    } else {
      const { error } = await supabase.from("work_locations").insert([dataToSubmit]);
      if (error) {
        alert("❌ Failed to add location");
        console.error(error);
      } else {
        alert("✅ Location added!");
        setShowForm(false);
        fetchLocations();
      }
    }
    resetForm();
  };

  const resetForm = () => {
    setForm({
      name: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      isFilingAddress: false,
    });
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Work Locations</h2>
        <button
          onClick={() => {
            resetForm();
            setEditing(null);
            setShowForm(true);
          }}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add Work Location
        </button>
      </div>

      {/* Locations List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {locations.map((loc) => (
        <div
  key={loc.id}
  className="border border-blue-400 rounded-lg shadow p-4 bg-white relative" // relative parent
>
  <div className="flex justify-between items-start">
    <h3 className="text-lg font-semibold">{loc.name}</h3>

    {/* Edit button */}
    <button
      onClick={() => {
        setForm({
          ...loc,
          state: loc.state,
          isFilingAddress: loc.is_filing_address,
        });
        setEditing(loc);
        setShowForm(true);
      }}
      className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 text-blue-500 hover:bg-blue-200"
      title="Edit"
    >
      <FaEdit />
    </button>
  </div>

  <p>{loc.address}</p>
  <p>
    {loc.city},<br /> {getStateName(loc.state)},<br />
    {loc.pincode}
  </p>

  <p className="text-sm text-gray-500 mt-1 flex items-center">
    <FaUsers className="mr-1" /> {loc.employee_count || 0} Employees
  </p>

  {/* Filing Address badge */}
  {loc.is_filing_address && (
    <span className="absolute right-0 bottom-0 mb-2 mr-2 text-xs bg-green-200 px-2 py-1 rounded">
      Filing Address
    </span>
  )}
</div>


        ))}
      </div>

      {/* Add/Edit Form Modal */}
{showForm && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start pt-20 z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
      <h3 className="text-lg font-bold mb-6">
        {editing ? "Edit" : "Add"} Work Location
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Work Location Name */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Work Location Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="address"
            placeholder="Address Line 1"
            value={form.address}
            onChange={handleChange}
            className="w-full border border-gray-300 p-2 rounded mb-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
            required
          />
         
        </div>

        {/* State, City, Pincode */}
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium mb-1">State*</label>
            <select
              name="state"
              value={form.state}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            >
              <option value="">Select State</option>
              {states.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City*</label>
           <input type="text" 
           className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
           onChange={handleChange}
           value={form.city}
           name="city"
            required
           />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pincode*</label>
            <input
              type="text"
              name="pincode"
              value={form.pincode}
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Info Text */}
        <p className="text-xs text-gray-500 bg-blue-50 border-l-4 border-blue-300 p-2 rounded">
          Labour Welfare Fund is applicable for {getStateName(form.state) || "selected state"}. 
          If not configured yet, configure it in <b>Settings &gt; Statutory Components</b>.
        </p>

        {/* Filing Address Checkbox */}
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="isFilingAddress"
            checked={form.isFilingAddress}
            onChange={handleChange}
          />
          <span className="text-sm">Set as Filing Address</span>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-2 mt-2">
          <button
            type="button"
            onClick={() => {
              setShowForm(false);
              setEditing(null);
            }}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    </div>
  );
};

export default WorkLocations;
