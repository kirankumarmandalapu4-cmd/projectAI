import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, X, Send, Check } from 'lucide-react';
import api from '../../services/api';

interface FeedbackModalProps {
  messageId: string;
  initialRating: number; // 1 or -1
  onClose: () => void;
}

const REASONS = [
  'Incorrect',
  'Incomplete',
  'Irrelevant',
  'Wrong source',
  'Other'
];

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ messageId, initialRating, onClose }) => {
  const [rating, setRating] = useState<number>(initialRating);
  const [reason, setReason] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/api/feedback', {
        message_id: messageId,
        rating,
        reason: reason || undefined,
        comment: comment || undefined
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Failed to submit feedback", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800 p-5 shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Thank You for Your Feedback!</h3>
            <p className="text-xs text-slate-400">Your feedback helps improve our RAG knowledge system.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-white">Rate AI Answer</h3>
              <p className="text-xs text-slate-400 mt-1">How helpful was this response?</p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => setRating(1)}
                className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center space-x-2 text-xs font-semibold transition ${
                  rating === 1
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <ThumbsUp className="w-4 h-4" />
                <span>Helpful</span>
              </button>
              <button
                type="button"
                onClick={() => setRating(-1)}
                className={`flex-1 py-2.5 rounded-xl border flex items-center justify-center space-x-2 text-xs font-semibold transition ${
                  rating === -1
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <ThumbsDown className="w-4 h-4" />
                <span>Needs Improvement</span>
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Primary Reason (Optional)</label>
              <div className="grid grid-cols-2 gap-2">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border text-left transition ${
                      reason === r
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'border-slate-800/80 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Additional Comments</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe how the answer could be improved..."
                rows={3}
                className="w-full rounded-xl bg-slate-900 border border-slate-800 px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 transition disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Feedback</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
