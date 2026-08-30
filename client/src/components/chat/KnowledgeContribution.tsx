import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, FilePlus2, Loader2, UploadCloud } from 'lucide-react';
import api from '../../services/api';

const ACCEPTED_FILES = '.pdf,.doc,.docx,.txt,.csv,.md,.markdown,.json,.xml,.html,.htm,.rtf,.log,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff,.gif';

export const KnowledgeContribution: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || isUploading) return;

    if (file.size > 20 * 1024 * 1024) {
      setError('Files must be 20 MB or smaller.');
      return;
    }

    setIsUploading(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
    formData.append('category', 'General');
    formData.append('department', 'All');
    formData.append('version', '1.0');
    formData.append('description', 'Community contribution to the college knowledge base.');

    try {
      const response = await api.post('/api/documents/upload', formData);
      if (response.data?.status !== 'COMPLETED') {
        throw new Error('The file was uploaded but could not be indexed. Please ask an administrator to reprocess it.');
      }
      setMessage(`“${file.name}” was added to the knowledge base. You can ask about it now.`);
      setFile(null);
    } catch (uploadError: any) {
      setError(uploadError.response?.data?.detail || uploadError.message || 'Unable to add this resource.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <details className="glass-panel rounded-2xl border border-violet-500/20 overflow-hidden">
      <summary className="cursor-pointer list-none px-4 py-3 flex items-center justify-between gap-3 hover:bg-violet-500/5 transition">
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <FilePlus2 className="w-4 h-4 text-violet-400" />
          Contribute a resource to the knowledge base
        </span>
        <span className="text-[10px] text-slate-500">PDF, Word, text, data, web, or image · max 20 MB</span>
      </summary>

      <form onSubmit={handleSubmit} className="border-t border-violet-500/10 p-4 space-y-3">
        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-slate-700 bg-slate-900/40 px-3 py-3 text-xs text-slate-400 hover:border-violet-500/50 transition">
            <input
              type="file"
              accept={ACCEPTED_FILES}
              onChange={(event) => {
                setFile(event.target.files?.[0] || null);
                setMessage('');
                setError('');
              }}
              className="sr-only"
            />
            <span className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-violet-400" />
              {file ? `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)` : 'Choose a resource file'}
            </span>
          </label>
          <button
            type="submit"
            disabled={!file || isUploading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-xs font-semibold text-white shadow-lg shadow-violet-600/20 transition hover:bg-violet-500 disabled:opacity-50"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
            {isUploading ? 'Processing...' : 'Add to knowledge'}
          </button>
        </div>
        <p className="text-[10px] text-slate-500">Your resource is indexed immediately and becomes available to the chatbot after processing.</p>
      </form>
    </details>
  );
};
