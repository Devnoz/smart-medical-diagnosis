'use client';

import Link from 'next/link';
import { Bell, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function Navbar({ activeTab = 'Dashboard', onTabChange }: { activeTab?: string, onTabChange?: (tab: string) => void }) {
  const tabs = ['Dashboard', 'Consultations', 'History', 'Insights'];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/60 backdrop-blur-md border-b border-slate-200/50">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <button onClick={() => onTabChange?.('Dashboard')} className="text-2xl font-bold tracking-tight">
            <span className="text-blue-600">DermoMed</span>
            <span className="text-cyan-500"> AI</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="hidden md:flex items-center gap-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => onTabChange?.(tab)}
              className={`nav-link ${activeTab === tab ? 'active text-blue-600' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Actions - Icons removed per user request */}
        <div className="flex items-center gap-4">
          <div className="w-10" /> {/* Spacer */}
        </div>
      </div>
    </nav>
  );
}

