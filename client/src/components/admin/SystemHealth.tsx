import React from 'react';
import { Server, Database, Layers, Cpu, CheckCircle, AlertTriangle } from 'lucide-react';

interface SystemHealthProps {
  health: {
    status: string;
    database: string;
    vectorDatabase: string;
    ragPipeline: string;
  };
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ health }) => {
  const isHealthy = health.status === 'OPERATIONAL';

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <Server className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-white">System Infrastructure Health</h3>
        </div>
        <span
          className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-semibold border ${
            isHealthy
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
          }`}
        >
          {isHealthy ? <CheckCircle className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          <span>{health.status}</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Database className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-medium text-slate-300">Relational DB</span>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {health.database}
          </span>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-medium text-slate-300">Qdrant Vector DB</span>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {health.vectorDatabase}
          </span>
        </div>

        <div className="glass-card p-3.5 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-medium text-slate-300">RAG Ingestion Engine</span>
          </div>
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {health.ragPipeline}
          </span>
        </div>
      </div>
    </div>
  );
};
