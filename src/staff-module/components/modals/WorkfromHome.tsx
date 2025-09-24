import React, { useState, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import { useUser } from "../../../context/UserContext";
import { supabase } from "../../../supabaseClient";
import { toast } from "react-hot-toast";

type Props = {
  onClose: () => void;
};

const WorkFromHomeRequestModal: React.FC<Props> = ({ onClose }) => {
  const { userData } = useUser();
  if (!userData) {
    console.error("User data not found");
    return null;
  }

  const [formData, setFormData] = useState({
    duration_id: "",
    date: "",
    reason: "",
    location: "",
  });

  const [durations, setDurations] = useState<{ id: string; duration_name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // fetch duration types from DB
  useEffect(() => {
    const fetchDurations = async () => {
      const { data, error } = await supabase.from("duration_types").select("id, duration_name");
      if (error) {
        console.error("Error fetching durations:", error);
      } else {
        setDurations(data || []);
      }
    };
    fetchDurations();
  }, []);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // compute day name from date
  const getDayName = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", { weekday: "long" });
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.duration_id || !formData.date || !formData.reason || !formData.location) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("attendance_requests").insert([
        {
          request_type: "WFH",
          start_date: formData.date,
          end_date: formData.date,
          reason: formData.reason,
          location: formData.location,
          status: "PENDING",
          company_id: userData.company_id,
          user_id: userData.id,
          duration_id: formData.duration_id, // correct FK
        },
      ]);

      if (error) throw error;

      console.log("✅ WFH request submitted successfully!");
      toast.success("WFH request submitted successfully!");
      // Reset form
      setFormData({
        duration_id: "",
        date: "",
        reason: "",
        location: "",
      });
      onClose();
    } catch (err: any) {
      console.error("❌ Submit error:", err);
      toast.error(err.message || "Failed to submit WFH request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-3xl p-8 shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-2xl text-gray-800 hover:text-black"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Work From Home Request
        </h2>

        {/* Form Box */}
        <div className="bg-gray-200 rounded-2xl p-6">
          <form className="grid grid-cols-3 gap-6" onSubmit={handleSubmit}>
            {/* Day (auto-calculated from date) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day
              </label>
              <input
                value={getDayName(formData.date)}
                readOnly
                className="w-full rounded-full border border-blue-400 px-4 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed"
              />
            </div>

            {/* Duration (dynamic) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration <span className="text-red-500">*</span>
              </label>
              <select
                name="duration_id"
                value={formData.duration_id}
                onChange={handleChange}
                required
                className="w-full rounded-full border border-blue-400 px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Select Duration</option>
                {durations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.duration_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full rounded-full border border-blue-400 px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
                placeholder="Enter your location"
                className="w-full rounded-full border border-blue-400 px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Reason */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason <span className="text-red-500">*</span>
              </label>
              <input
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                placeholder="Reason for WFH"
                className="w-full rounded-full border border-blue-400 px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Submit Button */}
            <div className="col-span-3 mt-6 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {loading ? (
                  "Submitting..."
                ) : (
                  <>
                    Submit Request <FiSend className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WorkFromHomeRequestModal;
