import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { CollectionItem } from './CollectionManager';

interface DocumentUploaderProps {
  onUploadSuccess: () => void;
  collections?: CollectionItem[];
}

const CATEGORIES = ['General', 'Admissions', 'Departments', 'Courses', 'Fees', 'Examinations', 'Academic Calendar', 'Campus Services', 'Placements', 'Scholarships', 'Policies and Notices'];
const DEPARTMENTS = ['All', 'Computer Science', 'Electronics & Communication', 'Mechanical', 'Electrical', 'Civil', 'Business Administration', 'Basic Sciences'];

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onUploadSuccess, collections = [] }) => {
  const [file, setFile] = useState<File | null>(null);
  const [docName, setDocName] = useState('');
  const [category, setCategory] = useState('General');
  const [department, setDepartment] = useState('All');
  const [collectionId, setCollectionId] = useState('');
  const [version, setVersion] = useState('1.0');
  const [description, setDescription] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      if (!docName) {
        setDocName(selected.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMsg("Please select a resource file before uploading.");
      return;
    }

    setIsUploading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const formData = new FormData();
    formData.append('file', file);
    if (docName) formData.append('name', docName);
    formData.append('category', category);
    formData.append('department', department);
    if (collectionId) formData.append('collection_id', collectionId);
    formData.append('version', version);
    if (description) formData.append('description', description);

    try {
      // Let the browser add the multipart boundary. Setting this header manually
      // can make FastAPI reject an otherwise valid FormData request.
      const response = await api.post('/api/documents/upload', formData);
      if (response.data?.status === 'FAILED') {
        throw new Error('The resource was saved, but processing failed. Check its status and try reprocessing it.');
      }

      setSuccessMsg(`Document "${file.name}" uploaded successfully! RAG vector processing started.`);
      setFile(null);
      setDocName('');
      setDescription('');
      onUploadSuccess();
    } catch (err: any) {
      console.error("Upload error", err);
      setErrorMsg(err.response?.data?.detail || err.message || "Failed to upload resource.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
          <UploadCloud className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Upload Knowledge Resource</h3>
          <p className="text-xs text-slate-400">PDF, Word, text, data, web, and image files (Max 20MB)</p>
        </div>

      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* File Dropzone */}
      <div className="relative border-2 border-dashed border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 text-center transition bg-slate-900/40">
        <input
          type="file"
          accept=".pdf,.doc,.docx,.txt,.csv,.md,.markdown,.json,.xml,.html,.htm,.rtf,.log,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff,.gif"
          onChange={handleFileChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="flex flex-col items-center space-y-2">
          <FileText className="w-8 h-8 text-blue-400" />
          {file ? (
            <div>
              <span className="text-xs font-semibold text-white">{file.name}</span>
              <span className="text-[10px] text-slate-400 block">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-slate-300">Click or drag document to upload</span>
              <span className="text-[10px] text-slate-500 block">PDF, Word, text, data, web, or image files</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Knowledge Collection</label>
          <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500">
            <option value="">No collection</option>
            {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Document Display Title</label>
          <input
            type="text"
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            placeholder="e.g. Academic Fee Structure 2026"
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Department</label>
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief document notes..."
            className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">Document Version</label>
          <input type="text" value={version} onChange={(e) => setVersion(e.target.value)} placeholder="e.g. 2026.1" className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={!file || isUploading}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 flex items-center space-x-2 transition disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          <span>{isUploading ? 'Extracting & Indexing...' : 'Upload & Process RAG'}</span>
        </button>
      </div>
    </form>
  );
};
