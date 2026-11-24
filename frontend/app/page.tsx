import Link from 'next/link';

function MedicineBox({ color, label, batch }: { color: string; label: string; batch: string }) {
  return (
    <div className="medicine-box p-6 cursor-pointer group mt-2">
      <div className={`h-20 rounded-lg mb-3 flex items-center justify-center text-white font-bold text-sm ${color} relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white to-transparent"></div>
        <div className="text-center z-10">
          <div className="text-xs opacity-80 mb-1">💊</div>
          {label}
        </div>
      </div>
      <div className="text-xs text-gray-500 font-mono">Batch: {batch}</div>
      <div className="mt-2">
        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">🔴 NSQ FOUND</span>
      </div>
    </div>
  );
}

function StatCard({ value, label, icon, color }: { value: string; label: string; icon: string; color: string }) {
  return (
    <div className="stat-card p-6 text-center">
      <div className="text-4xl mb-2">{icon}</div>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      <div className="text-blue-200 text-sm mt-1">{label}</div>
    </div>
  );
}

export default function HomePage() {
  const recentAlerts = [
    { name: "Paracip 500mg", batch: "CIP2024001", color: "bg-blue-600" },
    { name: "Azithral 250mg", batch: "AZT2024099", color: "bg-purple-600" },
    { name: "Metformin SR", batch: "MET2024200", color: "bg-teal-600" },
  ];

  return (
    <div className="min-h-screen">

      {/* HERO */}
      <section className="relative bg-gradient-to-br from-[#001a40] via-[#003580] to-[#0051a2] text-white overflow-hidden min-h-[88vh] flex items-center">
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',backgroundSize:'40px 40px'}}></div>

        {/* Floating pills */}
        <div className="absolute top-10 left-10 opacity-15 floating-pill">
          <div className="w-24 h-10 rounded-full border-4 border-blue-400 flex overflow-hidden">
            <div className="w-1/2 h-full bg-blue-400"></div>
            <div className="w-1/2 h-full bg-transparent"></div>
          </div>
        </div>
        <div className="absolute top-32 right-20 opacity-15 floating-pill-delay">
          <div className="w-16 h-7 rounded-full border-4 border-green-400 flex overflow-hidden">
            <div className="w-1/2 h-full bg-green-400"></div>
          </div>
        </div>
        <div className="absolute bottom-20 left-32 opacity-15 floating-pill-delay2">
          <div className="w-20 h-8 rounded-full border-4 border-red-400 flex overflow-hidden">
            <div className="w-1/2 h-full bg-red-400"></div>
          </div>
        </div>
        <div className="absolute bottom-10 right-10 opacity-15 floating-pill">
          <div className="w-28 h-11 rounded-full border-4 border-yellow-400 flex overflow-hidden">
            <div className="w-1/2 h-full bg-yellow-400"></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-900/50 border border-blue-500/30 rounded-full px-4 py-1.5 text-blue-300 text-xs font-semibold uppercase tracking-widest mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Live Drug Verification System
            </div>
            <h1 className="text-5xl lg:text-6xl font-black leading-tight mb-4">
              Is Your Medicine
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-cyan-300">Safe to Take?</span>
            </h1>
            <p className="text-blue-200 text-lg leading-relaxed mb-8 max-w-lg">
              Enter any medicine batch number to instantly verify if it has been flagged as{' '}
              <strong className="text-red-400">NSQ</strong>,{' '}
              <strong className="text-orange-400">Spurious</strong>, or{' '}
              <strong className="text-yellow-400">Adulterated</strong> by Kerala Drug Control &amp; CDSCO.
            </p>

            <form action="/search" className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 mb-6">
              <div className="text-xs text-blue-300 uppercase tracking-wider mb-3 font-semibold">⚡ Quick Verify</div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input name="batch" type="text" placeholder="Batch Number (e.g. CIP2024001)"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                <input name="drug" type="text" placeholder="Drug Name"
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
                <button type="submit" className="pill-btn bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 px-6 py-3 font-bold text-sm transition-all">
                  🔍 Verify
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-3">
              <Link href="/search" className="pill-btn bg-red-600 hover:bg-red-500 text-white px-6 py-3 font-semibold text-sm flex items-center gap-2 transition-all">
                📦 Scan Medicine Box
              </Link>
              <Link href="/alerts" className="pill-btn bg-transparent border-2 border-white/30 hover:border-white text-white px-6 py-3 font-semibold text-sm flex items-center gap-2 transition-all">
                🚨 View Active Recalls
              </Link>
            </div>
          </div>

          {/* Scanner visual */}
          <div className="hidden lg:flex justify-center">
            <div className="relative">
              <div className="terminal-glow bg-gray-900/80 backdrop-blur-sm border border-cyan-500/30 rounded-3xl p-8 w-80">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="ml-2 text-cyan-400 text-xs font-mono">MEDWATCH v2.0</span>
                </div>
                <div className="relative bg-black/50 border-2 border-cyan-500/40 rounded-2xl h-44 mb-4 flex items-center justify-center overflow-hidden">
                  <div className="scan-line"></div>
                  <div className="relative bg-white/10 border border-white/20 rounded-xl p-4 text-center">
                    <div className="text-2xl mb-1">💊</div>
                    <div className="text-white text-xs font-bold">Paracip 500mg</div>
                    <div className="text-cyan-300 text-xs font-mono mt-1">Batch: CIP2024001</div>
                    <div className="mt-2 flex gap-1 justify-center">
                      {[2,4,3,5,2,4,3,2].map((w, i) => (
                        <div key={i} className="bg-white/60" style={{width: w*2, height: 24}}></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="nsq-badge text-white rounded-xl p-3 text-center">
                  <div className="text-xs opacity-80 mb-1 uppercase tracking-widest">Verification Result</div>
                  <div className="text-lg font-black">🔴 NSQ FOUND</div>
                  <div className="text-xs opacity-80 mt-1">Stop Sale Order Active</div>
                </div>
                <div className="mt-4 text-xs font-mono text-green-400 space-y-1">
                  <div>{'>'} Querying CDSCO Database...</div>
                  <div>{'>'} Kerala DC Portal: Connected</div>
                  <div className="text-red-400">{'>'} ALERT: Batch flagged NSQ</div>
                </div>
              </div>
              <div className="floating-pill absolute -top-6 -right-8 bg-blue-500/20 border border-blue-400/40 rounded-full px-3 py-1 text-blue-300 text-xs font-mono">pg_trgm ✓</div>
              <div className="floating-pill-delay absolute -bottom-4 -left-10 bg-green-500/20 border border-green-400/40 rounded-full px-3 py-1 text-green-300 text-xs font-mono">CDSCO synced</div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-gradient-to-r from-[#002060] to-[#003580] py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard value="14,230+" label="Drug Batches Verified Today" icon="🔍" color="text-cyan-300" />
          <StatCard value="387" label="NSQ Batches in Database" icon="⚠️" color="text-red-400" />
          <StatCard value="52" label="Accredited Labs Connected" icon="🏥" color="text-green-400" />
          <StatCard value="2.1M+" label="Citizens Protected" icon="🛡️" color="text-yellow-300" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-black text-gray-800 mb-3">How It Works</h2>
            <p className="text-gray-500">Verify any medicine in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step:"01", icon:"📦", title:"Find the Batch Number", desc:"Look at the medicine box or strip. The Batch Number is printed next to the manufacturing date.", color:"from-blue-500 to-blue-700" },
              { step:"02", icon:"🔍", title:"Enter or Scan", desc:"Type the Batch Number + Drug Name in the search form, or scan the barcode / QR code on the box.", color:"from-purple-500 to-purple-700" },
              { step:"03", icon:"✅", title:"Get Instant Result", desc:"MEDWATCH checks CDSCO and Kerala Drug Control databases and returns a verified safety status in seconds.", color:"from-teal-500 to-teal-700" },
            ].map((item) => (
              <div key={item.step} className="group">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-2xl mb-5 group-hover:scale-110 transition-transform`}>{item.icon}</div>
                  <div className="text-xs font-black text-gray-300 tracking-widest mb-2">STEP {item.step}</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-3">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/search" className="pill-btn inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white px-8 py-4 font-bold text-sm transition-all shadow-lg shadow-blue-500/30">
              🛡️ Verify My Medicine Now
            </Link>
          </div>
        </div>
      </section>

      {/* RECENT ALERTS - Medicine Boxes */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-gray-800">Recent Drug Alerts</h2>
              <p className="text-gray-500 mt-1">Latest batches flagged by Kerala Drug Control &amp; CDSCO</p>
            </div>
            <Link href="/alerts" className="pill-btn bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-5 py-2 text-sm font-semibold transition-all">View All →</Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {recentAlerts.map((drug) => (
              <MedicineBox key={drug.batch} color={drug.color} label={drug.name} batch={drug.batch} />
            ))}
          </div>
        </div>
      </section>

      {/* RESULT TYPES */}
      <section className="py-20 bg-gradient-to-br from-gray-900 to-[#001a40] text-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">Understanding Your Results</h2>
            <p className="text-blue-300">MEDWATCH never shows &ldquo;PASS&rdquo;. Absence of a record means no adverse report — not a quality clearance.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { badge:"🔴 NSQ FOUND", label:"Not of Standard Quality", desc:"Batch failed lab quality test", bg:"from-red-900/60 to-red-800/40", border:"border-red-700" },
              { badge:"🔴 SPURIOUS DRUG", label:"Counterfeit Medicine", desc:"Fake / counterfeit drug identified", bg:"from-orange-900/60 to-orange-800/40", border:"border-orange-700" },
              { badge:"🔴 ADULTERATED", label:"Harmful Contents", desc:"Drug contains harmful substances", bg:"from-yellow-900/60 to-yellow-800/40", border:"border-yellow-700" },
              { badge:"🔴 MISBRANDED", label:"Incorrect Label", desc:"Incorrect label or identity", bg:"from-pink-900/60 to-pink-800/40", border:"border-pink-700" },
              { badge:"🟡 NO ADVERSE REPORT", label:"Not in Failed List", desc:"Not in any failed list — not a clearance", bg:"from-yellow-900/40 to-amber-900/40", border:"border-amber-700" },
              { badge:"⚪ DATA UNAVAILABLE", label:"Insufficient Input", desc:"Could not match — check your input", bg:"from-gray-800/60 to-gray-700/40", border:"border-gray-600" },
            ].map((item) => (
              <div key={item.badge} className={`bg-gradient-to-br ${item.bg} border ${item.border} rounded-2xl p-5`}>
                <div className="text-sm font-black mb-1">{item.badge}</div>
                <div className="text-white font-semibold text-sm mb-1">{item.label}</div>
                <div className="text-gray-400 text-xs">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-blue-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-5xl mb-4">🛡️</div>
          <h2 className="text-3xl font-black mb-4">Don&apos;t Risk Your Health</h2>
          <p className="text-blue-100 mb-8">Always verify your medicine before use. It takes 3 seconds and could save your life.</p>
          <Link href="/search" className="pill-btn inline-block bg-white text-blue-700 hover:bg-blue-50 px-10 py-4 font-black text-lg transition-all shadow-xl">
            🔍 Verify Medicine Now — It&apos;s Free
          </Link>
        </div>
      </section>
    </div>
  );
}
