import React, { useEffect, useState } from 'react';
import { supabase } from '../../../supabaseClient';

interface BasicDetailsFormProps {
  authId: string; // pass logged-in user id
  formData: any;
  setFormData: (data: any) => void;
}

interface DropdownItem {
  id: string;        // since UUID is string
  name?: string;     // for states
  type_name?: string; // for differently_abled_types
}

const BasicDetailsForm: React.FC<BasicDetailsFormProps> = ({ authId, formData, setFormData }) => {
  const pillInput =
    'w-full px-4 py-2 border-2 border-blue-400 rounded-full focus:outline-none focus:border-blue-500';
  const pillSelect =
    'w-full px-4 py-2 border-2 border-blue-400 rounded-full bg-white focus:outline-none focus:border-blue-500 appearance-none';

  const [states, setStates] = useState<DropdownItem[]>([]);
  const [abledTypes, setAbledTypes] = useState<DropdownItem[]>([]);

  // 🔹 Fetch dropdown options
  useEffect(() => {
    const fetchDropdowns = async () => {
      const { data: statesData } = await supabase.from('states').select('*');
      setStates(statesData || []);

      const { data: typesData } = await supabase.from('differently_abled_types').select('*');
      setAbledTypes(typesData || []);
    };

    fetchDropdowns();
  }, []);

  // 🔹 Fetch user’s personal details from the view
  useEffect(() => {
    const fetchUserDetails = async () => {
      const { data, error } = await supabase
        .from('admin_personal_details_view')
        .select('*')
        .eq('auth_id', authId)  // filter by user
        .single();

      if (error) {
        console.error('Error fetching details:', error);
      } else if (data) {
        setFormData(data);
      }
    };

    if (authId) fetchUserDetails();
  }, [authId, setFormData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg max-h-screen overflow-y-auto">
      <form className="space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date of Birth <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date_of_birth"
              className={pillInput}
              value={formData.date_of_birth || ''}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Age <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="age"
              placeholder="00"
              className={pillInput}
              value={formData.age || ''}
              onChange={handleChange}
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PAN <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="pan_no"
              placeholder="XXXXXXXXXX"
              className={pillInput}
              value={formData.pan_no || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Father's Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fathers_name"
              placeholder="Father's Name"
              className={pillInput}
              value={formData.fathers_name || ''}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Differently Abled Type
            </label>
            <select
              name="differently_abled_id"
              className={pillSelect}
              value={formData.differently_abled_id || ''}
              onChange={handleChange}
            >
              <option value="">Select Type</option>
              {abledTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.type_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Personal Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="personal_email"
              placeholder="xxxx@gmail.com"
              className={pillInput}
              value={formData.personal_email || ''}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address Line 1
          </label>
          <input
  type="text"
  name="address_1"
  placeholder="Address line 1"
  className={pillInput}
  value={formData.address_1 || ''}
  onChange={handleChange}
/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Address Line 2
          </label>
          <input
  type="text"
  name="address_2"
  placeholder="Address line 2"
  className={pillInput}
  value={formData.address_2 || ''}
  onChange={handleChange}
/>
        </div>

        {/* State, City (text), Pincode */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* State */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
  <select
    name="state"
    className={pillSelect}
    value={formData.state || ''}   // use `state` not `state_id`
    onChange={handleChange}
  >
    <option value="">Select State</option>
    {states.map((state) => (
      <option key={state.id} value={state.name}>
        {state.name}
      </option>
    ))}
  </select>
</div>



          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input
              type="text"
              name="city"
              placeholder="City"
              className={pillInput}
              value={formData.city || ''}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
            <input
              type="number"
              name="pincode"
              placeholder="Pincode"
              className={pillInput}
              value={formData.pincode || ''}
              onChange={handleChange}
              min={0}
            />
          </div>
        </div>
      </form>
    </div>
  );
};

export default BasicDetailsForm;
