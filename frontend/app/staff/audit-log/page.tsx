'use client';
import { useEffect, useState } from 'react';
import StaffLayout, { StaffRedirect } from '@/components/StaffLayout';
import { downloadCsv } from '@/lib/csv';
import { getAuditLogs, AuditLogEntry, useStaffSession } from '@/lib/staff-api';

const ACTION_COLOR: Record<string, string> = {
  STAFF_LOGIN: 'bg-blue-100 text-blue-700',
  DRUG_APPROVED: 'bg-green-100 text-green-700',
  DRUG_REJECTED: 'bg-red-100 text-red-700',
  DRUG_DELETED: 'bg-red-100 text-red-700',
  DRUG_UPDATED: 'bg-amber-100 text-amber-700',
  DRUG_ADDED: 'bg-cyan-100 text-cyan-700',
  CDSCO_PDF_IMPORTED: 'bg-indigo-100 text-indigo-700',
  STAFF_VERIFIED: 'bg-green-100 text-green-700',
  STAFF_SUSPENDED: 'bg-orange-100 text-orange-700',
  STAFF_DELETED: 'bg-red-100 text-red-700',
  REPORT_UPDATED: 'bg-purple-100 text-purple-700',
  REPORT_DELETED: 'bg-red-100 text-red-700',
  ALERT_SENT: 'bg-red-100 text-red-700',
};

type LogTab = 'APPROVALS_DRUGS' | 'LOGINS' | 'STAFF_REPORTS' | 'ALL';

const APPROVAL_DRUG_ACTIONS = new Set([
  'DRUG_APPROVED',
  'DRUG_REJECTED',
  'DRUG_ADDED',
  'DRUG_UPDATED',
  'DRUG_DELETED',
  'CDSCO_PDF_IMPORTED',
  'ALERT_SENT',
]);

const STAFF_REPORT_ACTIONS = new Set([
  'STAFF_CREATED',
  'STAFF_VERIFIED',
  'STAFF_SUSPENDED',
  'STAFF_DELETED',
  'REPORT_UPDATED',
  'REPORT_DELETED',
]);

export default function AuditLogPage() {
  const { ready, user } = useStaffSession();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<LogTab>('APPROVALS_DRUGS');

  const loadLogs = async (q = query) => {
    setLoading(true);
    try {
      const data = await getAuditLogs(q);
      setLogs(data);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !user || user.role !== 'SUPER_ADMIN') return;
    loadLogs('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  if (!ready) return null;
  if (!user || user.role !== 'SUPER_ADMIN') return <StaffRedirect />;

  const loginLogs = logs.filter((l) => l.action === 'STAFF_LOGIN');
  const approvalDrugLogs = logs.filter((l) => APPROVAL_DRUG_ACTIONS.has(l.action));
  const staffReportLogs = logs.filter((l) => STAFF_REPORT_ACTIONS.has(l.action));

  const visibleLogs =
    activeTab === 'LOGINS'
      ? loginLogs
      : activeTab === 'APPROVALS_DRUGS'
      ? approvalDrugLogs
      : activeTab === 'STAFF_REPORTS'
      ? staffReportLogs
      : logs;

  return (
    <StaffLayout user={user}>
      <div>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800">📜 Government Audit Log</h1>
            <p className="text-gray-500 text-sm mt-1">
              Separated into clear sections: Approvals &amp; Drug Actions, Staff Logins, and Staff / Citizen Reports.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              downloadCsv(
                `medwatch_audit_${activeTab.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.csv`,
                ['Timestamp', 'Officer Name', 'Role', 'Action', 'Target', 'Details', 'IP Address'],
                visibleLogs.map((l) => [
                  l.created_at, l.actor_name, l.actor_role, l.action, l.target, l.details, l.ip_address,
                ])
              )
            }
            disabled={visibleLogs.length === 0}
            className="pill-btn bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 text-sm font-bold disabled:opacity-50"
          >
            📥 Export CSV ({visibleLogs.length})
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { id: 'APPROVALS_DRUGS' as LogTab, label: `✅ Approvals & Drug Actions (${approvalDrugLogs.length})` },
            { id: 'LOGINS' as LogTab, label: `🔐 Staff Logins (${loginLogs.length})` },
            { id: 'STAFF_REPORTS' as LogTab, label: `🚨 Staff & Citizen Reports (${staffReportLogs.length})` },
            { id: 'ALL' as LogTab, label: `📋 All Logs (${logs.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#001a40] text-white border-[#001a40] shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            loadLogs(query);
          }}
          className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 flex gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by officer name, action, drug, or reference code..."
            className="flex-1 border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2 text-sm text-gray-800"
          />
          <button type="submit" className="pill-btn bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 text-sm font-bold">
            🔍 Search
          </button>
        </form>

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="bg-gray-100 rounded-xl h-14 animate-pulse" />)}</div>
        ) : visibleLogs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400 text-sm">
            No entries in this section yet.
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Timestamp</th>
                    <th className="p-3.5">Officer</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Target</th>
                    <th className="p-3.5">Details</th>
                    <th className="p-3.5">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {visibleLogs.map((l) => (
                    <tr key={l.id} className="hover:bg-gray-50/70">
                      <td className="p-3.5 font-mono text-gray-500 whitespace-nowrap">{l.created_at}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-gray-800">{l.actor_name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{l.actor_role}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-full font-black text-[10px] ${ACTION_COLOR[l.action] || 'bg-gray-100 text-gray-700'}`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-gray-800">{l.target || '—'}</td>
                      <td className="p-3.5 text-gray-600 max-w-xs truncate" title={l.details}>{l.details || '—'}</td>
                      <td className="p-3.5 font-mono text-gray-400">{l.ip_address || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
