'use client';
import { useState } from 'react';
import StaffLayout, { StaffRedirect } from '@/components/StaffLayout';
import { addDrugRecord, useStaffSession } from '@/lib/staff-api';

const RESULT_TYPES = ['NSQ', 'SPURIOUS', 'ADULTERATED', 'MISBRANDED'];

export default function UploadPage() {
  const { ready, user } = useStaffSession();
  const [form, setForm] = useState({
    brand_name: '', generic_name: '', dosage_form: '',
    manufacturer_name: '', license_number: '', state: 'Kerala',
    batch_no: '', result_type: 'NSQ', lab_name: '',
    test_date: '', action_taken: '',
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
      const res = await addDrugRecord(form);
      setMsg(`✅ ${res.message} (Record ID: ${res.result_id})`);
      setForm({
        brand_name: '', generic_name: '', dosage_form: '',
        manufacturer_name: '', license_number: '', state: 'Kerala',
        batch_no: '', result_type: 'NSQ', lab_name: '',
        test_date: '', action_taken: '',
      });
    } catch (e: unknown) {
      setMsg(`❌ ${e instanceof Error ? e.message : 'Error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!ready) return null;
  if (!user || !['SUPER_ADMIN', 'UPLOADER'].includes(user.role)) return <StaffRedirect />;

  const field = (label: string, name: string, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type} name={name} value={form[name as keyof typeof form]}
        onChange={handleChange} placeholder={placeholder} required={['brand_name','batch_no','result_type','test_date'].includes(name)}
        className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 transition-all"
      />
    </div>
  );

  return (
    <StaffLayout user={user}>
      <div className="max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-800">📦 Add Drug Record</h1>
          <p className="text-gray-500 text-sm mt-1">Submit a new NSQ/spurious/adulterated drug record. It will go to the Approver for review before going live.</p>
        </div>

        {msg && (
          <div className={`rounded-xl px-4 py-3 text-sm mb-5 font-semibold ${msg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">

          {/* Drug info */}
          <div>
            <div className="text-xs font-black text-blue-700 uppercase tracking-widest mb-3 pb-2 border-b border-gray-100">💊 Drug Information</div>
            <div className="grid md:grid-cols-2 gap-4">
              {field('Brand Name *', 'brand_name', 'text', 'e.g. Paracip 500mg')}
              {field('Generic Name', 'generic_name', 'text', 'e.g. Paracetamol')}
              {field('Dosage Form', 'dosage_form', 'text', 'e.g. Tablet, Syrup, Injection')}
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Batch Number *</label>
                <input
                  type="text" name="batch_no" value={form.batch_no} onChange={handleChange} required
                  placeholder="e.g. CIP2024001"
                  className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-800 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Result */}
          <div>
            <div className="text-xs font-black text-red-700 uppercase tracking-widest mb-3 pb-2 border-b border-gray-100">🔴 Test Result</div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Result Type *</label>
                <select
                  name="result_type" value={form.result_type} onChange={handleChange}
                  className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800"
                >
                  {RESULT_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {field('Test Date *', 'test_date', 'date')}
              {field('Lab Name', 'lab_name', 'text', 'e.g. Regional Drug Testing Lab')}
            </div>
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Action Taken</label>
              <textarea
                name="action_taken" value={form.action_taken} onChange={handleChange}
                placeholder="e.g. Stop sale order issued, Product recall initiated..."
                rows={2}
                className="w-full border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 transition-all resize-none"
              />
            </div>
          </div>

          {/* Manufacturer */}
          <div>
            <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 pb-2 border-b border-gray-100">🏭 Manufacturer</div>
            <div className="grid md:grid-cols-3 gap-4">
              {field('Manufacturer Name', 'manufacturer_name', 'text', 'e.g. Cipla Ltd')}
              {field('License Number', 'license_number', 'text', 'e.g. KL-MFG-001')}
              {field('State', 'state', 'text', 'e.g. Kerala')}
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full pill-btn bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white py-3.5 font-black text-sm shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Submitting...
              </span>
            ) : '📤 Submit for Approval'}
          </button>

          <div className="text-xs text-gray-400 text-center">
            ⚠️ Record will NOT go live until approved by the Data Approver
          </div>
        </form>
      </div>
    </StaffLayout>
  );
}
