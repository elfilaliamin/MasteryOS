import { useState, useRef } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { BookOpen, Upload, Link as LinkIcon, FileText, AlertCircle, X, Sparkles, Search } from 'lucide-react';

const CourseFormContent = ({ course, tasks = [], onSubmit, onClose }) => {
  const [title, setTitle] = useState(course?.title || '');
  const [description, setDescription] = useState(course?.description || '');
  const [coverType, setCoverType] = useState(() => {
    if (course?.cover_image?.startsWith('data:')) return 'upload';
    return 'url';
  });
  const [coverImage, setCoverImage] = useState(course?.cover_image || '');
  const [coverUrlInput, setCoverUrlInput] = useState(() => {
    return course?.cover_image && !course.cover_image.startsWith('data:') ? course.cover_image : '';
  });
  const [totalLessons, setTotalLessons] = useState(() => {
    return course?.total_lessons != null ? String(course.total_lessons) : '';
  });
  const [finishedLessons, setFinishedLessons] = useState(() => {
    return course?.finished_lessons != null ? String(course.finished_lessons) : '';
  });
  const [certType, setCertType] = useState(course?.certification_filename ? 'file' : 'url');
  const [certUrl, setCertUrl] = useState(course?.certification_url || '');
  const [certFilename, setCertFilename] = useState(course?.certification_filename || '');
  const [selectedTaskIds, setSelectedTaskIds] = useState(() => {
    if (!course) return [];
    return tasks.filter((t) => t.course_id === course.id).map((t) => t.id);
  });
  const [taskSearch, setTaskSearch] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);
  const certFileInputRef = useRef(null);

  // Cover image file upload handler
  const handleCoverFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCoverImage(reader.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  // Certificate PDF file upload handler
  const handleCertFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      setError('Please select a PDF document for certificate.');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('PDF must be under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCertUrl(reader.result);
      setCertFilename(file.name);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const toggleTask = (taskId) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Course title is required');
      return;
    }

    const parsedTotal = totalLessons !== '' && totalLessons !== null && !isNaN(totalLessons)
      ? Math.max(0, parseInt(totalLessons, 10))
      : null;

    const parsedFinished = finishedLessons !== '' && finishedLessons !== null && !isNaN(finishedLessons)
      ? Math.max(0, parseInt(finishedLessons, 10))
      : null;

    const finalFinished = (parsedTotal !== null && parsedFinished !== null)
      ? Math.min(parsedTotal, parsedFinished)
      : parsedFinished;

    const activeCover = coverType === 'upload' ? coverImage : (coverUrlInput.trim() || null);

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: course?.id,
        title: title.trim(),
        description: description.trim(),
        cover_image: activeCover,
        total_lessons: parsedTotal,
        finished_lessons: finalFinished,
        certification_url: certUrl.trim() || null,
        certification_filename: certFilename.trim() || null,
        task_ids: selectedTaskIds,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save course');
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewCover = coverType === 'upload' ? coverImage : coverUrlInput;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Course Title */}
      <Input
        label="Course Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g., Complete Docker & Kubernetes Bootcamp"
        required
      />

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Course Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What skills will you learn or teach in this course?..."
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#0d8a72] focus:ring-2 focus:ring-[#0d8a72]/20"
        />
      </div>

      {/* Cover Image Section - 2 Clean Types: Upload or Direct Link */}
      <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
            Course Cover Image
          </label>
          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setCoverType('upload')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                coverType === 'upload'
                  ? 'bg-[#0d8a72] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => setCoverType('url')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                coverType === 'url'
                  ? 'bg-[#0d8a72] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Direct Link
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-1">
          {/* Cover Preview */}
          <div className="relative w-28 h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shrink-0 shadow-xs">
            {previewCover ? (
              <img
                src={previewCover}
                alt="Course cover preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <BookOpen size={24} />
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {coverType === 'upload' ? (
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverFileUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-1.5 text-xs font-bold"
                >
                  <Upload size={14} />
                  <span>{coverImage ? 'Change Image File' : 'Upload Image File'}</span>
                </Button>

                {coverImage && (
                  <button
                    type="button"
                    onClick={() => setCoverImage('')}
                    className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Remove image"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <Input
                icon={LinkIcon}
                placeholder="https://images.unsplash.com/... or direct image link"
                value={coverUrlInput}
                onChange={(e) => setCoverUrlInput(e.target.value)}
              />
            )}
            <p className="text-[11px] text-slate-400">
              {coverType === 'upload' ? 'Upload PNG, JPG, or WebP under 5MB.' : 'Paste direct web URL to any cover image.'}
            </p>
          </div>
        </div>
      </div>

      {/* Lessons Count Row */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Finished Lessons (Optional)"
          type="number"
          min="0"
          max={totalLessons !== '' && !isNaN(totalLessons) ? parseInt(totalLessons, 10) : undefined}
          value={finishedLessons}
          onChange={(e) => setFinishedLessons(e.target.value)}
          placeholder="e.g., 0"
        />
        <Input
          label="Total Lessons (Optional)"
          type="number"
          min="1"
          value={totalLessons}
          onChange={(e) => setTotalLessons(e.target.value)}
          placeholder="e.g., 10"
        />
      </div>

      {/* Certification Section */}
      <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>Course Certification (Optional)</span>
          </label>
          <div className="flex items-center gap-1 text-[11px]">
            <button
              type="button"
              onClick={() => setCertType('file')}
              className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                certType === 'file'
                  ? 'bg-[#0d8a72] text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              PDF Upload
            </button>
            <button
              type="button"
              onClick={() => setCertType('url')}
              className={`px-2 py-0.5 rounded-md font-bold cursor-pointer ${
                certType === 'url'
                  ? 'bg-[#0d8a72] text-white'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Link / URL
            </button>
          </div>
        </div>

        {certType === 'file' ? (
          <div className="flex items-center gap-2">
            <input
              ref={certFileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleCertFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => certFileInputRef.current?.click()}
              className="gap-1.5 text-xs font-semibold"
            >
              <FileText size={14} />
              <span>{certFilename ? 'Change PDF Certificate' : 'Upload PDF Certificate'}</span>
            </Button>

            {certFilename && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 truncate">
                <span className="truncate max-w-[200px]">{certFilename}</span>
                <button
                  type="button"
                  onClick={() => {
                    setCertUrl('');
                    setCertFilename('');
                  }}
                  className="text-slate-400 hover:text-rose-500"
                >
                  <X size={12} />
                </button>
              </div>
            )}
          </div>
        ) : (
          <Input
            icon={LinkIcon}
            placeholder="https://example.com/certificates/my-cert.pdf"
            value={certUrl}
            onChange={(e) => {
              setCertUrl(e.target.value);
              setCertFilename('');
            }}
          />
        )}
      </div>

      {/* Assign Tasks to this Course */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
          <span>Assign Tasks to this Course</span>
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

        <div className="max-h-36 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 flex flex-col gap-1.5 bg-slate-50/50 dark:bg-slate-950/30">
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
          {course ? 'Update Course' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
};

export const CourseModal = ({ isOpen, onClose, onSubmit, course = null, tasks = [] }) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={course ? 'Edit Course Details' : 'Track New Course'}
      maxWidth="max-w-xl"
    >
      <CourseFormContent
        key={course?.id || 'new-course'}
        course={course}
        tasks={tasks}
        onSubmit={onSubmit}
        onClose={onClose}
      />
    </Modal>
  );
};
