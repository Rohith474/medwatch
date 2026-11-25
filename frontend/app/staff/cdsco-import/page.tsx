'use client';
import { useState } from 'react';
import Link from 'next/link';
import StaffLayout, { StaffRedirect } from '@/components/StaffLayout';
import { importCDSCOPdf, CDSCOImportResult, useStaffSession } from '@/lib/staff-api';

export default function CDSCOImportPage() {
  const { ready, user } = useStaffSession();
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [source, setSource] = useState('CDSCO');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<CDSCOImportResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!file && !pdfUrl.trim()) {
      setError('Please select a PDF file or enter a CDSCO PDF URL.');
      return;
    }

    const fd = new FormData();
    fd.append('source', source);
    if (file) fd.append('file', file);
    if (pdfUrl.trim()) fd.append('pdf_url', pdfUrl.trim());

    setLoading(true);
    try {
      const res = await importCDSCOPdf(fd);
      setResult(res);
      setFile(null);
      setPdfUrl('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'PDF import failed');
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;
  if (!user || !['SUPER_ADMIN', 'UPLOADER'].includes(user.role)) return <StaffRedirect />;

  return (
    <StaffLayout user={user}>
      <div className="max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-800">📄 CDSCO / Lab PDF Ingestion</h1>
          <p className="text-gray-500 text-sm mt-1">
            Upload a monthly CDSCO NSQ PDF alert or paste a PDF URL. Tables are parsed automatically into staging for Data Approver sign-off.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 text-xs text-blue-800">
          <strong>🛡️ Two-Person Safety Rule:</strong> Imported PDF records are saved with{' '}
          <code className="bg-white px-1.5 py-0.5 rounded font-mono">is_active=False</code> (Staging). A{' '}
          <strong>Data Approver</strong> must review and approve them at{' '}
          <Link href="/staff/approve" className="underline font-bold">/staff/approve</Link> before citizens see them.
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5 shadow-sm">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
              Data Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800"
            >
              <option value="CDSCO">CDSCO Monthly NSQ List</option>
              <option value="KERALA_DC">Kerala Drug Control Dept.</option>
              <option value="STATE_LAB">State Drug Testing Lab</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
              Option 1: Upload PDF File
            </label>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full border-2 border-dashed border-gray-300 hover:border-blue-400 rounded-2xl p-4 text-sm text-gray-600 cursor-pointer"
            />
            {file && (
              <div className="text-xs text-green-700 font-semibold mt-1.5">
                📎 Selected: {file.name} ({Math.round(file.size / 1024)} KB)
              </div>
            )}
          </div>

          <div className="text-center text-xs font-bold text-gray-400 uppercase">— OR —</div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
              Option 2: Direct CDSCO PDF URL
            </label>
            <input
              type="url"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              placeholder="https://cdsco.gov.in/.../nsq_list.pdf"
              className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-800"
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
            className="pill-btn bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 text-sm font-black disabled:opacity-50"
          >
            {loading ? '⏳ Parsing PDF Tables...' : '🚀 Parse & Import to Staging'}
          </button>
        </form>

        {result && (
          <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-2xl p-6">
            <div className="font-black text-green-800 text-base mb-1">✅ {result.message}</div>
            <div className="text-xs text-green-700 mb-4">
              Imported: <strong>{result.imported_count}</strong> • Skipped duplicates: <strong>{result.skipped_count}</strong>
            </div>

            {result.records.length > 0 && (
              <div className="bg-white rounded-xl border border-green-200 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-green-100/70 text-green-900 font-bold">
                    <tr>
                      <th className="p-3">Drug</th>
                      <th className="p-3">Batch No</th>
                      <th className="p-3">Manufacturer</th>
                      <th className="p-3">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {result.records.map((r) => (
                      <tr key={r.id}>
                        <td className="p-3 font-bold text-gray-800">{r.brand_name}</td>
                        <td className="p-3 font-mono text-gray-600">{r.batch_no}</td>
                        <td className="p-3 text-gray-600">{r.manufacturer}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-bold">
                            {r.result_type}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4">
              <Link href="/staff/approve" className="text-xs font-bold text-blue-700 hover:underline">
                Go to Approval Queue (/staff/approve) →
              </Link>
            </div>
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
