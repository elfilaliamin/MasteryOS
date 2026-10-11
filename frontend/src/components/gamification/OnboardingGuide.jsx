import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Target,
  GraduationCap,
  CheckSquare,
  Flame,
  CheckCircle2,
  ArrowRight,
  Plus,
  Trophy,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  LayoutDashboard
} from 'lucide-react';
import { Button } from '../ui/Button';

export const OnboardingGuide = ({
  tasks = [],
  goals = [],
  courses = [],
  habits = [],
  onOpenNewGoal,
  onOpenNewCourse,
  onOpenNewTask,
  onOpenNewHabit,
  isCompact = false,
  onSwitchToDashboard
}) => {
  const navigate = useNavigate();
  const [showArchitectureDetails, setShowArchitectureDetails] = useState(!isCompact);

  // Evaluate the 4 starter quests dynamically
  const hasGoal = goals.length > 0;
  const hasCourse = courses.length > 0;
  const hasTask = tasks.length > 0;
  const hasHabit = habits.length > 0;

  const quests = [
    {
      id: 'quest-goal',
      pillar: 'Strategic Vision',
      title: 'Chart Your First Goal',
      description: 'Define an ambitious strategic milestone (e.g., "Launch Web App" or "Run 10K").',
      icon: Target,
      iconEmoji: '🎯',
      color: 'from-amber-500 to-orange-500',
      badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      xp: 50,
      isCompleted: hasGoal,
      actionText: hasGoal ? 'View Goals' : 'Create Goal',
      onAction: () => {
        if (hasGoal) {
          navigate('/goals');
        } else if (onOpenNewGoal) {
          onOpenNewGoal();
        } else {
          navigate('/goals');
        }
      }
    },
    {
      id: 'quest-course',
      pillar: 'Knowledge & Skills',
      title: 'Track Your First Course',
      description: 'Add a book, certification, or course to turn learning into measurable milestones.',
      icon: GraduationCap,
      iconEmoji: '📚',
      color: 'from-indigo-500 to-sky-500',
      badgeBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
      xp: 50,
      isCompleted: hasCourse,
      actionText: hasCourse ? 'View Courses' : 'Add Course',
      onAction: () => {
        if (hasCourse) {
          navigate('/courses');
        } else if (onOpenNewCourse) {
          onOpenNewCourse();
        } else {
          navigate('/courses');
        }
      }
    },
    {
      id: 'quest-task',
      pillar: 'Daily Execution',
      title: 'Create Your First Task',
      description: 'Define a high-priority action for today. Link it directly to a goal or course for maximum XP.',
      icon: CheckSquare,
      iconEmoji: '✅',
      color: 'from-teal-500 to-emerald-500',
      badgeBg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
      xp: 50,
      isCompleted: hasTask,
      actionText: hasTask ? 'View Tasks' : 'Create Task',
      onAction: () => {
        if (hasTask) {
          navigate('/tasks');
        } else if (onOpenNewTask) {
          onOpenNewTask();
        } else {
          navigate('/tasks');
        }
      }
    },
    {
      id: 'quest-habit',
      pillar: 'Daily Consistency',
      title: 'Build Your First Habit',
      description: 'Establish a recurring daily discipline (e.g., "Deep Work 1hr", "Morning Workout") and protect your streak.',
      icon: Flame,
      iconEmoji: '🔥',
      color: 'from-rose-500 to-amber-500',
      badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      xp: 50,
      isCompleted: hasHabit,
      actionText: hasHabit ? 'View Habits' : 'Set Habit',
      onAction: () => {
        if (hasHabit) {
          navigate('/habits');
        } else if (onOpenNewHabit) {
          onOpenNewHabit();
        } else {
          navigate('/habits');
        }
      }
    }
  ];

  const completedCount = quests.filter((q) => q.isCompleted).length;
  const totalQuests = quests.length;
  const progressPercent = Math.round((completedCount / totalQuests) * 100);
  const earnedXp = completedCount * 50;
  const totalAvailableXp = totalQuests * 50;
  const allCompleted = completedCount === totalQuests;

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in text-left">
      {/* 1. Welcome & Philosophy Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-[#0a443a] to-[#0d8a72] text-white p-5 sm:p-8 shadow-xl shadow-teal-950/20 border border-teal-700/30">
        {/* Ambient background glows */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-gradient-to-tr from-[#0d8a72] to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-900/40 shrink-0">
                <Sparkles className="text-white" size={26} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/90 text-amber-950 shadow-2xs">
                    Pathfinder Onboarding
                  </span>
                  <span className="text-xs text-teal-200 font-semibold hidden sm:inline-block">
                    Level 1 Starter Quest
                  </span>
                </div>
                <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white mt-1">
                  Welcome to MasteryOS
                </h1>
              </div>
            </div>

            {onSwitchToDashboard && completedCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSwitchToDashboard}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 self-start sm:self-auto cursor-pointer"
              >
                <LayoutDashboard size={15} />
                <span>Open Standard Workspace</span>
              </Button>
            )}
          </div>

          <div className="max-w-3xl">
            <p className="text-sm sm:text-base text-teal-50/90 leading-relaxed font-medium">
              MasteryOS is your unified personal operating system designed to turn long-term ambition into daily momentum.
              Instead of isolated todo lists, everything is interconnected through our <strong>Gamified Execution Engine</strong>:
            </p>
          </div>

          {/* Toggle Button for App Architecture Breakdown */}
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => setShowArchitectureDetails((prev) => !prev)}
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-300 hover:text-amber-200 transition-colors cursor-pointer bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl border border-white/15"
            >
              <HelpCircle size={15} />
              <span>{showArchitectureDetails ? 'Hide How MasteryOS Works' : 'How does MasteryOS connect everything?'}</span>
              {showArchitectureDetails ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>

          {/* 4 Pillars Architecture Breakdown (Mobile-optimized cards) */}
          {showArchitectureDetails && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1 animate-fade-in">
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎯</span>
                  <h4 className="text-sm font-bold text-white">1. Strategic Goals</h4>
                </div>
                <p className="text-xs text-teal-100/80 leading-relaxed">
                  Define your destination. Goals track percentage progress as assigned tasks are finished.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">📚</span>
                  <h4 className="text-sm font-bold text-white">2. Skill Courses</h4>
                </div>
                <p className="text-xs text-teal-100/80 leading-relaxed">
                  Master real knowledge. Track syllabus modules, log finished lessons, and store certificates.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✅</span>
                  <h4 className="text-sm font-bold text-white">3. Action Tasks</h4>
                </div>
                <p className="text-xs text-teal-100/80 leading-relaxed">
                  Execute daily. High-impact tasks linked to goals/courses award instant XP and push your ranks.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🔥</span>
                  <h4 className="text-sm font-bold text-white">4. Daily Habits</h4>
                </div>
                <p className="text-xs text-teal-100/80 leading-relaxed">
                  Build atomic discipline. Check off daily routines, protect streaks, and prevent burnout.
                </p>
              </div>
            </div>
          )}

          {/* Quest Completion Progress Bar */}
          <div className="p-4 rounded-2xl bg-black/25 backdrop-blur-md border border-white/10 flex flex-col gap-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" />
                <span className="font-bold text-white">Starter Quest Progress:</span>
                <span className="font-black text-amber-300">
                  {completedCount} of {totalQuests} Completed ({progressPercent}%)
                </span>
              </div>
              <div className="text-teal-200 font-semibold flex items-center gap-1.5">
                <Zap size={14} className="text-amber-400 fill-amber-400" />
                <span>Bounty: <strong>+{earnedXp} XP</strong> earned of +{totalAvailableXp} XP</span>
              </div>
            </div>

            <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-emerald-400 to-[#0d8a72] transition-all duration-500 shadow-sm"
                style={{ width: `${Math.max(progressPercent, 4)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* All Complete Celebration Banner */}
      {allCompleted && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/20">
              <CheckCircle2 size={26} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight">
                🎉 Congratulations! Starter Quests Completed!
              </h3>
              <p className="text-xs sm:text-sm text-emerald-800/90 dark:text-emerald-300 mt-0.5">
                You have set up all foundational pillars. Your unified workspace is now ready for deep execution!
              </p>
            </div>
          </div>
          {onSwitchToDashboard && (
            <Button
              variant="primary"
              size="md"
              onClick={onSwitchToDashboard}
              className="bg-emerald-600 hover:bg-emerald-700 text-white self-start sm:self-auto shrink-0 shadow-sm"
            >
              <LayoutDashboard size={16} />
              <span>Enter Workspace Dashboard</span>
            </Button>
          )}
        </div>
      )}

      {/* 2. The 4 Foundation Starter Quests */}
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span>Foundation Starter Quests</span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                {completedCount}/4 Done
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Complete each step to earn +50 XP and unlock your foundational productivity loop.
            </p>
          </div>
        </div>

        {/* Responsive Grid: 1 col on mobile, 2 col on tablet/desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quests.map((quest, index) => {
            const Icon = quest.icon;
            return (
              <div
                key={quest.id}
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-200 flex flex-col justify-between gap-4 text-left ${
                  quest.isCompleted
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 shadow-sm hover:border-teal-500/50 dark:hover:border-teal-500/50'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm bg-gradient-to-tr ${quest.color}`}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          Quest #{index + 1} • {quest.pillar}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight mt-0.5 truncate">
                        {quest.title}
                      </h3>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {quest.isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                        <CheckCircle2 size={13} className="text-emerald-600 dark:text-emerald-400" />
                        <span>Completed</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 shadow-2xs">
                        <Zap size={12} className="text-amber-500 fill-amber-500" />
                        <span>+50 XP</span>
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                  {quest.description}
                </p>

                {/* Footer with Quest Action Button (Touch-friendly >= 44px) */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
                    {quest.isCompleted ? '✓ Quest unlocked & claimed' : 'Reward: +50 XP'}
                  </span>

                  <button
                    type="button"
                    onClick={quest.onAction}
                    className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer shadow-xs ${
                      quest.isCompleted
                        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
                        : 'bg-[#0d8a72] hover:bg-[#0b7460] text-white hover:shadow-teal-900/20'
                    }`}
                  >
                    {!quest.isCompleted && <Plus size={15} />}
                    <span>{quest.actionText}</span>
                    {quest.isCompleted && <ArrowRight size={14} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
