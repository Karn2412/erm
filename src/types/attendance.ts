// src/types/attendance.ts
export interface LatLong {
  lat: number | null;
  long: number | null;
  time?: string;
}

export interface AttendanceRecord {
  // fields used by both components
  day?: string;
  date: string;
  attendance_date?: string;
  hoursWorked: string;
  expectedHours: string;

  // always present (but can be null)
  check_in_latitudes: number[] | null;
  check_in_longitudes: number[] | null;
  check_out_latitudes: number[] | null;
  check_out_longitudes: number[] | null;

  first_check_in_time?: string | null;
  last_check_out_time?: string | null;

  request_type?: string | null;
  request_status?: string | null;
  
  attendance_statuses?: string[] | null;

  // optional friendly objects (your monthly view uses them)
  checkInLocation?: LatLong | null;
  checkOutLocation?: LatLong | null;

  status?: string;
  weekly_offs?: number[]; // optional weekly offs array
  leaveColor?: string; // ✅ new
  leave_name?: string; // ✅ new
}
