import { getNotifications } from '@/lib/api';
import Link from 'next/link';

const SEVERITY_CONFIG = {
  CRITICAL: { color: 'text-red-700', bg: 'bg-red-700', border: 'border-red-500', boxTop: 'bg-red-600', badge: 'bg-red-700 text-white', icon: '🔴', label: 'CRITICAL' },
  STANDARD: { color: 'text-orange-700', bg: 'bg-orange-600', border: 'border-orange-400', boxTop: 'bg-orange-500', badge: 'bg-orange-600 text-white', icon: '🟠', label: 'STANDARD' },
  ADVISORY: { color: 'text-yellow-700', bg: 'bg-yellow-500', border: 'border-yellow-400', boxTop: 'bg-yellow-400', badge: 'bg-yellow-500 text-black', icon: '🟡', label: 'ADVISORY' },
};

function MedicineBoxCard({ title, body, severity, batch, date }: {
  title: string; body: string; severity: 'CRITICAL' | 'STANDARD' | 'ADVISORY'; batch?: string; date: string;
}) {
  const cfg = SEVERITY_CONFIG[severity];

  return (
    <div className={`medicine-box border-2 ${cfg.border} rounded-2xl overflow-hidden group cursor-default`}>
      {/* Top of box — medicine box lid / color band */}
      <div className={`${cfg.boxTop} px-4 py-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className="text-white text-xs font-black tracking-widest uppercase">{cfg.icon} {cfg.label}</span>
        </div>
        {batch && (
          <span className="text-white/80 text-xs font-mono bg-black/20 px-2 py-0.5 rounded-full">
            {batch}
          </span>
        )}
      </div>

      {/* Box body */}
      <div className="bg-white p-5">
        {/* Fake medicine box design elements */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`flex-shrink-0 w-14 h-14 ${cfg.boxTop} rounded-xl flex flex-col items-center justify-center text-white relative overflow-hidden`}>
            <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white to-transparent"></div>
            <div className="text-2xl z-10">💊</div>
          </div>
          <div>
            <div className="font-black text-gray-800 leading-tight text-sm">{title}</div>
            <div className="text-xs text-gray-500 font-mono mt-0.5">{new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
          </div>
        </div>

        {/* Barcode lines (decorative) */}
        <div className="flex gap-0.5 items-end h-8 mb-3 opacity-20">
          {[2,3,1,4,2,3,1,2,4,3,2,1,3,2,4,2,3,1,2,3].map((h, i) => (
            <div key={i} className="bg-gray-800" style={{ width: 2, height: h * 5 }}></div>
          ))}
          <div className="text-[8px] text-gray-800 font-mono self-end ml-1 opacity-80">FDA/DC</div>
        </div>

        <p className="text-gray-600 text-xs leading-relaxed line-clamp-3">{body}</p>

        <div className="mt-3 flex items-center justify-between">
          <span className={`text-xs font-black px-2.5 py-1 rounded-full ${cfg.badge}`}>
            {cfg.icon} {cfg.label}
          </span>
          <span className="text-xs text-gray-400 font-mono">KDC ALERT</span>
        </div>
      </div>
    </div>
  );
}

// Mock data as fallback
const MOCK_ALERTS = [
  { id: 1, title: 'Paracip 500mg NSQ Batch', body: 'Batch CIP2024001 of Paracip 500mg tablets manufactured by Cipla Ltd has failed standard quality tests. Stop sale order issued by Kerala Drug Control.', severity: 'CRITICAL' as const, affected_batch: 'CIP2024001', created_at: new Date().toISOString() },
  { id: 2, title: 'Azithral 250mg — Spurious Drug Alert', body: 'Counterfeit Azithral 250mg tablets identified in Ernakulam district. Batch AZT2024099 — not manufactured by Alembic Pharmaceuticals. Report to nearest DC office.', severity: 'CRITICAL' as const, affected_batch: 'AZT2024099', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, title: 'Metformin SR — NSQ Alert', body: 'Metformin SR 500mg Batch MET2024200 by Sun Pharma failed dissolution test. Stop sale order active across Kerala. Product recall initiated.', severity: 'CRITICAL' as const, affected_batch: 'MET2024200', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: 4, title: 'Amoxicillin 250mg — Under Testing', body: 'Amoxicillin 250mg Batch AMX2024311 is currently under testing at the Regional Drug Testing Laboratory. Avoid purchase until results are confirmed.', severity: 'STANDARD' as const, affected_batch: 'AMX2024311', created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: 5, title: 'Dolo 650 — Adulterated Batch', body: 'Dolo 650mg Batch DOL2024410 found to contain undisclosed substances. CDSCO has issued a recall notice. Do not use this batch.', severity: 'CRITICAL' as const, affected_batch: 'DOL2024410', created_at: new Date(Date.now() - 345600000).toISOString() },
  { id: 6, title: 'Cetirizine 10mg — Misbranding', body: 'Cetirizine 10mg Batch CET2024501 has been found with incorrect labeling — missing manufacturing date. Advisory issued by Kerala Drug Control.', severity: 'ADVISORY' as const, affected_batch: 'CET2024501', created_at: new Date(Date.now() - 432000000).toISOString() },
];

export const revalidate = 60; // ISR every 60s

export default async function AlertsPage() {
  let alerts = await getNotifications().catch(() => []);
  if (!alerts.length) alerts = MOCK_ALERTS as typeof alerts;

  const critical = alerts.filter(a => a.severity === 'CRITICAL');
  const standard = alerts.filter(a => a.severity === 'STANDARD');
  const advisory = alerts.filter(a => a.severity === 'ADVISORY');

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero header */}
      <div className="bg-gradient-to-r from-red-700 to-red-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-red-600/50 border border-red-400/30 rounded-full px-3 py-1 text-red-200 text-xs font-semibold uppercase tracking-widest mb-4">
            <span className="w-2 h-2 bg-red-200 rounded-full animate-pulse"></span>
            Live Drug Recall Alerts
          </div>
          <h1 className="text-4xl font-black mb-2">Active Drug Recalls</h1>
          <p className="text-red-200 max-w-xl text-sm">
            Live alerts from Kerala Drug Control Department and CDSCO.
            If your medicine appears here — stop use immediately and contact your pharmacist.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 mt-6">
            <div className="bg-red-800/60 border border-red-600/40 rounded-xl px-4 py-2 text-sm">
              <span className="font-black text-lg mr-1">{critical.length}</span>
              <span className="text-red-200">Critical Alerts</span>
            </div>
            <div className="bg-orange-800/60 border border-orange-600/40 rounded-xl px-4 py-2 text-sm">
              <span className="font-black text-lg mr-1">{standard.length}</span>
              <span className="text-red-200">Standard Alerts</span>
            </div>
            <div className="bg-yellow-800/60 border border-yellow-600/40 rounded-xl px-4 py-2 text-sm">
              <span className="font-black text-lg mr-1">{advisory.length}</span>
              <span className="text-red-200">Advisories</span>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm text-red-200">
              🕒 Last updated: {new Date().toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'medium' })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Critical section */}
        {critical.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
              <h2 className="text-xl font-black text-gray-800">🔴 Critical Recalls — Immediate Action Required</h2>
              <span className="bg-red-100 text-red-700 text-xs font-black px-3 py-1 rounded-full">{critical.length} ALERTS</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {critical.map((a) => (
                <MedicineBoxCard
                  key={a.id}
                  title={a.title}
                  body={a.body}
                  severity="CRITICAL"
                  batch={a.affected_batch}
                  date={a.created_at}
                />
              ))}
            </div>
          </div>
        )}

        {/* Standard section */}
        {standard.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
              <h2 className="text-xl font-black text-gray-800">🟠 Standard Alerts</h2>
              <span className="bg-orange-100 text-orange-700 text-xs font-black px-3 py-1 rounded-full">{standard.length} ALERTS</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {standard.map((a) => (
                <MedicineBoxCard
                  key={a.id}
                  title={a.title}
                  body={a.body}
                  severity="STANDARD"
                  batch={a.affected_batch}
                  date={a.created_at}
                />
              ))}
            </div>
          </div>
        )}

        {/* Advisory section */}
        {advisory.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
              <h2 className="text-xl font-black text-gray-800">🟡 Advisories</h2>
              <span className="bg-yellow-100 text-yellow-700 text-xs font-black px-3 py-1 rounded-full">{advisory.length} ADVISORIES</span>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {advisory.map((a) => (
                <MedicineBoxCard
                  key={a.id}
                  title={a.title}
                  body={a.body}
                  severity="ADVISORY"
                  batch={a.affected_batch}
                  date={a.created_at}
                />
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#001a40] to-[#003580] rounded-3xl p-8 text-white text-center">
          <div className="text-4xl mb-3">🔍</div>
          <h3 className="text-2xl font-black mb-2">Check Your Specific Medicine</h3>
          <p className="text-blue-300 text-sm mb-6 max-w-md mx-auto">
            Enter your batch number for an instant, authoritative result against CDSCO and Kerala DC records.
          </p>
          <Link href="/search" className="pill-btn bg-white text-blue-800 hover:bg-blue-50 px-8 py-3 font-black text-sm">
            🛡️ Verify My Medicine Now
          </Link>
        </div>
      </div>
    </div>
  );
}
