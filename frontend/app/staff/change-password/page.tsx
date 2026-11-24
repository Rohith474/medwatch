'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword, getSession, clearSession } from '@/lib/staff-api';

export default function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!getSession()) router.replace('/staff/login');
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await changePassword(newPassword);
      setDone(true);
      // Clear session so user must log in with new password
      setTimeout(() => {
        clearSession();
        router.push('/staff/login');
      }, 2500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001a40] via-[#002a60] to-[#001a40] flex items-center justify-center px-4">
      {/* Grid */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="relative w-12 h-12">
              <div className="w-12 h-6 bg-blue-400 rounded-full absolute top-0" />
              <div className="w-12 h-6 bg-blue-700 rounded-full absolute bottom-0" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0.5 h-12 bg-white opacity-50" />
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
          <div className="text-yellow-400 text-sm font-semibold">⚠️ Security Requirement — Set New Password</div>
          <div className="text-blue-300 text-xs mt-1">Your account requires a new password before you can proceed.</div>
        </div>

        <div className="bg-gray-900/80 backdrop-blur-md border border-yellow-500/30 rounded-3xl overflow-hidden shadow-2xl">
          {/* Terminal header */}
          <div className="bg-black/40 px-6 py-3 flex items-center gap-2 border-b border-yellow-900/30">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="ml-2 text-yellow-400 text-xs font-mono">passwd-reset.exe — Kerala DC</span>
          </div>

          <div className="p-8">
            {done ? (
              <div className="text-center space-y-4">
                <div className="text-5xl">✅</div>
                <div className="text-green-400 font-bold text-lg">Password Changed Successfully</div>
                <div className="text-blue-300 text-sm">Redirecting to login page…</div>
              </div>
            ) : (
              <>
                <div className="mb-6 bg-black/30 border border-yellow-800/30 rounded-xl p-3 font-mono text-xs space-y-1">
                  <div className="text-yellow-400">{'>'} First-login security protocol activated</div>
                  <div className="text-blue-300">{'>'} Choose a strong password (min. 8 characters)</div>
                  <div className="text-green-400">{'>'} You will be logged out after changing</div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-blue-300 tracking-widest uppercase mb-1.5">🔒 New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full bg-white/10 border border-white/20 focus:border-yellow-400 rounded-2xl px-4 py-3 text-white placeholder-blue-400/50 text-sm transition-all focus:ring-2 focus:ring-yellow-400/20"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-blue-300 tracking-widest uppercase mb-1.5">🔒 Confirm Password</label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Confirm new password"
                      className="w-full bg-white/10 border border-white/20 focus:border-yellow-400 rounded-2xl px-4 py-3 text-white placeholder-blue-400/50 text-sm transition-all focus:ring-2 focus:ring-yellow-400/20"
                      required
                    />
                  </div>

                  {/* Password strength hints */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: '8+ characters', ok: newPassword.length >= 8 },
                      { label: 'Uppercase letter', ok: /[A-Z]/.test(newPassword) },
                      { label: 'Number', ok: /\d/.test(newPassword) },
                      { label: 'Passwords match', ok: newPassword.length > 0 && newPassword === confirm },
                    ].map(({ label, ok }) => (
                      <div key={label} className={`text-xs px-2 py-1 rounded-lg font-mono flex items-center gap-1 ${ok ? 'bg-green-900/40 text-green-400' : 'bg-gray-800/40 text-gray-500'}`}>
                        {ok ? '✓' : '○'} {label}
                      </div>
                    ))}
                  </div>

                  {error && (
                    <div className="bg-red-900/40 border border-red-700 text-red-300 rounded-xl px-4 py-3 text-sm font-mono">
                      ⚠️ {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full pill-btn bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-white py-3.5 font-black text-sm shadow-lg shadow-yellow-500/20 disabled:opacity-50 mt-2"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2 font-mono text-sm">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating…
                      </span>
                    ) : '🔑 Set New Password'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
