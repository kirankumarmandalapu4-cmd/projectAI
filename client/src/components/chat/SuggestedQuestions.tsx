import React from 'react';
import { HelpCircle, GraduationCap, DollarSign, Calendar, Home, Award } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelectQuestion: (question: string) => void;
}

const SAMPLE_QUESTIONS = [
  {
    icon: GraduationCap,
    category: 'Admissions',
    question: 'What are the eligibility requirements for admission?'
  },
  {
    icon: DollarSign,
    category: 'Fees',
    question: 'What is the tuition fee structure and hostel charges?'
  },
  {
    icon: Calendar,
    category: 'Examinations',
    question: 'What are the attendance requirements for semester exams?'
  },
  {
    icon: Home,
    category: 'Hostel',
    question: 'What are the hostel rules, timing, and mess fee structure?'
  },
  {
    icon: Award,
    category: 'Scholarships',
    question: 'What scholarship schemes are available and how to apply?'
  }
];

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onSelectQuestion }) => {
  return (
    <div className="w-full max-w-3xl mx-auto py-8 text-center space-y-6 animate-fade-in">
      <div>
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-violet-600 to-cyan-400 p-0.5 mx-auto shadow-xl shadow-violet-500/20 mb-4">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <HelpCircle className="w-7 h-7 text-violet-400" />
          </div>
        </div>
        <h2 className="font-display text-2xl font-bold gradient-text">
          College RAG Information Assistant
        </h2>
        <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
          Ask natural-language questions grounded strictly in official college documents, rules, and notices.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {SAMPLE_QUESTIONS.map((item, idx) => {
          const IconComponent = item.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectQuestion(item.question)}
              className="glass-card p-4 rounded-xl hover:-translate-y-0.5 transition-all duration-200 group flex items-start gap-3 text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400 flex items-center justify-center shrink-0 border border-violet-500/20 group-hover:scale-110 transition">
                <IconComponent className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wider">
                  {item.category}
                </span>
                <p className="text-sm text-slate-300 group-hover:text-white font-medium mt-0.5 line-clamp-2">
                  &ldquo;{item.question}&rdquo;
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
