import  { useEffect, useState } from "react";
import { supabase } from "../../../supabaseClient";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import { useUser } from "../../../context/UserContext";

const TimeTracker = () => {
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [checkOutLoading, setCheckOutLoading] = useState(false);
  const { userData } = useUser();

  useEffect(() => {
    const fetchTodayAttendance = async () => {
      const today = dayjs().format("YYYY-MM-DD");

      const { data, error } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", userData.id)
        .gte("check_in_time", `${today}T00:00:00`)
        .lt("check_in_time", `${today}T23:59:59`)
        .order("check_in_time", { ascending: false });
      console.log("Attendance Data:", data);

      if (error && error.code !== "PGRST116") {
        console.error("Attendance fetch error:", error.message);
      } else {
        const latestRecord = data?.[0] || null;

        if (latestRecord?.check_in_time && latestRecord?.check_out_time) {
          const start = dayjs(latestRecord.check_in_time);
          const end = dayjs(latestRecord.check_out_time);
          const duration = end.diff(start, "second");
          latestRecord.duration_in_seconds = duration;
        }

        setTodayRecord(latestRecord);
      }
      setIsLoading(false);
    };

    if (userData?.id) {
      fetchTodayAttendance();
    }
  }, [userData?.id]);

  const formatDateTime = (datetime: Date | string | null) =>
    datetime ? dayjs(datetime).format("hh:mm A") : "--";

  const formatDuration = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(error);
        }
      );
    });
  };

  const handleCheckIn = async () => {
    setCheckInLoading(true);
    try {
      const { latitude, longitude } = await getLocation();
      const userId = userData.id;
      console.log("Check-in Location:", { latitude, longitude });

      const { data: workingData, error: workingError } = await supabase
  .from("working_hours")
  .select("id, company_id")
  .eq("user_id", userId)
  .limit(1);

if (workingError || !workingData || workingData.length === 0) {
  console.error("Working hours fetch failed", workingError);
  toast.error("No working hours configured for this user!");
  setCheckInLoading(false);
  return;
}

const workingHoursId = workingData[0].id;
const companyId = workingData[0].company_id;


      const { data: statusData, error: statusError } = await supabase
        .from("attendance_status")
        .select("id")
        .eq("status", "Checked In")
        .single();

      if (statusError || !statusData)
        throw new Error("Could not fetch status_id.");

      const statusId = statusData.id;

      const { data, error } = await supabase
        .from("attendance")
        .insert([
          {
            company_id: companyId,
            user_id: userId,
            updated_by: userId,
            check_in_time: new Date().toISOString(),
            status_id: statusId,
            working_id: workingHoursId,
            check_in_latitude: latitude,
            check_in_longitude: longitude,
          },
        ])
        .select("*");

      if (error) throw error;

      toast.success("Checked in successfully!");
      setTodayRecord(data[0]);
    } catch (err: any) {
      console.error("Check-in error:", err.message);
      toast.error("Check-in failed!");
    } finally {
      setCheckInLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckOutLoading(true);
    try {
      const { latitude, longitude } = await getLocation();
      const userId = userData.id;

      const { data: openRecords, error: fetchError } = await supabase
        .from("attendance")
        .select("*")
        .eq("user_id", userId)
        .is("check_out_time", null)
        .order("check_in_time", { ascending: false })
        .limit(1);

      if (fetchError || !openRecords || openRecords.length === 0) {
        throw new Error("No open attendance record found.");
      }

      const latestOpen = openRecords[0];

      const { data, error } = await supabase
        .from("attendance")
        .update({
          check_out_time: new Date().toISOString(),
          check_out_latitude: latitude,
          check_out_longitude: longitude,
          updated_by: userId,
        })
        .eq("id", latestOpen.id)
        .select("*")
        .single();

      if (error) throw error;

      toast.success("Checked out successfully!");
      setTodayRecord(data);
    } catch (err: any) {
      console.error("Check-out error:", err.message);
      toast.error("Check-out failed!");
    } finally {
      setCheckOutLoading(false);
    }
  };

  const isCheckedIn =
    todayRecord?.check_in_time && !todayRecord?.check_out_time;
  const isCheckedOut = todayRecord?.check_out_time;

  return (
    <div className="bg-gray-50 p-6 rounded-lg ">
      <h2 className="font-semibold mb-4">Time Tracker</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-600 mb-1">Current Status:</p>
              <p
                className={`text-lg font-bold ${
                  isCheckedIn
                    ? "text-green-500"
                    : isCheckedOut
                    ? "text-gray-500"
                    : "text-red-500"
                }`}
              >
                {isCheckedIn
                  ? "Checked In"
                  : isCheckedOut
                  ? "Checked Out"
                  : "Not Checked In"}
              </p>
            </div>
            {!isCheckedIn && (
              <button
                onClick={handleCheckIn}
                disabled={checkInLoading}
                className={`px-4 py-2 rounded text-white ${
                  checkInLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                }`}
              >
                {checkInLoading ? "Checking In..." : "Check In"}
              </button>
            )}

            {isCheckedIn && (
              <button
                onClick={handleCheckOut}
                disabled={checkOutLoading}
                className={`px-4 py-2 rounded text-white ${
                  checkOutLoading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {checkOutLoading ? "Checking Out..." : "Check Out"}
              </button>
            )}
          </div>

          <div className="mt-4 text-sm text-gray-700">
            {todayRecord?.check_in_time && (
              <p>
                ✅ Checked in at:{" "}
                <span className="font-semibold">
                  {formatDateTime(todayRecord.check_in_time)}
                </span>
              </p>
            )}
            {todayRecord?.check_out_time && (
              <>
                <p>
                  ⛔ Checked out at:{" "}
                  <span className="font-semibold">
                    {formatDateTime(todayRecord.check_out_time)}
                  </span>
                </p>
                {todayRecord.duration_in_seconds != null && (
                  <p>
                    ⏱ Duration:{" "}
                    <span className="font-semibold">
                      {formatDuration(todayRecord.duration_in_seconds)}
                    </span>
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TimeTracker;
