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
import { query } from './config/db.js';

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

const getEnvOrigins = () => {
  return (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);
};

export const isOriginAllowed = (origin) => {
  // Allow requests with no origin (curl, mobile apps, server-to-server)
  if (!origin) {
    return true;
  }

  const cleanOrigin = origin.trim().replace(/\/+$/, '');
  const envOrigins = getEnvOrigins();

  // Wildcard allowed
  if (envOrigins.includes('*')) {
    return true;
  }

  // Direct match against env origins
  if (envOrigins.includes(cleanOrigin)) {
    return true;
  }

  try {
    const parsed = new URL(cleanOrigin);
    const hostname = parsed.hostname.toLowerCase();

    // Allow all subdomains and apex domains of aminlab.site, elfilaliamin.online, and elfilaiamin.online
    if (
      hostname === 'aminlab.site' ||
      hostname.endsWith('.aminlab.site') ||
      hostname === 'elfilaliamin.online' ||
      hostname.endsWith('.elfilaliamin.online') ||
      hostname === 'elfilaiamin.online' ||
      hostname.endsWith('.elfilaiamin.online')
    ) {
      return true;
    }

    // Allow masteryos.app and all subdomains
    if (hostname === 'masteryos.app' || hostname.endsWith('.masteryos.app')) {
      return true;
    }

    // Allow localhost and loopback interfaces on any port
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]'
    ) {
      return true;
    }

    // Match against any env origins (by origin string or hostname)
    for (const allowed of envOrigins) {
      if (allowed === cleanOrigin) return true;
      try {
        const allowedParsed = new URL(allowed.startsWith('http') ? allowed : `https://${allowed}`);
        if (allowedParsed.hostname.toLowerCase() === hostname) {
          return true;
        }
      } catch {
        // ignore invalid URL in env
      }
    }
  } catch {
    // If URL parsing fails, fallback to direct list check
    return envOrigins.includes(cleanOrigin);
  }

  return false;
};

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    console.warn(`[CORS Blocked] Origin not allowed: "${origin}"`);
    return callback(new Error('Blocked by CORS policy: Origin not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-XSRF-Token'],
  exposedHeaders: ['Set-Cookie']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
// Redact authorization and cookie headers from morgan tokens
morgan.token('safe-auth', (req) => (req.headers.authorization ? '[REDACTED_TOKEN]' : '-'));
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(':method :url :status :response-time ms - :res[content-length]'));
}

// Container & API Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    res.status(200).json({
      status: 'ok',
      db: 'up',
      service: 'master-tasks-tracker-api',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      db: 'down',
      service: 'master-tasks-tracker-api',
      timestamp: new Date().toISOString()
    });
  }
});

// Global caching control for API routes (exclude static uploads)
app.use('/api', (req, res, next) => {
  if (!req.path.startsWith('/upload/file/')) {
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  next();
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
