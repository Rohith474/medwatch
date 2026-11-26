'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StaffLayout, { StaffRedirect } from '@/components/StaffLayout';
import { downloadCsv } from '@/lib/csv';
import {
  getCitizenReports,
  updateCitizenReport,
  deleteCitizenReport,
  CitizenReportItem,
  useStaffSession,
} from '@/lib/staff-api';

const STATUS_BADGE: Record<string, string> = {
  NEW: 'bg-red-100 text-red-700 border-red-300',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700 border-amber-300',
  RESOLVED: 'bg-green-100 text-green-700 border-green-300',
  DISMISSED: 'bg-gray-100 text-gray-600 border-gray-300',
};

const QUICK_TEMPLATES = [
  'Sample collected from pharmacy and sent to Kerala Drug Testing Lab.',
  'Shop inspected; suspicious stock seized under Drugs & Cosmetics Act.',
  'Verified with manufacturer — genuine batch; isolated packaging damage.',
];

export default function StaffCitizenReportsPage() {
  const { ready, user } = useStaffSession();
  const [reports, setReports] = useState<CitizenReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'NEW' | 'UNDER_REVIEW' | 'RESOLVED'>('ALL');
  const [msg, setMsg] = useState('');
  const [acting, setActing] = useState<number | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [notesInput, setNotesInput] = useState('');

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await getCitizenReports();
      setReports(data);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !user || !['SUPER_ADMIN', 'APPROVER'].includes(user.role)) return;
    loadReports();
  }, [ready, user]);

  const handleStatus = async (id: number, status: string, notes = '') => {
    setActing(id);
    setMsg('');
    try {
      const res = await updateCitizenReport(id, status, notes);
      setMsg(`✅ ${res.message}`);
      setResolvingId(null);
      setNotesInput('');
      await loadReports();
    } catch (e: unknown) {
      setMsg(`❌ ${e instanceof Error ? e.message : 'Failed'}`);
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async (id: number, ref: string) => {
    if (!confirm(`Delete report ${ref}?`)) return;
    setActing(id);
    setMsg('');
    try {
      const res = await deleteCitizenReport(id);
      setMsg(`✅ ${res.message}`);
      await loadReports();
    } catch (e: unknown) {
      setMsg(`❌ ${e instanceof Error ? e.message : 'Failed'}`);
    } finally {
      setActing(null);
    }
  };

  if (!ready) return null;
  if (!user || !['SUPER_ADMIN', 'APPROVER'].includes(user.role)) return <StaffRedirect />;

  const filtered = reports.filter(r => filter === 'ALL' || r.status === filter);

  return (
    <StaffLayout user={user}>
      <div>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800">🚨 Citizen Suspicious Medicine Reports</h1>
            <p className="text-gray-500 text-sm mt-1">
              Inspect anonymous reports, record official investigation notes, or flag confirmed batches into the drug database.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                `medwatch_citizen_reports_${new Date().toISOString().slice(0, 10)}.csv`,
                ['Reference Code', 'Status', 'Drug Name', 'Batch No', 'Issue Type', 'District', 'Pharmacy / Location', 'Description', 'Inspector Notes', 'Created At'],
                filtered.map((r) => [
                  r.reference_code, r.status, r.drug_name, r.batch_no, r.issue_label,
                  r.district, r.pharmacy_or_location, r.description, r.inspector_notes, r.created_at,
                ])
              )
            }
            disabled={filtered.length === 0}
            className="pill-btn bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            📥 Export CSV ({filtered.length})
          </button>
        </div>

        {msg && (
          <div className={`rounded-xl px-4 py-3 text-sm mb-4 font-semibold ${msg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg}
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-5">
          {(['ALL', 'NEW', 'UNDER_REVIEW', 'RESOLVED'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                filter === tab
                  ? 'bg-[#001a40] text-white border-[#001a40]'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.replace('_', ' ')} ({tab === 'ALL' ? reports.length : reports.filter(r => r.status === tab).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400 text-sm">
            No citizen reports in this category yet.
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(r => (
              <div key={r.id} className="bg-white border-2 border-gray-200 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-[260px]">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="text-xs font-mono font-bold bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded">
                        {r.reference_code}
                      </span>
                      <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${STATUS_BADGE[r.status] || 'bg-gray-100 text-gray-700'}`}>
                        {r.status.replace('_', ' ')}
                      </span>
                      <span className="text-xs font-semibold bg-red-50 text-red-700 border border-red-200 px-2.5 py-0.5 rounded-full">
                        {r.issue_label}
                      </span>
                    </div>

                    <div className="font-black text-gray-800 text-base">
                      {r.drug_name} {r.batch_no && <span className="font-mono text-sm text-gray-500">· Batch: {r.batch_no}</span>}
                    </div>
                    <p className="text-sm text-gray-600 mt-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      {r.description}
                    </p>

                    {r.inspector_notes && (
                      <div className="mt-2 bg-green-50 border border-green-200 text-green-800 text-xs p-3 rounded-xl">
                        <strong className="uppercase tracking-wider">🛡️ Inspector Action Taken:</strong>{' '}
                        {r.inspector_notes}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                      {r.district && <span>📍 {r.district}</span>}
                      {r.pharmacy_or_location && <span>🏥 {r.pharmacy_or_location}</span>}
                      {r.manufacturer_name && <span>🏭 {r.manufacturer_name}</span>}
                      {r.reporter_contact && <span>📞 {r.reporter_contact}</span>}
                      <span>🕒 {r.created_at}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 flex-shrink-0">
                    {r.status === 'NEW' && (
                      <button
                        onClick={() => handleStatus(r.id, 'UNDER_REVIEW')}
                        disabled={acting === r.id}
                        className="pill-btn bg-amber-500 hover:bg-amber-600 text-white px-3.5 py-2 text-xs font-bold"
                      >
                        🔍 Mark Under Review
                      </button>
                    )}
                    {r.status !== 'RESOLVED' && (
                      <button
                        onClick={() => {
                          setResolvingId(resolvingId === r.id ? null : r.id);
                          setNotesInput('');
                        }}
                        disabled={acting === r.id}
                        className="pill-btn bg-green-600 hover:bg-green-700 text-white px-3.5 py-2 text-xs font-bold"
                      >
                        ✅ Resolve with Notes
                      </button>
                    )}
                    {user.role === 'SUPER_ADMIN' && (
                      <Link
                        href={`/staff/upload?brand=${encodeURIComponent(r.drug_name)}&batch=${encodeURIComponent(r.batch_no || '')}&mfr=${encodeURIComponent(r.manufacturer_name || '')}&result_type=${r.issue_type === 'SUSPECTED_FAKE' ? 'SPURIOUS' : 'NSQ'}&note=${encodeURIComponent(`From citizen report ${r.reference_code}: ${r.description}`)}`}
                        className="pill-btn bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-3 py-2 text-xs font-bold"
                      >
                        ⚠️ Flag to Drug DB
                      </Link>
                    )}
                    <button
                      onClick={() => handleDelete(r.id, r.reference_code)}
                      disabled={acting === r.id}
                      className="pill-btn bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 px-3 py-2 text-xs font-bold transition-colors"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                {/* Inline Inspector Investigation Notes box */}
                {resolvingId === r.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 bg-green-50/50 rounded-xl p-4 space-y-3">
                    <div className="text-xs font-black text-green-900 uppercase tracking-wider">
                      📝 Record Official Investigation Notes (Required before resolving)
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_TEMPLATES.map((tpl) => (
                        <button
                          key={tpl}
                          type="button"
                          onClick={() => setNotesInput(tpl)}
                          className="text-[11px] bg-white hover:bg-green-100 text-gray-700 border border-green-200 px-2.5 py-1 rounded-lg transition-colors"
                        >
                          + {tpl}
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={2}
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder="Describe the inspection, lab sample collection, or action taken..."
                      className="w-full bg-white border border-green-300 focus:border-green-600 rounded-xl px-3.5 py-2 text-sm text-gray-800 resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={acting === r.id || !notesInput.trim()}
                        onClick={() => handleStatus(r.id, 'RESOLVED', notesInput.trim())}
                        className="pill-btn bg-green-700 hover:bg-green-800 text-white px-4 py-2 text-xs font-bold disabled:opacity-50"
                      >
                        {acting === r.id ? 'Saving...' : '💾 Confirm & Resolve Report'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setResolvingId(null);
                          setNotesInput('');
                        }}
                        className="pill-btn bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 text-xs font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
