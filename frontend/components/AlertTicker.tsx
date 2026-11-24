'use client';

const alerts = [
  "🔴 NSQ FOUND — Paracip 500mg | Batch: CIP2024001 | Cipla Ltd | Kerala DC Order #2024-091",
  "🔴 SPURIOUS DRUG — Azithral 250mg | Batch: AZT2024099 | Alembic | CDSCO Alert",
  "🔴 NSQ FOUND — Metformin SR 500mg | Batch: MET2024200 | Sun Pharma | Stop Sale Issued",
  "⚠️ ADVISORY — Amoxicillin 250mg | Batch: AMX2024311 | Sample Under Testing",
  "🔴 ADULTERATED — Dolo 650mg | Batch: DOL2024410 | Manufacturer: Unknown | CDSCO Action",
  "⚠️ MISBRANDED — Cetirizine 10mg | Batch: CET2024501 | Label Non-Compliant | Kerala DC",
];

export default function AlertTicker() {
  const doubled = [...alerts, ...alerts];

  return (
    <div className="bg-red-700 text-white py-2 overflow-hidden relative z-40 border-b border-red-900">
      {/* Gradient fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-red-700 to-transparent z-10 pointer-events-none"></div>
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-red-700 to-transparent z-10 pointer-events-none"></div>

      <div className="flex items-center">
        <div className="flex-shrink-0 bg-red-900 text-white text-xs font-black px-4 py-1 tracking-widest uppercase z-20 mr-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
          LIVE ALERT
        </div>

        <div className="overflow-hidden flex-1">
          <div className="ticker-track flex whitespace-nowrap">
            {doubled.map((alert, i) => (
              <span key={i} className="text-xs font-medium mr-16 flex-shrink-0 opacity-95">
                {alert}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
