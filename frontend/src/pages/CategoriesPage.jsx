import { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Tags, Plus, Trash2, Check } from 'lucide-react';

export const CategoriesPage = ({ categories = [], onCreateCategory, onDeleteCategory }) => {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#0d8a72');
  const [isCreating, setIsCreating] = useState(false);

  const colorPresets = [
    '#0d8a72', // Khademni Teal
    '#0284c7', // Sky Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber Gold
    '#f97316', // Orange
    '#ef4444', // Red
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#64748b', // Slate
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      await onCreateCategory({ name: name.trim(), color: selectedColor });
      setName('');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Categories & Labels
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Group your tasks by projects, domains, or urgency.
        </p>
      </div>

      {/* Add New Category - Full Width Top Block */}
      <Card className="p-5 sm:p-6 bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-xs">
        <div className="flex items-center gap-2 pb-3.5 mb-4 border-b border-slate-100 dark:border-slate-800">
          <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-[#0d8a72] dark:text-teal-400">
            <Tags size={18} />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
              Add New Category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Create a new category with a customized color tag to categorize your tasks.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-end gap-4">
          {/* Category Name Input */}
          <div className="flex-1">
            <Input
              label="Category Name"
              placeholder="e.g., Marketing, Backend, DevOps, Personal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          {/* Color Badge Selector */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Color Tag
            </label>
            <div className="flex items-center gap-2 flex-wrap py-1">
              {colorPresets.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 cursor-pointer shadow-2xs border-2"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? '#ffffff' : 'transparent',
                    boxShadow: selectedColor === color ? `0 0 0 2px ${color}` : undefined,
                  }}
                  title={color}
                >
                  {selectedColor === color && <Check size={14} className="text-white drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isCreating}
            className="gap-2 shrink-0 h-[42px] px-6"
          >
            <Plus size={16} />
            <span>Create Category</span>
          </Button>
        </form>
      </Card>

      {/* Categories in Full-Width List Style */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            All Categories ({categories.length})
          </h3>
        </div>

        {categories.length === 0 ? (
          <Card className="py-12 text-center text-slate-400 text-xs rounded-3xl">
            No categories created yet. Use the form above to add your first category.
          </Card>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800/80">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between p-4 sm:px-6 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0 shadow-2xs ring-2 ring-white dark:ring-slate-900"
                    style={{ backgroundColor: cat.color }}
                  />
                  <div className="flex items-center gap-3 truncate">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                      {cat.name}
                    </span>
                    <span
                      className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
                      style={{
                        backgroundColor: `${cat.color}15`,
                        borderColor: `${cat.color}35`,
                        color: cat.color,
                      }}
                    >
                      {cat.task_count || 0} active task{cat.task_count === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onDeleteCategory(cat.id)}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                    title="Delete category"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
