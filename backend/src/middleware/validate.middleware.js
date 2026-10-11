// backend/src/middleware/validate.middleware.js
import { ZodError } from 'zod';

/**
 * Express middleware for schema validation using Zod
 * @param {object} options
 * @param {import('zod').ZodSchema} [options.body]
 * @param {import('zod').ZodSchema} [options.query]
 * @param {import('zod').ZodSchema} [options.params]
 */
export const validate = ({ body, query, params } = {}) => {
  return (req, res, next) => {
    try {
      if (params) {
        req.params = params.parse(req.params);
      }
      if (query) {
        req.query = query.parse(req.query);
      }
      if (body) {
        req.body = body.parse(req.body);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError || err.name === 'ZodError' || Array.isArray(err.issues)) {
        const issues = err.issues || err.errors || [];
        return res.status(400).json({
          error: 'Validation failed',
          details: issues.map((e) => ({
            field: Array.isArray(e.path) ? e.path.join('.') : String(e.path || ''),
            message: e.message
          }))
        });
      }
      next(err);
    }
  };
};
