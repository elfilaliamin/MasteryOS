import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  Tags,
  BarChart3,
  Target,
  GraduationCap,
  Settings,
  LogOut,
  Sun,
  Moon,
  Sparkles,
  Flame,
  Zap,
  X
} from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../context/useTheme';
import { useGamification } from '../../context/useGamification';

export const Sidebar = ({ isMobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { playerStats, isLoading } = useGamification();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isMobileOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCloseMobile?.();
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 768) {
        onCloseMobile?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleResize);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleResize);
    };
  }, [isMobileOpen, onCloseMobile]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Focus Mode', path: '/focus', icon: Zap },
    { name: 'Habits Tracker', path: '/habits', icon: Flame },
    { name: 'Goals & Milestones', path: '/goals', icon: Target },
    { name: 'Courses Tracker', path: '/courses', icon: GraduationCap },
    { name: 'Tasks Board', path: '/tasks', icon: CheckSquare },
    { name: 'Categories', path: '/categories', icon: Tags },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Settings & Profile', path: '/settings', icon: Settings },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800 w-64 p-5 select-none transition-colors overflow-y-auto">
      {/* Brand Header inspired by Khademni */}
      <div className="flex items-center justify-between px-2 py-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#0d8a72] to-emerald-500 flex items-center justify-center shadow-md shadow-teal-700/20">
            <Sparkles className="text-white" size={20} />
          </div>
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-lg font-black text-[#0d8a72] dark:text-teal-400 tracking-tight">Mastery</span>
              <span className="text-lg font-black text-amber-500 tracking-tight">OS</span>
            </div>
            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold tracking-wider uppercase block -mt-1">
              Pro Version
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Theme quick switch */}
          <button
            onClick={toggleTheme}
            className="hidden md:inline-flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isDark ? 'Light Mode' : 'Dark Mode'}
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? <Sun size={16} className="text-amber-400" /> : <Moon size={16} className="text-[#0d8a72]" />}
          </button>

          {/* Close button on mobile */}
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer md:hidden"
            title="Close menu"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? 'bg-[#0d8a72] text-white shadow-sm shadow-teal-900/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`
              }
            >
              <Icon size={18} />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info & Gamification Summary */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto flex flex-col gap-3">
        <NavLink
          to="/settings"
          onClick={onCloseMobile}
          className="flex items-center gap-3 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 hover:border-teal-500/50 transition-all text-left group"
        >
          <div className="relative">
            <img
              src={user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.full_name || 'Alex')}`}
              alt="User avatar"
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.full_name || 'Alex')}`;
              }}
            />
            <span className="absolute -bottom-1 -right-1 text-[10px] font-bold px-1 rounded-full bg-teal-600 text-white">
              {isLoading ? '•' : playerStats.level}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate leading-tight group-hover:text-[#0d8a72] transition-colors">
              {user?.full_name || 'Alex Mercer'}
            </p>
            <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium truncate">
              {playerStats.activeTitle?.name || 'Novice Tasker'}
            </p>
          </div>
        </NavLink>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all cursor-pointer"
        >
          <LogOut size={16} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex flex-col h-screen sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
        >
          <div
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full max-w-[85vw] flex flex-col shadow-2xl animate-fade-in">
            {sidebarContent}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
