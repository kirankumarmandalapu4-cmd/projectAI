'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, Clock, FileText, AlertTriangle, Loader2, Sparkles, Pencil, Save, X } from 'lucide-react';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import api from '../../../services/api';

interface DocumentDetails {
  id: string;
  name: string;
  original_filename: string;
  file_type: string;
  category: string;
  department: string;
  description?: string;
  status: string;
  page_count: number;
  chunk_count: number;
  version: string;
  created_at: string;
  updated_at: string;
  summary?: string;
  collection_id?: string;
  is_active: boolean;
}

const CATEGORIES = ['General', 'Admissions', 'Departments', 'Courses', 'Fees', 'Examinations', 'Academic Calendar', 'Campus Services', 'Placements', 'Scholarships', 'Policies and Notices'];
const DEPARTMENTS = ['All', 'Computer Science', 'Electronics & Communication', 'Mechanical', 'Electrical', 'Civil', 'Business Administration', 'Basic Sciences'];

export default function DocumentDetailsPage() {
  const params = useParams<{ id: string }>();
  const [document, setDocument] = useState<DocumentDetails | null>(null);
  const [error, setError] = useState('');
  const [insights, setInsights] = useState<{ summary: string; faqs: { question: string; answer: string }[] } | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    if (!params?.id) return;
    api.get(`/api/documents/${params.id}`)
      .then((response) => setDocument(response.data))
      .catch((err) => setError(err.response?.data?.detail || 'Unable to load document details.'));
  }, [params?.id]);

  const loadInsights = async () => {
    if (!params?.id) return;
    setLoadingInsights(true);
    try {
      const response = await api.get(`/api/documents/${params.id}/insights`);
      setInsights(response.data);
    } finally {
      setLoadingInsights(false);
    }
  };

  const saveMetadata = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!document) return;
    setSaving(true);
    setEditError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await api.put(`/api/documents/${document.id}`, {
        name: String(form.get('name') || '').trim(),
        category: form.get('category'),
        department: form.get('department'),
        version: String(form.get('version') || '').trim(),
        description: String(form.get('description') || '').trim() || null,
      });
      setDocument(response.data);
      setEditing(false);
    } catch (err: any) {
      setEditError(err.response?.data?.detail || 'Unable to update document metadata.');
    } finally {
      setSaving(false);
    }
  };

  const statusIcon = document?.status === 'COMPLETED'
    ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
    : document?.status === 'FAILED'
      ? <AlertTriangle className="w-5 h-5 text-rose-400" />
      : <Clock className="w-5 h-5 text-amber-400" />;

  return (
    <ProtectedRoute requireAdmin>
      <div className="flex-1 p-6 md:p-10 max-w-4xl mx-auto w-full space-y-6">
        <Link href="/documents" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white transition">
          <ArrowLeft className="w-4 h-4" /> Back to documents
        </Link>

        {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">{error}</div>}
        {!document && !error && (
          <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin" /> Loading document...</div>
        )}
        {document && (
          <div className="glass-panel rounded-2xl border border-slate-800 p-6 space-y-6">
            <div className="flex items-start gap-4 border-b border-slate-800 pb-5">
              <div className="w-11 h-11 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-white break-words">{document.name}</h1>
                <p className="text-xs text-slate-400 mt-1">{document.original_filename}</p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">{statusIcon}{document.status}{!document.is_active && ' · ARCHIVED'}</div>
            </div>

            <div className="flex justify-end -mt-3">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 transition hover:border-blue-500/40 hover:text-blue-400">
                  <Pencil className="w-3.5 h-3.5" /> Edit metadata
                </button>
              ) : (
                <button onClick={() => setEditing(false)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 px-3 py-1.5 text-xs text-slate-400 transition hover:text-white">
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>

            {editing && (
              <form onSubmit={saveMetadata} className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
                {editError && <p className="rounded-lg border border-rose-500/20 bg-rose-500/10 p-2 text-xs text-rose-300">{editError}</p>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="text-xs text-slate-400">Display title<input name="name" required defaultValue={document.name} className="input-field !pl-3 mt-1" /></label>
                  <label className="text-xs text-slate-400">Version<input name="version" required defaultValue={document.version} className="input-field !pl-3 mt-1" /></label>
                  <label className="text-xs text-slate-400">Category<select name="category" defaultValue={document.category} className="input-field !pl-3 mt-1">{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
                  <label className="text-xs text-slate-400">Department<select name="department" defaultValue={document.department} className="input-field !pl-3 mt-1">{DEPARTMENTS.map((department) => <option key={department}>{department}</option>)}</select></label>
                  <label className="text-xs text-slate-400 md:col-span-2">Description<textarea name="description" defaultValue={document.description || ''} rows={3} className="input-field !pl-3 mt-1" /></label>
                </div>
                <button type="submit" disabled={saving} className="btn-primary px-4 py-2 text-xs disabled:opacity-50"><Save className="w-3.5 h-3.5" />{saving ? 'Saving...' : 'Save metadata'}</button>
              </form>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><p className="text-[10px] uppercase text-slate-500">Pages</p><p className="text-lg font-semibold text-white">{document.page_count}</p></div>
              <div><p className="text-[10px] uppercase text-slate-500">Chunks</p><p className="text-lg font-semibold text-white">{document.chunk_count}</p></div>
              <div><p className="text-[10px] uppercase text-slate-500">Version</p><p className="text-lg font-semibold text-white">{document.version}</p></div>
              <div><p className="text-[10px] uppercase text-slate-500">Type</p><p className="text-lg font-semibold text-white uppercase">{document.file_type}</p></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div><p className="text-xs text-slate-500">Category</p><p className="text-slate-200">{document.category}</p></div>
              <div><p className="text-xs text-slate-500">Department</p><p className="text-slate-200">{document.department}</p></div>
              {document.description && <div className="md:col-span-2"><p className="text-xs text-slate-500">Description</p><p className="text-slate-200">{document.description}</p></div>}
            </div>

            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-indigo-400" /><h2 className="text-sm font-semibold text-white">Document Summary & FAQs</h2></div>
                <button onClick={loadInsights} disabled={loadingInsights} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-50">{loadingInsights ? 'Generating...' : 'Generate insights'}</button>
              </div>
              {(insights || document.summary) && <p className="text-xs leading-relaxed text-slate-300">{insights?.summary || document.summary}</p>}
              {insights?.faqs?.map((faq, index) => <details key={index} className="border-t border-indigo-500/10 pt-2"><summary className="cursor-pointer text-xs text-indigo-300">{faq.question}</summary><p className="mt-1 text-xs text-slate-400">{faq.answer}</p></details>)}
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
