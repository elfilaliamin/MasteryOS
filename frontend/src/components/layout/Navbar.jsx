import { Menu, Plus, Sun, Moon, Volume2, VolumeX } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTheme } from '../../context/useTheme';
import { useSound } from '../../context/useSound';
import { XpProgressBar } from '../gamification/XpProgressBar';

export const Navbar = ({ onOpenMobileSidebar, onQuickAddTask }) => {
  const { isDark, toggleTheme } = useTheme();
  const { isMuted, toggleMute } = useSound();

  return (
    <header className="h-16 border-b border-slate-200/90 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileSidebar}
          className="md:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Gamification Level & XP Badge */}
        <XpProgressBar compact />

        {/* Sound Effects Toggle Button */}
        <button
          type="button"
          onClick={toggleMute}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#0d8a72] dark:hover:text-teal-400 hover:border-[#0d8a72]/50 transition-all cursor-pointer shadow-xs"
          title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          aria-label={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          {isMuted ? (
            <VolumeX size={18} className="text-rose-500" />
          ) : (
            <Volume2 size={18} className="text-[#0d8a72] dark:text-teal-400" />
          )}
        </button>

        {/* Dark/Light Mode Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#0d8a72] dark:hover:text-teal-400 hover:border-[#0d8a72]/50 transition-all cursor-pointer shadow-xs"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun size={18} className="text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon size={18} className="text-[#0d8a72] hover:-rotate-12 transition-transform" />
          )}
        </button>

        {/* Quick New Task Button */}
        {onQuickAddTask && (
          <Button
            size="sm"
            onClick={onQuickAddTask}
            className="gap-1.5"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">New Task</span>
          </Button>
        )}
      </div>
    </header>
  );
};
