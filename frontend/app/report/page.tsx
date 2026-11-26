'use client';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { submitCitizenReport, trackCitizenReport, TrackedReport } from '@/lib/api';
import { useLang } from '@/lib/i18n';

const ISSUE_OPTIONS = [
  { value: 'SUSPECTED_FAKE', icon: '🚫', label: 'Suspected Fake / Spurious', desc: 'Looks counterfeit, misspelled, or not listed' },
  { value: 'ADVERSE_REACTION', icon: '🤒', label: 'Adverse Side Effect', desc: 'Unexpected reaction after taking medicine' },
  { value: 'TAMPERED_PACKAGING', icon: '📦', label: 'Tampered Seal / Label', desc: 'Broken seal, scratched batch, or altered expiry' },
  { value: 'QUALITY_ISSUE', icon: '⚠️', label: 'Spoiled / Quality Defect', desc: 'Discolored tablets, foul smell, or broken strip' },
];

const KERALA_DISTRICTS = [
  'Thiruvananthapuram', 'Kollam', 'Pathanamthitta', 'Alappuzha', 'Kottayam',
  'Idukki', 'Ernakulam', 'Thrissur', 'Palakkad', 'Malappuram',
  'Kozhikode', 'Wayanad', 'Kannur', 'Kasaragod', 'Other State',
];

function ReportFormContent() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    drug_name: '',
    batch_no: '',
    manufacturer_name: '',
    issue_type: 'SUSPECTED_FAKE',
    pharmacy_or_location: '',
    district: 'Thiruvananthapuram',
    description: '',
    reporter_contact: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState<{ reference_code: string; message: string } | null>(null);
  const [trackRef, setTrackRef] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [tracked, setTracked] = useState<TrackedReport | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackRef.trim()) return;
    setTrackLoading(true);
    setTrackError('');
    setTracked(null);
    try {
      const res = await trackCitizenReport(trackRef.trim());
      setTracked(res);
    } catch (err: unknown) {
      setTrackError(err instanceof Error ? err.message : 'Report not found');
    } finally {
      setTrackLoading(false);
    }
  };

  useEffect(() => {
    const d = searchParams.get('drug') || '';
    const b = searchParams.get('batch') || '';
    if (d || b) {
      setForm(prev => ({
        ...prev,
        drug_name: d || prev.drug_name,
        batch_no: b || prev.batch_no,
      }));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await submitCitizenReport(form);
      setSubmitted({ reference_code: res.reference_code, message: res.message });
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('MEDWATCH Safety Advisory', {
          body: 'Stop using the reported medicine immediately and keep the strip + purchase bill safely.',
          icon: '/favicon.ico',
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a40] via-[#002a60] to-[#001a40] py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-red-900/40 border border-red-500/40 rounded-full px-4 py-1.5 text-red-300 text-xs font-semibold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
            {t('rpt_badge')}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            {t('rpt_title_1')} <span className="text-red-400">{t('rpt_title_2')}</span>
          </h1>
          <p className="text-blue-200 text-sm max-w-lg mx-auto">
            {t('rpt_subtitle')}
          </p>
        </div>

        {/* Track Existing Report Card */}
        <div className="bg-gray-900/80 backdrop-blur-md border border-cyan-500/30 rounded-3xl p-5 md:p-6 mb-6 shadow-xl">
          <div className="text-xs font-black text-cyan-300 uppercase tracking-widest mb-2.5">
            🔎 {t('rpt_track_title')}
          </div>
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={trackRef}
              onChange={(e) => setTrackRef(e.target.value)}
              placeholder="Enter Reference Code (e.g. MW-RPT-2)"
              className="flex-1 bg-white/10 border border-white/20 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-white font-mono text-sm placeholder-blue-300/60"
            />
            <button
              type="submit"
              disabled={trackLoading}
              className="pill-btn bg-cyan-500 hover:bg-cyan-400 text-gray-950 px-6 py-2.5 text-sm font-black disabled:opacity-50"
            >
              {trackLoading ? 'Checking...' : t('rpt_track_btn')}
            </button>
          </form>

          {trackError && (
            <div className="mt-3 bg-red-900/40 border border-red-700 text-red-200 rounded-xl px-4 py-2.5 text-xs font-mono">
              ⚠️ {trackError}
            </div>
          )}

          {tracked && (
            <div className="mt-4 bg-white rounded-2xl p-5 text-gray-800 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-xs font-mono font-bold bg-gray-100 px-2.5 py-1 rounded text-gray-700">
                    {tracked.reference_code}
                  </span>
                  <span className="ml-2 font-black text-base text-gray-900">{tracked.drug_name}</span>
                  {tracked.batch_no && <span className="ml-2 text-xs font-mono text-gray-500">Batch: {tracked.batch_no}</span>}
                </div>
                <span className="text-xs text-gray-500">{tracked.district} · {tracked.created_at}</span>
              </div>

              {/* 3-Step Progress Bar */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="p-2 rounded-xl bg-green-100 text-green-800 border border-green-300">
                  ✓ 1. Submitted
                </div>
                <div className={`p-2 rounded-xl border ${
                  ['UNDER_REVIEW', 'RESOLVED'].includes(tracked.status)
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}>
                  {['UNDER_REVIEW', 'RESOLVED'].includes(tracked.status) ? '✓' : '○'} 2. Under Review
                </div>
                <div className={`p-2 rounded-xl border ${
                  tracked.status === 'RESOLVED'
                    ? 'bg-green-600 text-white border-green-700'
                    : tracked.status === 'DISMISSED'
                    ? 'bg-gray-500 text-white border-gray-600'
                    : 'bg-gray-100 text-gray-400 border-gray-200'
                }`}>
                  {tracked.status === 'RESOLVED' ? '✓ 3. Resolved' : tracked.status === 'DISMISSED' ? '✕ Closed' : '○ 3. Resolved'}
                </div>
              </div>

              {tracked.inspector_notes ? (
                <div className="bg-green-50 border border-green-200 text-green-900 text-xs p-3.5 rounded-xl">
                  <strong className="uppercase tracking-wider">🛡️ Inspector Action Taken:</strong>{' '}
                  {tracked.inspector_notes}
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-xl">
                  ⏳ Your report is in the Drug Inspector queue. Check back soon for investigation updates.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-900/20">
          {submitted ? (
            <div className="p-8 md:p-12 text-center space-y-5">
              <div className="text-6xl">🛡️</div>
              <h2 className="text-2xl font-black text-green-700">{t('rpt_success_title')}</h2>
              <p className="text-gray-600 text-sm max-w-md mx-auto">{submitted.message}</p>
              <div className="inline-block bg-gray-100 border border-gray-300 rounded-2xl px-6 py-4">
                <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t('rpt_ref_lbl')}</div>
                <div className="text-2xl font-black font-mono text-[#001a40] mt-1">{submitted.reference_code}</div>
              </div>

              {/* Citizen Safety Advisory Box */}
              <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-5 text-left max-w-lg mx-auto space-y-2">
                <div className="text-xs font-black text-red-700 uppercase tracking-wider flex items-center gap-1.5">
                  ⚠️ {t('rpt_safety_title')}
                </div>
                <ul className="text-sm text-red-900 space-y-1.5 list-disc list-inside">
                  <li><strong>{t('rpt_safety_1')}</strong></li>
                  <li><strong>{t('rpt_safety_2')}</strong></li>
                  <li><strong>{t('rpt_safety_3')}</strong></li>
                </ul>
              </div>

              <div className="text-xs text-gray-500">
                For urgent medical emergencies, call Kerala Drug Control Helpline: <strong>0471-2320551</strong>
              </div>
              <div className="pt-4 flex justify-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(null);
                    setForm({
                      drug_name: '', batch_no: '', manufacturer_name: '',
                      issue_type: 'SUSPECTED_FAKE', pharmacy_or_location: '',
                      district: 'Thiruvananthapuram', description: '', reporter_contact: '',
                    });
                  }}
                  className="pill-btn bg-blue-700 hover:bg-blue-800 text-white px-6 py-2.5 text-sm font-bold"
                >
                  {t('rpt_another')}
                </button>
                <Link href="/search" className="pill-btn bg-gray-100 hover:bg-gray-200 text-gray-800 px-6 py-2.5 text-sm font-bold">
                  {t('rpt_back')}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              {/* Issue Type Cards */}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2.5">
                  {t('rpt_q1')}
                </label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {[
                    { value: 'SUSPECTED_FAKE', icon: '🚫', label: t('rpt_opt_fake'), desc: t('rpt_opt_fake_d') },
                    { value: 'ADVERSE_REACTION', icon: '🤒', label: t('rpt_opt_adv'), desc: t('rpt_opt_adv_d') },
                    { value: 'TAMPERED_PACKAGING', icon: '📦', label: t('rpt_opt_tamp'), desc: t('rpt_opt_tamp_d') },
                    { value: 'QUALITY_ISSUE', icon: '⚠️', label: t('rpt_opt_qual'), desc: t('rpt_opt_qual_d') },
                  ].map((opt) => {
                    const active = form.issue_type === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm({ ...form, issue_type: opt.value })}
                        className={`text-left p-3.5 rounded-2xl border-2 transition-all cursor-pointer ${
                          active ? 'border-red-600 bg-red-50/70 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="font-bold text-sm text-gray-800 flex items-center gap-2">
                          <span>{opt.icon}</span> {opt.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Medicine Details */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    {t('rpt_lbl_drug')}
                  </label>
                  <input
                    type="text"
                    required
                    value={form.drug_name}
                    onChange={e => setForm({ ...form, drug_name: e.target.value })}
                    placeholder="e.g. Paracip 500mg"
                    className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    {t('rpt_lbl_batch')}
                  </label>
                  <input
                    type="text"
                    value={form.batch_no}
                    onChange={e => setForm({ ...form, batch_no: e.target.value })}
                    placeholder="e.g. CIP2024001"
                    className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    {t('rpt_lbl_mfr')}
                  </label>
                  <input
                    type="text"
                    value={form.manufacturer_name}
                    onChange={e => setForm({ ...form, manufacturer_name: e.target.value })}
                    placeholder="Printed on strip/box"
                    className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    {t('rpt_lbl_dist')}
                  </label>
                  <select
                    value={form.district}
                    onChange={e => setForm({ ...form, district: e.target.value })}
                    className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800"
                  >
                    {KERALA_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                  {t('rpt_lbl_shop')}
                </label>
                <input
                  type="text"
                  value={form.pharmacy_or_location}
                  onChange={e => setForm({ ...form, pharmacy_or_location: e.target.value })}
                  placeholder="Where was this medicine purchased?"
                  className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                  {t('rpt_lbl_desc')}
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Describe the suspected defect, tampered packaging, or adverse symptoms..."
                  className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800 resize-none"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                <label className="block text-xs font-bold text-blue-900 uppercase tracking-wide mb-1">
                  🔒 {t('rpt_lbl_contact')}
                </label>
                <input
                  type="text"
                  value={form.reporter_contact}
                  onChange={e => setForm({ ...form, reporter_contact: e.target.value })}
                  placeholder="Mobile or email only if you want an inspector follow-up"
                  className="w-full bg-white border border-blue-200 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-semibold">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full pill-btn bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white py-4 font-black text-sm shadow-lg shadow-red-600/20 disabled:opacity-50"
              >
                {loading ? 'Submitting Report...' : `🚨 ${t('rpt_submit_btn')}`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CitizenReportPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#001a40]" />}>
      <ReportFormContent />
    </Suspense>
  );
}
