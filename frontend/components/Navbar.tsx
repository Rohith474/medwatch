'use client';
import Link from 'next/link';
import { useState } from 'react';
import EnableAlertsButton from './EnableAlertsButton';
import { useLang } from '@/lib/i18n';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { lang, toggleLang, t } = useLang();

  return (
    <nav className="bg-gradient-to-r from-[#001a40] to-[#003580] text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 flex-shrink-0">
            <div className="w-10 h-5 bg-blue-400 rounded-full absolute top-0 group-hover:scale-110 transition-transform"></div>
            <div className="w-10 h-5 bg-blue-700 rounded-full absolute bottom-0 group-hover:scale-110 transition-transform"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-10 bg-white opacity-50"></div>
            </div>
          </div>
          <div>
            <div>
              <span className="text-xl font-black tracking-wider text-blue-200">MED</span>
              <span className="text-xl font-black tracking-wider text-white">WATCH</span>
            </div>
            <div className="text-[9px] text-blue-300 leading-none tracking-widest uppercase">{t('dept_name')}</div>
          </div>
        </Link>

        {/* Desktop Nav — Clean Icon Buttons with Translated Tooltips */}
        <div className="hidden lg:flex items-center gap-2.5 text-sm font-medium whitespace-nowrap">
          <Link
            href="/"
            title={t('nav_home')}
            aria-label={t('nav_home')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-lg transition-all"
          >
            🏠
          </Link>
          <Link
            href="/search"
            title={t('nav_verify')}
            aria-label={t('nav_verify')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-lg transition-all"
          >
            🔍
          </Link>
          <Link
            href="/alerts"
            title={t('nav_alerts')}
            aria-label={t('nav_alerts')}
            className="relative w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-lg transition-all"
          >
            🚨
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
          </Link>
          <Link
            href="/regulations"
            title={t('nav_regulations')}
            aria-label={t('nav_regulations')}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-lg transition-all"
          >
            📋
          </Link>
          <Link
            href="/report"
            title={t('nav_report')}
            aria-label={t('nav_report')}
            className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 border border-red-400/30 flex items-center justify-center text-lg transition-all"
          >
            📝
          </Link>
          <button
            type="button"
            onClick={toggleLang}
            className="px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 text-xs font-bold text-cyan-200 transition-all cursor-pointer flex-shrink-0"
            title="Switch English / Malayalam"
          >
            🌐 {lang === 'en' ? 'ML' : 'EN'}
          </button>
          <EnableAlertsButton compact />
          <Link
            href="/search"
            title={t('nav_check_med')}
            className="pill-btn bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white px-4 py-2 text-xs font-bold shadow-lg shadow-blue-500/30 transition-all flex-shrink-0"
          >
            💊 {lang === 'en' ? 'Verify' : 'പരിശോധിക്കുക'}
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-blue-800/50 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className="space-y-1.5">
            <div className={`w-6 h-0.5 bg-white transition-all ${menuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
            <div className={`w-6 h-0.5 bg-white transition-all ${menuOpen ? 'opacity-0' : ''}`}></div>
            <div className={`w-6 h-0.5 bg-white transition-all ${menuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
          </div>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-blue-800/60 py-4 px-4 flex flex-col gap-3 text-sm bg-[#001a40]/95 backdrop-blur-md">
          <Link href="/" className="hover:text-blue-300 py-1 flex items-center gap-2" onClick={() => setMenuOpen(false)}>🏠 {t('nav_home')}</Link>
          <Link href="/search" className="hover:text-blue-300 py-1 flex items-center gap-2" onClick={() => setMenuOpen(false)}>🔍 {t('nav_verify')}</Link>
          <Link href="/alerts" className="hover:text-blue-300 py-1 flex items-center gap-2" onClick={() => setMenuOpen(false)}>🚨 {t('nav_alerts')}</Link>
          <Link href="/regulations" className="hover:text-blue-300 py-1 flex items-center gap-2" onClick={() => setMenuOpen(false)}>📋 {t('nav_regulations')}</Link>
          <Link href="/report" className="hover:text-red-300 text-red-200 py-1 flex items-center gap-2" onClick={() => setMenuOpen(false)}>🚨 {t('nav_report_full')}</Link>
          <button
            type="button"
            onClick={() => { toggleLang(); setMenuOpen(false); }}
            className="text-left py-1.5 px-3 rounded-xl bg-white/10 text-cyan-200 text-xs font-bold w-fit"
          >
            🌐 {lang === 'en' ? 'Switch to മലയാളം' : 'Switch to English'}
          </button>
          <Link
            href="/search"
            className="pill-btn bg-blue-600 text-white px-4 py-2 text-sm font-bold mt-2 w-full justify-center"
            onClick={() => setMenuOpen(false)}
          >
            🔍 Check Medicine
          </Link>
        </div>
      )}
    </nav>
  );
}
