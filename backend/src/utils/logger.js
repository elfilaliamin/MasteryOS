// backend/src/utils/logger.js

const SENSITIVE_FIELDS = new Set([
  'password',
  'current_password',
  'new_password',
  'currentpassword',
  'newpassword',
  'token',
  'authorization',
  'csrftoken',
  'xsrf-token',
  'cookie',
  'token_version'
]);

/**
 * Recursively redacts passwords, tokens, and sensitive credentials from logs
 * @param {any} data
 * @returns {any}
 */
export const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeLogData);
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeLogData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};
