import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Calendar, AlertCircle, Check, Search } from 'lucide-react';

const colorPresets = [
  '#0d8a72', // Khademni Teal
  '#f59e0b', // Amber Gold
  '#0284c7', // Sky Blue
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
];

// Flat list of icons including Health, Training, Development, and Milestones
const GOAL_ICONS = [
  // Health
  { emoji: '🏃‍♂️', label: 'Running' },
  { emoji: '🍎', label: 'Nutrition' },
  { emoji: '💊', label: 'Wellness' },
  { emoji: '❤️', label: 'Heart' },
  { emoji: '🧘', label: 'Mindfulness' },
  { emoji: '💧', label: 'Hydration' },
  // Training
  { emoji: '🏋️‍♂️', label: 'Workout' },
  { emoji: '📚', label: 'Study' },
  { emoji: '🥋', label: 'Martial' },
  { emoji: '🎯', label: 'Target' },
  { emoji: '🥊', label: 'Boxing' },
  { emoji: '🚴', label: 'Cycling' },
  // Development & Execution
  { emoji: '💻', label: 'Coding' },
  { emoji: '🚀', label: 'Deploy' },
  { emoji: '⚡', label: 'Speed' },
  { emoji: '🛠️', label: 'Engineering' },
  { emoji: '🌐', label: 'Web' },
  { emoji: '🤖', label: 'AI' },
  // Milestones
  { emoji: '🏆', label: 'Victory' },
  { emoji: '🌟', label: 'Star' },
  { emoji: '📈', label: 'Growth' },
  { emoji: '💎', label: 'Prestige' },
  { emoji: '🔥', label: 'Streak' },
  { emoji: '💡', label: 'Idea' },
];

const GoalFormContent = ({ goal, tasks = [], onSubmit, onClose }) => {
  const [title, setTitle] = useState(goal?.title || '');
  const [description, setDescription] = useState(goal?.description || '');
  const [dueDate, setDueDate] = useState(() => {
    const rawDate = goal?.due_date || goal?.target_date;
    return rawDate ? new Date(rawDate).toISOString().split('T')[0] : '';
  });
  const [priority, setPriority] = useState(goal?.priority || 'MEDIUM');
  const [color, setColor] = useState(goal?.color || '#0d8a72');
  const [icon, setIcon] = useState(goal?.icon || '🎯');
  const [selectedTaskIds, setSelectedTaskIds] = useState(() => {
    if (!goal) return [];
    return tasks.filter((t) => t.goal_id === goal.id).map((t) => t.id);
  });
  const [taskSearch, setTaskSearch] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTask = (taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Goal title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: goal?.id,
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
        color,
        icon,
        task_ids: selectedTaskIds,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Title */}
      <Input
        label="Goal Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., Run 100km or Launch MVP V1"
        required
      />

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Goal Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What milestone will this goal accomplish?..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#0d8a72] focus:ring-2 focus:ring-[#0d8a72]/20"
        />
      </div>

      {/* Due Date & Priority Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Input
            label="Due Date"
            type="date"
            icon={Calendar}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-100 font-semibold focus:outline-none focus:border-[#0d8a72] focus:ring-2 focus:ring-[#0d8a72]/20"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Flat Goal Icons Grid (Health, Training, Dev, Milestones) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Goal Icon (Training, Health & Milestones)
          </label>
          <span className="text-xs font-bold text-[#0d8a72] dark:text-teal-400 flex items-center gap-1.5">
            <span>Selected:</span>
            <span className="text-base">{icon}</span>
          </span>
        </div>

        {/* Flat Icon Picker Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-2 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 max-h-48 overflow-y-auto">
          {GOAL_ICONS.map((item) => (
            <button
              key={item.emoji}
              type="button"
              onClick={() => setIcon(item.emoji)}
              className={`h-10 rounded-xl border text-lg flex items-center justify-center transition-all cursor-pointer ${
                icon === item.emoji
                  ? 'border-[#0d8a72] bg-teal-50 dark:bg-teal-950/40 ring-2 ring-[#0d8a72]/30 scale-105 shadow-2xs'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-400 bg-white dark:bg-slate-900'
              }`}
              title={item.label}
            >
              <span>{item.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Color Accent */}
      <div>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
          Badge Accent Color
        </label>
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          {colorPresets.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer"
              style={{ backgroundColor: c }}
            >
              {color === c && <Check size={14} className="text-white drop-shadow" />}
            </button>
          ))}
        </div>
      </div>

      {/* Assign Tasks Section */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Assign Tasks to this Goal</span>
          <span className="text-[11px] text-[#0d8a72] dark:text-teal-400 font-semibold">
            {selectedTaskIds.length} tasks selected
          </span>
        </label>

        {tasks.length > 0 && (
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              placeholder="Search tasks to assign..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#0d8a72] focus:ring-1 focus:ring-[#0d8a72]"
            />
          </div>
        )}

        <div className="max-h-40 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 flex flex-col gap-1.5 bg-slate-50/50 dark:bg-slate-950/30">
          {tasks.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No tasks available to assign.</p>
          ) : (
            (() => {
              const filtered = tasks.filter((task) =>
                task.title.toLowerCase().includes(taskSearch.toLowerCase())
              );
              if (filtered.length === 0) {
                return (
                  <p className="text-xs text-slate-400 text-center py-4">
                    No tasks match &ldquo;{taskSearch}&rdquo;
                  </p>
                );
              }
              return filtered.map((task) => {
                const isChecked = selectedTaskIds.includes(task.id);
                return (
                  <div
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer border ${
                      isChecked
                        ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800 text-slate-900 dark:text-slate-100 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="rounded text-[#0d8a72] focus:ring-[#0d8a72]"
                      />
                      <span className="truncate">{task.title}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        task.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {task.status.replace('_', ' ')}
                    </span>
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {goal ? 'Update Goal' : 'Create Goal'}
        </Button>
      </div>
    </form>
  );
};

export const GoalModal = ({ isOpen, onClose, onSubmit, goal = null, tasks = [] }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={goal ? 'Edit Goal' : 'Create New Goal'}
      maxWidth="max-w-xl"
    >
      <GoalFormContent
        key={goal?.id || 'new-goal'}
        goal={goal}
        tasks={tasks}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Modal>
  );
};
