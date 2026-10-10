import { useState } from 'react';
import { Badge } from '../ui/Badge';
import { Calendar, Clock, Edit2, Trash2, ArrowRight, GripVertical } from 'lucide-react';

export const TaskCard = ({
  task,
  onEdit,
  onDelete,
  onStatusChange,
  isDraggable = true,
  onDragStart,
  onDragEnd,
}) => {
  const [isLocalDragging, setIsLocalDragging] = useState(false);
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'COMPLETED';

  const nextStatusMap = {
    TODO: 'IN_PROGRESS',
    IN_PROGRESS: 'IN_REVIEW',
    IN_REVIEW: 'COMPLETED',
    COMPLETED: 'TODO',
  };

  const nextStatusLabel = {
    TODO: 'Start',
    IN_PROGRESS: 'Review',
    IN_REVIEW: 'Complete',
    COMPLETED: 'Reopen',
  };

  const handleDragStart = (e) => {
    if (!isDraggable) return;
    setIsLocalDragging(true);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
    if (onDragStart) onDragStart(task);
  };

  const handleDragEnd = () => {
    setIsLocalDragging(false);
    if (onDragEnd) onDragEnd(task);
  };

  return (
    <div
      draggable={isDraggable}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-xs transition-all duration-200 flex flex-col gap-3 group text-left select-none ${
        isLocalDragging
          ? 'opacity-30 border-2 border-dashed border-[#0d8a72] dark:border-teal-400 scale-[0.98]'
          : 'border-slate-200/90 dark:border-slate-800 hover:border-[#0d8a72]/40 dark:hover:border-teal-500/40 hover:shadow-md cursor-grab active:cursor-grabbing'
      }`}
    >
      {/* Top Row: Category, Goal, Priority & Drag Grip */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Draggable grip indicator */}
          <div
            className="text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 -ml-1 transition-colors cursor-grab"
            title="Drag to change status"
          >
            <GripVertical size={14} />
          </div>

          {task.category_name && (
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-md border"
              style={{
                backgroundColor: `${task.category_color || '#0d8a72'}15`,
                borderColor: `${task.category_color || '#0d8a72'}40`,
                color: task.category_color || '#0d8a72',
              }}
            >
              {task.category_name}
            </span>
          )}
          {task.goal_title && (
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1"
              style={{
                backgroundColor: `${task.goal_color || '#f59e0b'}15`,
                borderColor: `${task.goal_color || '#f59e0b'}40`,
                color: task.goal_color || '#d97706',
              }}
            >
              <span>{task.goal_icon || '🎯'}</span>
              <span>{task.goal_title}</span>
            </span>
          )}
          {task.course_title && (
            <span
              className="text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400"
            >
              <span>📚</span>
              <span className="truncate max-w-[120px]">{task.course_title}</span>
            </span>
          )}
          <Badge variant={task.priority} size="xs">
            {task.priority}
          </Badge>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            draggable={false}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(task);
            }}
            className="p-1.5 text-slate-400 hover:text-[#0d8a72] dark:hover:text-teal-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Edit task"
          >
            <Edit2 size={13} />
          </button>
          <button
            type="button"
            draggable={false}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(task.id);
            }}
            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Delete task"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Task Title & Description */}
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#0d8a72] dark:group-hover:text-teal-400 transition-colors line-clamp-2">
          {task.title}
        </h4>
        {task.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}
      </div>

      {/* Metadata & Progress Advance */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          {task.due_date && (
            <span
              className={`flex items-center gap-1 font-semibold ${
                isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Calendar size={12} />
              <span>
                {new Date(task.due_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </span>
          )}

          {task.estimated_minutes > 0 && (
            <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <Clock size={12} />
              <span>{task.estimated_minutes}m</span>
            </span>
          )}
        </div>

        {/* Move to next column button */}
        {onStatusChange && (
          <button
            type="button"
            draggable={false}
            onClick={(e) => {
              e.stopPropagation();
              onStatusChange(task.id, nextStatusMap[task.status]);
            }}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#0d8a72] dark:text-teal-300 hover:text-white bg-teal-50 dark:bg-teal-950/40 hover:bg-[#0d8a72] dark:hover:bg-[#0d8a72] rounded-lg border border-teal-200 dark:border-teal-800/60 transition-all cursor-pointer"
            title={`Advance to ${nextStatusMap[task.status]}`}
          >
            <span>{nextStatusLabel[task.status]}</span>
            <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  );
};
