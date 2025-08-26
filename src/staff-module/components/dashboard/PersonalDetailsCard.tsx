import  { useEffect } from 'react';
import { FaExclamationCircle } from 'react-icons/fa';
import { supabase } from '../../../supabaseClient'; // update path if needed
import { useUser } from '../../../context/UserContext';

const PersonalDetailsCard = () => {
  const { userData, setUserData } = useUser(); // ✅ Make sure setUserData is accessible

  console.log( userData);
  

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('User not authenticated:', authError);
        return;
      }

      const { data, error } = await supabase
        .from('user_with_email')
        .select('*')
        .eq('id', user.id)
        .single();

        console.log('Fetched User Data:', data);

      if (error) {
        console.error('Error fetching user data:', error);
      } else {
        setUserData(data);
      }
    };

    fetchUserData();
    console.log('User Data:', userData);
    
  }, []);

  return (
    <div className="bg-gray-100 p-6 rounded-2xl shadow col-span-3">
      <h2 className="font-semibold text-sm mb-6">View Your Personal Details</h2>

      <div className="grid grid-cols-3 gap-6 text-sm">
        {/* Row 1: Employee Name */}
        <div>
          <label className="block mb-1 font-medium text-gray-600">
            Employee Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="First Name"
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            value={userData?.name || ''}
            readOnly
          />
        </div>
        <div className="pt-6">
          <input
            type="text"
            placeholder="Middle Name"
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            value={userData?.middle_name || ''}
            readOnly
          />
        </div>
        <div className="pt-6">
          <input
            type="text"
            placeholder="Last Name"
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            value={userData?.last_name || ''}
            readOnly
          />
        </div>

        {/* Row 2: Employee ID & Date of Joining */}
        <div>
          <label className="block mb-1 font-medium text-gray-600">
            Employee ID <span className="text-red-500">*</span>
          </label>
          <input
            value={userData?.id || ''}
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            readOnly
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-600">
            Date of Joining <span className="text-red-500">*</span>
          </label>
          <input
            value={userData?.date_of_joining || ''}
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            readOnly
          />
        </div>
        <div />

        {/* Row 3: Email & Mobile */}
        <div>
          <label className="block mb-1 font-medium text-gray-600">
            Work Email <span className="text-red-500">*</span>
          </label>
          <input
            value={userData?.email || ''}
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            readOnly
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-600">Mobile Number</label>
          <input
            value={userData?.number || ''}
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            readOnly
          />
        </div>
        <div />

        {/* Row 4: Checkbox */}
        <div className="col-span-3 flex items-center space-x-2 text-xs text-gray-600">
          <input
            type="checkbox"
            className="accent-blue-500 w-4 h-4"
            checked={userData?.is_director || false}
            readOnly
          />
          <span>Employee is a director/person with substantial interest in the company.</span>
          <FaExclamationCircle className="text-gray-400 text-sm" />
        </div>

        {/* Row 5: Gender, Work Location, Designation */}
        <div>
          <label className="block mb-1 font-medium text-gray-600">Gender <span className="text-red-500">*</span></label>
          <select
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            value={userData?.gender || ''}
            disabled
          >
            <option value="">Select Gender</option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-600">password <span className="text-red-500">*</span></label>
          <input
            value={userData?.password || ''}
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            readOnly
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-600">Designation <span className="text-red-500">*</span></label>
          <input
            value={userData?.designation || ''}
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            readOnly
          />
        </div>

        {/* Row 6: Department, Reporting Manager */}
        <div>
          <label className="block mb-1 font-medium text-gray-600">Department <span className="text-red-500">*</span></label>
          <input
            value={userData?.department || ''}
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            readOnly
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-600">Reporting Manager <span className="text-red-500">*</span></label>
          <input
            value={userData?.reporting_manager || ''}
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            readOnly
          />
        </div>
        <div />

        {/* Extra fields: Company ID and Level */}
        <div>
          <label className="block mb-1 font-medium text-gray-600">Company ID</label>
          <input
            value={userData?.company_id || ''}
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            readOnly
          />
        </div>
        <div>
          <label className="block mb-1 font-medium text-gray-600">Level</label>
          <input
            value={userData?.levels|| ''}
            className="w-full border border-blue-400 rounded-full px-4 py-2 outline-none"
            readOnly
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsCard;
