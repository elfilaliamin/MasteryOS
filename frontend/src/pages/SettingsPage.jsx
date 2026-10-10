import { useState, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { useGamification } from '../context/useGamification';
import { api } from '../services/api';
import {
  User,
  Mail,
  Sun,
  Moon,
  Monitor,
  Sparkles,
  Trophy,
  Check,
  Lock,
  Save,
  Upload,
  Download,
  Database,
  Trash2,
  AlertTriangle,
  KeyRound,
  AlertCircle,
  Layout,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  FileJson,
  CheckCircle2,
} from 'lucide-react';
import { DEFAULT_DASHBOARD_CONFIG, normalizeDashboardConfig } from '../utils/dashboardConfig';

const SECTION_METADATA = {
  stats: { title: 'KPI Metrics & Summary Cards', icon: '📊', desc: 'Total tasks, completion rate, and active counts' },
  habits: { title: "Today's Habits & Streaks", icon: '🔥', desc: "Check today's active habits and streak progress" },
  urgent: { title: 'High & Urgent Priority Tasks', icon: '⚡', desc: 'Direct access to critical execution items' },
  deadlines: { title: 'Upcoming & Nearest Deadlines', icon: '📅', desc: 'Tasks sorted by nearest due date' },
  courses: { title: 'In-Progress Courses', icon: '🎓', desc: 'Active learning courses with quick +1 lesson progress' },
  goals: { title: 'Goals Progress', icon: '🎯', desc: 'Active milestones and task completion progress' },
};

export const SettingsPage = ({
  tasks = [],
  goals = [],
  courses = [],
  habits = [],
  categories = [],
  onResetData,
  onImportData,
}) => {
  const { user, updateProfile } = useAuth();
  const { theme, themeMode, selectThemeMode } = useTheme();
  const { playerStats, equippedTitleId, equipTitle } = useGamification();

  // Profile Form state
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.full_name || 'User')}`
  );
  const [savedSuccess, setSavedSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Sync state if user prop changes without causing cascading render warnings
  const [prevUser, setPrevUser] = useState(user);
  if (user && user !== prevUser) {
    setPrevUser(user);
    if (user.full_name) setFullName(user.full_name);
    if (user.email) setEmail(user.email);
    if (user.avatar_url) setAvatarUrl(user.avatar_url);
  }

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Notion-inspired Dashboard View Preferences state
  const [dashboardConfig, setDashboardConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('mastery_dashboard_config');
      const normalized = normalizeDashboardConfig(saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!parsed.order?.includes('habits') || parsed.showHabits === undefined) {
          localStorage.setItem('mastery_dashboard_config', JSON.stringify(normalized));
        }
      }
      return normalized;
    } catch {
      return DEFAULT_DASHBOARD_CONFIG;
    }
  });
  const [configSaved, setConfigSaved] = useState(false);

  // Achievement Track Tab
  const [activeTrack, setActiveTrack] = useState('tasks');

  // Avatar presets
  const avatarPresets = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley'];

  // Handle local file upload for profile picture
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      if (updateProfile) {
        await updateProfile(fullName, avatarUrl);
      } else {
        await api.updateProfile(fullName, avatarUrl);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } catch {
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 4000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getPasswordStrength = () => {
    if (!newPassword) return 0;
    let score = 0;
    if (newPassword.length >= 6) score++;
    if (newPassword.length >= 10) score++;
    if (/[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return score;
  };

  const strengthLabels = ['Too Weak', 'Weak', 'Good', 'Strong'];
  const strengthColors = ['bg-rose-500', 'bg-amber-500', 'bg-teal-500', 'bg-emerald-500'];

  // Notion-inspired dashboard view config handlers
  const toggleWidget = (propName) => {
    const updated = {
      ...dashboardConfig,
      [propName]: !dashboardConfig[propName],
    };
    setDashboardConfig(updated);
    localStorage.setItem('mastery_dashboard_config', JSON.stringify(updated));
    showConfigToast();
  };

  const moveSection = (index, direction) => {
    const newOrder = [...dashboardConfig.order];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const updated = { ...dashboardConfig, order: newOrder };
    setDashboardConfig(updated);
    localStorage.setItem('mastery_dashboard_config', JSON.stringify(updated));
    showConfigToast();
  };

  const resetDashboardConfig = () => {
    setDashboardConfig(DEFAULT_DASHBOARD_CONFIG);
    localStorage.setItem('mastery_dashboard_config', JSON.stringify(DEFAULT_DASHBOARD_CONFIG));
    showConfigToast();
  };

  const showConfigToast = () => {
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  // Reset Everything state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  // Export state
  const [exportSuccess, setExportSuccess] = useState(false);

  // Import state
  const [importPreview, setImportPreview] = useState(null);
  const [importMode, setImportMode] = useState('merge'); // 'merge' | 'replace'
  const [importError, setImportError] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const importFileInputRef = useRef(null);

  const handleExportData = () => {
    try {
      const exportPayload = {
        app: 'MasteryOS',
        version: '1.0',
        exported_at: new Date().toISOString(),
        user: {
          full_name: user?.full_name || '',
          email: user?.email || '',
        },
        dashboard_config: dashboardConfig,
        categories: categories || [],
        goals: goals || [],
        courses: courses || [],
        tasks: tasks || [],
        habits: habits || [],
        metadata: {
          task_count: tasks?.length || 0,
          goal_count: goals?.length || 0,
          course_count: courses?.length || 0,
          habit_count: habits?.length || 0,
          category_count: categories?.length || 0,
        }
      };

      const jsonStr = JSON.stringify(exportPayload, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `masteryos-backup-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } catch (err) {
      alert('Failed to export data: ' + err.message);
    }
  };

  const handleSelectImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError('');
    setImportSuccess(false);

    if (!file.name.toLowerCase().endsWith('.json')) {
      setImportError('Please select a valid JSON backup file (*.json).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Invalid JSON structure.');
        }

        const foundTasks = Array.isArray(parsed.tasks) ? parsed.tasks.length : 0;
        const foundGoals = Array.isArray(parsed.goals) ? parsed.goals.length : 0;
        const foundCourses = Array.isArray(parsed.courses) ? parsed.courses.length : 0;
        const foundHabits = Array.isArray(parsed.habits) ? parsed.habits.length : 0;
        const foundCategories = Array.isArray(parsed.categories) ? parsed.categories.length : 0;

        if (foundTasks === 0 && foundGoals === 0 && foundCourses === 0 && foundHabits === 0 && foundCategories === 0) {
          setImportError('No valid MasteryOS tasks, goals, courses, or habits found in this file.');
          setImportPreview(null);
          return;
        }

        setImportPreview({
          filename: file.name,
          data: parsed,
          counts: {
            tasks: foundTasks,
            goals: foundGoals,
            courses: foundCourses,
            habits: foundHabits,
            categories: foundCategories,
          }
        });
      } catch (err) {
        setImportError('Error parsing backup file: ' + err.message);
        setImportPreview(null);
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (!importPreview?.data) return;
    setIsImporting(true);
    setImportError('');
    try {
      if (onImportData) {
        await onImportData(importPreview.data, importMode);
      }
      setImportSuccess(true);
      setImportPreview(null);
      if (importFileInputRef.current) {
        importFileInputRef.current.value = '';
      }
      setTimeout(() => setImportSuccess(false), 5000);
    } catch (err) {
      setImportError('Import failed: ' + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleExecuteReset = async () => {
    setIsResetting(true);
    try {
      if (onResetData) {
        await onResetData();
      } else {
        await api.resetUserData();
      }
      setIsResetModalOpen(false);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 5000);
    } catch (err) {
      alert('Failed to reset data: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  // Filter achievements by current track
  const trackAchievements = playerStats.achievements.filter((a) => a.track === activeTrack);

  return (
    <div className="flex flex-col gap-6 text-left">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Settings & Executive Preferences
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Customize your profile, configure dashboard views, and manage achievements.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): Profile, Password & Dashboard Config */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Profile Form */}
          <Card className="flex flex-col gap-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <User size={18} className="text-[#0d8a72]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Profile Information
                </h3>
              </div>
              {savedSuccess && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check size={14} /> Saved successfully
                </span>
              )}
            </div>

            <form onSubmit={handleProfileSubmit} className="flex flex-col gap-4">
              {/* Profile Photo Section */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
                <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#0d8a72] shadow-sm shrink-0 bg-white dark:bg-slate-800">
                  <img
                    src={avatarUrl}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1.5"
                    >
                      <Upload size={14} />
                      <span>Upload Photo</span>
                    </Button>
                    <span className="text-[11px] text-slate-400">PNG, JPG, WebP</span>
                  </div>

                  {/* Preset Avatars */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400 font-semibold">Presets:</span>
                    {avatarPresets.map((seed) => {
                      const url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
                      const isSelected = avatarUrl === url;
                      return (
                        <button
                          key={seed}
                          type="button"
                          onClick={() => setAvatarUrl(url)}
                          className={`w-7 h-7 rounded-lg border-2 transition-all p-0.5 overflow-hidden cursor-pointer ${
                            isSelected
                              ? 'border-[#0d8a72] scale-105 shadow-sm'
                              : 'border-slate-200 dark:border-slate-700 hover:border-teal-400'
                          }`}
                        >
                          <img src={url} alt={seed} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  icon={User}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" className="gap-2">
                  <Save size={16} />
                  <span>Save Profile</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Dashboard View Preferences */}
          <Card className="flex flex-col gap-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Layout size={18} className="text-[#0d8a72] dark:text-teal-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Dashboard View Customizer
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Control which widgets appear on your dashboard and reorder sections.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {configSaved && (
                  <span className="text-[11px] font-bold text-emerald-500 animate-pulse">
                    Saved!
                  </span>
                )}
                <button
                  type="button"
                  onClick={resetDashboardConfig}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title="Reset to default order"
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Reorder and Toggle Controls */}
            <div className="flex flex-col gap-2.5">
              {dashboardConfig.order.map((key, index) => {
                const meta = SECTION_METADATA[key];
                if (!meta) return null;

                const propMap = {
                  habits: 'showHabits',
                  stats: 'showStats',
                  urgent: 'showUrgentTasks',
                  deadlines: 'showDeadlines',
                  courses: 'showActiveCourses',
                  goals: 'showGoalsOverview',
                };
                const isVisible = dashboardConfig[propMap[key]];

                return (
                  <div
                    key={key}
                    className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                      isVisible
                        ? 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
                        : 'opacity-50 bg-slate-100/50 dark:bg-slate-900/40 border-dashed border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl shrink-0">{meta.icon}</span>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            {meta.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono">#{index + 1}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{meta.desc}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Reorder Buttons */}
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveSection(index, -1)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        disabled={index === dashboardConfig.order.length - 1}
                        onClick={() => moveSection(index, 1)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown size={14} />
                      </button>

                      {/* Visibility Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => toggleWidget(propMap[key])}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          isVisible ? 'bg-[#0d8a72]' : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        title={isVisible ? 'Hide from Dashboard' : 'Show on Dashboard'}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                            isVisible ? 'left-6' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Change Password Card */}
          <Card className="flex flex-col gap-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-[#0d8a72]" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Security & Password
                </h3>
              </div>
              {passwordSuccess && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <Check size={14} /> Password updated successfully
                </span>
              )}
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                <AlertCircle size={16} />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
              <Input
                label="Current Password"
                type="password"
                icon={Lock}
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <Input
                    label="New Password"
                    type="password"
                    icon={Lock}
                    placeholder="Enter new password (min. 6 chars)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />

                  {newPassword && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4].map((step) => (
                          <div
                            key={step}
                            className={`flex-1 h-full rounded-full ${
                              getPasswordStrength() >= step
                                ? strengthColors[getPasswordStrength() - 1]
                                : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {strengthLabels[getPasswordStrength() - 1] || 'Weak'}
                      </span>
                    </div>
                  )}
                </div>

                <Input
                  label="Confirm New Password"
                  type="password"
                  icon={Lock}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isChangingPassword}
                  className="gap-2"
                >
                  <KeyRound size={16} />
                  <span>Update Password</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Data Management: Export & Import */}
          <Card className="flex flex-col gap-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-[#0d8a72] dark:text-teal-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Data Backup & Migration
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                JSON Format
              </span>
            </div>

            {/* Export Sub-Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Download size={15} className="text-[#0d8a72] dark:text-teal-400" />
                  <span>Export All Application Data</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Download a complete backup containing {tasks.length} tasks, {goals.length} goals, {courses.length} courses, {habits.length} habits, and categories.
                </p>
                {exportSuccess && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={13} /> Backup exported successfully to your downloads!
                  </span>
                )}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <Download size={14} />
                <span>Export JSON</span>
              </Button>
            </div>

            {/* Import Sub-Section */}
            <div className="flex flex-col gap-3 p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800">
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Upload size={15} className="text-[#0d8a72] dark:text-teal-400" />
                  <span>Import & Restore Data</span>
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload a previously exported MasteryOS JSON file to import tasks, goals, courses, and habits into your account.
                </p>
              </div>

              {/* Hidden file input */}
              <input
                ref={importFileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleSelectImportFile}
                className="hidden"
              />

              {!importPreview ? (
                <div className="flex items-center gap-3 pt-1">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => importFileInputRef.current?.click()}
                    className="gap-2 cursor-pointer"
                  >
                    <FileJson size={14} className="text-[#0d8a72]" />
                    <span>Select Backup File (.json)</span>
                  </Button>
                  <span className="text-[11px] text-slate-400">No file selected</span>
                </div>
              ) : (
                /* Import Preview Box */
                <div className="flex flex-col gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-teal-500/40 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileJson size={16} className="text-[#0d8a72]" />
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-xs">
                        {importPreview.filename}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setImportPreview(null);
                        if (importFileInputRef.current) importFileInputRef.current.value = '';
                      }}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Change file
                    </button>
                  </div>

                  {/* Detected items summary chips */}
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-[#0d8a72] dark:text-teal-300 font-semibold border border-teal-200 dark:border-teal-800">
                      {importPreview.counts.tasks} Tasks
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-semibold border border-sky-200 dark:border-sky-800">
                      {importPreview.counts.goals} Goals
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-semibold border border-purple-200 dark:border-purple-800">
                      {importPreview.counts.courses} Courses
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
                      {importPreview.counts.habits} Habits
                    </span>
                  </div>

                  {/* Mode selector: Merge vs Replace */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Import Mode:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                        importMode === 'merge'
                          ? 'border-[#0d8a72] bg-teal-50/50 dark:bg-teal-950/30 text-slate-900 dark:text-slate-100 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <input
                          type="radio"
                          name="importMode"
                          value="merge"
                          checked={importMode === 'merge'}
                          onChange={() => setImportMode('merge')}
                          className="accent-[#0d8a72]"
                        />
                        <span>Merge with current data</span>
                      </label>

                      <label className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition-colors ${
                        importMode === 'replace'
                          ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 text-slate-900 dark:text-slate-100 font-semibold'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                        <input
                          type="radio"
                          name="importMode"
                          value="replace"
                          checked={importMode === 'replace'}
                          onChange={() => setImportMode('replace')}
                          className="accent-rose-500"
                        />
                        <span>Replace existing data</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={isImporting}
                      onClick={handleExecuteImport}
                      className="gap-2 cursor-pointer"
                    >
                      <Upload size={14} />
                      <span>{importMode === 'replace' ? 'Replace & Restore Data' : 'Merge & Import Data'}</span>
                    </Button>
                  </div>
                </div>
              )}

              {importError && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  <AlertCircle size={15} />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 size={15} />
                  <span>Data backup imported and synced successfully!</span>
                </div>
              )}
            </div>
          </Card>

          {/* Danger Zone: Reset Everything */}
          <Card className="flex flex-col gap-4 border-rose-200/90 dark:border-rose-900/40 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-rose-100 dark:border-rose-950/60">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Trash2 size={18} />
                <h3 className="text-sm font-bold">
                  Danger Zone: Reset Everything
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                Destructive
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
              <div className="flex flex-col gap-1">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Reset All Tasks, Goals, Courses & Habits
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Permanently wipe all operational records, activity logs, streaks, and reset your gamification XP back to Level 1. This cannot be undone.
                </p>
                {resetSuccess && (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                    <CheckCircle2 size={13} /> All application data was successfully reset to a clean slate.
                  </span>
                )}
              </div>

              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setIsResetModalOpen(true)}
                className="gap-2 shrink-0 cursor-pointer self-start sm:self-auto"
              >
                <Trash2 size={14} />
                <span>Reset Everything</span>
              </Button>
            </div>
          </Card>
        </div>

        {/* Right Column (1 col): Separated Serious Mastery Tracks & Theme Toggle */}
        <div className="flex flex-col gap-6">
          {/* Theme Mode Toggle Box */}
          <Card className="flex flex-col gap-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                {theme === 'dark' ? (
                  <Moon size={18} className="text-teal-400" />
                ) : (
                  <Sun size={18} className="text-amber-500" />
                )}
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Display Theme
                </h3>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                {themeMode === 'system' ? 'Auto (OS)' : theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
              <button
                type="button"
                onClick={() => selectThemeMode('light')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Sun size={14} className="text-amber-500 shrink-0" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => selectThemeMode('dark')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  themeMode === 'dark'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Moon size={14} className="text-teal-400 shrink-0" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => selectThemeMode('system')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  themeMode === 'system'
                    ? 'bg-teal-50 dark:bg-slate-700 text-[#0d8a72] dark:text-teal-300 shadow-xs'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <Monitor size={14} className="text-slate-500 dark:text-slate-400 shrink-0" />
                <span>System</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {themeMode === 'system'
                ? `Automatically matches your browser and system preferences (currently ${theme}).`
                : theme === 'dark'
                ? 'Soft, eye-friendly dark palette tuned for reduced eye fatigue.'
                : 'Clean, high-clarity daylight theme.'}
            </p>
          </Card>

          {/* Executive Mastery & Next Unlock (Psychological Goal-Gradient Effect) */}
          <Card className="flex flex-col gap-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-[#0d8a72] dark:text-teal-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Executive Standing
                </h3>
              </div>
              <span className="text-xs font-bold text-amber-500">
                Level {playerStats.level}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 rounded-2xl bg-teal-50 dark:bg-slate-800 border border-teal-100 dark:border-slate-700">
                {playerStats.levelIcon}
              </span>
              <div>
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  {playerStats.levelTitle}
                </h4>
                <p className="text-xs text-slate-500">
                  {playerStats.totalXp} Total XP Earned
                </p>
              </div>
            </div>

            {/* Next Milestone Goal-Gradient Preview */}
            <div className="p-3 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-900/60">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-teal-900 dark:text-teal-200">
                  Next: {playerStats.nextLevelTitle}
                </span>
                <span className="text-[#0d8a72] dark:text-teal-400">
                  {playerStats.progressPercent}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0d8a72] rounded-full transition-all duration-300"
                  style={{ width: `${playerStats.progressPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                {playerStats.xpToNextLevel} XP remaining until advancement
              </p>
            </div>

            {/* Next Title Unlock Preview */}
            {playerStats.nextTitleToUnlock && (
              <div className="p-3 rounded-2xl border border-dashed border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20 text-left">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <span>{playerStats.nextTitleToUnlock.icon}</span>
                  <span>Next Title: {playerStats.nextTitleToUnlock.name}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Requirement: {playerStats.nextTitleToUnlock.description}
                </p>
              </div>
            )}
          </Card>

          {/* Separated Tracks for Achievements (Tasks, Goals, Courses) */}
          <Card className="flex flex-col gap-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Trophy size={18} className="text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Mastery Tracks
                </h3>
              </div>
            </div>

            {/* 3 Domain Track Switcher */}
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setActiveTrack('tasks')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTrack === 'tasks'
                    ? 'bg-white dark:bg-slate-700 text-[#0d8a72] dark:text-teal-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tasks
              </button>
              <button
                type="button"
                onClick={() => setActiveTrack('goals')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTrack === 'goals'
                    ? 'bg-white dark:bg-slate-700 text-[#0d8a72] dark:text-teal-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Goals
              </button>
              <button
                type="button"
                onClick={() => setActiveTrack('courses')}
                className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTrack === 'courses'
                    ? 'bg-white dark:bg-slate-700 text-[#0d8a72] dark:text-teal-300 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Courses
              </button>
            </div>

            {/* Track Achievements List with Progress */}
            <div className="flex flex-col gap-2.5">
              {trackAchievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`p-3 rounded-2xl border text-xs text-left transition-all ${
                    ach.isUnlocked
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{ach.icon}</span>
                      <div>
                        <h5 className="font-bold text-slate-900 dark:text-slate-100">
                          {ach.title}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {ach.description}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                        ach.isUnlocked
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {ach.isUnlocked ? 'Unlocked' : `+${ach.xpReward} XP`}
                    </span>
                  </div>

                  {/* Progress towards unlock */}
                  {!ach.isUnlocked && ach.target && (
                    <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1">
                        <span>Progress</span>
                        <span>
                          {Math.min(ach.target, ach.currentValue || 0)} / {ach.target}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round(((ach.currentValue || 0) / ach.target) * 100)
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Equip Titles Section */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Equipped Title
              </h5>
              <div className="grid grid-cols-1 gap-2">
                {playerStats.unlockedTitles.map((t) => {
                  const isEquipped = equippedTitleId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => equipTitle(t.id)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        isEquipped
                          ? 'bg-teal-50 dark:bg-teal-950/40 border-[#0d8a72] text-slate-900 dark:text-slate-100 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{t.icon}</span>
                        <span>{t.name}</span>
                      </div>
                      {isEquipped ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0d8a72] text-white">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Equip</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Reset Everything Confirmation Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Reset All Application Data?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  This action is permanent and cannot be reversed.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
              You are about to delete <strong>{tasks.length} tasks</strong>, <strong>{goals.length} goals</strong>, <strong>{courses.length} courses</strong>, and <strong>{habits.length} habits</strong>. All completion history, streaks, and XP will be reset back to Level 1.
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              We recommend clicking <strong>Export JSON</strong> first if you wish to retain a backup file.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                isLoading={isResetting}
                onClick={handleExecuteReset}
                className="gap-2 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Yes, Reset Everything</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
