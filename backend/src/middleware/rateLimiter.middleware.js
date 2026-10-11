// backend/src/middleware/rateLimiter.middleware.js
import rateLimit from 'express-rate-limit';

/**
 * Resolves client IP, prioritizing CF-Connecting-IP behind Cloudflare/Nginx reverse proxies
 * @param {import('express').Request} req
 * @returns {string}
 */
export const getClientIp = (req) => {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) {
    if (typeof cfIp === 'string') return cfIp.trim();
    if (Array.isArray(cfIp) && cfIp.length > 0) return cfIp[0].trim();
  }

  // Fallback to Express req.ip (via trust proxy) or connection remote address
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
};

/**
 * Factory for creating custom rate limiters
 * @param {object} options
 */
export const createRateLimiter = (options = {}) => {
  return rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 100,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => getClientIp(req),
    validate: { trustProxy: false },
    handler: (req, res) => {
      res.status(429).json({
        error: options.message || 'Too many requests, please try again later.'
      });
    },
    ...options
  });
};

/**
 * Rate limiter for sensitive authentication endpoints (login, register)
 */
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.AUTH_RATE_LIMIT_MAX ? parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) : 30,
  message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.'
});

/**
 * Rate limiter for password update endpoints
 */
export const passwordChangeLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.PASSWORD_RATE_LIMIT_MAX ? parseInt(process.env.PASSWORD_RATE_LIMIT_MAX, 10) : 10,
  message: 'Too many password update attempts. Please try again later.'
});

/**
 * Rate limiter for file upload endpoints
 */
export const uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.UPLOAD_RATE_LIMIT_MAX ? parseInt(process.env.UPLOAD_RATE_LIMIT_MAX, 10) : 30,
  message: 'Too many upload attempts. Please try again later.'
});
