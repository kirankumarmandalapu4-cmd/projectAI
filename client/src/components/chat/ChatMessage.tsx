import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Bot, User, Copy, Check, ThumbsUp, ThumbsDown, ShieldAlert, Sparkles, Layers, Volume2, VolumeX } from 'lucide-react';
import { SourceCard, Source } from './SourceCard';
import { FeedbackModal } from './FeedbackModal';

export interface ChatMessageData {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  answer_status?: string;
  created_at?: string;
}

interface ChatMessageProps {
  message: ChatMessageData;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [initialRating, setInitialRating] = useState<number>(1);
  const [speaking, setSpeaking] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedbackClick = (rating: number) => {
    setInitialRating(rating);
    setFeedbackOpen(true);
  };

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(message.content.replace(/[*#>`_]/g, ''));
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  const renderStatusBadge = (status?: string) => {
    if (!status || isUser) return null;
    
    switch (status) {
      case 'GROUNDED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3 h-3" />
            <span>100% Grounded in Knowledge Base</span>
          </span>
        );
      case 'PARTIALLY_GROUNDED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Layers className="w-3 h-3" />
            <span>Partially Grounded</span>
          </span>
        );
      case 'INSUFFICIENT_CONTEXT':
      case 'NO_RELEVANT_INFORMATION':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="w-3 h-3" />
            <span>Information Not in Knowledge Base</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex items-start space-x-3.5 ${isUser ? 'flex-row-reverse space-x-reverse' : ''} group mb-6`}>
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 text-blue-400'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Message Content Container */}
      <div className={`max-w-3xl flex flex-col space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
        {/* Status indicator for AI message */}
        {!isUser && renderStatusBadge(message.answer_status)}

        <div
          className={`rounded-2xl px-4 py-3.5 text-sm leading-relaxed ${
            isUser
              ? 'bg-blue-600 text-white rounded-tr-xs shadow-lg shadow-blue-600/10'
              : 'glass-panel border border-slate-800/80 text-slate-100 rounded-tl-xs shadow-xl'
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-800">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Source Cards Attachment */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="w-full mt-2 pt-2 border-t border-slate-800/60">
            <h4 className="text-[11px] font-semibold text-slate-400 mb-2 tracking-wide uppercase">
              Retrieved Sources ({message.sources.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {message.sources.map((src, idx) => (
                <SourceCard key={idx} source={src} />
              ))}
            </div>
          </div>
        )}

        {/* Message Actions (Copy & Feedback) */}
        {!isUser && (
          <div className="flex items-center space-x-2 text-slate-400 text-xs pt-1 opacity-80 group-hover:opacity-100 transition">
            <button
              onClick={handleCopy}
              className="flex items-center space-x-1 px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition"
              title="Copy answer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <span className="text-slate-700">•</span>
            <button onClick={toggleSpeech} className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-800 hover:text-white transition" title="Read answer aloud">
              {speaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{speaking ? 'Stop' : 'Read'}</span>
            </button>
            <button
              onClick={() => handleFeedbackClick(1)}
              className="p-1 rounded-lg hover:bg-slate-800 hover:text-emerald-400 transition"
              title="Helpful"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleFeedbackClick(-1)}
              className="p-1 rounded-lg hover:bg-slate-800 hover:text-rose-400 transition"
              title="Needs Improvement"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {feedbackOpen && (
        <FeedbackModal
          messageId={message.id}
          initialRating={initialRating}
          onClose={() => setFeedbackOpen(false)}
        />
      )}
    </div>
  );
};
