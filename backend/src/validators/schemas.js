// backend/src/validators/schemas.js
import { z } from 'zod';

// Strict UUID regex / format
export const uuidSchema = z.string().uuid({ message: 'Must be a valid UUID' });

// Common ID param validator
export const idParamSchema = z.object({
  id: uuidSchema
});

// HTTP/HTTPS URL or uploaded asset schema (strictly prevents javascript: or data: URIs and path traversal)
export const optionalHttpUrlSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true;
      if (val.startsWith('/api/upload/') || val.startsWith('/uploads/')) {
        return !val.includes('..');
      }
      return /^https?:\/\//i.test(val);
    },
    { message: 'URL must start with http://, https://, or /api/upload/' }
  )
  .optional()
  .nullable();

// Authentication Schemas
export const registerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(100),
  email: z.string().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128)
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Common enum parsers with case-insensitive normalization via z.preprocess
const normalizedTaskStatus = z.preprocess(
  (val) => {
    if (typeof val !== 'string') return val;
    const lower = val.toLowerCase();
    if (lower === 'done' || lower === 'completed') return 'COMPLETED';
    if (lower === 'in_progress') return 'IN_PROGRESS';
    if (lower === 'in_review') return 'IN_REVIEW';
    if (lower === 'todo') return 'TODO';
    return val.toUpperCase();
  },
  z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'])
);

const normalizedPriority = z.preprocess(
  (val) => (typeof val === 'string' ? val.toUpperCase() : val),
  z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
);
const normalizedGoalStatus = z.preprocess(
  (val) => (typeof val === 'string' ? val.toLowerCase() : val),
  z.enum(['in_progress', 'completed', 'archived'])
);
const normalizedCourseStatus = z.preprocess(
  (val) => (typeof val === 'string' ? val.toLowerCase() : val),
  z.enum(['not_started', 'in_progress', 'completed'])
);
const normalizedTimeOfDay = z.preprocess(
  (val) => (typeof val === 'string' ? val.toLowerCase() : val),
  z.enum(['morning', 'afternoon', 'evening', 'anytime'])
);

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1).optional(),
    currentPassword: z.string().min(1).optional(),
    new_password: z.string().min(6).max(128).optional(),
    newPassword: z.string().min(6).max(128).optional()
  })
  .refine(
    (data) => (data.current_password || data.currentPassword) && (data.new_password || data.newPassword),
    { message: 'Both current password and new password are required' }
  )
  .transform((data) => ({
    current_password: data.current_password || data.currentPassword,
    new_password: data.new_password || data.newPassword,
    currentPassword: data.currentPassword || data.current_password,
    newPassword: data.newPassword || data.new_password
  }));

export const updateProfileSchema = z
  .object({
    full_name: z.string().min(1).max(100).optional(),
    avatar_url: optionalHttpUrlSchema,
    avatar: optionalHttpUrlSchema,
    bio: z.string().max(500).optional().nullable()
  })
  .transform((data) => ({
    full_name: data.full_name,
    avatar_url: data.avatar_url !== undefined ? data.avatar_url : data.avatar,
    avatar: data.avatar !== undefined ? data.avatar : data.avatar_url,
    bio: data.bio
  }));

// Category Schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be valid hex code').optional(),
  icon: z.string().max(50).optional()
});

export const updateCategorySchema = createCategorySchema.partial();

// Task Schemas
export const taskQuerySchema = z.object({
  status: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return val;
      const lower = val.toLowerCase();
      if (lower === 'all') return 'all';
      if (lower === 'done' || lower === 'completed') return 'COMPLETED';
      if (lower === 'in_progress') return 'IN_PROGRESS';
      if (lower === 'in_review') return 'IN_REVIEW';
      if (lower === 'todo') return 'TODO';
      return val.toUpperCase();
    },
    z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'all'])
  ).optional(),
  priority: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return val;
      if (val.toLowerCase() === 'all') return 'all';
      return val.toUpperCase();
    },
    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT', 'all'])
  ).optional(),
  category_id: z.preprocess((val) => (val === '' ? null : val), z.string().max(100).optional().nullable()),
  categoryId: z.preprocess((val) => (val === '' ? null : val), z.string().max(100).optional().nullable()),
  goal_id: z.preprocess((val) => (val === '' ? null : val), z.string().uuid().optional().nullable()),
  course_id: z.preprocess((val) => (val === '' ? null : val), z.string().uuid().optional().nullable()),
  sortBy: z.enum(['due_date', 'priority', 'created_at', 'title', 'order_index']).optional(),
  sortOrder: z.enum(['asc', 'desc', 'ASC', 'DESC']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().int().min(0).default(0).optional(),
  search: z.string().max(200).optional()
});

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional().nullable(),
  status: normalizedTaskStatus.optional(),
  priority: normalizedPriority.optional(),
  due_date: z.preprocess((val) => (val === '' ? null : val), z.string().optional().nullable()),
  category_id: z.preprocess((val) => (val === '' ? null : val), z.string().max(100).optional().nullable()),
  goal_id: z.preprocess((val) => (val === '' ? null : val), z.string().uuid().optional().nullable()),
  course_id: z.preprocess((val) => (val === '' ? null : val), z.string().uuid().optional().nullable()),
  order_index: z.number().int().optional(),
  estimated_minutes: z.coerce.number().int().min(0).optional().nullable(),
  tags: z.array(z.string().max(50)).optional()
});

export const updateTaskSchema = createTaskSchema.partial();

export const updateTaskStatusSchema = z.object({
  status: normalizedTaskStatus
});

export const batchReorderSchema = z.object({
  tasks: z.array(
    z.object({
      id: uuidSchema,
      order_index: z.number().int(),
      status: normalizedTaskStatus.optional()
    })
  ).min(1, 'At least one task required for reordering')
});

// Goal Schemas
export const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional().nullable(),
  target_date: z.preprocess((val) => (val === '' ? null : val), z.string().optional().nullable()),
  due_date: z.preprocess((val) => (val === '' ? null : val), z.string().optional().nullable()),
  priority: normalizedPriority.optional(),
  status: normalizedGoalStatus.optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional().nullable(),
  icon: z.string().max(50).optional().nullable(),
  task_ids: z.array(uuidSchema).optional()
});

export const updateGoalSchema = createGoalSchema.partial();

// Course Schemas
export const createCourseSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional().nullable(),
  instructor: z.string().max(100).optional().nullable(),
  platform: z.string().max(100).optional().nullable(),
  status: normalizedCourseStatus.optional(),
  cover_image: optionalHttpUrlSchema,
  certificate_url: optionalHttpUrlSchema,
  certification_url: optionalHttpUrlSchema,
  certification_filename: z.string().max(255).optional().nullable(),
  task_ids: z.array(uuidSchema).optional(),
  total_lessons: z.number().int().min(0).optional().nullable(),
  completed_lessons: z.number().int().min(0).optional().nullable(),
  finished_lessons: z.number().int().min(0).optional().nullable()
});

export const updateCourseSchema = createCourseSchema.partial();

// Habit Schemas
export const createHabitSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(5000).optional().nullable(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be valid hex code').optional(),
  frequency: z.string().max(50).optional(),
  time_of_day: normalizedTimeOfDay.optional()
});

export const updateHabitSchema = createHabitSchema.partial();

export const toggleHabitSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional()
});
