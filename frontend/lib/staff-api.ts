import { useSyncExternalStore } from 'react';

// Staff API helpers — all calls send JWT Bearer token from localStorage
const API = 'http://127.0.0.1:8000/api/v1';
const SESSION_EVENT = 'staff-session-change';

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('staff_token') || '';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

export interface StaffUser {
  id: number;
  name: string;
  mobile: string;
  role: 'SUPER_ADMIN' | 'APPROVER' | 'UPLOADER' | 'DEPT_OFFICER';
  department: string;
}

export interface PendingResult {
  id: number;
  drug_name: string;
  generic_name: string;
  batch_no: string;
  result_type: string;
  lab: string;
  test_date: string;
  source: string;
}

export interface DashboardStats {
  pending_approvals: number;
  live_alerts: number;
  regulations: number;
  notifications_sent: number;
  total_staff: number;
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function staffLogin(mobile: string, password: string): Promise<{ user: StaffUser; access: string; refresh: string; must_change_password: boolean }> {
  const res = await fetch(`${API}/auth/staff/login/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Login failed');
  return data;
}

interface SessionSnapshot {
  ready: boolean;
  raw: string | null | undefined;
  user: StaffUser | null;
}

const LOADING_SNAPSHOT: SessionSnapshot = { ready: false, raw: undefined, user: null };
let cachedSnapshot: SessionSnapshot = LOADING_SNAPSHOT;

function readSessionRaw(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('staff_user');
}

function subscribeSession(onChange: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(SESSION_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(SESSION_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getSessionSnapshot(): SessionSnapshot {
  const raw = readSessionRaw();
  if (cachedSnapshot.raw !== raw) {
    cachedSnapshot = { ready: true, raw, user: raw ? JSON.parse(raw) as StaffUser : null };
  }
  return cachedSnapshot;
}

function getServerSessionSnapshot(): SessionSnapshot {
  return LOADING_SNAPSHOT;
}

export function useStaffSession(): SessionSnapshot {
  return useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);
}

export function saveSession(access: string, user: StaffUser) {
  localStorage.setItem('staff_token', access);
  localStorage.setItem('staff_user', JSON.stringify(user));
  window.dispatchEvent(new Event(SESSION_EVENT));
}

export function getSession(): StaffUser | null {
  return getSessionSnapshot().user;
}

export function clearSession() {
  localStorage.removeItem('staff_token');
  localStorage.removeItem('staff_user');
  window.dispatchEvent(new Event(SESSION_EVENT));
}

// ── Super Admin ───────────────────────────────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const res = await fetch(`${API}/auth/staff/stats/`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}

// ── Approver ──────────────────────────────────────────────────────────────────

export async function getPendingResults(): Promise<PendingResult[]> {
  const res = await fetch(`${API}/auth/staff/pending-results/`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch pending results');
  return res.json();
}

export async function approveResult(id: number, action: 'approve' | 'reject'): Promise<{ message: string }> {
  const res = await fetch(`${API}/auth/staff/pending-results/${id}/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ action }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Action failed');
  return data;
}

// ── Uploader ──────────────────────────────────────────────────────────────────

export async function addDrugRecord(payload: Record<string, string>): Promise<{ message: string; result_id: number }> {
  const res = await fetch(`${API}/auth/staff/add-drug/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to submit');
  return data;
}

// ── Dept Officer ──────────────────────────────────────────────────────────────

export async function getRegulationsStaff() {
  const res = await fetch(`${API}/auth/staff/regulations/`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch regulations');
  return res.json();
}

export async function addRegulation(payload: Record<string, string>): Promise<{ message: string; id: number }> {
  const res = await fetch(`${API}/auth/staff/regulations/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to publish');
  return data;
}

// ── Staff Management (Super Admin) ────────────────────────────────────────────

export interface StaffMember {
  id: number;
  name: string;
  mobile: string;
  role: string;
  department: string;
  employee_id: string;
  designation: string;
  qualification: string;
  licence_number: string;
  govt_id_type: string;
  govt_id_number: string;
  is_verified: boolean;
  must_change_password: boolean;
  created_at: string;
  verified_at: string | null;
  credentials_complete: boolean;
  missing_credentials: string[];
}

export async function getStaffList(): Promise<StaffMember[]> {
  const res = await fetch(`${API}/auth/staff/manage/`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch staff list');
  return res.json();
}

export async function createStaff(payload: Record<string, string>): Promise<{ message: string; user_id: number; profile_id: number }> {
  const res = await fetch(`${API}/auth/staff/manage/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to create staff account');
  return data;
}

export async function verifyStaff(profileId: number, action: 'verify' | 'suspend'): Promise<{ message: string }> {
  const res = await fetch(`${API}/auth/staff/manage/${profileId}/verify/`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ action }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Action failed');
  return data;
}

// ── Change Password ────────────────────────────────────────────────────────────

export async function changePassword(newPassword: string): Promise<{ message: string }> {
  const res = await fetch(`${API}/auth/staff/change-password/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ new_password: newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to change password');
  return data;
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function sendNotification(payload: Record<string, string>): Promise<{ message: string; id: number }> {
  const res = await fetch(`${API}/auth/staff/notifications/send/`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to send notification');
  return data;
}
