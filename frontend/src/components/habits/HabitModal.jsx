import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { AlertCircle, Check, Clock, Trash2 } from 'lucide-react';

const colorPresets = [
  '#0d8a72', // Khademni Teal
  '#10b981', // Emerald
  '#0284c7', // Sky Blue
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#6366f1', // Indigo
];

const HABIT_ICONS = [
  { emoji: '💧', label: 'Hydration' },
  { emoji: '🏃', label: 'Running' },
  { emoji: '🧘', label: 'Meditation' },
  { emoji: '💻', label: 'Coding' },
  { emoji: '📚', label: 'Reading' },
  { emoji: '🥗', label: 'Healthy Meal' },
  { emoji: '🌅', label: 'Early Rise' },
  { emoji: '💤', label: 'Sleep Quality' },
  { emoji: '✍️', label: 'Journaling' },
  { emoji: '⚡', label: 'Energy Sprint' },
  { emoji: '🏋️‍♂️', label: 'Gym Workout' },
  { emoji: '🚴', label: 'Cycling' },
  { emoji: '🍎', label: 'Nutrition' },
  { emoji: '🧠', label: 'Mindset' },
  { emoji: '🚶', label: '10K Steps' },
  { emoji: '🍵', label: 'Green Tea' },
  { emoji: '🎯', label: 'Focus' },
  { emoji: '🔋', label: 'Recharge' },
];

const TIME_OF_DAY_OPTIONS = [
  { value: 'ANYTIME', label: 'Anytime', icon: '☀️' },
  { value: 'MORNING', label: 'Morning', icon: '🌅' },
  { value: 'AFTERNOON', label: 'Afternoon', icon: '🌤️' },
  { value: 'EVENING', label: 'Evening', icon: '🌙' },
];

const FREQUENCY_OPTIONS = [
  { value: 'DAILY', label: 'Every Day (Daily)' },
  { value: 'WEEKDAYS', label: 'Weekdays (Mon-Fri)' },
  { value: 'WEEKENDS', label: 'Weekends (Sat-Sun)' },
];

const HabitFormContent = ({ habit, onSubmit, onDelete, onClose }) => {
  const [title, setTitle] = useState(habit?.title || '');
  const [description, setDescription] = useState(habit?.description || '');
  const [icon, setIcon] = useState(habit?.icon || '💧');
  const [color, setColor] = useState(habit?.color || '#0d8a72');
  const [timeOfDay, setTimeOfDay] = useState(habit?.time_of_day || 'ANYTIME');
  const [frequency, setFrequency] = useState(habit?.frequency || 'DAILY');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDelete = () => {
    if (!habit?.id || !onDelete) return;
    if (window.confirm(`Are you sure you want to delete "${habit.title}"? This will permanently remove its streak logs.`)) {
      onDelete(habit.id);
      onClose();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Habit title is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSubmit({
        id: habit?.id,
        title: title.trim(),
        description: description.trim(),
        icon,
        color,
        time_of_day: timeOfDay,
        frequency,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save habit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Habit Title *
        </label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Morning 2L Hydration, Read 20 Pages..."
          required
          autoFocus
        />
      </div>

      {/* Description / Why */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Purpose or Motivation (Optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Why does this habit matter to you? (e.g. Elevates focus and cognitive clarity)"
          rows={2}
          className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d8a72] transition-colors resize-none"
        />
      </div>

      {/* Icon Picker */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Habit Icon
        </label>
        <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {HABIT_ICONS.map((item) => (
            <button
              key={item.emoji}
              type="button"
              onClick={() => setIcon(item.emoji)}
              className={`h-9 w-9 rounded-lg flex items-center justify-center text-lg transition-all cursor-pointer ${
                icon === item.emoji
                  ? 'bg-white dark:bg-slate-800 shadow-md ring-2 ring-[#0d8a72] scale-105'
                  : 'hover:bg-white/60 dark:hover:bg-slate-800/60 opacity-80 hover:opacity-100'
              }`}
              title={item.label}
            >
              {item.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Time of Day & Frequency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Clock size={13} className="text-slate-400" />
            <span>Time of Day</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {TIME_OF_DAY_OPTIONS.map((tod) => (
              <button
                key={tod.value}
                type="button"
                onClick={() => setTimeOfDay(tod.value)}
                className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  timeOfDay === tod.value
                    ? 'border-[#0d8a72] bg-teal-50 dark:bg-teal-950/40 text-[#0d8a72] dark:text-teal-300 font-bold'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <span>{tod.icon}</span>
                <span>{tod.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Frequency
          </label>
          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#0d8a72] transition-colors"
          >
            {FREQUENCY_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Color Accent */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Theme Accent
        </label>
        <div className="flex items-center gap-2 flex-wrap">
          {colorPresets.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-sm"
              style={{ backgroundColor: c }}
            >
              {color === c && <Check size={14} className="text-white drop-shadow-md" />}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
        {habit?.id && onDelete ? (
          <button
            type="button"
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <Trash2 size={14} />
            <span>Delete Habit</span>
          </button>
        ) : <div />}

        <div className="flex items-center gap-2">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : habit ? 'Update Habit' : 'Create Habit'}
          </Button>
        </div>
      </div>
    </form>
  );
};

export const HabitModal = ({ isOpen, onClose, onSubmit, onDelete, habit }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={habit ? 'Edit Habit' : 'Create New Habit'}
      maxWidth="max-w-md"
    >
      <HabitFormContent
        key={habit?.id || 'new'}
        habit={habit}
        onSubmit={onSubmit}
        onDelete={onDelete}
        onClose={onClose}
      />
    </Modal>
  );
};
