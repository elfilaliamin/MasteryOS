import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Calendar, Clock, Tag, Target, GraduationCap, AlertCircle } from 'lucide-react';

const TaskFormContent = ({
  task,
  categories = [],
  goals = [],
  courses = [],
  onSubmit,
  onClose
}) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'TODO');
  const [priority, setPriority] = useState(task?.priority || 'MEDIUM');
  const [categoryId, setCategoryId] = useState(task?.category_id || '');
  const [goalId, setGoalId] = useState(task?.goal_id || '');
  const [courseId, setCourseId] = useState(task?.course_id || '');
  const [dueDate, setDueDate] = useState(() =>
    task?.due_date
      ? new Date(task.due_date).toISOString().split('T')[0]
      : ''
  );
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    task?.estimated_minutes != null ? task.estimated_minutes : ''
  );
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: task?.id,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        category_id: categoryId || null,
        goal_id: goalId || null,
        course_id: courseId || null,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        estimated_minutes: estimatedMinutes !== '' ? parseInt(estimatedMinutes, 10) || 0 : 0
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Title */}
      <Input
        label="Task Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., Complete Docker compose service definitions"
        required
      />

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Add details, checklists, or links..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#0d8a72] focus:ring-2 focus:ring-[#0d8a72]/20 transition-all resize-none"
        />
      </div>

      {/* Status & Priority Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] focus:ring-2 focus:ring-[#0d8a72]/20"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] focus:ring-2 focus:ring-[#0d8a72]/20"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Category, Goal & Course - Displayed in separate distinct lines */}
      <div className="flex flex-col gap-3.5 pt-1">
        {/* Category Line */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Tag size={13} className="text-[#0d8a72] dark:text-teal-400" />
            <span>Category</span>
          </label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] focus:ring-2 focus:ring-[#0d8a72]/20"
          >
            <option value="">No Category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Goal Line */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Target size={13} className="text-[#0d8a72] dark:text-teal-400" />
            <span>Assigned Goal</span>
          </label>
          <select
            value={goalId}
            onChange={(e) => setGoalId(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] focus:ring-2 focus:ring-[#0d8a72]/20"
          >
            <option value="">No Goal Assigned</option>
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.icon || '🎯'} {g.title}
              </option>
            ))}
          </select>
        </div>

        {/* Course Line */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <GraduationCap size={13} className="text-[#0d8a72] dark:text-teal-400" />
            <span>Assigned Course</span>
          </label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2.5 text-sm text-slate-900 dark:text-slate-200 focus:outline-none focus:border-[#0d8a72] focus:ring-2 focus:ring-[#0d8a72]/20"
          >
            <option value="">No Course Assigned</option>
            {courses.map((cr) => (
              <option key={cr.id} value={cr.id}>
                📚 {cr.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Due Date & Estimated Time */}
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

        <div>
          <Input
            label="Estimated Time (Minutes)"
            type="number"
            icon={Clock}
            value={estimatedMinutes}
            onChange={(e) => setEstimatedMinutes(e.target.value)}
            placeholder="e.g., 30"
            min="0"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting}>
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
};

export const TaskModal = ({
  isOpen,
  onClose,
  onSubmit,
  task = null,
  categories = [],
  goals = [],
  courses = []
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task ? 'Edit Task Details' : 'Create New Task'}
      maxWidth="max-w-xl"
    >
      <TaskFormContent
        key={task?.id || 'new-task'}
        task={task}
        categories={categories}
        goals={goals}
        courses={courses}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Modal>
  );
};
