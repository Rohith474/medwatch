'use client';
import { useState } from 'react';
import { searchDrug, SearchResult } from '@/lib/api';
import Link from 'next/link';
import CameraScanner from '@/components/CameraScanner';

const STATUS_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string; border: string; badgeClass: string; severity: string }> = {
  NSQ_FOUND: {
    icon: '🔴',
    label: 'NSQ FOUND',
    color: 'text-red-700',
    bg: 'bg-red-50',
    border: 'border-red-500',
    badgeClass: 'bg-red-700 text-white',
    severity: 'CRITICAL — Batch Failed Lab Quality Test. Do not use.',
  },
  SPURIOUS_DRUG: {
    icon: '🚫',
    label: 'SPURIOUS DRUG',
    color: 'text-orange-700',
    bg: 'bg-orange-50',
    border: 'border-orange-500',
    badgeClass: 'bg-orange-600 text-white',
    severity: 'CRITICAL — Fake / Counterfeit Drug Identified. Report immediately.',
  },
  ADULTERATED: {
    icon: '⚠️',
    label: 'ADULTERATED',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-500',
    badgeClass: 'bg-yellow-600 text-white',
    severity: 'CRITICAL — Drug Contains Harmful Substances. Stop use immediately.',
  },
  MISBRANDED: {
    icon: '⚠️',
    label: 'MISBRANDED',
    color: 'text-pink-700',
    bg: 'bg-pink-50',
    border: 'border-pink-500',
    badgeClass: 'bg-pink-600 text-white',
    severity: 'STANDARD — Incorrect Label or Identity. Do not use.',
  },
  NO_ADVERSE_REPORT: {
    icon: '🟡',
    label: 'NO ADVERSE REPORT FOUND',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    badgeClass: 'bg-amber-500 text-white',
    severity: 'ADVISORY — Not in any failed list. This is NOT a quality clearance.',
  },
  DATA_UNAVAILABLE: {
    icon: '⚪',
    label: 'DATA UNAVAILABLE',
    color: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-400',
    badgeClass: 'bg-gray-500 text-white',
    severity: 'Could not match — check your batch number and drug name.',
  },
};

function PillInput({ label, value, onChange, placeholder, icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder: string; icon: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold text-blue-200 tracking-widest uppercase flex items-center gap-1.5">
        <span>{icon}</span> {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-white/10 border border-white/20 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30 rounded-2xl px-5 py-3.5 text-white placeholder-blue-300/60 text-sm font-mono transition-all"
      />
    </div>
  );
}

function ResultCard({ result }: { result: SearchResult }) {
  const cfg = STATUS_CONFIG[result.status] ?? STATUS_CONFIG['DATA_UNAVAILABLE'];
  const isCritical = ['NSQ_FOUND', 'SPURIOUS_DRUG', 'ADULTERATED', 'MISBRANDED'].includes(result.status);

  return (
    <div className={`mt-8 border-2 ${cfg.border} rounded-3xl overflow-hidden shadow-2xl fade-in-up`}>
      {/* Header stamp */}
      <div className={`${isCritical ? 'bg-gradient-to-r from-red-700 to-red-900' : result.status === 'NO_ADVERSE_REPORT' ? 'bg-gradient-to-r from-amber-600 to-amber-700' : 'bg-gradient-to-r from-gray-600 to-gray-700'} p-6 text-white`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs tracking-widest uppercase mb-1 opacity-80 font-mono">
              Kerala Drug Control Department — Verification Result
            </div>
            <div className="text-3xl font-black flex items-center gap-3">
              <span>{cfg.icon}</span> {cfg.label}
            </div>
            <div className="text-sm mt-1 opacity-90">{cfg.severity}</div>
          </div>
          {/* Official stamp visual */}
          <div className="stamp-animate flex-shrink-0">
            <div className={`w-24 h-24 rounded-full border-4 ${isCritical ? 'border-red-300 bg-red-900/60' : 'border-amber-300 bg-amber-900/60'} flex flex-col items-center justify-center text-center relative`}>
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-white/30 m-2"></div>
              <div className="text-2xl">{cfg.icon}</div>
              <div className="text-[8px] font-black tracking-widest uppercase leading-none mt-1 opacity-90">KDC</div>
              <div className="text-[7px] font-bold opacity-70">OFFICIAL</div>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className={`${cfg.bg} p-6`}>
        <div className="grid md:grid-cols-2 gap-4 text-sm mb-6">
          {[
            { label: '💊 Drug Name', value: result.drug_name },
            { label: '📦 Batch Number', value: result.batch_number },
            { label: '🏭 Manufacturer', value: result.manufacturer },
            { label: '🏥 Testing Lab', value: result.lab_name },
            { label: '📅 Test Date', value: result.test_date },
            { label: '📋 Action Taken', value: result.action_taken },
          ].filter(f => f.value).map((f) => (
            <div key={f.label} className="bg-white/60 rounded-xl p-3 border border-gray-200">
              <div className="text-xs text-gray-500 font-semibold mb-0.5">{f.label}</div>
              <div className="font-bold text-gray-800 font-mono">{f.value}</div>
            </div>
          ))}
        </div>

        {result.details && (
          <div className="bg-white/80 border border-gray-200 rounded-xl p-4 mb-4 text-sm text-gray-700">
            <div className="font-semibold mb-1 text-xs text-gray-500 uppercase tracking-wide">📝 Details</div>
            {result.details}
          </div>
        )}

        {/* Suggestions */}
        {result.suggestions && result.suggestions.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-bold text-gray-700 mb-3">🔎 Did you mean one of these?</div>
            <div className="grid gap-2">
              {result.suggestions.map((s, i) => (
                <button
                  key={i}
                  className="text-left bg-white border border-blue-200 rounded-xl px-4 py-3 hover:bg-blue-50 hover:border-blue-400 transition-all group"
                  onClick={() => {}}
                >
                  <div className="font-bold text-blue-700 text-sm group-hover:underline">{s.drug_name}</div>
                  <div className="text-xs text-gray-500 font-mono">Batch: {s.batch_number} · {Math.round(s.similarity * 100)}% match</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-gray-200">
          {isCritical && (
            <a
              href="tel:0471-2320551"
              className="pill-btn bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 text-sm font-bold"
            >
              📞 Report to Drug Control
            </a>
          )}
          <button
            onClick={() => window.print()}
            className="pill-btn bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 px-5 py-2.5 text-sm font-semibold"
          >
            🖨️ Print Result
          </button>
          <Link
            href="/alerts"
            className="pill-btn bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-5 py-2.5 text-sm font-semibold"
          >
            🚨 View All Recalls
          </Link>
        </div>
      </div>

      {/* Footer note */}
      <div className="bg-gray-100 px-6 py-3 text-xs text-gray-500 font-mono border-t border-gray-200">
        🔒 Search processed anonymously · Kerala Drug Control Dept. · Result timestamp: {new Date().toLocaleString('en-IN')}
      </div>
    </div>
  );
}

export default function SearchPage() {
  const [batch, setBatch] = useState('');
  const [drug, setDrug] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const runSearch = async (b: string, d: string) => {
    if (!b.trim() && !d.trim()) {
      setError('Please enter at least a batch number or drug name.');
      return;
    }
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await searchDrug(b.trim(), d.trim());
      setResult(res);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect to server. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await runSearch(batch, drug);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a40] via-[#002a60] to-[#001a40]">

      {/* Grid pattern */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      ></div>

      {/* Floating pills */}
      <div className="fixed top-24 left-8 opacity-10 floating-pill pointer-events-none">
        <div className="w-20 h-8 rounded-full border-4 border-blue-400 flex overflow-hidden">
          <div className="w-1/2 bg-blue-400"></div>
        </div>
      </div>
      <div className="fixed top-48 right-12 opacity-10 floating-pill-delay pointer-events-none">
        <div className="w-14 h-6 rounded-full border-4 border-cyan-400 flex overflow-hidden">
          <div className="w-1/2 bg-cyan-400"></div>
        </div>
      </div>
      <div className="fixed bottom-24 left-16 opacity-10 floating-pill-delay2 pointer-events-none">
        <div className="w-16 h-7 rounded-full border-4 border-purple-400 flex overflow-hidden">
          <div className="w-1/2 bg-purple-400"></div>
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-cyan-900/40 border border-cyan-500/30 rounded-full px-4 py-1.5 text-cyan-300 text-xs font-semibold uppercase tracking-widest mb-6">
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
            Drug Verification Terminal
          </div>
          <h1 className="text-4xl font-black text-white mb-3">
            Verify Your <span className="text-cyan-300">Medicine</span>
          </h1>
          <p className="text-blue-300 text-sm max-w-md mx-auto">
            Enter the batch number from your medicine box. We&apos;ll check CDSCO and Kerala Drug Control databases instantly.
          </p>
        </div>

        {/* Search Terminal */}
        <div className="terminal-glow bg-gray-900/90 backdrop-blur-md border border-cyan-500/30 rounded-3xl overflow-hidden">
          {/* Terminal header */}
          <div className="bg-black/40 px-6 py-3 flex items-center gap-3 border-b border-cyan-900/50">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-3 text-cyan-400 text-xs font-mono">MEDWATCH v2.0 — Drug Quality Verification System</span>
          </div>

          {/* Scan window */}
          <div className="p-8">
            <div className="mb-6 bg-black/30 border border-cyan-800/40 rounded-2xl p-4 font-mono text-xs text-green-400 space-y-1">
              <div>{'>'} Connected to: CDSCO National Database</div>
              <div>{'>'} Connected to: Kerala Drug Control Portal</div>
              <div className="text-cyan-400">{'>'} pg_trgm fuzzy matching: enabled</div>
              <div className="text-blue-300">{'>'} Privacy: IP anonymized · Search not logged to identity</div>
              <div className="text-yellow-400">{'>'} Ready — Enter batch details below</div>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <PillInput
                label="Batch Number"
                value={batch}
                onChange={setBatch}
                placeholder="e.g. CIP2024001, MET2024200..."
                icon="📦"
              />
              <PillInput
                label="Drug Name"
                value={drug}
                onChange={setDrug}
                placeholder="e.g. Paracetamol, Metformin, Azithromycin..."
                icon="💊"
              />

              {error && (
                <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm font-mono">
                  ⚠️ {error}
                </div>
              )}

              {/* Live Camera QR / Barcode Scanner */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10"></div>
                <span className="text-blue-400 text-xs font-mono">or</span>
                <div className="flex-1 h-px bg-white/10"></div>
              </div>

              {showScanner ? (
                <CameraScanner
                  onDetected={async ({ batch: scannedBatch, drug: scannedDrug }) => {
                    const nextBatch = scannedBatch || '';
                    const nextDrug = scannedDrug || '';
                    setBatch(nextBatch);
                    setDrug(nextDrug);
                    setShowScanner(false);
                    await runSearch(nextBatch, nextDrug);
                  }}
                  onClose={() => setShowScanner(false)}
                />
              ) : (
                <button
                  type="button"
                  className="w-full border-2 border-dashed border-cyan-700 hover:border-cyan-500 rounded-2xl py-5 text-cyan-400 hover:text-cyan-300 font-semibold text-sm flex flex-col items-center gap-2 transition-all group cursor-pointer"
                  onClick={() => setShowScanner(true)}
                >
                  <div className="text-3xl group-hover:scale-110 transition-transform">📷</div>
                  <div>Scan Barcode / QR Code with Camera</div>
                  <div className="text-xs opacity-60 font-normal">Supports live camera &amp; image file upload</div>
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full pill-btn bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-4 font-black text-base shadow-lg shadow-cyan-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2 font-mono text-sm">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Querying databases...
                  </span>
                ) : '🔍 Verify Medicine Now'}
              </button>
            </form>

            {/* Result */}
            {result && <ResultCard result={result} />}
          </div>
        </div>

        {/* Help section */}
        <div className="mt-8 grid sm:grid-cols-3 gap-4">
          {[
            { icon: '📦', title: 'Find Batch Number', desc: 'Look near the manufacturing date on your medicine strip or box.' },
            { icon: '💡', title: 'No result?', desc: 'Try entering just the batch number, or just the drug name for fuzzy matching.' },
            { icon: '🛡️', title: 'Your Privacy', desc: 'All searches are anonymous. Your identity is never stored. DPDP Act 2023 compliant.' },
          ].map((tip) => (
            <div key={tip.title} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">{tip.icon}</div>
              <div className="text-white font-semibold text-sm mb-1">{tip.title}</div>
              <div className="text-blue-300 text-xs leading-relaxed">{tip.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
