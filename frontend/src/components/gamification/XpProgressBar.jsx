import { Link } from 'react-router-dom';
import { useGamification } from '../../context/useGamification';

export const XpProgressBar = ({ compact = false }) => {
  const { playerStats, isLoading } = useGamification();

  if (isLoading) {
    if (compact) {
      return (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 animate-pulse">
          <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="flex flex-col gap-1">
            <div className="w-14 h-2.5 bg-slate-200 dark:bg-slate-700 rounded" />
            <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>
        </div>
      );
    }
    return (
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse h-24" />
    );
  }

  if (compact) {
    return (
      <Link
        to="/settings"
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-teal-50 dark:bg-slate-800/80 border border-teal-200/80 dark:border-slate-700/80 hover:border-teal-500/50 transition-all text-left group"
        title="View Gamification & Titles in Settings"
      >
        <span className="text-base">{playerStats.levelIcon}</span>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-teal-700 dark:text-teal-400">
              Lv.{playerStats.level}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[90px]">
              {playerStats.activeTitle?.name || playerStats.levelTitle}
            </span>
          </div>
          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-teal-600 dark:bg-teal-400 rounded-full transition-all duration-300"
              style={{ width: `${playerStats.progressPercent}%` }}
            />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to="/settings"
      className="block p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{playerStats.levelIcon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300">
                Level {playerStats.level}
              </span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {playerStats.levelTitle}
              </span>
            </div>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
              Title: {playerStats.activeTitle?.name}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            {playerStats.totalXp} XP
          </span>
          <p className="text-[10px] text-slate-400">
            {playerStats.progressPercent}% to Lv.{playerStats.level + 1}
          </p>
        </div>
      </div>

      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-300"
          style={{ width: `${playerStats.progressPercent}%` }}
        />
      </div>
    </Link>
  );
};
