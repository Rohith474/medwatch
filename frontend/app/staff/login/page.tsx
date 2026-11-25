'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { staffLogin, saveSession } from '@/lib/staff-api';

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: '#1e40af',
  APPROVER: '#7c3aed',
  UPLOADER: '#0891b2',
  DEPT_OFFICER: '#059669',
};
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  APPROVER: 'Data Approver',
  UPLOADER: 'Data Uploader',
  DEPT_OFFICER: 'Department Officer',
};
const ROLE_DEMO: Record<string, { mobile: string; password: string }> = {
  SUPER_ADMIN: { mobile: '9000000001', password: 'SuperAdmin@2024' },
  APPROVER: { mobile: '9000000002', password: 'Approver@2024' },
  UPLOADER: { mobile: '9000000003', password: 'Uploader@2024' },
  DEPT_OFFICER: { mobile: '9000000004', password: 'DeptOfficer@2024' },
};
const ROLE_REDIRECT: Record<string, string> = {
  SUPER_ADMIN: '/staff/dashboard',
  APPROVER: '/staff/approve',
  UPLOADER: '/staff/upload',
  DEPT_OFFICER: '/staff/regulations',
};

export default function StaffLoginPage() {
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSelectRole = (role: string) => {
    setSelectedRole(role);
    setError('');
    const demo = ROLE_DEMO[role];
    if (demo) {
      setMobile(demo.mobile);
      setPassword(demo.password);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await staffLogin(mobile, password);
      saveSession(res.access, res.user);
      // If this is first login — force password change before anything else
      if (res.must_change_password) {
        router.push('/staff/change-password');
        return;
      }
      router.push(ROLE_REDIRECT[res.user.role] || '/staff/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a40] via-[#002a60] to-[#001a40] flex items-center justify-center px-4">
      {/* Grid pattern */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }}
      ></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative w-12 h-12">
              <div className="w-12 h-6 bg-blue-400 rounded-full absolute top-0"></div>
              <div className="w-12 h-6 bg-blue-700 rounded-full absolute bottom-0"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0.5 h-12 bg-white opacity-50"></div>
              </div>
            </div>
            <div className="text-left">
              <div>
                <span className="text-2xl font-black text-blue-200">MED</span>
                <span className="text-2xl font-black text-white">WATCH</span>
              </div>
              <div className="text-[10px] text-blue-400 tracking-widest uppercase">Kerala Drug Control Dept.</div>
            </div>
          </div>
          <div className="text-blue-300 text-sm">Staff Portal — Restricted Access</div>
        </div>

        {/* Login card */}
        <div className="bg-gray-900/80 backdrop-blur-md border border-cyan-500/20 rounded-3xl overflow-hidden shadow-2xl">
          {/* Terminal header */}
          <div className="bg-black/40 px-6 py-3 flex items-center gap-2 border-b border-cyan-900/30">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="ml-2 text-cyan-400 text-xs font-mono">staff-login.exe — Kerala DC</span>
          </div>

          <div className="p-8">
            <div className="mb-6 bg-black/30 border border-cyan-800/30 rounded-xl p-3 font-mono text-xs space-y-1">
              <div className="text-green-400">{'>'} Secure staff authentication portal</div>
              <div className="text-blue-300">{'>'} Authorized personnel only</div>
              <div className="text-yellow-400">{'>'} All access is logged and audited</div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-blue-300 tracking-widest uppercase mb-1.5">📱 Mobile Number</label>
                <input
                  type="tel"
                  value={mobile}
                  onChange={e => setMobile(e.target.value)}
                  placeholder="e.g. 9000000001"
                  className="w-full bg-white/10 border border-white/20 focus:border-cyan-400 rounded-2xl px-4 py-3 text-white font-mono placeholder-blue-400/50 text-sm transition-all focus:ring-2 focus:ring-cyan-400/20"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-blue-300 tracking-widest uppercase mb-1.5">🔒 Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-white/10 border border-white/20 focus:border-cyan-400 rounded-2xl px-4 py-3 text-white placeholder-blue-400/50 text-sm transition-all focus:ring-2 focus:ring-cyan-400/20"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm font-mono">
                  ⚠️ {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full pill-btn bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white py-3.5 font-black text-sm shadow-lg shadow-cyan-500/20 disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2 font-mono text-sm">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    Authenticating...
                  </span>
                ) : '🔐 Login to Staff Portal'}
              </button>
            </form>

            {/* Interactive Role Selector */}
            <div className="mt-6 pt-5 border-t border-white/10">
              <div className="text-xs text-blue-400 mb-3 font-semibold text-center tracking-wide">
                SELECT ROLE (QUICK FILL DEMO)
              </div>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(ROLE_LABELS).map(([role, label]) => {
                  const isSelected = selectedRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleSelectRole(role)}
                      className={`text-center rounded-xl px-2 py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                        isSelected ? 'ring-2 ring-white scale-[1.02] shadow-md' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{
                        background: isSelected ? ROLE_COLORS[role] + '45' : ROLE_COLORS[role] + '20',
                        border: `1px solid ${isSelected ? ROLE_COLORS[role] : ROLE_COLORS[role] + '40'}`,
                        color: isSelected ? '#ffffff' : ROLE_COLORS[role],
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Link to Registration */}
            <div className="mt-5 pt-4 border-t border-white/10 text-center">
              <p className="text-xs text-blue-300 mb-2">New department official or inspector?</p>
              <Link
                href="/staff/register"
                className="inline-block w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-cyan-400/30 text-cyan-300 text-xs font-bold transition-all"
              >
                📝 Apply for Staff Access / Register Here →
              </Link>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-blue-500 text-xs">
          🔒 Unauthorized access attempts are logged and prosecuted under IT Act 2000
        </div>
      </div>
    </div>
  );
}
