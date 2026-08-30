'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-violet-500/10 glass-panel">
      <div className="max-w-6xl mx-auto px-6 lg:px-12 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-cyan-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                <Bot className="w-4 h-4 text-violet-400" />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">College RAG AI</p>
              <p className="text-[10px] text-slate-500">Grounded answers from verified documents</p>
            </div>
          </div>

          <nav className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/chat" className="hover:text-violet-400 transition">Chatbot</Link>
            <Link href="/login" className="hover:text-violet-400 transition">Sign In</Link>
            <Link href="/register" className="hover:text-violet-400 transition">Register</Link>
          </nav>

          <p className="text-[11px] text-slate-500 flex items-center gap-1">
            Built with <Heart className="w-3 h-3 text-rose-400 fill-rose-400/30" /> using FastAPI + Next.js + Qdrant
          </p>
        </div>
      </div>
    </footer>
  );
};
