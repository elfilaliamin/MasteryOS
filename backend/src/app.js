import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes.js';
import taskRoutes from './routes/task.routes.js';
import categoryRoutes from './routes/category.routes.js';
import goalRoutes from './routes/goal.routes.js';
import courseRoutes from './routes/course.routes.js';
import habitRoutes from './routes/habit.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import { sanitizeLogData } from './utils/logger.js';

const app = express();

// Trust reverse proxy (Cloudflare / Nginx) for accurate client IP attribution
app.set('trust proxy', process.env.TRUST_PROXY || 1);

// Security and standard middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'https:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: false // Excluded locally because edge reverse proxy / Cloudflare handles HSTS
}));

app.use(cookieParser());

const defaultAllowedOrigins = process.env.NODE_ENV === 'production'
  ? ['https://masteryos.app']
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((s) => s.trim())
  : defaultAllowedOrigins;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile, test harness) or test env
    if (!origin || process.env.NODE_ENV === 'test') {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS policy: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-XSRF-Token']
}));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
// Redact authorization and cookie headers from morgan tokens
morgan.token('safe-auth', (req) => (req.headers.authorization ? '[REDACTED_TOKEN]' : '-'));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :response-time ms - :res[content-length]'));
}

// Container & API Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'master-tasks-tracker-api',
    timestamp: new Date().toISOString()
  });
});

// Mount modular API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/upload', uploadRoutes);

// Global 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Centralized error handler
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  const statusCode = err.status || (err.message && err.message.includes('CORS') ? 403 : 500);

  if (!isProd) {
    console.error('Unhandled server error:', err);
  }

  // Redact internal database or stack trace details in production
  const safeMessage = isProd
    ? (statusCode < 500 ? err.message : 'Internal server error')
    : (err.message || 'Internal server error');

  res.status(statusCode).json({
    error: safeMessage
  });
});

export default app;
