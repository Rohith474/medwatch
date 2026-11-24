'use client';
import Link from 'next/link';
import { useState } from 'react';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

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
            <div className="text-[9px] text-blue-300 leading-none tracking-widest uppercase">Kerala Drug Control Dept.</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-blue-300 transition-colors">Home</Link>
          <Link href="/search" className="hover:text-blue-300 transition-colors">Verify Drug</Link>
          <Link href="/alerts" className="hover:text-blue-300 transition-colors flex items-center gap-2">
            <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
            Live Alerts
          </Link>
          <Link href="/regulations" className="hover:text-blue-300 transition-colors">Regulations</Link>
          <Link
            href="/search"
            className="pill-btn bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white px-5 py-2 text-sm font-bold shadow-lg shadow-blue-500/30 transition-all"
          >
            🔍 Check Medicine
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-blue-800/50 transition-colors"
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
          <Link href="/" className="hover:text-blue-300 py-1 flex items-center gap-2" onClick={() => setMenuOpen(false)}>🏠 Home</Link>
          <Link href="/search" className="hover:text-blue-300 py-1 flex items-center gap-2" onClick={() => setMenuOpen(false)}>🔍 Verify Drug</Link>
          <Link href="/alerts" className="hover:text-blue-300 py-1 flex items-center gap-2" onClick={() => setMenuOpen(false)}>🚨 Live Alerts</Link>
          <Link href="/regulations" className="hover:text-blue-300 py-1 flex items-center gap-2" onClick={() => setMenuOpen(false)}>📋 Regulations</Link>
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
