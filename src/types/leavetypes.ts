export interface LeaveType {
  id?: string; // optional when creating, required after saving
  leave_name: string;
  is_paid: boolean;
  max_days_per_month?: number | null;
  carry_forward: boolean;
  yearly_limit?: number | null;
  carry_forward_limit?: number | null;
  requires_approval: boolean;
  max_consecutive_days?: number | null;
  description?: string | null;
  code?: string | null;
  company_id?: string | null;
    color?: string | null; // optional color field
}