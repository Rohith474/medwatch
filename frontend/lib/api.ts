const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface SearchResult {
  status: 'NSQ_FOUND' | 'SPURIOUS_DRUG' | 'ADULTERATED' | 'MISBRANDED' | 'NO_ADVERSE_REPORT' | 'DATA_UNAVAILABLE' | 'NO_MATCH_SUGGESTIONS';
  drug_name: string;
  batch_number: string;
  manufacturer?: string;
  lab_name?: string;
  test_date?: string;
  action_taken?: string;
  details?: string;
  suggestions?: Array<{ drug_name: string; batch_number: string; similarity: number }>;
  report_date?: string;
  severity?: 'CRITICAL' | 'STANDARD' | 'ADVISORY';
}

export interface Regulation {
  id: number;
  title: string;
  description: string;
  issuing_authority: string;
  gazette_number?: string;
  effective_date: string;
  document_url?: string;
  created_at: string;
}

export interface Notification {
  id: number;
  title: string;
  body: string;
  discreet_title: string;
  discreet_body: string;
  severity: 'CRITICAL' | 'STANDARD' | 'ADVISORY';
  affected_batch?: string;
  created_at: string;
  is_read: boolean;
}

export async function searchDrug(batch_number: string, drug_name: string): Promise<SearchResult> {
  const res = await fetch(`${API_BASE}/api/v1/search/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batch_number, drug_name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Server error: ${res.status}`);
  }
  return res.json();
}

export async function getRegulations(): Promise<Regulation[]> {
  const res = await fetch(`${API_BASE}/api/v1/regulations/`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function getNotifications(): Promise<Notification[]> {
  const res = await fetch(`${API_BASE}/api/v1/notifications/`, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data.results ?? [];
}

export async function submitCitizenReport(payload: {
  drug_name: string;
  batch_no?: string;
  manufacturer_name?: string;
  issue_type: string;
  pharmacy_or_location?: string;
  district?: string;
  description: string;
  reporter_contact?: string;
}): Promise<{ message: string; report_id: number; reference_code: string }> {
  const res = await fetch(`${API_BASE}/api/v1/drugs/report/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to submit report');
  return data;
}

export interface TrackedReport {
  reference_code: string;
  drug_name: string;
  batch_no: string;
  issue_label: string;
  district: string;
  status: 'NEW' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  inspector_notes: string;
  created_at: string;
}

export async function trackCitizenReport(ref: string): Promise<TrackedReport> {
  const res = await fetch(`${API_BASE}/api/v1/drugs/report/track/?ref=${encodeURIComponent(ref)}`, {
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Report not found');
  return data;
}
