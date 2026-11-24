'use client';
import { useEffect, useState } from 'react';
import StaffLayout, { StaffRedirect } from '@/components/StaffLayout';
import { getPendingResults, approveResult, PendingResult, useStaffSession } from '@/lib/staff-api';

const RESULT_COLORS: Record<string, string> = {
  NSQ: 'bg-red-100 text-red-700 border-red-300',
  SPURIOUS: 'bg-orange-100 text-orange-700 border-orange-300',
  ADULTERATED: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  MISBRANDED: 'bg-pink-100 text-pink-700 border-pink-300',
};

export default function ApprovePage() {
  const { ready, user } = useStaffSession();
  const [results, setResults] = useState<PendingResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState('');
  const [acting, setActing] = useState<number | null>(null);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await getPendingResults();
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !user || !['SUPER_ADMIN', 'APPROVER'].includes(user.role)) return;
    getPendingResults()
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [ready, user]);

  const handleAction = async (id: number, action: 'approve' | 'reject') => {
    setActing(id);
    setActionMsg('');
    try {
      const res = await approveResult(id, action);
      setActionMsg(`✅ ${res.message}`);
      setResults(prev => prev.filter(r => r.id !== id));
    } catch (e: unknown) {
      setActionMsg(`❌ ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setActing(null);
    }
  };

  if (!ready) return null;
  if (!user || !['SUPER_ADMIN', 'APPROVER'].includes(user.role)) return <StaffRedirect />;

  return (
    <StaffLayout user={user}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800">✅ Pending Approvals</h1>
            <p className="text-gray-500 text-sm mt-1">Review drug test records submitted by uploaders before they go live.</p>
          </div>
          <button onClick={fetchPending} className="pill-btn bg-blue-600 text-white px-4 py-2 text-sm font-bold">
            🔄 Refresh
          </button>
        </div>

        {actionMsg && (
          <div className={`rounded-xl px-4 py-3 text-sm mb-4 font-semibold ${actionMsg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {actionMsg}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-24 animate-pulse"></div>)}
          </div>
        ) : results.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <div className="text-green-700 font-bold text-lg">All caught up!</div>
            <div className="text-green-600 text-sm mt-1">No pending records to review.</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-gray-500 font-semibold">{results.length} record{results.length !== 1 ? 's' : ''} pending review</div>
            {results.map(r => (
              <div key={r.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${RESULT_COLORS[r.result_type] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                        {r.result_type}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-mono">{r.source}</span>
                    </div>
                    <div className="font-black text-gray-800 text-lg">{r.drug_name}</div>
                    <div className="text-gray-500 text-sm">{r.generic_name}</div>
                    <div className="flex gap-4 mt-2 text-xs text-gray-400 font-mono flex-wrap">
                      <span>📦 Batch: {r.batch_no}</span>
                      <span>🏥 Lab: {r.lab || 'Unknown'}</span>
                      <span>📅 Test: {r.test_date}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleAction(r.id, 'approve')}
                      disabled={acting === r.id}
                      className="pill-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-bold disabled:opacity-50"
                    >
                      {acting === r.id ? '...' : '✅ Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(r.id, 'reject')}
                      disabled={acting === r.id}
                      className="pill-btn bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-bold disabled:opacity-50"
                    >
                      {acting === r.id ? '...' : '❌ Reject'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
