'use client';
import { useEffect, useState } from 'react';
import StaffLayout, { StaffRedirect } from '@/components/StaffLayout';
import { getRegulationsStaff, addRegulation, useStaffSession } from '@/lib/staff-api';

export default function RegulationsPage() {
  const { ready, user } = useStaffSession();
  const [regulations, setRegulations] = useState<{ id: number; title: string; issued_by: string; issued_on: string; description: string }[]>([]);
  const [form, setForm] = useState({ title: '', description: '', issued_by: '', issued_on: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [showForm, setShowForm] = useState(false);

  const fetchRegs = async () => {
    try {
      const data = await getRegulationsStaff();
      setRegulations(data);
    } catch { setRegulations([]); }
  };

  useEffect(() => {
    if (!ready || !user || !['SUPER_ADMIN', 'DEPT_OFFICER'].includes(user.role)) return;
    getRegulationsStaff()
      .then(setRegulations)
      .catch(() => setRegulations([]));
  }, [ready, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await addRegulation(form);
      setMsg(`✅ ${res.message}`);
      setForm({ title: '', description: '', issued_by: '', issued_on: '' });
      setShowForm(false);
      fetchRegs();
    } catch (e: unknown) {
      setMsg(`❌ ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;
  if (!user || !['SUPER_ADMIN', 'DEPT_OFFICER'].includes(user.role)) return <StaffRedirect />;

  return (
    <StaffLayout user={user}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800">📋 Regulations & Gazette</h1>
            <p className="text-gray-500 text-sm mt-1">Publish and manage official drug control regulations and circulars.</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="pill-btn bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 text-sm font-bold"
          >
            {showForm ? '✕ Cancel' : '+ Publish New'}
          </button>
        </div>

        {msg && (
          <div className={`rounded-xl px-4 py-3 text-sm mb-4 font-semibold ${msg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 mb-6 space-y-4">
            <div className="text-sm font-black text-amber-800 uppercase tracking-widest mb-2">📄 New Regulation / Circular</div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Title *</label>
              <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. NSQ Alert Protocol 2024" className="w-full border border-gray-300 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-gray-800" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} required rows={3} placeholder="Full text of the regulation or circular..." className="w-full border border-gray-300 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-gray-800 resize-none" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Issued By *</label>
                <input name="issued_by" value={form.issued_by} onChange={handleChange} required placeholder="e.g. Kerala Drug Control Dept." className="w-full border border-gray-300 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Issue Date *</label>
                <input name="issued_on" type="date" value={form.issued_on} onChange={handleChange} required className="w-full border border-gray-300 focus:border-amber-500 rounded-xl px-4 py-2.5 text-sm text-gray-800" />
              </div>
            </div>
            <button type="submit" disabled={loading} className="pill-btn bg-amber-600 hover:bg-amber-700 text-white px-6 py-2.5 text-sm font-bold disabled:opacity-50">
              {loading ? 'Publishing...' : '📢 Publish Regulation'}
            </button>
          </form>
        )}

        {/* Existing regulations */}
        <div className="space-y-3">
          {regulations.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-gray-400 text-sm">No regulations published yet.</div>
          ) : regulations.map(reg => (
            <div key={reg.id} className="bg-white border border-amber-200 border-l-4 border-l-amber-500 rounded-xl p-5">
              <div className="font-bold text-gray-800 mb-1">{reg.title}</div>
              <div className="text-gray-500 text-sm mb-2 line-clamp-2">{reg.description}</div>
              <div className="flex gap-4 text-xs text-gray-400 font-mono">
                <span>🏛️ {reg.issued_by}</span>
                <span>📅 {reg.issued_on}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </StaffLayout>
  );
}
