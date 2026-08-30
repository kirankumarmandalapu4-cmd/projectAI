import React, { useState } from 'react';
import { Send, Loader2, Filter, Mic, MicOff } from 'lucide-react';

interface CollectionFilter {
  id: string;
  name: string;
}

interface ChatInputProps {
  onSendMessage: (message: string, categoryFilter?: string, departmentFilter?: string, collectionFilter?: string, language?: string) => void;
  isLoading: boolean;
  collections?: CollectionFilter[];
}

const CATEGORIES = ['All', 'Admissions', 'Departments', 'Courses', 'Fees', 'Examinations', 'Academic Calendar', 'Campus Services', 'Placements', 'Scholarships', 'Policies and Notices'];
const DEPARTMENTS = ['All', 'Computer Science', 'Electronics & Communication', 'Mechanical', 'Electrical', 'Civil', 'Business Administration', 'Basic Sciences'];

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, collections = [] }) => {
  const [message, setMessage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [selectedCollection, setSelectedCollection] = useState('All');
  const [language, setLanguage] = useState('auto');
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    onSendMessage(message.trim(), selectedCategory, selectedDepartment, selectedCollection, language);
    setMessage('');
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      window.alert('Voice input is not supported by this browser. Try Chrome or Edge.');
      return;
    }
    if (isListening) return;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'te' ? 'te-IN' : 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => setMessage(event.results[0][0].transcript);
    recognition.start();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-2">
      {/* Category filter pills */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pb-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium border shrink-0 transition ${
                selectedCategory === cat
                  ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
          <select value={selectedDepartment} onChange={(event) => setSelectedDepartment(event.target.value)} className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[11px] text-slate-300">
            {DEPARTMENTS.map((department) => <option key={department} value={department}>{department === 'All' ? 'All departments' : department}</option>)}
          </select>
          {collections.length > 0 && (
            <select value={selectedCollection} onChange={(event) => setSelectedCollection(event.target.value)} className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[11px] text-slate-300">
              <option value="All">All collections</option>
              {collections.map((collection) => <option key={collection.id} value={collection.id}>{collection.name}</option>)}
            </select>
          )}
          <select value={language} onChange={(event) => setLanguage(event.target.value)} className="rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[11px] text-slate-300" title="Answer language">
            <option value="auto">Auto language</option><option value="en">English</option><option value="hi">हिन्दी</option><option value="te">తెలుగు</option>
          </select>
        </div>
      )}

      {/* Input container */}
      <form onSubmit={handleSubmit} className="relative glass-panel rounded-2xl border border-slate-800 focus-within:border-blue-500/60 transition shadow-2xl p-2 flex items-end space-x-2">
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`p-2.5 rounded-xl border transition ${
            showFilters || selectedCategory !== 'All'
              ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
              : 'border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Filter by Knowledge Category"
        >
          <Filter className="w-4 h-4" />
        </button>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about admissions, fees, courses, exams, placements..."
          rows={1}
          disabled={isLoading}
          className="flex-1 bg-transparent border-none text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none py-2 px-1 max-h-32"
        />

        <button type="button" onClick={toggleVoiceInput} className={`p-2.5 rounded-xl border transition ${isListening ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 animate-pulse' : 'border-slate-800 text-slate-400 hover:text-slate-200'}`} title="Voice input" aria-label="Voice input">
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          type="submit"
          disabled={!message.trim() || isLoading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/20 disabled:opacity-40 disabled:hover:bg-blue-600 transition shrink-0"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>

      <div className="flex items-center justify-between text-[10px] text-slate-500 px-2">
        <span>Press <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">Shift+Enter</kbd> for line break</span>
        {selectedCategory !== 'All' && (
          <span className="text-blue-400 font-medium">Filter: {selectedCategory}</span>
        )}
      </div>
    </div>
  );
};
