import React, { useState } from 'react';
import Link from 'next/link';
import { FileText, RefreshCw, Trash2, CheckCircle2, Clock, AlertTriangle, Search, Filter } from 'lucide-react';
import api from '../../services/api';

export interface DocumentItem {
  id: string;
  name: string;
  original_filename: string;
  file_type: string;
  category: string;
  department: string;
  status: string;
  page_count: number;
  chunk_count: number;
  version: string;
  collection_id?: string;
  is_active?: boolean;
  created_at: string;
}

interface DocumentTableProps {
  documents: DocumentItem[];
  onRefresh: () => void;
}

export const DocumentTable: React.FC<DocumentTableProps> = ({ documents, onRefresh }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionId, setActionId] = useState<string | null>(null);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) || doc.original_filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleReprocess = async (id: string) => {
    setActionId(id);
    try {
      await api.post(`/api/documents/${id}/reprocess`);
      onRefresh();
    } catch (err) {
      console.error("Reprocess error", err);
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document and remove all vector embeddings from Qdrant?")) return;
    setActionId(id);
    try {
      await api.delete(`/api/documents/${id}`);
      onRefresh();
    } catch (err) {
      console.error("Delete error", err);
    } finally {
      setActionId(null);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            <span>COMPLETED</span>
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <Clock className="w-3 h-3 animate-spin" />
            <span>PROCESSING</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" />
            <span>FAILED</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
            <span>UPLOADED</span>
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden space-y-4 p-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Categories</option>
            <option value="Admissions">Admissions</option>
            <option value="Fees">Fees</option>
            <option value="Examinations">Examinations</option>
            <option value="Hostel">Hostel</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="All">All Statuses</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800">
            <tr>
              <th className="px-4 py-3">Document Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Pages / Chunks</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No knowledge base documents found.
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-900/40 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <Link href={`/documents/${doc.id}`} className="font-medium text-white hover:text-blue-300 transition">
                          {doc.name}
                        </Link>
                        <div className="text-[10px] text-slate-500">{doc.original_filename} · v{doc.version}{doc.is_active === false ? ' · archived' : ''}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium">
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{doc.department}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {doc.page_count} pgs / {doc.chunk_count} chunks
                  </td>
                  <td className="px-4 py-3">{renderStatusBadge(doc.status)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => handleReprocess(doc.id)}
                        disabled={actionId === doc.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800 transition"
                        title="Reprocess Vector Embeddings"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${actionId === doc.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        disabled={actionId === doc.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                        title="Delete Document & Chunks"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
