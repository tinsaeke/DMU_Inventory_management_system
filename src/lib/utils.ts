import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const user_role = [
  'admin',
  'college_dean',
  'department_head',
  'storekeeper',
  'staff',
] as const;

export const item_status = [
  'Available',
  'Allocated',
  'Under Maintenance',
  'Damaged'
] as const;

export const request_status = [
  'pending_dept_head',
  'pending_dean', 
  'pending_storekeeper',
  'approved',
  'rejected'
] as const;

export const urgency_levels = [
  'low',
  'medium', 
  'high',
  'critical'
] as const;
