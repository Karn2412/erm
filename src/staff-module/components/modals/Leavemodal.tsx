import React, { useState, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import { useUser } from "../../../context/UserContext";
import { supabase } from "../../../supabaseClient";

type Props = {
  onClose: () => void;
};

const LeaveRequestModal: React.FC<Props> = ({ onClose }) => {
  const { userData } = useUser();
  if (!userData) {
    console.error("User data not found");
    return null;
  }

  const [formData, setFormData] = useState({
    day: "",
    type: "",
    duration: "",
    date: "",
    reason: "",
  });

  const [durations, setDurations] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔹 Fetch duration & leave types dynamically
  useEffect(() => {
    const fetchDurations = async () => {
      const { data, error } = await supabase
        .from("duration_types")
        .select("id, duration_name");
      if (error) console.error("Error fetching durations:", error);
      else setDurations(data || []);
    };

    const fetchLeaveTypes = async () => {
      const { data, error } = await supabase
        .from("leave_types")
        .select("id, leave_name");
      if (error) console.error("Error fetching leave types:", error);
      else setLeaveTypes(data || []);
    };

    fetchDurations();
    fetchLeaveTypes();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "date") {
      const selectedDate = new Date(value);
      const dayName = selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
      });
      setFormData({ ...formData, date: value, day: dayName });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.day ||
      !formData.type ||
      !formData.duration ||
      !formData.date ||
      !formData.reason
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("attendance_requests").insert([
        {
          request_type: "LEAVE",
          start_date: formData.date,
          end_date: formData.date,
          reason: formData.reason,
          company_id: userData.company_id,
          user_id: userData.id,
          duration_id: formData.duration, // dynamic duration id
          leave_type_id: formData.type,   // ✅ dynamic leave type id
        },
      ]);

      if (error) throw error;

      console.log("✅ Leave request submitted successfully!");
      setFormData({ day: "", type: "", duration: "", date: "", reason: "" });
      onClose();
    } catch (err: any) {
      console.error("❌ Submit error:", err);
      alert(err.message || "Failed to submit leave request");
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
          Leave Request
        </h2>

        {/* Form Box */}
        <div className="bg-gray-200 rounded-2xl p-6">
          <form className="grid grid-cols-3 gap-6" onSubmit={handleSubmit}>
            {/* Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day
              </label>
              <input
                name="day"
                value={formData.day}
                readOnly
                className="w-full rounded-full border border-blue-400 px-4 py-2 text-sm bg-gray-100 text-gray-800 cursor-not-allowed"
              />
            </div>

            {/* Type (dynamic from DB) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type <span className="text-red-500">*</span>
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full rounded-full border border-blue-400 px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
              >
                <option value="">Select Type</option>
                {leaveTypes.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.leave_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Duration (dynamic from DB) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration <span className="text-red-500">*</span>
              </label>
              <select
                name="duration"
                value={formData.duration}
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
                className="w-full rounded-full border border-blue-400 px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Reason"
              />
            </div>

            {/* Submit Button */}
            <div className="col-span-3 mt-6 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
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

export default LeaveRequestModal;
