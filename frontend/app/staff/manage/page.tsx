'use client';
import { useEffect, useState } from 'react';
import StaffLayout, { StaffRedirect } from '@/components/StaffLayout';
import { useStaffSession } from '@/lib/staff-api';

// Credential requirements per role — mirrors backend ROLE_CREDENTIALS
const ROLE_CREDENTIALS: Record<string, {
  label: string;
  description: string;
  required_fields: string[];
  credential_label: string;
  credential_hint: string;
}> = {
  SUPER_ADMIN: {
    label: 'Senior Gazetted Officer',
    description: 'Must be a senior gazetted officer of the Kerala Drug Control Department.',
    required_fields: ['employee_id', 'designation'],
    credential_label: 'Official Order / Appointment Reference',
    credential_hint: 'Government appointment order number or service book reference',
  },
  APPROVER: {
    label: 'Licensed Drug Inspector',
    description: 'Must hold a valid Drug Inspector licence (Drugs & Cosmetics Act 1940). Minimum qualification: B.Pharm / M.Pharm / PharmD.',
    required_fields: ['employee_id', 'designation', 'qualification', 'licence_number'],
    credential_label: 'Drug Inspector Licence No.',
    credential_hint: 'e.g. KL-DI-2023-0042 (issued by Kerala State Drug Control Authority)',
  },
  UPLOADER: {
    label: 'Pharmaceutical Data Entry Officer',
    description: 'Government employee with a recognised pharmacy qualification (minimum D.Pharm or Pharmacy Technician Certificate).',
    required_fields: ['employee_id', 'qualification'],
    credential_label: 'Training / Qualification Certificate No.',
    credential_hint: 'Certificate number of D.Pharm / B.Pharm or pharmacy training',
  },
  DEPT_OFFICER: {
    label: 'Gazette / Regulations Officer',
    description: 'Gazette officer or section officer with authority to publish official drug control notifications.',
    required_fields: ['employee_id', 'designation', 'licence_number'],
    credential_label: 'Department Posting Order No.',
    credential_hint: 'Official posting order number assigning you to Gazette/Regulations duty',
  },
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-blue-100 text-blue-700 border-blue-300',
  APPROVER: 'bg-purple-100 text-purple-700 border-purple-300',
  UPLOADER: 'bg-cyan-100 text-cyan-700 border-cyan-300',
  DEPT_OFFICER: 'bg-green-100 text-green-700 border-green-300',
};

interface StaffMember {
  id: number;
  name: string;
  mobile: string;
  role: string;
  role_display: string;
  department: string;
  designation: string;
  employee_id: string;
  qualification: string;
  drug_inspector_license: string;
  licence_number: string;
  govt_id_type: string;
  govt_id_number: string;
  is_verified: boolean;
  must_change_password: boolean;
  created_at: string;
  created_by: string;
  last_login_ip: string;
}

const API = 'http://127.0.0.1:8000/api/v1';
function authHeaders() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('staff_token')}` };
}

const EMPTY_FORM = {
  name: '', mobile: '', password: '', role: 'UPLOADER',
  department: '', designation: '', employee_id: '',
  qualification: '', licence_number: '',
  govt_id_type: 'Service Book', govt_id_number: '',
};

export default function ManageStaffPage() {
  const { ready, user } = useStaffSession();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');
  const [acting, setActing] = useState<number | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/staff/manage/`, { headers: authHeaders() });
      const data = await res.json();
      setStaff(data);
    } catch { setStaff([]); }
    setLoading(false);
  };

  useEffect(() => {
    if (!ready || !user || user.role !== 'SUPER_ADMIN') return;
    fetch(`${API}/auth/staff/manage/`, { headers: authHeaders() })
      .then(res => res.json())
      .then((data: StaffMember[]) => setStaff(data))
      .catch(() => setStaff([]))
      .finally(() => setLoading(false));
  }, [ready, user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('');
    try {
      const res = await fetch(`${API}/auth/staff/manage/`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMsg(`✅ ${data.message}`);
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      fetchStaff();
    } catch (e: unknown) {
      setMsg(`❌ ${e instanceof Error ? e.message : 'Error'}`);
    } finally { setSubmitting(false); }
  };

  const handleVerify = async (id: number, action: 'verify' | 'suspend') => {
    setActing(id);
    setMsg('');
    try {
      const res = await fetch(`${API}/auth/staff/manage/${id}/verify/`, {
        method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMsg(`✅ ${data.message}`);
      fetchStaff();
    } catch (e: unknown) {
      setMsg(`❌ ${e instanceof Error ? e.message : 'Error'}`);
    } finally { setActing(null); }
  };

  const roleCfg = ROLE_CREDENTIALS[form.role];
  const requiredFields = roleCfg?.required_fields || [];

  if (!ready) return null;
  if (!user || user.role !== 'SUPER_ADMIN') return <StaffRedirect />;

  return (
    <StaffLayout user={user}>
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-800">👥 Manage Staff Accounts</h1>
            <p className="text-gray-500 text-sm mt-1">Create and verify staff accounts. All roles require official credentials before access is granted.</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="pill-btn bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 text-sm font-bold">
            {showForm ? '✕ Cancel' : '+ Create Staff Account'}
          </button>
        </div>

        {msg && (
          <div className={`rounded-xl px-4 py-3 text-sm mb-5 font-semibold ${msg.startsWith('✅') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {msg}
          </div>
        )}

        {/* Create staff form */}
        {showForm && (
          <form onSubmit={handleCreate} className="bg-white border-2 border-blue-200 rounded-2xl p-6 mb-8 shadow-sm">
            <div className="text-sm font-black text-blue-800 uppercase tracking-widest mb-5">📋 New Staff Account</div>

            {/* Role selection — shows requirements */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Role *</label>
              <select name="role" value={form.role} onChange={handleChange} className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800 mb-3">
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="APPROVER">Data Approver</option>
                <option value="UPLOADER">Data Uploader</option>
                <option value="DEPT_OFFICER">Department Officer</option>
              </select>

              {/* Dynamic requirement box */}
              {roleCfg && (
                <div className="bg-amber-50 border border-amber-300 rounded-xl p-4">
                  <div className="text-xs font-black text-amber-800 uppercase tracking-wide mb-1">📌 {roleCfg.label} — Required Credentials</div>
                  <p className="text-amber-700 text-xs leading-relaxed mb-2">{roleCfg.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {requiredFields.map(f => (
                      <span key={f} className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                        {f === 'licence_number' ? roleCfg.credential_label : f.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Basic info */}
            <div className="grid md:grid-cols-2 gap-4 mb-5">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Full Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="Official full name" className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Mobile Number *</label>
                <input name="mobile" value={form.mobile} onChange={handleChange} required placeholder="10-digit mobile" className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Temporary Password *</label>
                <input name="password" type="password" value={form.password} onChange={handleChange} required placeholder="Min 8 characters" className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Department</label>
                <input name="department" value={form.department} onChange={handleChange} placeholder="e.g. Quality Control Division" className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800" />
              </div>
            </div>

            {/* Credentials — shown conditionally per role */}
            <div className="border-t border-gray-100 pt-5">
              <div className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">🔐 Official Credentials</div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    Govt Employee ID {requiredFields.includes('employee_id') && <span className="text-red-500">*</span>}
                  </label>
                  <input name="employee_id" value={form.employee_id} onChange={handleChange} required={requiredFields.includes('employee_id')} placeholder="e.g. KL-DC-2023-0042" className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-800" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                    Designation {requiredFields.includes('designation') && <span className="text-red-500">*</span>}
                  </label>
                  <input name="designation" value={form.designation} onChange={handleChange} required={requiredFields.includes('designation')} placeholder="e.g. Drug Inspector Grade-II" className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800" />
                </div>
                {requiredFields.includes('qualification') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Qualification <span className="text-red-500">*</span></label>
                    <input name="qualification" value={form.qualification} onChange={handleChange} required placeholder="e.g. B.Pharm, M.Pharm, D.Pharm" className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800" />
                  </div>
                )}
                {requiredFields.includes('licence_number') && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                      {roleCfg.credential_label} <span className="text-red-500">*</span>
                    </label>
                    <input name="licence_number" value={form.licence_number} onChange={handleChange} required placeholder={roleCfg.credential_hint} className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-800" />
                    <div className="text-xs text-gray-400 mt-1">{roleCfg.credential_hint}</div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Govt ID Type</label>
                  <select name="govt_id_type" value={form.govt_id_type} onChange={handleChange} className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm text-gray-800">
                    <option>Service Book No.</option>
                    <option>Aadhaar</option>
                    <option>PAN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Govt ID Number</label>
                  <input name="govt_id_number" value={form.govt_id_number} onChange={handleChange} placeholder="ID number" className="w-full border border-gray-300 focus:border-blue-500 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-800" />
                </div>
              </div>
            </div>

            <div className="mt-6 flex gap-3 items-center">
              <button type="submit" disabled={submitting} className="pill-btn bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 text-sm font-black disabled:opacity-50">
                {submitting ? 'Creating...' : '➕ Create Account (Pending Verification)'}
              </button>
              <span className="text-xs text-gray-400">Account won&apos;t be active until you verify their credentials below.</span>
            </div>
          </form>
        )}

        {/* Staff list */}
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="bg-gray-100 rounded-2xl h-20 animate-pulse"></div>)}</div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-500">{staff.length} staff member{staff.length !== 1 ? 's' : ''}</div>
            {staff.map(s => (
              <div key={s.id} className={`bg-white border-2 rounded-2xl p-5 ${s.is_verified ? 'border-green-200' : 'border-orange-200'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${ROLE_COLORS[s.role] || 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                        {s.role_display}
                      </span>
                      {s.is_verified
                        ? <span className="text-xs bg-green-100 text-green-700 border border-green-300 px-2 py-0.5 rounded-full font-bold">✅ Verified</span>
                        : <span className="text-xs bg-orange-100 text-orange-700 border border-orange-300 px-2 py-0.5 rounded-full font-bold">⏳ Pending Verification</span>
                      }
                      {s.must_change_password && <span className="text-xs bg-yellow-100 text-yellow-700 border border-yellow-300 px-2 py-0.5 rounded-full">🔑 Must change password</span>}
                    </div>

                    <div className="font-black text-gray-800 text-base">{s.name}</div>
                    <div className="text-gray-500 text-xs font-mono mt-0.5">{s.mobile}</div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-1 mt-3 text-xs text-gray-500">
                      {s.designation && <span>👤 {s.designation}</span>}
                      {s.department && <span>🏛️ {s.department}</span>}
                      {s.employee_id && <span>🪪 EMP: {s.employee_id}</span>}
                      {s.qualification && <span>🎓 {s.qualification}</span>}
                      {(s.licence_number || s.drug_inspector_license) && <span>📜 {s.licence_number || s.drug_inspector_license}</span>}
                      {s.last_login_ip && <span>🌐 Last IP: {s.last_login_ip}</span>}
                      <span>📅 Created: {s.created_at} by {s.created_by}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-shrink-0">
                    {!s.is_verified ? (
                      <button
                        onClick={() => handleVerify(s.id, 'verify')}
                        disabled={acting === s.id}
                        className="pill-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-xs font-bold disabled:opacity-50"
                      >
                        {acting === s.id ? '...' : '✅ Verify & Activate'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerify(s.id, 'suspend')}
                        disabled={acting === s.id}
                        className="pill-btn bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 px-4 py-2 text-xs font-bold disabled:opacity-50"
                      >
                        {acting === s.id ? '...' : '🚫 Suspend'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
