import React from 'react';
import { FileText, Bookmark, Hash } from 'lucide-react';

export interface Source {
  documentId?: string;
  documentName: string;
  pageNumber?: number;
  section?: string;
  category?: string;
  department?: string;
  score?: number;
  snippet?: string;
}

interface SourceCardProps {
  source: Source;
}

export const SourceCard: React.FC<SourceCardProps> = ({ source }) => {
  const scorePct = source.score ? Math.round(source.score * 100) : null;

  return (
    <div className="glass-card rounded-xl p-3 border border-slate-800/80 hover:border-blue-500/40 transition group">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-semibold text-slate-200 truncate group-hover:text-blue-300 transition">
              {source.documentName}
            </h4>
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
              {source.pageNumber && (
                <span className="flex items-center text-slate-300 font-mono">
                  Page {source.pageNumber}
                </span>
              )}
              {source.category && (
                <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">
                  {source.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {scorePct !== null && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            {scorePct}% match
          </span>
        )}
      </div>

      {source.section && source.section !== "General" && (
        <div className="mt-2 text-[10px] text-slate-400 flex items-center space-x-1 border-t border-slate-800/40 pt-1.5">
          <Bookmark className="w-3 h-3 text-slate-500 shrink-0" />
          <span className="truncate">Section: {source.section}</span>
        </div>
      )}
      {source.snippet && (
        <details className="mt-2 border-t border-slate-800/40 pt-1.5">
          <summary className="cursor-pointer text-[10px] text-blue-400 hover:text-blue-300">Highlight retrieved passage</summary>
          <p className="mt-1.5 rounded-lg bg-blue-500/5 border-l-2 border-blue-400/60 px-2 py-1.5 text-[10px] leading-relaxed text-slate-400">{source.snippet}</p>
        </details>
      )}
    </div>
  );
};
