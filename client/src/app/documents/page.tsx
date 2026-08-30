'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { DocumentUploader } from '../../components/documents/DocumentUploader';
import { DocumentTable, DocumentItem } from '../../components/documents/DocumentTable';
import { CollectionManager, CollectionItem } from '../../components/documents/CollectionManager';
import { FileText, RefreshCw } from 'lucide-react';
import api from '../../services/api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [collections, setCollections] = useState<CollectionItem[]>([]);
  const [selectedCollection, setSelectedCollection] = useState('');

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/api/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to load documents", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCollections = async () => {
    try {
      const res = await api.get('/api/collections');
      setCollections(res.data);
    } catch (err) {
      console.error('Failed to load collections', err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchCollections();
  }, []);

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Knowledge Base Document Management</h1>
              <p className="text-xs text-slate-400">Upload college PDFs, regulations, circulars, and manage RAG Qdrant vectors</p>
            </div>
          </div>

          <button
            onClick={fetchDocuments}
            className="p-2.5 rounded-xl glass-panel text-slate-400 hover:text-white transition"
            title="Refresh Document List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Uploader Section */}
        <CollectionManager collections={collections} selectedId={selectedCollection} onSelect={setSelectedCollection} onRefresh={fetchCollections} />
        <DocumentUploader onUploadSuccess={fetchDocuments} collections={collections} />

        {/* Documents Table Section */}
        <DocumentTable documents={selectedCollection ? documents.filter((document) => document.collection_id === selectedCollection) : documents} onRefresh={fetchDocuments} />
      </div>
    </ProtectedRoute>
  );
}
