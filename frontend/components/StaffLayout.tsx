'use client';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { clearSession, StaffUser } from '@/lib/staff-api';

export function StaffRedirect({ to = '/staff/login' }: { to?: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to);
  }, [router, to]);
  return null;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: '🔵 Super Admin',
  APPROVER: '🟣 Data Approver',
  UPLOADER: '🔵 Data Uploader',
  DEPT_OFFICER: '🟢 Dept Officer',
};

const ROLE_NAV: Record<string, { label: string; href: string }[]> = {
  SUPER_ADMIN: [
    { label: '📊 Dashboard', href: '/staff/dashboard' },
    { label: '👥 Manage Staff', href: '/staff/manage' },
    { label: '✅ Approve Records', href: '/staff/approve' },
    { label: '📦 Add Drug Record', href: '/staff/upload' },
    { label: '📋 Regulations', href: '/staff/regulations' },
    { label: '🔔 Send Notifications', href: '/staff/notifications' },
  ],
  APPROVER: [
    { label: '✅ Pending Approvals', href: '/staff/approve' },
  ],
  UPLOADER: [
    { label: '📦 Add Drug Record', href: '/staff/upload' },
  ],
  DEPT_OFFICER: [
    { label: '📋 Manage Regulations', href: '/staff/regulations' },
  ],
};

export default function StaffLayout({ children, user }: { children: React.ReactNode; user: StaffUser }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    clearSession();
    router.push('/staff/login');
  };

  const nav = ROLE_NAV[user.role] || [];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-[#001a40] to-[#002a60] text-white flex flex-col flex-shrink-0">
        {/* Logo */}
        <div className="p-5 border-b border-blue-800">
          <Link href="/" className="flex items-center gap-2 mb-3">
            <div className="relative w-8 h-8 flex-shrink-0">
              <div className="w-8 h-4 bg-blue-400 rounded-full absolute top-0"></div>
              <div className="w-8 h-4 bg-blue-700 rounded-full absolute bottom-0"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-0.5 h-8 bg-white opacity-50"></div>
              </div>
            </div>
            <div>
              <span className="text-sm font-black text-blue-200">MED</span>
              <span className="text-sm font-black">WATCH</span>
              <div className="text-[8px] text-blue-400 leading-none tracking-widest uppercase">Staff Portal</div>
            </div>
          </Link>

          {/* User badge */}
          <div className="bg-white/10 rounded-xl p-3">
            <div className="text-xs font-black text-white">{user.name}</div>
            <div className="text-[10px] text-blue-300 mt-0.5">{ROLE_LABELS[user.role]}</div>
            <div className="text-[9px] text-blue-400 mt-0.5">{user.department}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pathname === item.href
                  ? 'bg-blue-500/30 text-white border border-blue-400/30'
                  : 'text-blue-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}

          <div className="pt-4 border-t border-blue-800 mt-4">
            <Link href="/" className="flex items-center gap-2 px-4 py-2.5 text-blue-300 hover:text-white text-sm transition-colors">
              🌐 Public Website
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-red-400 hover:text-red-300 text-sm transition-colors"
            >
              🚪 Logout
            </button>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-blue-900 text-[9px] text-blue-500 text-center">
          Kerala Drug Control Dept.<br />Staff Portal v2.0
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            <span className="font-semibold text-gray-800">MEDWATCH</span> Staff Portal
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-full font-semibold">
              <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></span>
              {ROLE_LABELS[user.role]}
            </span>
            <span className="text-xs text-gray-400">{user.mobile}</span>
          </div>
        </div>

        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
