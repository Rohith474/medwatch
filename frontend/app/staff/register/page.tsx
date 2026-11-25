'use client';
import { useState } from 'react';
import Link from 'next/link';
import { registerStaff } from '@/lib/staff-api';

type StaffRole = 'SUPER_ADMIN' | 'APPROVER' | 'UPLOADER' | 'DEPT_OFFICER';

const ROLE_CONFIG: Record<StaffRole, {
  title: string;
  subtitle: string;
  color: string;
  badge: string;
  regulation: string;
  requiredFields: string[];
  credentialLabel: string;
  credentialPlaceholder: string;
  credentialHint: string;
}> = {
  SUPER_ADMIN: {
    title: 'Super Admin',
    subtitle: 'Full System Control',
    color: '#2563eb',
    badge: '👑',
    regulation: 'Must be a Senior Gazetted Officer of the Kerala Drug Control Department. Grants full control to manage drugs, staff, approvals, regulations, and notifications. Requires Department Authorization Code.',
    requiredFields: ['employee_id', 'designation'],
    credentialLabel: 'Appointment Order Reference',
    credentialPlaceholder: 'e.g. GO-KL-DC-2024-01',
    credentialHint: 'Government appointment order or service book reference',
  },
  APPROVER: {
    title: 'Data Approver',
    subtitle: 'Licensed Drug Inspector',
    color: '#7c3aed',
    badge: '🔍',
    regulation: 'Must hold a valid Drug Inspector licence issued under the Drugs & Cosmetics Act 1940 by CDSCO or State Drug Control Authority. Minimum qualification: B.Pharm / M.Pharm / PharmD.',
    requiredFields: ['employee_id', 'designation', 'qualification', 'licence_number'],
    credentialLabel: 'Drug Inspector Licence No.',
    credentialPlaceholder: 'e.g. KL-DI-2024-0042',
    credentialHint: 'Issued by Kerala State Drug Control Authority / CDSCO',
  },
  UPLOADER: {
    title: 'Data Uploader',
    subtitle: 'Pharmaceutical Data Entry Officer',
    color: '#0891b2',
    badge: '📤',
    regulation: 'Must be a government employee with a recognised pharmacy qualification (minimum D.Pharm or Pharmacy Technician Certificate).',
    requiredFields: ['employee_id', 'qualification'],
    credentialLabel: 'Training / Qualification Certificate No. (Optional)',
    credentialPlaceholder: 'e.g. DPHARM-KL-2023-118',
    credentialHint: 'Certificate number of your D.Pharm / B.Pharm or pharmacy training',
  },
  DEPT_OFFICER: {
    title: 'Department Officer',
    subtitle: 'Gazette / Regulations Officer',
    color: '#059669',
    badge: '📜',
    regulation: 'Must be a gazette officer or section officer of the Kerala Drug Control Dept. with authority to publish official notifications and circulars.',
    requiredFields: ['employee_id', 'designation', 'licence_number'],
    credentialLabel: 'Department Posting Order No.',
    credentialPlaceholder: 'e.g. KL-POST-ORD-2024-004',
    credentialHint: 'Official posting order assigning you to Gazette/Regulations duty',
  },
};

export default function StaffRegisterPage() {
  const [selectedRole, setSelectedRole] = useState<StaffRole>('APPROVER');
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    department: 'Kerala Drug Control Dept.',
    employee_id: '',
    designation: '',
    qualification: '',
    licence_number: '',
    govt_id_type: 'GOVT_EMP_ID',
    govt_id_number: '',
    admin_auth_code: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [autoVerified, setAutoVerified] = useState(false);

  const cfg = ROLE_CONFIG[selectedRole];
  const isReq = (field: string) => cfg.requiredFields.includes(field);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = await registerStaff({
        name: form.name,
        mobile: form.mobile,
        password: form.password,
        role: selectedRole,
        department: form.department,
        employee_id: form.employee_id,
        designation: form.designation,
        qualification: form.qualification,
        licence_number: form.licence_number,
        govt_id_type: form.govt_id_type,
        govt_id_number: form.govt_id_number,
        admin_auth_code: form.admin_auth_code,
      });
      setAutoVerified(Boolean((res as { auto_verified?: boolean }).auto_verified));
      setSuccessMsg(res.message);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a40] via-[#002a60] to-[#001a40] py-10 px-4">
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="relative w-10 h-10">
              <div className="w-10 h-5 bg-blue-400 rounded-full absolute top-0" />
              <div className="w-10 h-5 bg-blue-700 rounded-full absolute bottom-0" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0.5 h-10 bg-white opacity-50" />
              </div>
            </div>
            <div className="text-left">
              <div>
                <span className="text-xl font-black text-blue-200">MED</span>
                <span className="text-xl font-black text-white">WATCH</span>
              </div>
              <div className="text-[10px] text-blue-400 tracking-widest uppercase">Kerala Drug Control Dept.</div>
            </div>
          </div>
          <h1 className="text-2xl font-black text-white">Official Staff Registration</h1>
          <p className="text-blue-300 text-sm mt-1">
            Apply for portal access by submitting your government credentials &amp; certificates
          </p>
        </div>

        <div className="bg-gray-900/85 backdrop-blur-md border border-cyan-500/20 rounded-3xl overflow-hidden shadow-2xl">
          {/* Terminal Bar */}
          <div className="bg-black/40 px-6 py-3 flex items-center justify-between border-b border-cyan-900/30">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-2 text-cyan-400 text-xs font-mono">staff-register.exe — Credential Verification</span>
            </div>
            <Link href="/staff/login" className="text-xs text-blue-300 hover:text-cyan-300 font-semibold">
              ← Back to Login
            </Link>
          </div>

          <div className="p-6 md:p-8">
            {successMsg ? (
              <div className="text-center py-8 space-y-4">
                <div className="text-5xl">{autoVerified ? '👑' : '📋'}</div>
                <h2 className="text-xl font-black text-green-400">
                  {autoVerified ? 'Super Admin Account Activated!' : 'Application Submitted!'}
                </h2>
                <p className="text-blue-200 text-sm max-w-md mx-auto leading-relaxed">{successMsg}</p>
                {autoVerified ? (
                  <div className="bg-green-900/30 border border-green-700/50 rounded-2xl p-4 text-xs text-green-300 max-w-md mx-auto font-mono">
                    ✅ Status: VERIFIED &amp; ACTIVE (FULL CONTROL)<br />
                    You can log in right now to access the Admin Dashboard.
                  </div>
                ) : (
                  <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-2xl p-4 text-xs text-yellow-300 max-w-md mx-auto font-mono">
                    ⏳ Status: PENDING SUPER ADMIN VERIFICATION<br />
                    You will be able to log in once your licence &amp; certificates are verified.
                  </div>
                )}
                <div className="pt-4">
                  <Link
                    href="/staff/login"
                    className="inline-block pill-btn bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-8 py-3 font-bold text-sm"
                  >
                    🔐 Go to Staff Login
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Step 1: Interactive Role Boxes */}
                <div>
                  <label className="block text-xs font-bold text-blue-300 tracking-widest uppercase mb-2.5">
                    1. Select Your Official Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {(Object.keys(ROLE_CONFIG) as StaffRole[]).map((role) => {
                      const r = ROLE_CONFIG[role];
                      const active = selectedRole === role;
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => setSelectedRole(role)}
                          className={`text-left rounded-2xl p-3.5 transition-all cursor-pointer border-2 ${
                            active ? 'scale-[1.02] shadow-lg' : 'opacity-70 hover:opacity-100'
                          }`}
                          style={{
                            background: active ? `${r.color}30` : `${r.color}12`,
                            borderColor: active ? r.color : `${r.color}40`,
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-lg">{r.badge}</span>
                            {active && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
                                SELECTED
                              </span>
                            )}
                          </div>
                          <div className="font-bold text-sm text-white">{r.title}</div>
                          <div className="text-[11px] text-blue-300">{r.subtitle}</div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Regulation Box for Selected Role */}
                  <div className="mt-3 bg-black/30 border border-cyan-800/40 rounded-xl p-3.5 text-xs text-blue-200 leading-relaxed">
                    <span className="text-cyan-400 font-bold uppercase tracking-wider">⚖️ Eligibility &amp; Regulations ({cfg.title}): </span>
                    {cfg.regulation}
                  </div>
                </div>

                {/* Step 2: Account Details */}
                <div>
                  <label className="block text-xs font-bold text-blue-300 tracking-widest uppercase mb-2.5">
                    2. Personal &amp; Login Details
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] text-blue-300 mb-1">Full Name *</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={e => setForm({ ...form, name: e.target.value })}
                        placeholder="Dr. Ananya Nair"
                        className="w-full bg-white/10 border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-blue-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-300 mb-1">Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        value={form.mobile}
                        onChange={e => setForm({ ...form, mobile: e.target.value })}
                        placeholder="10-digit mobile"
                        className="w-full bg-white/10 border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm placeholder-blue-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-300 mb-1">Password (min 8 chars) *</label>
                      <input
                        type="password"
                        required
                        value={form.password}
                        onChange={e => setForm({ ...form, password: e.target.value })}
                        placeholder="Create password"
                        className="w-full bg-white/10 border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-blue-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-300 mb-1">Confirm Password *</label>
                      <input
                        type="password"
                        required
                        value={form.confirmPassword}
                        onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                        placeholder="Re-enter password"
                        className="w-full bg-white/10 border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-blue-400/50"
                      />
                    </div>
                  </div>
                </div>

                {/* Step 3: Official Credentials & Certificates */}
                <div>
                  <label className="block text-xs font-bold text-blue-300 tracking-widest uppercase mb-2.5">
                    3. Official Certificates &amp; Credentials
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] text-blue-300 mb-1">
                        Employee ID {isReq('employee_id') && '*'}
                      </label>
                      <input
                        type="text"
                        required={isReq('employee_id')}
                        value={form.employee_id}
                        onChange={e => setForm({ ...form, employee_id: e.target.value })}
                        placeholder="e.g. KL-DC-2024-105"
                        className="w-full bg-white/10 border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm placeholder-blue-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-300 mb-1">
                        Designation {isReq('designation') ? '*' : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        required={isReq('designation')}
                        value={form.designation}
                        onChange={e => setForm({ ...form, designation: e.target.value })}
                        placeholder="e.g. Drug Inspector / Lab Officer"
                        className="w-full bg-white/10 border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-blue-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-300 mb-1">
                        Qualification {isReq('qualification') ? '*' : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        required={isReq('qualification')}
                        value={form.qualification}
                        onChange={e => setForm({ ...form, qualification: e.target.value })}
                        placeholder="e.g. B.Pharm / M.Pharm / D.Pharm"
                        className="w-full bg-white/10 border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white text-sm placeholder-blue-400/50"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-300 mb-1">
                        {cfg.credentialLabel} {isReq('licence_number') && '*'}
                      </label>
                      <input
                        type="text"
                        required={isReq('licence_number')}
                        value={form.licence_number}
                        onChange={e => setForm({ ...form, licence_number: e.target.value })}
                        placeholder={cfg.credentialPlaceholder}
                        className="w-full bg-white/10 border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm placeholder-blue-400/50"
                      />
                      <span className="text-[10px] text-blue-400">{cfg.credentialHint}</span>
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-300 mb-1">Govt ID Type</label>
                      <select
                        value={form.govt_id_type}
                        onChange={e => setForm({ ...form, govt_id_type: e.target.value })}
                        className="w-full bg-gray-800 border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white text-sm"
                      >
                        <option value="GOVT_EMP_ID">Govt Employee ID Card</option>
                        <option value="AADHAAR">Aadhaar Card</option>
                        <option value="PAN">PAN Card</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-blue-300 mb-1">Govt ID Number</label>
                      <input
                        type="text"
                        value={form.govt_id_number}
                        onChange={e => setForm({ ...form, govt_id_number: e.target.value })}
                        placeholder="ID number for verification"
                        className="w-full bg-white/10 border border-white/20 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm placeholder-blue-400/50"
                      />
                    </div>
                  </div>

                  {selectedRole === 'SUPER_ADMIN' && (
                    <div className="mt-4 bg-blue-950/60 border border-blue-500/40 rounded-2xl p-4">
                      <label className="block text-xs font-bold text-cyan-300 uppercase tracking-wider mb-1">
                        🔐 Department Master Authorization Code *
                      </label>
                      <input
                        type="password"
                        required
                        value={form.admin_auth_code}
                        onChange={e => setForm({ ...form, admin_auth_code: e.target.value })}
                        placeholder="Enter Department Authorization Code"
                        className="w-full bg-black/40 border border-blue-400/40 focus:border-cyan-400 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm placeholder-blue-400/50"
                      />
                      <span className="text-[11px] text-blue-300 mt-1 block">
                        Required for Full Control Super Admin registration (Dev code: <code className="text-cyan-300">KDC-ADMIN-2024</code>)
                      </span>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm font-mono">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full pill-btn bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-3.5 font-black text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                >
                  {loading ? 'Submitting Application...' : `📝 Submit ${cfg.title} Application`}
                </button>

                <div className="text-center text-xs text-blue-300">
                  Already verified?{' '}
                  <Link href="/staff/login" className="text-cyan-400 hover:underline font-bold">
                    Login to Staff Portal →
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
