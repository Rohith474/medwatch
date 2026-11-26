import { getRegulations } from '@/lib/api';
import Link from 'next/link';
import { T } from '@/lib/i18n';

const MOCK_REGULATIONS = [
  {
    id: 1,
    title: 'Drugs and Cosmetics Act, 1940 — Amended 2008',
    description: 'The principal Act governing the import, manufacture, distribution and sale of drugs and cosmetics in India. Establishes quality standards and licensing requirements.',
    issuing_authority: 'Ministry of Health and Family Welfare',
    gazette_number: 'G.S.R. 294(E)',
    effective_date: '2008-04-01',
    document_url: '#',
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: 'Schedule H Drugs — Prescription-Only Regulations',
    description: 'List of drugs that can only be dispensed on the prescription of a Registered Medical Practitioner. Retail sale of Schedule H drugs without prescription is prohibited.',
    issuing_authority: 'Central Drugs Standard Control Organisation (CDSCO)',
    gazette_number: 'SO 1946(E)',
    effective_date: '2013-09-19',
    document_url: '#',
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: 'Kerala Drug Control NSQ Action Protocol 2023',
    description: 'Standard operating procedure for Kerala Drug Control inspectors upon identification of a Not of Standard Quality batch. Covers stop-sale orders, sample collection, recall procedures and reporting timelines.',
    issuing_authority: 'Kerala Drug Control Department',
    gazette_number: 'KDC/NSQ/2023/01',
    effective_date: '2023-01-15',
    document_url: '#',
    created_at: new Date().toISOString(),
  },
  {
    id: 4,
    title: 'CDSCO Alert Management and Public Disclosure Guidelines',
    description: 'Guidelines on how drug safety alerts are classified, escalated and publicly disclosed. Defines CRITICAL, STANDARD and ADVISORY categories and their respective response timelines.',
    issuing_authority: 'Central Drugs Standard Control Organisation (CDSCO)',
    gazette_number: 'CDSCO/AMG/2022/07',
    effective_date: '2022-07-01',
    document_url: '#',
    created_at: new Date().toISOString(),
  },
  {
    id: 5,
    title: 'Digital Personal Data Protection Act 2023 — Drug Data Compliance',
    description: 'Requirements for drug quality platforms under DPDP Act 2023. Covers anonymization of search data, consent requirements, data retention limits and user rights.',
    issuing_authority: 'Ministry of Electronics and Information Technology',
    gazette_number: 'No. 22 of 2023',
    effective_date: '2023-09-11',
    document_url: '#',
    created_at: new Date().toISOString(),
  },
];

export const revalidate = 300;

export default async function RegulationsPage() {
  let regs = await getRegulations().catch(() => []);
  if (!regs.length) regs = MOCK_REGULATIONS as typeof regs;

  return (
    <div className="min-h-screen bg-amber-50">

      {/* Gazette-style header */}
      <div className="bg-gradient-to-r from-[#001a40] to-[#003580] text-white py-12 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-5xl mb-3">📋</div>
          <h1 className="text-4xl font-black mb-2"><T k="reg_title" /></h1>
          <p className="text-blue-300 text-sm max-w-xl mx-auto">
            <T k="reg_sub" />
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <span className="bg-white/10 border border-white/20 text-white text-xs px-3 py-1 rounded-full">Drugs & Cosmetics Act</span>
            <span className="bg-white/10 border border-white/20 text-white text-xs px-3 py-1 rounded-full">CDSCO Guidelines</span>
            <span className="bg-white/10 border border-white/20 text-white text-xs px-3 py-1 rounded-full">Kerala DC Orders</span>
            <span className="bg-white/10 border border-white/20 text-white text-xs px-3 py-1 rounded-full">DPDP Act 2023</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* Official Gazette masthead */}
        <div className="bg-amber-100 border-4 border-double border-amber-800 rounded-2xl p-6 mb-8 text-center">
          <div className="text-amber-900 text-xs font-bold tracking-widest uppercase mb-1"><T k="reg_masthead" /></div>
          <div className="text-amber-800 text-2xl font-black"><T k="reg_official" /></div>
          <div className="text-amber-700 text-xs mt-1 font-mono">
            {regs.length} Regulation{regs.length !== 1 ? 's' : ''} Listed · Last Updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* Regulations list */}
        <div className="space-y-5">
          {regs.map((reg, i) => (
            <div
              key={reg.id}
              className="gazette-card bg-gradient-to-r from-amber-50 to-white border border-amber-300 border-l-8 border-l-amber-600 rounded-xl overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="bg-amber-100 text-amber-800 text-xs font-black px-2 py-0.5 rounded-full border border-amber-400">
                        No. {String(i + 1).padStart(2, '0')}
                      </span>
                      {reg.gazette_number && (
                        <span className="bg-blue-50 text-blue-700 text-xs font-mono px-2 py-0.5 rounded-full border border-blue-200">
                          {reg.gazette_number}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 font-mono">
                        Effective: {new Date(reg.effective_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <h2 className="text-lg font-black text-gray-800 mb-2 group-hover:text-blue-700 transition-colors">
                      {reg.title}
                    </h2>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">{reg.description}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="font-semibold">🏛️ Issuing Authority:</span>
                      <span>{reg.issuing_authority}</span>
                    </div>
                  </div>

                  {/* Download button */}
                  {reg.document_url && reg.document_url !== '#' ? (
                    <a
                      href={reg.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pill-btn flex-shrink-0 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 text-xs font-bold shadow-md"
                    >
                      📄 PDF
                    </a>
                  ) : (
                    <div className="flex-shrink-0 bg-gray-100 text-gray-400 text-xs px-4 py-2.5 rounded-full font-semibold">
                      PDF Coming
                    </div>
                  )}
                </div>
              </div>

              {/* Footer strip */}
              <div className="bg-amber-50 border-t border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-700">
                <span className="font-mono">KDC-MEDWATCH Database Entry {reg.id}</span>
                <span>Added: {new Date(reg.created_at).toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Contact section */}
        <div className="mt-12 bg-gradient-to-r from-[#001a40] to-[#003580] rounded-3xl p-8 text-white text-center">
          <div className="text-3xl mb-3">📞</div>
          <h3 className="text-xl font-black mb-2">Need Legal Assistance?</h3>
          <p className="text-blue-300 text-sm mb-4">
            For regulatory compliance queries, contact the Kerala Drug Control Department directly.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-white/10 rounded-xl px-4 py-2">📞 0471-2320551</div>
            <div className="bg-white/10 rounded-xl px-4 py-2">✉️ drugcontrol@kerala.gov.in</div>
          </div>
          <div className="mt-6">
            <Link href="/search" className="pill-btn bg-white text-blue-800 hover:bg-blue-50 px-8 py-3 font-black text-sm">
              🔍 Verify a Drug Batch
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
