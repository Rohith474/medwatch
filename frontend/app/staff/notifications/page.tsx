'use client';
import { useState } from 'react';
import StaffLayout, { StaffRedirect } from '@/components/StaffLayout';
import { sendNotification, useStaffSession } from '@/lib/staff-api';

const SEVERITIES = ['CRITICAL', 'STANDARD', 'ADVISORY'];

export default function NotificationsPage() {
  const { ready, user } = useStaffSession();
  const [form, setForm] = useState({
    title: '', body: '', severity: 'CRITICAL', affected_batch: '',
    discreet_title: 'Drug safety alert', discreet_body: 'A new drug safety alert has been issued. Open MEDWATCH for details.',
  });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await sendNotification(form);
      setMsg('✅ Notification created. It will be dispatched by the system.');
      setForm({ title: '', body: '', severity: 'CRITICAL', affected_batch: '', discreet_title: 'Drug safety alert', discreet_body: 'A new drug safety alert has been issued. Open MEDWATCH for details.' });
    } catch (e: unknown) {
      setMsg(`❌ ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;
  if (!user || user.role !== 'SUPER_ADMIN') return <StaffRedirect />;

  const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: 'bg-red-600', STANDARD: 'bg-orange-500', ADVISORY: 'bg-yellow-500',
  };

  return (
    <StaffLayout user={user}>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-800">🔔 Send Alert Notification</h1>
          <p className="text-gray-500 text-sm mt-1">Broadcast a drug safety alert to all app users. Lock screen shows only the discreet text (DPDP Act 2023).</p>
        </div>

        {msg && (
          <div className={`rounded-xl px-4 py-3 text-sm mb-5 font-semibold ${msg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">

          {/* Severity selector */}
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Severity Level *</label>
            <div className="flex gap-2">
              {SEVERITIES.map(s => (
                <button
                  key={s} type="button"
                  onClick={() => setForm(prev => ({ ...prev, severity: s }))}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-black border-2 transition-all ${form.severity === s ? `${SEVERITY_COLORS[s]} text-white border-transparent` : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-400'}`}
                >
                  {s === 'CRITICAL' ? '🔴' : s === 'STANDARD' ? '🟠' : '🟡'} {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Alert Title *</label>
            <input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. NSQ FOUND — Paracip 500mg Batch CIP2024001" className="w-full border border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 rounded-xl px-4 py-2.5 text-sm text-gray-800" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Alert Body *</label>
            <textarea name="body" value={form.body} onChange={handleChange} required rows={3} placeholder="Full alert message shown inside the app..." className="w-full border border-gray-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 rounded-xl px-4 py-2.5 text-sm text-gray-800 resize-none" />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Affected Batch Number</label>
            <input name="affected_batch" value={form.affected_batch} onChange={handleChange} placeholder="e.g. CIP2024001" className="w-full border border-gray-300 focus:border-blue-400 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-800" />
          </div>

          {/* Privacy section */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="text-xs font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
              🔒 Lock Screen Text (DPDP Act 2023 Privacy)
            </div>
            <div className="text-xs text-blue-600">These are shown on the device lock screen — no drug names visible to bystanders.</div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Discreet Title</label>
              <input name="discreet_title" value={form.discreet_title} onChange={handleChange} className="w-full border border-blue-200 focus:border-blue-400 rounded-xl px-4 py-2.5 text-sm text-gray-800" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Discreet Body</label>
              <input name="discreet_body" value={form.discreet_body} onChange={handleChange} className="w-full border border-blue-200 focus:border-blue-400 rounded-xl px-4 py-2.5 text-sm text-gray-800" />
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full pill-btn bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white py-3.5 font-black text-sm shadow-lg shadow-red-500/20 disabled:opacity-50">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Sending...
              </span>
            ) : '🔔 Send Notification'}
          </button>
        </form>
      </div>
    </StaffLayout>
  );
}
