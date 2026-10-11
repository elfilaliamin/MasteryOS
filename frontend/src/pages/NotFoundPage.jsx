import { Link } from 'react-router-dom';
import { Home, CheckSquare, Sparkles, Sun, Moon } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useTheme } from '../context/useTheme';

export const NotFoundPage = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[#f4f7f6] dark:bg-[#0b131e] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden transition-colors text-center">
      {/* Dynamic ambient gradients */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-600 dark:text-slate-300 hover:text-[#0d8a72] dark:hover:text-teal-400 transition-all cursor-pointer shadow-xs"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label="Toggle Theme"
        >
          {isDark ? (
            <Sun size={18} className="text-amber-400" />
          ) : (
            <Moon size={18} className="text-[#0d8a72]" />
          )}
        </button>
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in flex flex-col items-center">
        {/* 404 Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl p-7 sm:p-10 shadow-xl dark:shadow-2xl w-full flex flex-col items-center">
          {/* Brand header */}
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-[#0d8a72] to-emerald-400 flex items-center justify-center shadow-md shadow-teal-700/20 mb-2 text-white">
            <Sparkles size={24} />
          </div>

          <div className="flex items-baseline gap-1 mb-4">
            <span className="text-xl font-black text-[#0d8a72] dark:text-teal-400 tracking-tight">Mastery</span>
            <span className="text-xl font-black text-amber-500 tracking-tight">OS</span>
          </div>

          {/* 404 Gradient Text */}
          <div className="relative mb-2">
            <span className="text-7xl sm:text-8xl font-black bg-gradient-to-tr from-[#0d8a72] via-emerald-500 to-amber-500 bg-clip-text text-transparent tracking-tighter select-none drop-shadow-xs">
              404
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-2">
            Page Not Found
          </h1>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed mb-6 font-normal">
            The page you are looking for doesn't exist, has been moved, or the link is incorrect.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full">
            <Link to="/" className="w-full">
              <Button variant="primary" className="w-full justify-center">
                <Home size={16} />
                <span>Back to Dashboard</span>
              </Button>
            </Link>

            <Link to="/tasks" className="w-full">
              <Button variant="outline" className="w-full justify-center">
                <CheckSquare size={16} />
                <span>Tasks Board</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
