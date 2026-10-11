// backend/src/utils/accountLockout.js
// Tracks failed login attempts per normalized email to mitigate distributed brute-force attacks

const failedAttempts = new Map();

const getThreshold = () => {
  return process.env.FAILED_LOGIN_THRESHOLD ? parseInt(process.env.FAILED_LOGIN_THRESHOLD, 10) : 5;
};

const getLockoutDuration = () => {
  return process.env.LOCKOUT_DURATION_MS ? parseInt(process.env.LOCKOUT_DURATION_MS, 10) : 15 * 60 * 1000;
};

/**
 * Checks if an email account is currently locked out
 * @param {string} email
 * @returns {boolean}
 */
export const isEmailLocked = (email) => {
  if (!email || typeof email !== 'string') return false;
  const key = email.trim().toLowerCase();
  const record = failedAttempts.get(key);
  if (!record) return false;

  const now = Date.now();
  if (now > record.resetTime) {
    failedAttempts.delete(key);
    return false;
  }

  return record.count >= getThreshold();
};

/**
 * Increments failed login count for an email account
 * @param {string} email
 */
export const recordFailedLogin = (email) => {
  if (!email || typeof email !== 'string') return;
  const key = email.trim().toLowerCase();
  const now = Date.now();
  const lockoutDuration = getLockoutDuration();

  const record = failedAttempts.get(key);
  if (!record || now > record.resetTime) {
    failedAttempts.set(key, {
      count: 1,
      resetTime: now + lockoutDuration
    });
  } else {
    record.count += 1;
    if (record.count >= getThreshold()) {
      record.resetTime = now + lockoutDuration;
    }
  }
};

/**
 * Clears failed login tracking upon successful authentication
 * @param {string} email
 */
export const clearFailedLogins = (email) => {
  if (!email || typeof email !== 'string') return;
  failedAttempts.delete(email.trim().toLowerCase());
};

/**
 * Test helper to reset in-memory state
 */
export const resetAllLockouts = () => {
  failedAttempts.clear();
};
