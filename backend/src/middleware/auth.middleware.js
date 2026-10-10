import { verifyToken } from '../utils/auth.js';
import { findUserById } from '../models/user.model.js';

export const verifyJWT = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    const user = await findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User no longer exists or session expired.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const requireAuth = verifyJWT;

