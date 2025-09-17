import React, { useState } from "react";
import { FiSend } from "react-icons/fi";
import { useUser } from "../../../context/UserContext";
import { supabase } from "../../../supabaseClient";

type Props = {
  onClose: () => void;
};

const RegularizationRequestModal: React.FC<Props> = ({ onClose }) => {
  const { userData } = useUser();
  console.log("User Data:", userData);
 

  const [formData, setFormData] = useState({
    day: "",
    checkIn: "",
    checkOut: "",
    date: "",
    reason: "",
  });
  console.log("Form Data:", formData);

  const [loading, setLoading] = useState(false);

  // If userData is missing, don't render the modal at all
  if (!userData) {
    console.error("User data not found — not rendering modal");
    return null;
  }

  // Prevent rendering if IDs are missing (avoids UUID "" error)
  if (!userData.company_id || !userData.id) {
    console.error("Missing user or company ID");
    alert(
      "Missing user or company information. Please try logging in again."
    );
    return null;
  }
  
  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  if (name === "date") {
    const selectedDate = new Date(value);
    const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" });
    setFormData({
      ...formData,
      date: value,
      day: dayName, // auto-fill day
    });
  } else {
    setFormData({ ...formData, [name]: value });
  }
};


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!formData.day || !formData.checkIn || !formData.checkOut || !formData.date || !formData.reason) {
    alert("Please fill in all required fields");
    return;
  }

  if (!userData.company_id || !userData.id || userData.company_id.length !== 36 || userData.id.length !== 36) {
    alert("Invalid user or company ID");
    return;
  }

  setLoading(true);

const payload = {
  company_id: userData.company_id,
  user_id: userData.id,
  request_type: "REGULARIZATION",
  requested_check_in: `${formData.date}T${formData.checkIn}:00+00:00`,
  requested_check_out: `${formData.date}T${formData.checkOut}:00+00:00`,
  start_date: formData.date,  // <-- ADD THIS
  end_date: formData.date,    // optional, but good for consistency
  reason: formData.reason
};


  console.log("Submitting payload:", payload);

  try {
    const { error } = await supabase
      .from("attendance_requests")
      .insert([payload]);

    if (error) throw error;

    console.log("✅ Regularization request submitted successfully!");
    setFormData({ day: "", checkIn: "", checkOut: "", date: "", reason: "" });
    onClose();
  } catch (err: any) {
    console.error("❌ Submit error:", err);
    alert(err.message || "Failed to submit regularization request");
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
          Regularization Request
        </h2>

        {/* Form Box */}
        <div className="bg-gray-200 rounded-2xl p-6">
          <form
            className="grid grid-cols-3 gap-6"
            onSubmit={handleSubmit}
          >
            {/* Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Day 
              </label>
              <input
                name="day"
                value={formData.day}
                onChange={handleChange}
                className="w-full rounded-full border border-blue-400 px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Day"
              />
            </div>

            {/* Check In */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check In <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="checkIn"
                value={formData.checkIn}
                onChange={handleChange}
                className="w-full rounded-full border border-blue-400 px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Check Out */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Check Out <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="checkOut"
                value={formData.checkOut}
                onChange={handleChange}
                className="w-full rounded-full border border-blue-400 px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
              />
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
                className="w-full rounded-full border border-blue-400 px-4 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-300"
                placeholder="Reason"
              />
            </div>

            {/* Submit Button */}
            <div className="col-span-3 mt-6 flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-yellow-500 text-white px-6 py-2 rounded-xl hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
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

export default RegularizationRequestModal;

