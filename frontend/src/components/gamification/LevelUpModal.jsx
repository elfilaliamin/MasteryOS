import { useEffect } from 'react';
import { Award, Sparkles, ArrowRight, X } from 'lucide-react';
import { Button } from '../ui/Button';

export const LevelUpModal = ({ isOpen, onClose, levelData }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !levelData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-teal-500/30 rounded-3xl p-7 shadow-2xl text-center z-10 overflow-hidden">
        {/* Top-right close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20 cursor-pointer"
          title="Dismiss (Esc)"
        >
          <X size={18} />
        </button>

        {/* Ambient celebration glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-teal-600 to-emerald-400 flex items-center justify-center shadow-xl shadow-teal-500/30 mb-4 animate-bounce text-4xl">
            {levelData.icon || '🏆'}
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles size={14} />
            <span>Level Up Unlocked!</span>
          </div>

          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Level {levelData.level}
          </h2>

          <p className="text-base font-semibold text-teal-600 dark:text-teal-400 mt-1">
            "{levelData.title}"
          </p>

          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-xs leading-relaxed">
            Awesome work! By completing tasks, you earned XP and unlocked new titles and rank prestige!
          </p>

          <div className="mt-6 w-full p-3.5 rounded-2xl bg-teal-50 dark:bg-slate-800/60 border border-teal-100 dark:border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-left">
              <div className="p-2 rounded-xl bg-teal-600/10 text-teal-700 dark:text-teal-400">
                <Award size={18} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Total Experience</p>
                <p className="text-[11px] text-slate-500">{levelData.totalXp} XP Earned</p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-500">+Rank Up</span>
          </div>

          <Button
            variant="primary"
            size="lg"
            onClick={onClose}
            className="mt-6 w-full gap-2"
          >
            <span>Claim & Keep Conquering</span>
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};
