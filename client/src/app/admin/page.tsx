'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { MetricCard } from '../../components/admin/MetricCard';
import { SystemHealth } from '../../components/admin/SystemHealth';
import { LayoutDashboard, Users, FileText, HelpCircle, Clock, ThumbsUp, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/admin/dashboard');
      setData(res.data);
      const analyticsRes = await api.get('/api/admin/analytics?days=7');
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const metrics = data?.metrics || {};
  const health = data?.systemHealth || {
    status: 'OPERATIONAL',
    database: 'CONNECTED',
    vectorDatabase: 'CONNECTED',
    ragPipeline: 'READY'
  };

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Administrator Analytics & Health Dashboard</h1>
              <p className="text-xs text-slate-400">Live RAG performance analytics, document status, and system health</p>
            </div>
          </div>

          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-xl glass-panel text-slate-400 hover:text-white transition"
            title="Refresh Metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Registered Users"
            value={metrics.totalUsers ?? 0}
            subtitle="Students, Faculty & Admins"
            icon={Users}
            color="blue"
          />

          <MetricCard
            title="Total Knowledge Documents"
            value={metrics.totalDocuments ?? 0}
            subtitle={`${metrics.processedDocuments ?? 0} Processed / ${metrics.failedDocuments ?? 0} Failed`}
            icon={FileText}
            color="cyan"
          />

          <MetricCard
            title="Questions Asked"
            value={metrics.totalQuestions ?? 0}
            subtitle={`${metrics.questionsToday ?? 0} asked today`}
            icon={HelpCircle}
            color="indigo"
          />

          <MetricCard
            title="Average Response Time"
            value={`${metrics.avgResponseTimeMs ?? 0} ms`}
            subtitle="Vector search + Generation latency"
            icon={Clock}
            color="emerald"
          />
        </div>

        {/* Feedback Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Answer Quality Feedback</span>
              <ThumbsUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-3">
              <span className="text-3xl font-bold text-white">{metrics.feedback?.satisfactionRate ?? 100}%</span>
              <span className="text-xs text-emerald-400 font-medium">User Satisfaction</span>
            </div>
            <div className="flex items-center space-x-4 text-xs text-slate-400 pt-2 border-t border-slate-800/60">
              <span>👍 Helpful: <strong className="text-white">{metrics.feedback?.helpful ?? 0}</strong></span>
              <span>👎 Unhelpful: <strong className="text-white">{metrics.feedback?.unhelpful ?? 0}</strong></span>
            </div>
          </div>

          <SystemHealth health={health} />
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div><h2 className="text-sm font-semibold text-white">Query Analytics</h2><p className="text-xs text-slate-400">Last 7 days · {analytics?.totalQueries ?? 0} queries</p></div>
            <span className="text-xs text-slate-400">Avg {analytics?.averageResponseTimeMs ?? 0} ms</span>
          </div>
          <div className="flex items-end gap-2 h-28 border-b border-slate-800/60 pb-1">
            {(analytics?.queriesByDay || []).map((day: { date: string; count: number }) => {
              const max = Math.max(...(analytics?.queriesByDay || []).map((item: { count: number }) => item.count), 1);
              return <div key={day.date} className="flex-1 h-full flex flex-col items-center justify-end gap-1"><div className="w-full max-w-10 rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400" style={{ height: `${Math.max(8, (day.count / max) * 88)}%` }} title={`${day.count} queries`} /><span className="text-[9px] text-slate-500">{day.date.slice(5)}</span></div>;
            })}
            {!analytics?.queriesByDay?.length && <span className="w-full text-center text-xs text-slate-500 self-center">No queries recorded yet.</span>}
          </div>
          <div className="flex flex-wrap gap-3 text-[11px] text-slate-400">{Object.entries(analytics?.answerStatusCounts || {}).map(([status, count]) => <span key={status} className="rounded-lg bg-slate-900 px-2 py-1">{status}: <strong className="text-white">{count as number}</strong></span>)}</div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
