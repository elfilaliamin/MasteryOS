import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const getValidatedJwtSecret = () => {
  const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_master_tasks_tracker_2026_production';
  if (secret.length < 32) {
    throw new Error('SECURITY CONFIGURATION ERROR: JWT_SECRET must have at least 32 characters for adequate entropy.');
  }
  return secret;
};

const JWT_SECRET = getValidatedJwtSecret();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d'; // 30-day long-lived session expiry

export const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    algorithm: 'HS256', // Enforce HS256 algorithm pinning
    expiresIn: JWT_EXPIRES_IN
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET, {
    algorithms: ['HS256'] // Strictly pin HS256 to reject algorithm confusion attacks
  });
};

export const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

