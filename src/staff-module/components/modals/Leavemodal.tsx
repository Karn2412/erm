import React, { useState, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import { useUser } from "../../../context/UserContext";
import { supabase } from "../../../supabaseClient";
import { toast } from "react-hot-toast";

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

  // 🔹 Helper to calculate total days between start_date and end_date
  const calculateDays = (start: string, end: string) => {
    const s = new Date(start);
    const e = new Date(end);
    return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  // 🔹 Fetch durations + leave types with balance check
  useEffect(() => {
    const fetchDurations = async () => {
      const { data, error } = await supabase
        .from("duration_types")
        .select("id, duration_name");
      if (error) console.error("Error fetching durations:", error);
      else setDurations(data || []);
    };

    const fetchLeaveTypesWithBalance = async () => {
      const { data: leaveTypes, error } = await supabase
        .from("leave_types")
        .select("*")
        .eq("company_id", userData.company_id);

      if (error) {
        console.error("Error fetching leave types:", error);
        return;
      }

      // Check balance for each leave type
      const balances = await Promise.all(
        (leaveTypes || []).map(async (lt) => {
          // fetch approved leaves of this type
          const { data: requests } = await supabase
            .from("attendance_requests")
            .select("start_date, end_date")
            .eq("user_id", userData.id)
            .eq("leave_type_id", lt.id)
            .eq("status", "APPROVED");

          const usedDays =
            requests?.reduce((acc, req) => {
              return acc + calculateDays(req.start_date, req.end_date);
            }, 0) || 0;

          // check limit
          let available: number | null = null;
          if (lt.yearly_limit) {
            available = Math.max(0, lt.yearly_limit - usedDays);
          } else if (lt.max_days_per_month) {
            // limit for current month
            const monthStart = new Date(
              new Date().getFullYear(),
              new Date().getMonth(),
              1
            );
            const monthEnd = new Date(
              new Date().getFullYear(),
              new Date().getMonth() + 1,
              0
            );

            const { data: monthLeaves } = await supabase
              .from("attendance_requests")
              .select("start_date, end_date")
              .eq("user_id", userData.id)
              .eq("leave_type_id", lt.id)
              .eq("status", "APPROVED")
              .gte("start_date", monthStart.toISOString())
              .lte("end_date", monthEnd.toISOString());

            const monthUsed =
              monthLeaves?.reduce((acc, req) => {
                return acc + calculateDays(req.start_date, req.end_date);
              }, 0) || 0;

            available = Math.max(0, lt.max_days_per_month - monthUsed);
          }

          return {
            ...lt,
            usedDays,
            available,
          };
        })
      );

      setLeaveTypes(balances);
    };

    fetchDurations();
    fetchLeaveTypesWithBalance();
  }, [userData]);

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
      toast.error("Please fill in all required fields");
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
          duration_id: formData.duration,
          leave_type_id: formData.type,
        },
      ]);

      if (error) throw error;

      console.log("✅ Leave request submitted successfully!");
      toast.success("Leave request submitted successfully!");
      // Reset form
      setFormData({ day: "", type: "", duration: "", date: "", reason: "" });
      onClose();
    } catch (err: any) {
      console.error("❌ Submit error:", err);
      toast.error(err.message || "Failed to submit leave request");
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

            {/* Type (dynamic from DB with balance check) */}
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
                  <option
                    key={lt.id}
                    value={lt.id}
                    disabled={lt.available !== null && lt.available <= 0}
                  >
                    {lt.leave_name}{" "}
                    {lt.available !== null
                      ? `(${lt.available} days left)`
                      : ""}
                    {lt.available === 0 ? " - Not Applicable" : ""}
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
