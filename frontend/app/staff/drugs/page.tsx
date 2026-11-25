'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StaffLayout, { StaffRedirect } from '@/components/StaffLayout';
import {
  getAllDrugsAdmin,
  toggleDrugStatus,
  deleteDrugRecord,
  AdminDrugRecord,
  useStaffSession,
} from '@/lib/staff-api';

const RESULT_BADGE: Record<string, string> = {
  NSQ: 'bg-orange-100 text-orange-700 border-orange-300',
  SPURIOUS: 'bg-red-100 text-red-700 border-red-300',
  ADULTERATED: 'bg-red-100 text-red-700 border-red-300',
  MISBRANDED: 'bg-amber-100 text-amber-700 border-amber-300',
  NO_ADVERSE: 'bg-teal-100 text-teal-700 border-teal-300',
  UNAVAILABLE: 'bg-gray-100 text-gray-700 border-gray-300',
};

export default function ManageDrugsPage() {
  const { ready, user } = useStaffSession();
  const [drugs, setDrugs] = useState<AdminDrugRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'PENDING'>('ALL');
  const [msg, setMsg] = useState('');
  const [acting, setActing] = useState<number | null>(null);

  const loadDrugs = async (q = query) => {
    setLoading(true);
    try {
      const data = await getAllDrugsAdmin(q);
      setDrugs(data);
    } catch {
      setDrugs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!ready || !user || user.role !== 'SUPER_ADMIN') return;
    loadDrugs('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user]);

  const handleToggle = async (item: AdminDrugRecord) => {
    setActing(item.id);
    setMsg('');
    try {
      const res = await toggleDrugStatus(item.id, !item.is_active);
      setMsg(`✅ ${item.brand_name} is now ${res.is_active ? 'LIVE' : 'HIDDEN (Pending)'}.`);
      await loadDrugs();
    } catch (e: unknown) {
      setMsg(`❌ ${e instanceof Error ? e.message : 'Failed'}`);
    } finally {
      setActing(null);
    }
  };

  const handleDelete = async (item: AdminDrugRecord) => {
    if (!confirm(`Delete "${item.brand_name}" (Batch: ${item.batch_no})? This cannot be undone.`)) return;
    setActing(item.id);
    setMsg('');
    try {
      const res = await deleteDrugRecord(item.id);
      setMsg(`✅ ${res.message}`);
      await loadDrugs();
    } catch (e: unknown) {
      setMsg(`❌ ${e instanceof Error ? e.message : 'Failed'}`);
    } finally {
      setActing(null);
    }
  };

  if (!ready) return null;
  if (!user || user.role !== 'SUPER_ADMIN') return <StaffRedirect />;

  const filtered = drugs.filter((d) => {
    if (filter === 'LIVE') return d.is_active;
    if (filter === 'PENDING') return !d.is_active;
    return true;
  });

  return (
    <StaffLayout user={user}>
      <div>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800">💊 Manage Drug Database</h1>
            <p className="text-gray-500 text-sm mt-1">
              View, search, add, activate/hide, or delete any drug lab record.
            </p>
          </div>
          <Link
            href="/staff/upload"
            className="pill-btn bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 text-sm font-bold"
          >
            + Add Drug Record
          </Link>
        </div>

        {msg && (
          <div
            className={`rounded-xl px-4 py-3 text-sm mb-4 font-semibold ${
              msg.startsWith('✅')
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {msg}
          </div>
        )}

        {/* Search & Filter */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-5 flex flex-wrap items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              loadDrugs(query);
            }}
            className="flex-1 min-w-[220px] flex gap-2"
          >
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brand, generic, batch no, or result type..."
              className="flex-1 border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2 text-sm text-gray-800"
            />
            <button
              type="submit"
              className="pill-btn bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 text-sm font-bold"
            >
              🔍 Search
            </button>
          </form>

          <div className="flex gap-2">
            {(['ALL', 'LIVE', 'PENDING'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                  filter === tab
                    ? 'bg-[#001a40] text-white border-[#001a40]'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {tab === 'ALL' ? `All (${drugs.length})` : tab === 'LIVE' ? `Live (${drugs.filter((d) => d.is_active).length})` : `Pending (${drugs.filter((d) => !d.is_active).length})`}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-20 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center text-gray-400 text-sm">
            No drug records match your filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`bg-white border-2 rounded-2xl p-5 flex items-start justify-between gap-4 flex-wrap ${
                  item.is_active ? 'border-gray-200' : 'border-orange-200 bg-orange-50/20'
                }`}
              >
                <div className="flex-1 min-w-[240px]">
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${
                        RESULT_BADGE[item.result_type] || 'bg-gray-100 text-gray-700 border-gray-300'
                      }`}
                    >
                      {item.result_type}
                    </span>
                    {item.is_active ? (
                      <span className="text-xs bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded-full font-bold">
                        🟢 Live (Public)
                      </span>
                    ) : (
                      <span className="text-xs bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded-full font-bold">
                        ⏳ Pending / Hidden
                      </span>
                    )}
                    <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      Batch: {item.batch_no}
                    </span>
                  </div>

                  <div className="font-black text-gray-800 text-base">
                    {item.brand_name}{' '}
                    <span className="font-normal text-gray-500 text-sm">({item.generic_name})</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {item.manufacturer && <span>🏭 {item.manufacturer}</span>}
                    {item.lab && <span>🧪 {item.lab}</span>}
                    <span>📅 {item.test_date}</span>
                    <span>📥 {item.source}</span>
                  </div>
                  {item.action_taken && (
                    <div className="text-xs text-gray-600 mt-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                      Action: {item.action_taken}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(item)}
                    disabled={acting === item.id}
                    className={`pill-btn px-3.5 py-2 text-xs font-bold border disabled:opacity-50 ${
                      item.is_active
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-300'
                        : 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                    }`}
                  >
                    {item.is_active ? '⏸️ Hide' : '✅ Publish Live'}
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    disabled={acting === item.id}
                    className="pill-btn bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 px-3.5 py-2 text-xs font-bold disabled:opacity-50 transition-colors"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
