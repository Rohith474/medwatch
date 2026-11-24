'use client';
import { useEffect, useState } from 'react';
import StaffLayout, { StaffRedirect } from '@/components/StaffLayout';
import { getDashboardStats, DashboardStats, useStaffSession } from '@/lib/staff-api';

function StatBox({ icon, value, label, color }: { icon: string; value: number | string; label: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <div className="text-3xl mb-2">{icon}</div>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      <div className="text-gray-500 text-sm mt-1">{label}</div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { ready, user } = useStaffSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready || !user || user.role !== 'SUPER_ADMIN') return;
    getDashboardStats().then(setStats).catch(e => setError(e.message));
  }, [ready, user]);

  if (!ready) return null;
  if (!user) return <StaffRedirect />;
  if (user.role !== 'SUPER_ADMIN') return <StaffRedirect to={getRoleRoute(user.role)} />;

  return (
    <StaffLayout user={user}>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-800">📊 Super Admin Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Welcome back, {user.name}. Full system overview.</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">{error}</div>
        )}

        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            <StatBox icon="⏳" value={stats.pending_approvals} label="Pending Approvals" color="text-orange-600" />
            <StatBox icon="🔴" value={stats.live_alerts} label="Live Drug Alerts" color="text-red-600" />
            <StatBox icon="📋" value={stats.regulations} label="Regulations" color="text-amber-600" />
            <StatBox icon="🔔" value={stats.notifications_sent} label="Notifications Sent" color="text-blue-600" />
            <StatBox icon="👥" value={stats.total_staff} label="Total Staff" color="text-purple-600" />
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-4 mb-8">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-28 shimmer-bg animate-pulse"></div>
            ))}
          </div>
        )}

        {/* Quick links */}
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { href: '/staff/approve', icon: '✅', title: 'Review Pending Records', desc: `${stats?.pending_approvals ?? '...'} records awaiting approval`, color: 'border-orange-200 hover:border-orange-400' },
            { href: '/staff/upload', icon: '📦', title: 'Add Drug Record', desc: 'Manually enter a new NSQ/spurious alert', color: 'border-blue-200 hover:border-blue-400' },
            { href: '/staff/regulations', icon: '📋', title: 'Manage Regulations', desc: 'Publish or update gazette circulars', color: 'border-amber-200 hover:border-amber-400' },
            { href: '/staff/notifications', icon: '🔔', title: 'Send Alert Notification', desc: 'Push CRITICAL/STANDARD/ADVISORY alerts', color: 'border-red-200 hover:border-red-400' },
          ].map(card => (
            <a key={card.href} href={card.href} className={`bg-white border-2 ${card.color} rounded-2xl p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-all group`}>
              <div className="text-3xl group-hover:scale-110 transition-transform">{card.icon}</div>
              <div>
                <div className="font-bold text-gray-800">{card.title}</div>
                <div className="text-gray-500 text-sm mt-0.5">{card.desc}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </StaffLayout>
  );
}

function getRoleRoute(role: string) {
  const routes: Record<string, string> = {
    APPROVER: '/staff/approve',
    UPLOADER: '/staff/upload',
    DEPT_OFFICER: '/staff/regulations',
  };
  return routes[role] || '/staff/login';
}
