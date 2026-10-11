import { verifyToken } from '../utils/auth.js';
import { findUserById } from '../models/user.model.js';

export const verifyJWT = async (req, res, next) => {
  try {
    let token = null;
    let isCookieAuth = false;

    // 1. Check httpOnly cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      isCookieAuth = true;
    }

    // 2. Check Authorization Bearer header
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
      isCookieAuth = false;
    }

    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = verifyToken(token);

    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists or session expired.' });
    }

    // Check token_version to immediately invalidate stale tokens (password reset or session revocation)
    const currentVersion = user.token_version || 1;
    const tokenVersion = decoded.token_version || 1;
    if (tokenVersion < currentVersion) {
      return res.status(401).json({ error: 'Session revoked or expired. Please log in again.' });
    }

    // CSRF Protection for state-changing endpoints authenticated via cookie
    if (isCookieAuth && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const csrfHeader = req.headers['x-csrf-token'] || req.headers['x-xsrf-token'];
      const csrfCookie = req.cookies ? req.cookies['XSRF-TOKEN'] : null;

      if (!csrfHeader || !csrfCookie || csrfHeader !== csrfCookie) {
        return res.status(403).json({ error: 'CSRF token missing or invalid.' });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireAuth = verifyJWT;


