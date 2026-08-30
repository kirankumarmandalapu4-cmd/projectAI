'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Bot, LogOut, FileText, MessageSquare, LayoutDashboard, Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { BackendStatus } from './BackendStatus';

export const Header: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/chat', label: 'Chatbot', icon: MessageSquare, iconColor: 'text-violet-400', show: true },
    { href: '/documents', label: 'Documents', icon: FileText, iconColor: 'text-cyan-400', show: user?.role === 'ADMIN' },
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, iconColor: 'text-indigo-400', show: user?.role === 'ADMIN' },
  ];

  const isActive = (href: string) => pathname === href || (pathname?.startsWith(href + '/') ?? false);

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-violet-500/10">
      <div className="px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-violet-500/20 group-hover:scale-105 transition-transform duration-200">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Bot className="w-5 h-5 text-violet-400" />
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-base font-display font-bold gradient-text">College RAG AI</h1>
              <p className="text-[9px] text-slate-500 font-medium tracking-widest uppercase">Verified Knowledge</p>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1 bg-slate-900/40 p-1 rounded-xl border border-violet-500/10">
          {navLinks.filter(l => l.show).map(({ href, label, icon: Icon, iconColor }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${isActive(href) ? 'nav-link-active' : ''}`}
            >
              <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <BackendStatus />
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs font-semibold text-slate-200">{user.name}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-violet-500/10 text-violet-400 font-mono border border-violet-500/20">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition border border-transparent hover:border-rose-500/20"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/login" className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition">
                Log In
              </Link>
              <Link href="/register" className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-md shadow-violet-600/20 transition">
                Register
              </Link>
            </div>
          )}

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-violet-500/10 px-4 py-3 space-y-1 animate-fade-in">
          {navLinks.filter(l => l.show).map(({ href, label, icon: Icon, iconColor }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`nav-link w-full ${isActive(href) ? 'nav-link-active' : ''}`}
            >
              <Icon className={`w-4 h-4 ${iconColor}`} />
              <span>{label}</span>
            </Link>
          ))}
          {!isAuthenticated && (
            <div className="flex gap-2 pt-2">
              <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 btn-secondary text-center py-2 text-xs">Log In</Link>
              <Link href="/register" onClick={() => setMobileOpen(false)} className="flex-1 btn-primary text-center py-2 text-xs">Register</Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
