import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import AlertTicker from "@/components/AlertTicker";
import { LanguageProvider } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MEDWATCH — Kerala Drug Control | Drug Quality Verification",
  description: "Official drug quality verification platform by Kerala Drug Control Department. Check if your medicine batch is NSQ, Spurious, or Adulterated.",
  keywords: "drug verification, NSQ, spurious drug, Kerala Drug Control, CDSCO, medicine safety",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-gray-50 flex flex-col">
        <LanguageProvider>
          <Navbar />
          <AlertTicker />
          <main className="flex-1">{children}</main>

        {/* Footer */}
        <footer className="bg-gradient-to-r from-[#001a40] to-[#002a60] text-white mt-auto">
          <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative w-10 h-10 flex-shrink-0">
                  <div className="w-10 h-5 bg-blue-400 rounded-full absolute top-0"></div>
                  <div className="w-10 h-5 bg-blue-600 rounded-full absolute bottom-0"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-0.5 h-10 bg-white opacity-50"></div>
                  </div>
                </div>
                <div>
                  <span className="text-xl font-black text-blue-200">MED</span>
                  <span className="text-xl font-black text-white">WATCH</span>
                  <div className="text-[9px] text-blue-300 leading-none tracking-widest uppercase">Kerala Drug Control</div>
                </div>
              </div>
              <p className="text-blue-300 text-sm leading-relaxed max-w-md">
                Official drug quality verification system of the Kerala Drug Control Department.
                Verify any medicine batch before consumption — protecting 2.1 million+ citizens.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="bg-blue-900/50 border border-blue-700 text-blue-300 text-xs px-3 py-1 rounded-full">CDSCO Connected</span>
                <span className="bg-blue-900/50 border border-blue-700 text-blue-300 text-xs px-3 py-1 rounded-full">DPDP Act 2023 Compliant</span>
                <span className="bg-blue-900/50 border border-blue-700 text-blue-300 text-xs px-3 py-1 rounded-full">ISO 27001</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <div className="text-blue-300 text-xs font-bold tracking-widest uppercase mb-4">Quick Links</div>
              <ul className="space-y-2 text-sm text-blue-200">
                {[
                  { label: "🔍 Verify Medicine", href: "/search" },
                  { label: "🚨 Active Recalls", href: "/alerts" },
                  { label: "📋 Regulations", href: "/regulations" },
                  { label: "📊 Drug Database", href: "/search" },
                  { label: "🏥 Lab Network", href: "/regulations" },
                ].map((l) => (
                  <li key={l.href}><a href={l.href} className="hover:text-white transition-colors">{l.label}</a></li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <div className="text-blue-300 text-xs font-bold tracking-widest uppercase mb-4">Contact</div>
              <ul className="space-y-2 text-sm text-blue-200">
                <li>📍 Drug Control Bhavan, Thiruvananthapuram</li>
                <li>📞 0471-2320551</li>
                <li>✉️ drugcontrol@kerala.gov.in</li>
                <li className="pt-2">
                  <span className="bg-green-900/40 border border-green-700 text-green-400 text-xs px-2 py-1 rounded-full">
                    <span className="inline-block w-2 h-2 bg-green-400 rounded-full animate-pulse mr-1"></span>
                    System Online
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-900 py-4 px-6 text-center text-blue-400 text-xs">
            © 2024 Kerala Drug Control Department, Government of Kerala. All rights reserved. |
            <a href="#" className="ml-2 hover:text-white">Privacy Policy</a> |
            <a href="#" className="ml-2 hover:text-white">Terms of Use</a>
          </div>
        </footer>
        </LanguageProvider>
      </body>
    </html>
  );
}
