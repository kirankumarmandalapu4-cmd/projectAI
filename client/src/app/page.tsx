'use client';

import React from 'react';
import Link from 'next/link';
import { Bot, Search, ShieldCheck, Database, Layers, ArrowRight, FileText, Sparkles, Globe, BarChart3 } from 'lucide-react';

const STATS = [
  { value: '100%', label: 'Source Citations' },
  { value: '<2s', label: 'Avg Response' },
  { value: '5-Step', label: 'RAG Pipeline' },
  { value: '24/7', label: 'Availability' },
];

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Hero */}
      <section className="relative py-16 md:py-24 px-6 lg:px-12 max-w-6xl mx-auto text-center space-y-8 animate-slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold tracking-wide uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Vector Search & Grounded Retrieval AI</span>
        </div>

        <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1] max-w-4xl mx-auto">
          Instant College Answers{' '}
          <span className="gradient-text">Grounded in Verified Documents</span>
        </h1>

        <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Ask natural-language questions about admissions, regulations, fees, hostels, and exams — with zero hallucination and transparent source citations.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <Link href="/chat" className="btn-primary w-full sm:w-auto group">
            <span>Launch College Chatbot</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/register" className="btn-secondary w-full sm:w-auto">
            Create Free Account
          </Link>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 max-w-3xl mx-auto">
          {STATS.map((stat) => (
            <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
              <div className="text-xl md:text-2xl font-bold gradient-text">{stat.value}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* RAG Pipeline */}
      <section className="py-16 px-6 lg:px-12 bg-slate-900/30 border-y border-violet-500/10">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <h2 className="section-title">How RAG Vector Search Works</h2>
            <p className="text-sm text-slate-400 max-w-xl mx-auto">
              Official college files are parsed, embedded, and indexed for precise semantic retrieval.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: FileText, title: 'Ingestion', desc: 'PDF, Word, text, data & image extraction', color: 'violet' },
              { icon: Layers, title: 'Chunking', desc: '500–800 token overlap splitting', color: 'indigo' },
              { icon: Database, title: 'Embeddings', desc: 'Vector generation & Qdrant indexing', color: 'cyan' },
              { icon: Search, title: 'Retrieval', desc: 'Top-K cosine similarity search', color: 'blue' },
              { icon: ShieldCheck, title: 'Grounded AI', desc: 'Answer + exact page source cards', color: 'emerald' },
            ].map((step, idx) => {
              const IconComp = step.icon;
              return (
                <div key={idx} className="glass-card p-5 rounded-2xl text-center space-y-3 group hover:-translate-y-0.5 transition-transform duration-200">
                  <div className="w-11 h-11 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center mx-auto border border-violet-500/20 group-hover:scale-110 transition-transform">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <div className="text-[10px] font-bold text-violet-400/70 uppercase tracking-widest">Step {idx + 1}</div>
                  <h3 className="text-sm font-semibold text-slate-100">{step.title}</h3>
                  <p className="text-xs text-slate-500 leading-snug">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 lg:px-12 max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-3">
          <h2 className="section-title">Built for Students, Faculty & Administrators</h2>
          <p className="text-sm text-slate-400">Everything needed to manage college knowledge transparently.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: Bot, title: 'Source Citation Cards', desc: 'Every answer displays clickable references to original document names and page numbers.', accent: 'violet' },
            { icon: ShieldCheck, title: 'Zero Hallucination Safety', desc: 'If an answer is not in the knowledge base, the system safely declines rather than inventing policies.', accent: 'cyan' },
            { icon: BarChart3, title: 'Admin Analytics Dashboard', desc: 'Upload documents, track processing status, and monitor query analytics in real time.', accent: 'indigo' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="glass-card p-6 rounded-2xl space-y-4 hover:-translate-y-1 transition-transform duration-200">
              <div className="w-11 h-11 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center border border-violet-500/20">
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-100">{title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Bonus features strip */}
        <div className="glass-panel rounded-2xl p-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
          {[
            { icon: Globe, label: 'Multi-language Support' },
            { icon: Search, label: 'Hybrid Search + Reranking' },
            { icon: Database, label: 'Document Collections' },
          ].map(({ icon: Icon, label }) => (
            <span key={label} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/50 border border-violet-500/10">
              <Icon className="w-3.5 h-3.5 text-violet-400" />
              {label}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
