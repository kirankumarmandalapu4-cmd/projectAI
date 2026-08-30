import React, { useState } from 'react';
import { FolderPlus, Layers, Trash2 } from 'lucide-react';
import api from '../../services/api';

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  department: string;
}

interface CollectionManagerProps {
  collections: CollectionItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  onRefresh: () => void;
}

export const CollectionManager: React.FC<CollectionManagerProps> = ({ collections, selectedId, onSelect, onRefresh }) => {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  const createCollection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const response = await api.post('/api/collections', { name: name.trim() });
      setName('');
      onRefresh();
      onSelect(response.data.id);
    } finally {
      setCreating(false);
    }
  };

  const deleteCollection = async (id: string) => {
    if (!window.confirm('Delete this collection? Documents will remain available without a collection.')) return;
    await api.delete(`/api/collections/${id}`);
    if (selectedId === id) onSelect('');
    onRefresh();
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-cyan-400" />
        <div>
          <h2 className="text-sm font-semibold text-white">Knowledge Collections</h2>
          <p className="text-[11px] text-slate-400">Separate knowledge bases for teams, departments, or campuses.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={() => onSelect('')} className={`px-3 py-1.5 rounded-lg text-xs border transition ${!selectedId ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-800 text-slate-400 hover:text-white'}`}>All documents</button>
        {collections.map((collection) => (
          <div key={collection.id} className={`flex items-center rounded-lg border ${selectedId === collection.id ? 'bg-blue-600/20 border-blue-500/50' : 'border-slate-800'}`}>
            <button onClick={() => onSelect(collection.id)} className="px-3 py-1.5 text-xs text-slate-200">{collection.name}</button>
            <button onClick={() => deleteCollection(collection.id)} className="px-2 text-slate-500 hover:text-rose-400" title="Delete collection"><Trash2 className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
      <form onSubmit={createCollection} className="flex gap-2">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="New collection name" className="flex-1 rounded-lg bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
        <button type="submit" disabled={creating || !name.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"><FolderPlus className="w-3.5 h-3.5" /> Create</button>
      </form>
    </div>
  );
};
